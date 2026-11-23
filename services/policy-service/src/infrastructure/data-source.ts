import "reflect-metadata";
import { DataSource } from "typeorm";

import { env } from "../config/env.js";

import { Policy } from "../entities/policy.entity.js";
import { OutboxEvent } from "../entities/outbox-event.entity.js";

import { CreateOutboxEvents1795445724093 } from "../migrations/1795445724093-CreateOutboxEvents.js";

// Policy Service'in PostgreSQL bağlantısını ve TypeORM yapılandırmasını oluşturur.
const PolicyDataSource = new DataSource({
  type: "postgres",

  host: env.database.host,
  port: env.database.port,

  username: env.database.username,
  password: env.database.password,

  database: env.database.name,

  // Veritabanı tablolarının otomatik değiştirilmesini engeller.
  synchronize: false,

  // Development ortamında SQL sorgularını loglar.
  logging: env.nodeEnv === "development",

  // Policy Service tarafından yönetilen entity'leri tanımlar.
  entities: [Policy, OutboxEvent],

  // Policy Service migration dosyalarını tanımlar.
  migrations: [CreateOutboxEvents1795445724093],

  // Migration geçmişi için servise özel tablo kullanır.
  migrationsTableName: "policy_service_migrations",
});

export default PolicyDataSource;