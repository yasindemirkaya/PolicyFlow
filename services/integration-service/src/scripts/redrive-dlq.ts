// RabbitMQ bağlantı kütüphanesini içe aktarır.
import amqp from "amqplib";

// Her redrive işlemi için benzersiz kimlik oluşturur.
import { randomUUID } from "node:crypto";

// RabbitMQ mesaj ve yayınlama tiplerini içe aktarır.
import type {
  Message,
  Options,
} from "amqplib";

// Merkezi RabbitMQ bağlantı ayarlarını içe aktarır.
import { env } from "../config/env.js";

// Consumer'ların DLQ ve ana kuyruk isimlerini merkezi olarak tanımlar.
const CONSUMER_QUEUES = {
  sms: {
    dlq: "integration.sms.dlq",
    main: "integration.sms.queue",
  },
  email: {
    dlq: "integration.email.dlq",
    main: "integration.email.queue",
  },
  crm: {
    dlq: "integration.crm.dlq",
    main: "integration.crm.queue",
  },
} as const;

// Desteklenen Consumer isimlerini otomatik olarak belirler.
type ConsumerName = keyof typeof CONSUMER_QUEUES;

// Komut satırından gelen Consumer parametresini kontrol eder.
const getConsumerName = (): ConsumerName => {
  const consumerName = process.argv[2]?.toLowerCase();

  // Geçersiz parametre verilirse kullanım bilgisini gösterir.
  if (
    !consumerName ||
    !Object.hasOwn(CONSUMER_QUEUES, consumerName)
  ) {
    throw new Error(
      "Usage: npx tsx src/scripts/redrive-dlq.ts <sms|email|crm>",
    );
  }

  return consumerName as ConsumerName;
};

