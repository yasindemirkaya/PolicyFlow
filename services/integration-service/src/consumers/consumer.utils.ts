// RabbitMQ Channel ve Message tiplerini içe aktarır.
import type {
  Channel,
  ConsumeMessage,
} from "amqplib";

// Onaylı mesaj yayınlama fonksiyonunu ve Exchange isimlerini içe aktarır.
import {
  publishConfirmedMessage,
  RABBITMQ_RETRY_EXCHANGE,
  RABBITMQ_DLX_EXCHANGE,
} from "../infrastructure/rabbitmq.js";

// Gelen event'i doğrulayan metodu ve tipini içe aktarır.
import {
  parsePolicyIssuedEvent,
  type PolicyIssuedEvent,
} from "../types/policy-issued-event.js";

// Consumer tarafından çalıştırılacak handler metodunun tipini tanımlar.
type EventHandler = (
  event: PolicyIssuedEvent,
) => Promise<void>;

// Consumer servislerinin isimlerini sınırlandırır.
type ConsumerName = "SMS" | "EMAIL" | "CRM";

// Bir mesajın toplam kaç defa işlenebileceğini belirler.
const MAX_ATTEMPTS = 3;

// Mesajın kaçıncı tekrarında hangi gecikmenin uygulanacağını belirler.
const RETRY_DELAYS = [5000, 10000] as const;

// Mesajın daha önce kaç kez tekrar kuyruğuna gönderildiğini okur.
const getRetryCount = (message: ConsumeMessage): number => {
  const retryCount =
    message.properties.headers?.["x-retry-count"];

  // Geçerli bir retry sayısı bulunamazsa ilk deneme kabul eder.
  return typeof retryCount === "number" && retryCount >= 0
    ? Math.floor(retryCount)
    : 0;
};

// Retry mesajını ilgili gecikmeli kuyruğa gönderir ve broker onayını bekler.
const publishToRetryQueue = async (
  message: ConsumeMessage,
  consumerName: ConsumerName,
  retryCount: number,
): Promise<void> => {
  // Servis adını routing key içerisinde kullanılacak formata dönüştürür.
  const serviceName = consumerName.toLowerCase();

  // Retry sayısına göre 5 veya 10 saniyelik gecikmeyi belirler.
  const delay = RETRY_DELAYS[retryCount - 1];

  // Mesajın gönderileceği Retry routing key değerini oluşturur.
  const routingKey =
    `integration.${serviceName}.retry.${delay / 1000}s`;

  // Mesajı Confirm Channel üzerinden yayınlar ve RabbitMQ onayını bekler.
  await publishConfirmedMessage(
    RABBITMQ_RETRY_EXCHANGE,
    routingKey,
    message.content,
    {
      contentType: message.properties.contentType,
      messageId: message.properties.messageId,
      type: message.properties.type,
      correlationId: message.properties.correlationId,

      // Önceki header bilgilerini koruyup retry sayısını günceller.
      headers: {
        ...message.properties.headers,
        "x-retry-count": retryCount,
      },

      timestamp: Math.floor(Date.now() / 1000),
    },
  );

  console.log(
    `[${consumerName} CONSUMER] Retry ${retryCount}/${MAX_ATTEMPTS - 1} confirmed. Delay: ${delay / 1000}s`,
  );
};

// Üçüncü denemeden sonra başarısız mesajı DLQ'ya gönderir.
const publishToDeadLetterQueue = async (
  message: ConsumeMessage,
  consumerName: ConsumerName,
  retryCount: number,
  reason: string,
): Promise<void> => {
  // Servis adına göre ilgili DLQ routing key değerini oluşturur.
  const serviceName = consumerName.toLowerCase();
  const routingKey = `integration.${serviceName}.dlq`;

  // Mesajı Confirm Channel üzerinden DLQ'ya gönderir ve onay bekler.
  await publishConfirmedMessage(
    RABBITMQ_DLX_EXCHANGE,
    routingKey,
    message.content,
    {
      contentType: message.properties.contentType,
      messageId: message.properties.messageId,
      type: message.properties.type,
      correlationId: message.properties.correlationId,

      // DLQ mesajına retry ve hata bilgilerini ekler.
      headers: {
        ...message.properties.headers,
        "x-retry-count": retryCount,
        "x-total-attempts": retryCount + 1,
        "x-final-failure-reason": reason,
      },

      timestamp: Math.floor(Date.now() / 1000),
    },
  );

  console.error(
    `[${consumerName} CONSUMER] Message moved to DLQ after ${retryCount + 1} attempts: ${routingKey}`,
  );
};

