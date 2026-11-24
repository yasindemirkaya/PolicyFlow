// RabbitMQ bağlantı kütüphanesini içe aktarır.
import amqp from "amqplib";

// Benzersiz yayınlama kimliği oluşturmak için kullanılır.
import { randomUUID } from "node:crypto";

// RabbitMQ bağlantı, normal kanal, onaylı kanal ve yayınlama seçeneklerini içe aktarır.
import type {
  Channel,
  ChannelModel,
  ConfirmChannel,
  Options,
} from "amqplib";

// Merkezi environment ayarlarını içe aktarır.
import { env } from "../config/env.js";

// Ana event Exchange adını belirler.
export const RABBITMQ_EXCHANGE = "policyflow.events";

// Retry mesajlarının yönlendirileceği Exchange adını belirler.
export const RABBITMQ_RETRY_EXCHANGE = "policyflow.retry";

// Başarısız mesajların yönlendirileceği Exchange adını belirler.
export const RABBITMQ_DLX_EXCHANGE = "policyflow.dlx";

// Ana Consumer kuyruklarını ve routing key değerlerini tanımlar.
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

// Her servis için gecikmeli Retry kuyruklarını tanımlar.
const RETRY_QUEUE_DEFINITIONS = [
  {
    name: "integration.sms.retry.5s.queue",
    routingKey: "integration.sms.retry.5s",
    ttl: 5000,
    targetQueue: "integration.sms.queue",
  },
  {
    name: "integration.sms.retry.10s.queue",
    routingKey: "integration.sms.retry.10s",
    ttl: 10000,
    targetQueue: "integration.sms.queue",
  },
  {
    name: "integration.email.retry.5s.queue",
    routingKey: "integration.email.retry.5s",
    ttl: 5000,
    targetQueue: "integration.email.queue",
  },
  {
    name: "integration.email.retry.10s.queue",
    routingKey: "integration.email.retry.10s",
    ttl: 10000,
    targetQueue: "integration.email.queue",
  },
  {
    name: "integration.crm.retry.5s.queue",
    routingKey: "integration.crm.retry.5s",
    ttl: 5000,
    targetQueue: "integration.crm.queue",
  },
  {
    name: "integration.crm.retry.10s.queue",
    routingKey: "integration.crm.retry.10s",
    ttl: 10000,
    targetQueue: "integration.crm.queue",
  },
] as const;

// Her servis için Dead Letter Queue tanımlarını oluşturur.
const DLQ_DEFINITIONS = [
  {
    name: "integration.sms.dlq",
    routingKey: "integration.sms.dlq",
  },
  {
    name: "integration.email.dlq",
    routingKey: "integration.email.dlq",
  },
  {
    name: "integration.crm.dlq",
    routingKey: "integration.crm.dlq",
  },
] as const;

// Her başarılı bağlantıdan sonra Consumer'ları başlatacak fonksiyon tipini tanımlar.
type ChannelInitializer = (
  channel: Channel,
) => Promise<void>;

