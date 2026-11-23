// RabbitMQ bağlantı kütüphanesini içe aktarır.
import amqp from "amqplib";

// RabbitMQ bağlantı ve onaylı kanal tiplerini içe aktarır.
import type {
  ChannelModel,
  ConfirmChannel,
} from "amqplib";

// Merkezi environment ayarlarını içe aktarır.
import { env } from "../config/env.js";

// Outbox Entity tipini içe aktarır.
import { OutboxEvent } from "../entities/outbox-event.entity.js";

// Integration Service ile ortak Exchange adını kullanır.
const RABBITMQ_EXCHANGE = "policyflow.events";

// Publisher bağlantısını ve kanalını saklar.
let connection: ChannelModel | null = null;
let publisherChannel: ConfirmChannel | null = null;

// Aynı anda birden fazla bağlantı kurulmasını önler.
let connectionPromise: Promise<ConfirmChannel> | null = null;

// Kuyruğa yönlendirilemeyen mesajların ID'lerini saklar.
const returnedMessageIds = new Set<string>();

// RabbitMQ bağlantısını ve Confirm Channel'ını oluşturur.
const createPublisherChannel = async (): Promise<ConfirmChannel> => {
  // RabbitMQ kullanıcı bilgilerinin tanımlı olduğunu kontrol eder.
  if (!env.rabbitmq.username || !env.rabbitmq.password) {
    throw new Error("RabbitMQ username or password is missing.");
  }

  // RabbitMQ sunucusuna bağlantı kurar.
  const newConnection = await amqp.connect({
    protocol: "amqp",
    hostname: env.rabbitmq.host,
    port: env.rabbitmq.port,
    username: env.rabbitmq.username,
    password: env.rabbitmq.password,
    vhost: env.rabbitmq.vhost,
    heartbeat: 30,
  });

  try {
    // RabbitMQ mesaj onaylarını takip eden Confirm Channel oluşturur.
    const newChannel = await newConnection.createConfirmChannel();

    // Mesajların gönderileceği Topic Exchange'i garanti altına alır.
    await newChannel.assertExchange(
      RABBITMQ_EXCHANGE,
      "topic",
      { durable: true },
    );

    // Aktif bağlantı ve kanal referanslarını saklar.
    connection = newConnection;
    publisherChannel = newChannel;

    // RabbitMQ bağlantı hatalarını takip eder.
    newConnection.on("error", (error: Error) => {
      console.error("[POLICY RABBITMQ] Connection error:", error);
    });

    // RabbitMQ bağlantısı kapandığında referansları temizler.
    newConnection.on("close", () => {
      if (connection === newConnection) {
        connection = null;
        publisherChannel = null;

        console.warn("[POLICY RABBITMQ] Connection closed");
      }
    });

    // Channel hatalarını takip eder.
    newChannel.on("error", (error: Error) => {
      console.error("[POLICY RABBITMQ] Channel error:", error);
    });

    // Kuyruğa yönlendirilemeyen mesajları takip eder.
    newChannel.on("return", (message) => {
      const messageId = message.properties.messageId;

      if (typeof messageId === "string") {
        returnedMessageIds.add(messageId);
      }

      console.error(
        "[POLICY RABBITMQ] Message could not be routed:",
        messageId,
      );
    });

    // Channel kapandığında bağlantı referanslarını temizler.
    newChannel.on("close", () => {
      if (publisherChannel === newChannel) {
        publisherChannel = null;
        connection = null;

        console.warn("[POLICY RABBITMQ] Channel closed");

        void newConnection.close().catch(() => undefined);
      }
    });

    console.log(
      "[POLICY RABBITMQ] Publisher connected successfully",
    );

    return newChannel;
  } catch (error) {
    // Channel oluşturulamazsa açık RabbitMQ bağlantısını kapatır.
    await newConnection.close().catch(() => undefined);

    throw error;
  }
};

// Aktif Publisher Channel'ını döndürür veya yeni bağlantı oluşturur.
const getPublisherChannel = async (): Promise<ConfirmChannel> => {
  // Mevcut bağlantı kullanılabilir durumdaysa tekrar kullanır.
  if (publisherChannel) {
    return publisherChannel;
  }

  // Devam eden bağlantı denemesi varsa aynı işlemi bekler.
  if (connectionPromise) {
    return connectionPromise;
  }

  // Yeni RabbitMQ bağlantısı oluşturur.
  const newConnectionPromise = createPublisherChannel();

  connectionPromise = newConnectionPromise;

  try {
    return await newConnectionPromise;
  } finally {
    // Tamamlanan bağlantı denemesinin referansını temizler.
    if (connectionPromise === newConnectionPromise) {
      connectionPromise = null;
    }
  }
};

// Outbox event'ini RabbitMQ Exchange'e yayınlar.
export const publishOutboxEvent = async (
  event: OutboxEvent,
): Promise<void> => {
  // Aktif RabbitMQ Publisher Channel'ını alır.
  const channel = await getPublisherChannel();

  // Önceki denemelerden kalan mesaj ID'sini temizler.
  returnedMessageIds.delete(event.id);

  // Event içeriğini JSON Buffer formatına dönüştürür.
  const message = Buffer.from(
    JSON.stringify(event.payload),
    "utf8",
  );

  try {
    // Mesajı RabbitMQ'ya gönderir ve broker onayını bekler.
    await new Promise<void>((resolve, reject) => {
      channel.publish(
        RABBITMQ_EXCHANGE,
        event.routingKey,
        message,
        {
          // Mesajın RabbitMQ üzerinde kalıcı olmasını sağlar.
          persistent: true,

          // Mesaj herhangi bir kuyruğa yönlendirilemiyorsa geri döndürür.
          mandatory: true,

          contentType: "application/json",
          messageId: event.id,
          type: event.eventType,
          timestamp: Date.now(),
        },
        (error) => {
          // RabbitMQ mesajı reddederse hata döndürür.
          if (error) {
            reject(error);
            return;
          }

          // RabbitMQ mesajı onayladığında işlemi tamamlar.
          resolve();
        },
      );
    });
  } catch (error) {
    // Başarısız yayınlamaya ait geri dönüş kaydını temizler.
    returnedMessageIds.delete(event.id);

    throw error;
  }

  // Mesajın herhangi bir kuyruğa yönlendirilip yönlendirilmediğini kontrol eder.
  if (returnedMessageIds.delete(event.id)) {
    throw new Error(
      `Event could not be routed to any queue: ${event.id}`,
    );
  }

  console.log(
    `[POLICY RABBITMQ] Event published: ${event.eventType} (${event.id})`,
  );
};

// Uygulama kapanırken Publisher bağlantısını güvenli şekilde kapatır.
export const closeRabbitMQPublisher = async (): Promise<void> => {
  const activeChannel = publisherChannel;
  const activeConnection = connection;

  // Aktif bağlantı referanslarını temizler.
  publisherChannel = null;
  connection = null;

  // Publisher Channel'ını kapatır.
  try {
    await activeChannel?.close();
  } catch {
    // Channel zaten kapanmış olabilir.
  }

  // RabbitMQ bağlantısını kapatır.
  try {
    await activeConnection?.close();
  } catch {
    // Connection zaten kapanmış olabilir.
  }

  console.log(
    "[POLICY RABBITMQ] Publisher connection closed",
  );
};