// Mesaj aktarımı başarısız olduğunda Consumer kanalını kapatır.
const closeConsumerChannel = async (
  channel: Channel,
  consumerName: ConsumerName,
  error: unknown,
): Promise<void> => {
  console.error(
    `[${consumerName} CONSUMER] Message publishing failed:`,
    error,
  );

  // ACK edilmemiş mesajların RabbitMQ tarafından yeniden teslim edilmesini sağlar.
  await channel.close().catch(() => undefined);
};

// Queue içerisinde bekleyen mesajları dinlemeye başlar.
export const registerPolicyIssuedConsumer = async (
  channel: Channel,
  queueName: string,
  consumerName: ConsumerName,
  handler: EventHandler,
): Promise<void> => {
  // Consumer'ın aynı anda en fazla bir mesaj işlemesini sağlar.
  await channel.prefetch(1);

  // İlgili kuyruğu dinlemeye başlar.
  await channel.consume(
    queueName,
    (message) => {
      // Consumer iptal edildiğinde gelen null değerini kontrol eder.
      if (!message) return;

      // Gelen mesajı işleme metoduna gönderir.
      void processMessage(
        channel,
        message,
        consumerName,
        handler,
      );
    },
    { noAck: false },
  );

  console.log(
    `[${consumerName} CONSUMER] Listening on ${queueName}`,
  );
};

// Gelen mesajı doğrular, işler ve ACK yönetimini gerçekleştirir.
const processMessage = async (
  channel: Channel,
  message: ConsumeMessage,
  consumerName: ConsumerName,
  handler: EventHandler,
): Promise<void> => {
  let event: PolicyIssuedEvent;

  // Gelen mesajın event formatını doğrular.
  try {
    event = parsePolicyIssuedEvent(message.content);
  } catch (error) {
    console.error(
      `[${consumerName} CONSUMER] Invalid message:`,
      error,
    );

    try {
      // Geçersiz mesajı doğrudan ilgili DLQ'ya gönderir.
      await publishToDeadLetterQueue(
        message,
        consumerName,
        getRetryCount(message),
        "Invalid event payload",
      );

      // RabbitMQ onayı geldikten sonra orijinal mesajı ACK eder.
      channel.ack(message);
    } catch (publishError) {
      // DLQ yayını onaylanmazsa orijinal mesaj ACK edilmez.
      await closeConsumerChannel(
        channel,
        consumerName,
        publishError,
      );
    }

    return;
  }

  try {
    // Event'e ait iş mantığını çalıştırır.
    await handler(event);

    // İşlem başarılıysa mesajı RabbitMQ'ya ACK eder.
    channel.ack(message);

    console.log(
      `[${consumerName} CONSUMER] Message acknowledged`,
    );
  } catch (error) {
    console.error(
      `[${consumerName} CONSUMER] Processing failed:`,
      error,
    );

    // Mesajın önceki retry sayısını öğrenir.
    const retryCount = getRetryCount(message);

    try {
      if (retryCount < MAX_ATTEMPTS - 1) {
        // İlk veya ikinci başarısızlıkta retry sayısını artırır.
        const nextRetryCount = retryCount + 1;

        // Mesajı uygun gecikmeli Retry kuyruğuna gönderir ve onay bekler.
        await publishToRetryQueue(
          message,
          consumerName,
          nextRetryCount,
        );

        // RabbitMQ onayı geldikten sonra orijinal mesajı ACK eder.
        channel.ack(message);

        return;
      }

      // Son deneme de başarısızsa mesajı DLQ'ya gönderir.
      await publishToDeadLetterQueue(
        message,
        consumerName,
        retryCount,
        error instanceof Error ? error.message : String(error),
      );

      // RabbitMQ onayı geldikten sonra orijinal mesajı ACK eder.
      channel.ack(message);
    } catch (publishError) {
      // Retry veya DLQ yayını onaylanmazsa orijinal mesaj ACK edilmez.
      await closeConsumerChannel(
        channel,
        consumerName,
        publishError,
      );
    }
  }
};