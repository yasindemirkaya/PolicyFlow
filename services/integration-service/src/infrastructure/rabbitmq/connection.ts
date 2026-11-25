import amqp from "amqplib";

import type {
  Channel,
  ChannelModel,
  ConfirmChannel,
} from "amqplib";

import { env } from "../../config/env.js";

import { setupRabbitMQTopology } from "./topology.js";

// Consumer kayıt fonksiyonunun tipi.
type ChannelInitializer = (
  channel: Channel,
) => Promise<void>;

// RabbitMQ kaynakları.
let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let publisherChannel: ConfirmChannel | null = null;

// Bağlantı durumları.
let isConnected = false;
let isShuttingDown = false;

// Devam eden bağlantı denemesini tutar.
let connectionPromise: Promise<void> | null = null;

// Yeniden bağlantı zamanlayıcısı.
let reconnectTimer: NodeJS.Timeout | null = null;

// Consumer kayıt fonksiyonunu saklar.
let onChannelReady: ChannelInitializer | undefined;

/**
 * Aktif Publisher Confirm Channel'ı döndürür.
 *
 * Publisher modülü bu fonksiyonu kullanır.
 * Fonksiyon dışarıya açık ana API üzerinden export edilmez.
 */
export const getPublisherChannel = (): ConfirmChannel => {
  if (!publisherChannel) {
    throw new Error(
      "RabbitMQ Publisher Confirm Channel is not available.",
    );
  }

  return publisherChannel;
};

/**
 * Bağlantı koptuğunda yeniden bağlantı planlar.
 */
const scheduleReconnect = (): void => {
  if (isShuttingDown || reconnectTimer) {
    return;
  }

  console.log(
    `[RABBITMQ] Reconnecting in ${
      env.rabbitmq.reconnectDelay / 1000
    } seconds...`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    void establishConnection();
  }, env.rabbitmq.reconnectDelay);
};

/**
 * RabbitMQ bağlantısını kurar.
 *
 * Aynı anda birden fazla çağrı gelirse
 * aynı connectionPromise beklenir.
 */
