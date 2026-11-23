// CRM, SMS ve Email consumerlarının ortak kullanacağı utility metotları içerir.


// RabbitMQ Consumer ve Message tiplerini içe aktarır.
import type {
  Channel,
  ConsumeMessage,
} from "amqplib";

// Gelen poliçe event'ini doğrulayan metodu içe aktarır.
import {
  parsePolicyIssuedEvent,
  type PolicyIssuedEvent,
} from "../types/policy-issued-event.js";

// Consumer tarafından çalıştırılacak metot tipini tanımlar.
type EventHandler = (
  event: PolicyIssuedEvent,
) => Promise<void>;

// Belirtilen kuyruğu dinlemeye başlar.
export const registerPolicyIssuedConsumer = async (
  channel: Channel,
  queueName: string,
  consumerName: string,
  handler: EventHandler,
): Promise<void> => {
  // Mesajları manuel ACK ile işleyecek şekilde Consumer oluşturur.
  await channel.consume(
    queueName,
    (message) => {
      // RabbitMQ Consumer iptal edildiğinde gelen null değerini kontrol eder.
      if (!message) return;

      // Gelen mesajı ilgili handler metoduna gönderir.
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

// Gelen mesajı doğrular ve işleme sonucuna göre ACK/NACK gönderir.
const processMessage = async (
  channel: Channel,
  message: ConsumeMessage,
  consumerName: string,
  handler: EventHandler,
): Promise<void> => {
  let event: PolicyIssuedEvent;

  try {
    // Gelen RabbitMQ mesajının event formatını doğrular.
    event = parsePolicyIssuedEvent(message.content);
  } catch (error) {
    console.error(
      `[${consumerName} CONSUMER] Invalid message:`,
      error,
    );

    // Geçersiz mesajı tekrar kuyruğa almadan reddeder.
    channel.nack(message, false, false);
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

    // İşlem başarısızsa mesajı yeniden kuyruğa alır.
    channel.nack(message, false, true);
  }
};