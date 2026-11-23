// RabbitMQ Channel tipini içe aktarır.
import type { Channel } from "amqplib";

// Ortak Consumer kayıt metodunu içe aktarır.
import { registerPolicyIssuedConsumer } from "./consumer.utils.js";

// Poliçe tanzim SMS metodunu içe aktarır.
import { sendPolicyIssuedSms } from "../modules/notification/services/sms.service.js";

// SMS kuyruğunu dinlemeye başlar.
export const registerSmsConsumer = async (
  channel: Channel,
): Promise<void> => {
  // Poliçe tanzim event'ini SMS Service'e yönlendirir.
  await registerPolicyIssuedConsumer(
    channel,
    "integration.sms.queue",
    "SMS",
    sendPolicyIssuedSms,
  );
};