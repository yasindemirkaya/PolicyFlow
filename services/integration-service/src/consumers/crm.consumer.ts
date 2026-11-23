// RabbitMQ Channel tipini içe aktarır.
import type { Channel } from "amqplib";

// Ortak Consumer kayıt metodunu içe aktarır.
import { registerPolicyIssuedConsumer } from "./consumer.utils.js";

// Poliçe tanzim CRM metodunu içe aktarır.
import { updateCrmForPolicyIssued } from "../modules/crm/services/crm.service.js";

// CRM kuyruğunu dinlemeye başlar.
export const registerCrmConsumer = async (
  channel: Channel,
): Promise<void> => {
  // Poliçe tanzim event'ini CRM Service'e yönlendirir.
  await registerPolicyIssuedConsumer(
    channel,
    "integration.crm.queue",
    "CRM",
    updateCrmForPolicyIssued,
  );
};