// Mesajı hedef kuyruğa gönderir ve RabbitMQ onayını bekler.
const publishWithConfirm = async (
  channel: amqp.ConfirmChannel,
  targetQueue: string,
  message: Message,
  headers: Record<string, unknown>,
  redriveId: string,
): Promise<void> => {
  // Mesajın hedef kuyruğa yönlendirilip yönlendirilmediğini takip eder.
  let isReturned = false;
  let isSettled = false;

  // Yayınlama seçeneklerini oluşturur.
  const publishOptions: Options.Publish = {
    persistent: true,
    mandatory: true,
    headers: {
      ...headers,
      "x-redrive-id": redriveId,
    },
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Orijinal mesajın önemli özelliklerini korur.
  if (message.properties.contentType) {
    publishOptions.contentType = message.properties.contentType;
  }

  if (message.properties.contentEncoding) {
    publishOptions.contentEncoding =
      message.properties.contentEncoding;
  }

  if (message.properties.messageId) {
    publishOptions.messageId = message.properties.messageId;
  }

  if (message.properties.correlationId) {
    publishOptions.correlationId =
      message.properties.correlationId;
  }

  if (message.properties.type) {
    publishOptions.type = message.properties.type;
  }

  if (message.properties.appId) {
    publishOptions.appId = message.properties.appId;
  }

  if (message.properties.replyTo) {
    publishOptions.replyTo = message.properties.replyTo;
  }

  // Yayınlama işlemini Promise üzerinden yönetir.
  await new Promise<void>((resolve, reject) => {
    // Event listener'larını temizler.
    const cleanup = (): void => {
      channel.removeListener("return", onReturn);
      channel.removeListener("close", onClose);
    };

    // İşlemin sonucunu yalnızca bir defa tamamlar.
    const settle = (error?: Error): void => {
      if (isSettled) return;

      isSettled = true;
      cleanup();

      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    // Mesaj hiçbir kuyruğa yönlendirilemezse bu event çalışır.
    const onReturn = (returnedMessage: Message): void => {
      if (
        returnedMessage.properties.headers?.["x-redrive-id"] ===
        redriveId
      ) {
        isReturned = true;
      }
    };

    // Publisher Channel kapanırsa işlemi başarısız sayar.
    const onClose = (): void => {
      settle(
        new Error("Publisher channel closed before confirmation."),
      );
    };

    // Mesaj yönlendirme sonuçlarını takip eder.
    channel.on("return", onReturn);

    // Kanalın kapanma durumunu takip eder.
    channel.once("close", onClose);

    try {
      // Mesajı Default Exchange üzerinden doğrudan hedef kuyruğa gönderir.
      channel.publish(
        "",
        targetQueue,
        message.content,
        publishOptions,
        (error) => {
          // Broker mesajı reddederse işlemi başarısız sayar.
          if (error) {
            settle(error);
            return;
          }

          // Mesaj hedef kuyruğa ulaşamadıysa hata verir.
          if (isReturned) {
            settle(
              new Error(
                `Message could not be routed to ${targetQueue}`,
              ),
            );
            return;
          }

          // RabbitMQ onayı geldiyse işlemi başarılı tamamlar.
          settle();
        },
      );
    } catch (error) {
      settle(
        error instanceof Error
          ? error
          : new Error(String(error)),
      );
    }
  });
};

// Seçilen Consumer'ın DLQ mesajını ana kuyruğa taşır.
const redriveMessage = async (
  consumerName: ConsumerName,
): Promise<void> => {
  // Seçilen Consumer'ın kuyruk isimlerini alır.
  const queues = CONSUMER_QUEUES[consumerName];

  // RabbitMQ sunucusuna bağlantı kurar.
  const connection = await amqp.connect({
    protocol: "amqp",
    hostname: env.rabbitmq.host,
    port: env.rabbitmq.port,
    username: env.rabbitmq.username,
    password: env.rabbitmq.password,
    vhost: env.rabbitmq.vhost,
    heartbeat: 30,
  });

  try {
    // Mesaj yayınlama onaylarını takip eden kanal oluşturur.
    const channel = await connection.createConfirmChannel();

    try {
      // Seçilen DLQ içerisinden yalnızca bir mesaj alır.
      const message = await channel.get(
        queues.dlq,
        { noAck: false },
      );

      // Kuyruk boşsa işlemi sonlandırır.
      if (!message) {
        console.log(
          `[REDRIVE] No message found in ${queues.dlq}`,
        );

        return;
      }

      // Orijinal mesajın header bilgilerini korur.
      const headers: Record<string, unknown> = {
        ...message.properties.headers,
      };

      // Önceki başarısız deneme bilgilerini temizler.
      delete headers["x-total-attempts"];
      delete headers["x-final-failure-reason"];
      delete headers["x-publish-confirm-id"];
      delete headers["x-redrive-id"];

      // Yeni bir Retry süreci için sayacı sıfırlar.
      headers["x-retry-count"] = 0;
      headers["x-redriven-at"] = new Date().toISOString();

      // Bu yayınlama için benzersiz kimlik oluşturur.
      const redriveId = randomUUID();

      // Mesajı ana kuyruğa gönderir ve RabbitMQ onayını bekler.
      await publishWithConfirm(
        channel,
        queues.main,
        message,
        headers,
        redriveId,
      );

      // Yeni mesaj onaylandıktan sonra eski DLQ mesajını ACK eder.
      channel.ack(message);

      console.log(
        `[REDRIVE] Message successfully moved from ${queues.dlq} to ${queues.main}`,
      );
    } finally {
      // İşlem tamamlandığında Confirm Channel'ı kapatır.
      await channel.close().catch(() => undefined);
    }
  } finally {
    // İşlem tamamlandığında RabbitMQ bağlantısını kapatır.
    await connection.close().catch(() => undefined);
  }
};

// Redrive işlemini başlatır ve oluşabilecek hataları yakalar.
const main = async (): Promise<void> => {
  // Komut satırından Consumer ismini alır.
  const consumerName = getConsumerName();

  console.log(
    `[REDRIVE] Starting redrive for ${consumerName.toUpperCase()}`,
  );

  // Seçilen Consumer'ın DLQ mesajını taşır.
  await redriveMessage(consumerName);
};

// Script'i çalıştırır ve hataları terminale yazar.
main().catch((error) => {
  console.error("[REDRIVE] Operation failed:", error);
  process.exitCode = 1;
});