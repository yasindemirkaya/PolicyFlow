
import { Kafka } from "kafkajs";

import { env } from "../config/env.js";

// Policy Service için Kafka client oluşturur.
export const kafka = new Kafka({
  clientId: "policy-service",
  brokers: env.kafka.brokers,
});
