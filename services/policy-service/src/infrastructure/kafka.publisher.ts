
import type { Producer } from "kafkajs";

import { kafka } from "./kafka.client.js";

import { OutboxEvent } from "../entities/outbox-event.entity.js";

// Kafka üzerinde kullanılacak Topic adını belirler.
const KAFKA_TOPIC = "policy.issued";

// Producer bağlantısını saklar.
let producer: Producer | null = null;

// Aynı anda birden fazla bağlantı kurulmasını önler.
let connectionPromise: Promise<Producer> | null = null;

// Kafka Producer bağlantısını oluşturur.
const createProducer = async (): Promise<Producer> => {
  const newProducer = kafka.producer();

  await newProducer.connect();

  producer = newProducer;

  console.log("[POLICY KAFKA] Producer connected successfully");

  return newProducer;
};

// Aktif Producer'ı döndürür veya yeni bağlantı oluşturur.
const getProducer = async (): Promise<Producer> => {
  if (producer) {
    return producer;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const newConnectionPromise = createProducer();

  connectionPromise = newConnectionPromise;

  try {
    return await newConnectionPromise;
  } finally {
    if (connectionPromise === newConnectionPromise) {
      connectionPromise = null;
    }
  }
};

// Outbox event'ini Kafka Topic üzerine yayınlar.
export const publishKafkaEvent = async (
  event: OutboxEvent,
): Promise<void> => {
  const activeProducer = await getProducer();

  await activeProducer.send({
    topic: KAFKA_TOPIC,
    messages: [
      {
        key: event.id,
        value: JSON.stringify(event.payload),
        headers: {
          eventId: event.id,
          eventType: event.eventType,
        },
      },
    ],
  });

  console.log(
    `[POLICY KAFKA] Event published: ${event.eventType} (${event.id})`,
  );
};

// Uygulama kapanırken Kafka Producer bağlantısını kapatır.
export const closeKafkaProducer = async (): Promise<void> => {
  const activeProducer = producer;

  producer = null;

  try {
    await activeProducer?.disconnect();
  } catch (error) {
    console.error("[POLICY KAFKA] Producer disconnect failed:", error);
  }

  console.log("[POLICY KAFKA] Producer connection closed");
};