// RabbitMQ bağlantısını ve kanallarını saklar.
let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let publisherChannel: ConfirmChannel | null = null;

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
  // Ana Topic Exchange'i oluşturur.
  await rabbitChannel.assertExchange(
    RABBITMQ_EXCHANGE,
    "topic",
    {
      durable: true,
    },
  );

  // Retry mesajları için Direct Exchange oluşturur.
  await rabbitChannel.assertExchange(
    RABBITMQ_RETRY_EXCHANGE,
    "direct",
    {
      durable: true,
    },
  );

  // Başarısız mesajlar için Dead Letter Exchange oluşturur.
  await rabbitChannel.assertExchange(
    RABBITMQ_DLX_EXCHANGE,
    "direct",
    {
      durable: true,
    },
  );

  // Ana Consumer kuyruklarını oluşturur ve Exchange'e bağlar.
  for (const queueDefinition of QUEUE_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      queueDefinition.name,
      {
        durable: true,
      },
    );

    // İlgili ana kuyruğu Event Exchange'e bağlar.
    for (const routingKey of queueDefinition.routingKeys) {
      await rabbitChannel.bindQueue(
        queueDefinition.name,
        RABBITMQ_EXCHANGE,
        routingKey,
      );
    }
  }

  // TTL ve Dead Letter ayarlarıyla Retry kuyruklarını oluşturur.
  for (const retryQueue of RETRY_QUEUE_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      retryQueue.name,
      {
        durable: true,
        arguments: {
          // Mesajın Retry kuyruğunda bekleyeceği süreyi belirler.
          "x-message-ttl": retryQueue.ttl,

          // Süresi dolan mesajın varsayılan Exchange'e gönderilmesini sağlar.
          "x-dead-letter-exchange": "",

          // Süresi dolan mesajı ilgili ana kuyruğa yönlendirir.
          "x-dead-letter-routing-key": retryQueue.targetQueue,
        },
      },
    );

    // Retry kuyruğunu Retry Exchange'e bağlar.
    await rabbitChannel.bindQueue(
      retryQueue.name,
      RABBITMQ_RETRY_EXCHANGE,
      retryQueue.routingKey,
    );
  }

  // Başarısız mesajlar için DLQ kuyruklarını oluşturur.
  for (const dlq of DLQ_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      dlq.name,
      {
        durable: true,
      },
    );

    // DLQ kuyruğunu Dead Letter Exchange'e bağlar.
    await rabbitChannel.bindQueue(
      dlq.name,
      RABBITMQ_DLX_EXCHANGE,
      dlq.routingKey,
    );
  }

  console.log(
    "[RABBITMQ] Exchanges, queues and bindings are ready",
  );
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
      publisherChannel = null;
      isConnected = false;

      console.warn("[RABBITMQ] Connection closed");

      scheduleReconnect();
    });

    // Consumer işlemleri için normal bir Channel oluşturur.
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

    // Consumer Channel kapandığında bağlantının yeniden kurulmasını sağlar.
    rabbitChannel.on("close", () => {
      if (channel !== rabbitChannel) {
        return;
      }

      channel = null;
      isConnected = false;

      console.warn("[RABBITMQ] Consumer channel closed");

      if (!isShuttingDown) {
        void newConnection.close().catch(() => undefined);
      }
    });

    // Mesaj yayınlama onaylarını takip etmek için Confirm Channel oluşturur.
    const rabbitPublisherChannel =
      await newConnection.createConfirmChannel();

    // Kapatma başladıysa veya bağlantı değiştiyse yeni kanalları kapatır.
    if (
      isShuttingDown ||
      connection !== newConnection
    ) {
      await rabbitPublisherChannel.close().catch(() => undefined);
      await rabbitChannel.close().catch(() => undefined);
      return;
    }

    publisherChannel = rabbitPublisherChannel;

    // Publisher Confirm Channel hatalarını takip eder.
    rabbitPublisherChannel.on("error", (error: Error) => {
      isConnected = false;
      console.error("[RABBITMQ] Publisher channel error:", error);
    });

    // Publisher Channel kapandığında bağlantıyı yeniden kurar.
    rabbitPublisherChannel.on("close", () => {
      if (publisherChannel !== rabbitPublisherChannel) {
        return;
      }

      publisherChannel = null;
      isConnected = false;

      console.warn("[RABBITMQ] Publisher channel closed");

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
      channel !== rabbitChannel ||
      publisherChannel !== rabbitPublisherChannel
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
      channel !== rabbitChannel ||
      publisherChannel !== rabbitPublisherChannel
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
      publisherChannel = null;
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

// Mesajı RabbitMQ'ya yayınlar ve broker onayını bekler.
export const publishConfirmedMessage = async (
  exchange: string,
  routingKey: string,
  content: Buffer,
  options: Options.Publish = {},
): Promise<void> => {
  // Aktif Confirm Channel referansını alır.
  const activePublisherChannel = publisherChannel;

  // Publisher Channel yoksa mesajın yayınlanmasına izin vermez.
  if (!activePublisherChannel) {
    throw new Error(
      "RabbitMQ Publisher Confirm Channel is not available.",
    );
  }

  // Her yayınlama işlemi için benzersiz bir kimlik oluşturur.
  const publishId = randomUUID();

  // RabbitMQ tarafından geri döndürülen mesajı takip eder.
  let isReturned = false;
  let isSettled = false;

  // Yayınlama sırasında kullanılan event listener'larını temizler.
  const cleanup = (): void => {
    activePublisherChannel.removeListener("return", onReturn);
    activePublisherChannel.removeListener("close", onClose);
  };

  // Mesaj herhangi bir kuyruğa yönlendirilemezse bu event çalışır.
  const onReturn = (returnedMessage: {
    properties: {
      headers?: Record<string, unknown>;
    };
  }): void => {
    if (
      returnedMessage.properties.headers?.[
        "x-publish-confirm-id"
      ] === publishId
    ) {
      isReturned = true;
    }
  };

  // Onay gelmeden Publisher Channel kapanırsa işlemi başarısız sayar.
  const onClose = (): void => {
    if (isSettled) {
      return;
    }

    isSettled = true;
    cleanup();

    rejectPublish(
      new Error(
        "RabbitMQ Publisher Channel closed before confirmation.",
      ),
    );
  };

  // Yayınlama işlemini Promise olarak yönetir.
  let rejectPublish: (error: Error) => void;

  const publishPromise = new Promise<void>((resolve, reject) => {
    rejectPublish = reject;

    // RabbitMQ'dan gelen unroutable mesajları takip eder.
    activePublisherChannel.on("return", onReturn);

    // Publisher Channel kapanırsa Promise'i reddeder.
    activePublisherChannel.once("close", onClose);

    try {
      // Mesajı onay mekanizmasıyla RabbitMQ'ya gönderir.
      activePublisherChannel.publish(
        exchange,
        routingKey,
        content,
        {
          ...options,

          // Mesajın broker tarafından kalıcı tutulmasını ister.
          persistent: true,

          // Mesajın herhangi bir kuyruğa yönlendirilememesi durumunda geri dönmesini ister.
          mandatory: true,

          // Her yayınlamayı diğerlerinden ayırt etmek için benzersiz header ekler.
          headers: {
            ...options.headers,
            "x-publish-confirm-id": publishId,
          },
        },
        (error) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          cleanup();

          // RabbitMQ mesajı reddederse işlemi başarısız sayar.
          if (error) {
            reject(error);
            return;
          }

          // Mesaj hiçbir kuyruğa yönlendirilemediyse hata fırlatır.
          if (isReturned) {
            reject(
              new Error(
                `RabbitMQ could not route message. Exchange: ${exchange}, Routing key: ${routingKey}`,
              ),
            );
            return;
          }

          // Broker onayladı ve mesaj yönlendirilebildiyse başarılı tamamlar.
          resolve();
        },
      );
    } catch (error) {
      if (isSettled) {
        return;
      }

      isSettled = true;
      cleanup();

      reject(
        error instanceof Error
          ? error
          : new Error(String(error)),
      );
    }
  });

  // Yayınlama işleminin onay sonucunu çağıran koda döndürür.
  return publishPromise;
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

  // Aktif kanal ve bağlantı referanslarını geçici olarak saklar.
  const activePublisherChannel = publisherChannel;
  const activeChannel = channel;
  const activeConnection = connection;

  // Global bağlantı referanslarını temizler.
  publisherChannel = null;
  channel = null;
  connection = null;

  // Publisher Confirm Channel'ı kapatır.
  try {
    await activePublisherChannel?.close();
  } catch {
    // Channel zaten kapanmış olabilir.
  }

  // Consumer Channel'ı kapatır.
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