// RabbitMQ bağlantı kütüphanesini içe aktarır.
import amqp from "amqplib";

// RabbitMQ bağlantı ve kanal tiplerini içe aktarır.
import type { Channel, ChannelModel } from "amqplib";

// Merkezi environment ayarlarını içe aktarır.
import { env } from "../config/env.js";

// Uygulamanın kullanacağı ana Topic Exchange adını belirler.
export const RABBITMQ_EXCHANGE = "policyflow.events";

// RabbitMQ üzerinde oluşturulacak kuyrukları ve routing key değerlerini tanımlar.
const QUEUE_DEFINITIONS = [
  {
    name: "integration.sms.queue",
    routingKeys: ["policy.issued"],
  },
  {
    name: "integration.email.queue",
    routingKeys: ["policy.issued"],
  },
  {
    name: "integration.crm.queue",
    routingKeys: ["policy.issued"],
  },
] as const;

// Her başarılı bağlantıdan sonra Consumer'ları başlatacak fonksiyon tipini tanımlar.
type ChannelInitializer = (
  channel: Channel,
) => Promise<void>;

// RabbitMQ bağlantısını ve kanalını saklar.
let connection: ChannelModel | null = null;
let channel: Channel | null = null;

// Bağlantı durumlarını takip eder.
let isConnected = false;
let isConnecting = false;
let isShuttingDown = false;

// Yeniden bağlantı zamanlayıcısını saklar.
let reconnectTimer: NodeJS.Timeout | null = null;

// Consumer kayıt fonksiyonunu saklar.
let onChannelReady: ChannelInitializer | undefined;

// RabbitMQ Exchange, Queue ve Binding yapılarını oluşturur.
const setupRabbitMQTopology = async (
  rabbitChannel: Channel,
): Promise<void> => {
  // Topic Exchange oluşturur.
  await rabbitChannel.assertExchange(
    RABBITMQ_EXCHANGE,
    "topic",
    {
      durable: true,
    },
  );

  // Her kuyruk için Queue ve Routing Binding oluşturur.
  for (const queueDefinition of QUEUE_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      queueDefinition.name,
      {
        durable: true,
      },
    );

    // İlgili kuyruğu Exchange üzerine bağlar.
    for (const routingKey of queueDefinition.routingKeys) {
      await rabbitChannel.bindQueue(
        queueDefinition.name,
        RABBITMQ_EXCHANGE,
        routingKey,
      );
    }
  }

  console.log("[RABBITMQ] Exchange and queues are ready");
};

// Bağlantı koptuğunda yeniden bağlantı işlemini zamanlar.
const scheduleReconnect = (): void => {
  if (isShuttingDown || reconnectTimer) {
    return;
  }

  console.log(
    `[RABBITMQ] Reconnecting in ${
      env.rabbitmq.reconnectDelay / 1000
    } seconds...`,
  );

  // Belirlenen süre sonunda yeniden bağlantı başlatır.
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void establishConnection();
  }, env.rabbitmq.reconnectDelay);
};

