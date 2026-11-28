
import { Kafka, logLevel } from "kafkajs";
import { env } from "../config/env.js";

// Analytics Service Kafka bağlantısını oluşturur.
export const kafka = new Kafka({
  clientId: "analytics-service",
  brokers: env.kafka.brokers,

  logLevel: logLevel.INFO,

  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});
