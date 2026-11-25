import type { Channel } from "amqplib";

// Ana event Exchange.
export const RABBITMQ_EXCHANGE = "policyflow.events";

// Retry Exchange.
export const RABBITMQ_RETRY_EXCHANGE = "policyflow.retry";

// Dead Letter Exchange.
export const RABBITMQ_DLX_EXCHANGE = "policyflow.dlx";

// Ana Consumer Queue tanımları.
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

// Retry Queue tanımları.
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

// Dead Letter Queue tanımları.
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

/**
 * RabbitMQ Exchange, Queue ve Binding yapılarını oluşturur.
 *
 * assertExchange ve assertQueue mevcut yapılarla uyumlu
 * seçeneklerle çağrıldığı için tekrar çalıştırılabilir.
 */
export const setupRabbitMQTopology = async (
  rabbitChannel: Channel,
): Promise<void> => {
  // Ana Topic Exchange.
  await rabbitChannel.assertExchange(
    RABBITMQ_EXCHANGE,
    "topic",
    {
      durable: true,
    },
  );

  // Retry için Direct Exchange.
  await rabbitChannel.assertExchange(
    RABBITMQ_RETRY_EXCHANGE,
    "direct",
    {
      durable: true,
    },
  );

  // Dead Letter için Direct Exchange.
  await rabbitChannel.assertExchange(
    RABBITMQ_DLX_EXCHANGE,
    "direct",
    {
      durable: true,
    },
  );

  // Ana Consumer Queue'larını oluştur ve ana Exchange'e bağla.
  for (const queueDefinition of QUEUE_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      queueDefinition.name,
      {
        durable: true,
      },
    );

    for (const routingKey of queueDefinition.routingKeys) {
      await rabbitChannel.bindQueue(
        queueDefinition.name,
        RABBITMQ_EXCHANGE,
        routingKey,
      );
    }
  }

  // Retry Queue'larını oluştur ve Retry Exchange'e bağla.
  for (const retryQueue of RETRY_QUEUE_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      retryQueue.name,
      {
        durable: true,
        arguments: {
          "x-message-ttl": retryQueue.ttl,
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": retryQueue.targetQueue,
        },
      },
    );

    await rabbitChannel.bindQueue(
      retryQueue.name,
      RABBITMQ_RETRY_EXCHANGE,
      retryQueue.routingKey,
    );
  }

  // DLQ'ları oluştur ve DLX'e bağla.
  for (const dlq of DLQ_DEFINITIONS) {
    await rabbitChannel.assertQueue(
      dlq.name,
      {
        durable: true,
      },
    );

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