// RabbitMQ bağlantısını oluşturur ve gerekli yapıları hazırlar.
const establishConnection = async (): Promise<void> => {
  if (isConnecting || connection || isShuttingDown) {
    return;
  }

  isConnecting = true;

  let rabbitConnection: ChannelModel | null = null;

  try {
    // RabbitMQ kullanıcı bilgilerinin tanımlı olduğunu kontrol eder.
    if (
      !env.rabbitmq.username ||
      !env.rabbitmq.password
    ) {
      throw new Error(
        "RabbitMQ username or password is missing.",
      );
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

    rabbitConnection = newConnection;

    // Kapanma isteği bağlantı kurulurken geldiyse yeni bağlantıyı kapatır.
    if (isShuttingDown) {
      await newConnection.close();
      return;
    }

    connection = newConnection;

    console.log("[RABBITMQ] Connection established");

    // RabbitMQ bağlantı hatalarını takip eder.
    newConnection.on("error", (error: Error) => {
      isConnected = false;
      console.error("[RABBITMQ] Connection error:", error);
    });

    // RabbitMQ bağlantısı kapandığında yeniden bağlantı planlar.
    newConnection.on("close", () => {
      if (connection !== newConnection) {
        return;
      }

      connection = null;
      channel = null;
      isConnected = false;

      console.warn("[RABBITMQ] Connection closed");

      scheduleReconnect();
    });

    // Yeni bağlantı üzerinden bir Channel oluşturur.
    const rabbitChannel = await newConnection.createChannel();

    // Bağlantı oluşturulurken kapanma başladıysa Channel'ı kapatır.
    if (
      isShuttingDown ||
      connection !== newConnection
    ) {
      await rabbitChannel.close().catch(() => undefined);
      return;
    }

    channel = rabbitChannel;

    // Channel hatalarını takip eder.
    rabbitChannel.on("error", (error: Error) => {
      isConnected = false;
      console.error("[RABBITMQ] Channel error:", error);
    });

    // Channel kapandığında bağlantının da yeniden kurulmasını sağlar.
    rabbitChannel.on("close", () => {
      if (channel !== rabbitChannel) {
        return;
      }

      channel = null;
      isConnected = false;

      console.warn("[RABBITMQ] Channel closed");

      if (!isShuttingDown) {
        void newConnection.close().catch(() => undefined);
      }
    });

    // Exchange, Queue ve Binding yapılarını hazırlar.
    await setupRabbitMQTopology(rabbitChannel);

    // Bağlantı kurulumu sırasında kapatma başlamışsa devam etmez.
    if (
      isShuttingDown ||
      connection !== newConnection ||
      channel !== rabbitChannel
    ) {
      return;
    }

    // RabbitMQ bağlantısı hazır olduğunda Consumer'ları kaydeder.
    if (onChannelReady) {
      await onChannelReady(rabbitChannel);
    }

    // Consumer kayıt işlemi sırasında bağlantı kapanmışsa hazır saymaz.
    if (
      isShuttingDown ||
      connection !== newConnection ||
      channel !== rabbitChannel
    ) {
      return;
    }

    isConnected = true;

    console.log("[RABBITMQ] Connected successfully");
  } catch (error) {
    isConnected = false;

    console.error("[RABBITMQ] Connection failed:", error);

    // Hatalı bağlantıya ait referansları temizler.
    if (connection === rabbitConnection) {
      connection = null;
      channel = null;
    }

    // Hata oluştuğunda açık kalan RabbitMQ bağlantısını kapatır.
    if (rabbitConnection) {
      try {
        await rabbitConnection.close();
      } catch {
        // Kapanış sırasında oluşabilecek ikincil hataları yok sayar.
      }
    }

    // Yeni bağlantı denemesini planlar.
    scheduleReconnect();
  } finally {
    // Bağlantı denemesinin tamamlandığını belirtir.
    isConnecting = false;
  }
};

// RabbitMQ bağlantısını dışarıya açar.
export const connectRabbitMQ = async (
  initializer?: ChannelInitializer,
): Promise<void> => {
  // Consumer kayıt fonksiyonunu saklar.
  if (initializer) {
    onChannelReady = initializer;
  }

  // Bağlantı zaten hazırsa yeni Consumer kayıt fonksiyonunu çalıştırır.
  if (initializer && channel && isConnected) {
    await initializer(channel);
    return;
  }

  // RabbitMQ bağlantısını başlatır.
  await establishConnection();
};

// RabbitMQ bağlantısının durumunu döndürür.
export const isRabbitMQConnected = (): boolean => {
  return isConnected;
};

// Uygulama kapanırken RabbitMQ kaynaklarını güvenli şekilde kapatır.
export const closeRabbitMQ = async (): Promise<void> => {
  isShuttingDown = true;
  isConnected = false;

  // Bekleyen yeniden bağlantı zamanlayıcısını temizler.
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Aktif bağlantı ve kanal referanslarını geçici olarak saklar.
  const activeChannel = channel;
  const activeConnection = connection;

  // Global bağlantı referanslarını temizler.
  channel = null;
  connection = null;

  // Aktif Channel'ı kapatır.
  try {
    await activeChannel?.close();
  } catch {
    // Channel zaten kapanmış olabilir.
  }

  // Aktif RabbitMQ bağlantısını kapatır.
  try {
    await activeConnection?.close();
  } catch {
    // Connection zaten kapanmış olabilir.
  }

  console.log("[RABBITMQ] Connection closed gracefully");
};