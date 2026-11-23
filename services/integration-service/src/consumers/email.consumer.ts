// RabbitMQ Channel tipini içe aktarır.
import type { Channel } from "amqplib";

// Ortak Consumer kayıt metodunu içe aktarır.
import { registerPolicyIssuedConsumer } from "./consumer.utils.js";

// Poliçe tanzim Email metodunu içe aktarır.
import { sendPolicyIssuedEmail } from "../modules/notification/services/email.service.js";

// Email kuyruğunu dinlemeye başlar.
export const registerEmailConsumer = async (
  channel: Channel,
): Promise<void> => {
  // Poliçe tanzim event'ini Email Service'e yönlendirir.
  await registerPolicyIssuedConsumer(
    channel,
    "integration.email.queue",
    "EMAIL",
    sendPolicyIssuedEmail,
  );
};