const establishConnection = (): Promise<void> => {
  if (isShuttingDown || isConnected) {
    return Promise.resolve();
  }

  // Devam eden bağlantı denemesi varsa onu bekle.
  if (connectionPromise) {
    return connectionPromise;
  }

  // Zaten bir bağlantı varsa yeni bağlantı açma.
  if (connection) {
    return Promise.resolve();
  }

  const attempt = (async (): Promise<void> => {
    let rabbitConnection: ChannelModel | null = null;

    try {
      // RabbitMQ kullanıcı bilgilerini kontrol et.
      if (
        !env.rabbitmq.username ||
        !env.rabbitmq.password
      ) {
        throw new Error(
          "RabbitMQ username or password is missing.",
        );
      }

      // RabbitMQ bağlantısını oluştur.
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

      // Bağlantı sırasında uygulama kapanıyorsa bağlantıyı kapat.
      if (isShuttingDown) {
        await newConnection.close();
        return;
      }

      connection = newConnection;

      console.log("[RABBITMQ] Connection established");

      // Connection hatalarını takip et.
      newConnection.on("error", (error: Error) => {
        isConnected = false;

        console.error(
          "[RABBITMQ] Connection error:",
          error,
        );
      });

      // Connection kapandığında yeniden bağlantı planla.
      newConnection.on("close", () => {
        if (connection !== newConnection) {
          return;
        }

        connection = null;
        channel = null;
        publisherChannel = null;

        isConnected = false;

        console.warn("[RABBITMQ] Connection closed");

        scheduleReconnect();
      });

      // Consumer Channel oluştur.
      const rabbitChannel =
        await newConnection.createChannel();

      if (
        isShuttingDown ||
        connection !== newConnection
      ) {
        await rabbitChannel
          .close()
          .catch(() => undefined);

        return;
      }

      channel = rabbitChannel;

      // Consumer Channel hatalarını takip et.
      rabbitChannel.on("error", (error: Error) => {
        isConnected = false;

        console.error(
          "[RABBITMQ] Channel error:",
          error,
        );
      });

      // Consumer Channel kapanırsa bağlantıyı yenile.
      rabbitChannel.on("close", () => {
        if (channel !== rabbitChannel) {
          return;
        }

        channel = null;
        isConnected = false;

        console.warn(
          "[RABBITMQ] Consumer channel closed",
        );

        if (!isShuttingDown) {
          void newConnection
            .close()
            .catch(() => undefined);
        }
      });

      // Publisher Confirm Channel oluştur.
      const rabbitPublisherChannel =
        await newConnection.createConfirmChannel();

      if (
        isShuttingDown ||
        connection !== newConnection
      ) {
        await rabbitPublisherChannel
          .close()
          .catch(() => undefined);

        await rabbitChannel
          .close()
          .catch(() => undefined);

        return;
      }

      publisherChannel = rabbitPublisherChannel;

      // Publisher Channel hatalarını takip et.
      rabbitPublisherChannel.on(
        "error",
        (error: Error) => {
          isConnected = false;

          console.error(
            "[RABBITMQ] Publisher channel error:",
            error,
          );
        },
      );

      // Publisher Channel kapanırsa bağlantıyı yenile.
      rabbitPublisherChannel.on("close", () => {
        if (
          publisherChannel !== rabbitPublisherChannel
        ) {
          return;
        }

        publisherChannel = null;
        isConnected = false;

        console.warn(
          "[RABBITMQ] Publisher channel closed",
        );

        if (!isShuttingDown) {
          void newConnection
            .close()
            .catch(() => undefined);
        }
      });

      // Exchange, Queue ve Binding yapılarını oluştur.
      await setupRabbitMQTopology(rabbitChannel);

      // Kurulum sırasında bağlantı değişmiş olabilir.
      if (
        isShuttingDown ||
        connection !== newConnection ||
        channel !== rabbitChannel ||
        publisherChannel !== rabbitPublisherChannel
      ) {
        return;
      }

      // Consumer kayıtlarını gerçekleştir.
      if (onChannelReady) {
        await onChannelReady(rabbitChannel);
      }

      // Consumer kayıt işlemi sırasında bağlantı kapanmış olabilir.
      if (
        isShuttingDown ||
        connection !== newConnection ||
        channel !== rabbitChannel ||
        publisherChannel !== rabbitPublisherChannel
      ) {
        return;
      }

      isConnected = true;

      console.log("[RABBITMQ] Connected successfully");
    } catch (error) {
      isConnected = false;

      console.error(
        "[RABBITMQ] Connection failed:",
        error,
      );

      // Hatalı bağlantıya ait referansları temizle.
      if (connection === rabbitConnection) {
        connection = null;
        channel = null;
        publisherChannel = null;
      }

      // Açık kalan bağlantıyı kapat.
      if (rabbitConnection) {
        try {
          await rabbitConnection.close();
        } catch {
          // İkincil kapanış hatalarını yok say.
        }
      }

      // Yeniden bağlantı planla.
      scheduleReconnect();
    }
  })();

  connectionPromise = attempt.finally(() => {
    connectionPromise = null;
  });

  return connectionPromise;
};

/**
 * RabbitMQ bağlantısını başlatır.
 *
 * İsteğe bağlı initializer ile Consumer kayıtlarını alır.
 */
export const connectRabbitMQ = async (
  initializer?: ChannelInitializer,
): Promise<void> => {
  if (initializer) {
    onChannelReady = initializer;
  }

  // Bağlantı zaten hazırsa Consumer kayıt fonksiyonunu çalıştır.
  if (initializer && channel && isConnected) {
    await initializer(channel);
    return;
  }

  await establishConnection();
};

/**
 * RabbitMQ bağlantı durumunu döndürür.
 */
export const isRabbitMQConnected = (): boolean => {
  return isConnected;
};

/**
 * Uygulama kapanırken RabbitMQ kaynaklarını kapatır.
 */
export const closeRabbitMQ = async (): Promise<void> => {
  isShuttingDown = true;
  isConnected = false;

  // Bekleyen yeniden bağlantı zamanlayıcısını temizle.
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Aktif kaynakları sakla.
  const activePublisherChannel = publisherChannel;
  const activeChannel = channel;
  const activeConnection = connection;

  // Global referansları temizle.
  publisherChannel = null;
  channel = null;
  connection = null;

  // Publisher Channel'ı kapat.
  try {
    await activePublisherChannel?.close();
  } catch {
    // Channel zaten kapanmış olabilir.
  }

  // Consumer Channel'ı kapat.
  try {
    await activeChannel?.close();
  } catch {
    // Channel zaten kapanmış olabilir.
  }

  // Connection'ı kapat.
  try {
    await activeConnection?.close();
  } catch {
    // Connection zaten kapanmış olabilir.
  }

  console.log(
    "[RABBITMQ] Connection closed gracefully",
  );
};