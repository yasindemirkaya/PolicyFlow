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

// Kaynak DLQ ve hedef ana kuyruğu belirler.
const DLQ_QUEUE = "integration.sms.dlq";
const MAIN_QUEUE = "integration.sms.queue";

// Yayınlanan mesajın RabbitMQ tarafından onaylanmasını bekler.
const publishWithConfirm = async (
  channel: amqp.ConfirmChannel,
  content: Buffer,
  options: Options.Publish,
  redriveId: string,
): Promise<void> => {
  // Mesajın hedef kuyruğa yönlendirilip yönlendirilmediğini takip eder.
  let isReturned = false;

  // RabbitMQ mesajı yönlendiremezse bu event çalışır.
  const onReturn = (message: Message): void => {
    if (
      message.properties.headers?.["x-redrive-id"] === redriveId
    ) {
      isReturned = true;
    }
  };

  // Event listener'larını temizler.
  const cleanup = (): void => {
    channel.removeListener("return", onReturn);
    channel.removeListener("close", onClose);
  };

  // Onay gelmeden kanal kapanırsa işlemi başarısız sayar.
  let rejectPublish: (error: Error) => void;

  const onClose = (): void => {
    cleanup();

    rejectPublish(
      new Error("Publisher channel closed before confirmation."),
    );
  };

  // Yayınlama işlemini Promise üzerinden yönetir.
  await new Promise<void>((resolve, reject) => {
    rejectPublish = reject;

    // Mesajın yönlendirme sonucunu takip eder.
    channel.on("return", onReturn);

    // Kanal kapanma durumunu takip eder.
    channel.once("close", onClose);

    try {
      // Default Exchange üzerinden doğrudan hedef kuyruğa yayınlar.
      channel.publish(
        "",
        MAIN_QUEUE,
        content,
        options,
        (error) => {
          cleanup();

          // RabbitMQ mesajı reddettiyse işlemi başarısız sayar.
          if (error) {
            reject(error);
            return;
          }

          // Mesaj hedef kuyruğa yönlendirilemediyse hata verir.
          if (isReturned) {
            reject(
              new Error("Message could not be routed to SMS queue."),
            );
            return;
          }

          // Broker onayı geldiyse işlemi tamamlar.
          resolve();
        },
      );
    } catch (error) {
      cleanup();

      reject(
        error instanceof Error
          ? error
          : new Error(String(error)),
      );
    }
  });
};

// DLQ içerisindeki tek bir mesajı ana SMS kuyruğuna taşır.
const redriveSmsMessage = async (): Promise<void> => {
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
      // DLQ içerisinden yalnızca bir mesaj alır.
      const message = await channel.get(
        DLQ_QUEUE,
        { noAck: false },
      );

      // DLQ içerisinde mesaj yoksa işlemi sonlandırır.
      if (!message) {
        console.log("[REDRIVE] No message found in SMS DLQ.");
        return;
      }

      // Orijinal mesajın header bilgilerini korur.
      const headers: Record<string, unknown> = {
        ...message.properties.headers,
      };

      // Önceki başarısız denemenin bilgilerini temizler.
      delete headers["x-total-attempts"];
      delete headers["x-final-failure-reason"];
      delete headers["x-publish-confirm-id"];

      // Yeni bir deneme süreci başlatır.
      const redriveId = randomUUID();

      headers["x-retry-count"] = 0;
      headers["x-redriven-at"] = new Date().toISOString();
      headers["x-redrive-id"] = redriveId;

      // Yeni yayınlama seçeneklerini oluşturur.
      const publishOptions: Options.Publish = {
        persistent: true,
        mandatory: true,
        headers,
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

      // Mesajı ana kuyruğa yayınlar ve RabbitMQ onayını bekler.
      await publishWithConfirm(
        channel,
        message.content,
        publishOptions,
        redriveId,
      );

      // Yeni mesaj onaylandıktan sonra eski DLQ mesajını ACK eder.
      channel.ack(message);

      console.log(
        `[REDRIVE] Message successfully moved from ${DLQ_QUEUE} to ${MAIN_QUEUE}`,
      );
    } finally {
      // İşlem bitince yayınlama kanalını kapatır.
      await channel.close().catch(() => undefined);
    }
  } finally {
    // İşlem bitince RabbitMQ bağlantısını kapatır.
    await connection.close().catch(() => undefined);
  }
};

// Redrive işlemini başlatır ve hataları yakalar.
redriveSmsMessage().catch((error) => {
  console.error("[REDRIVE] Operation failed:", error);
  process.exitCode = 1;
});