
import "reflect-metadata";
import { DataSource } from "typeorm";

import { env } from "../config/env.js";
import { IssueAnalytics } from "../entities/issue-analytics.entity.js";
import { CreateIssueAnalytics1796000000000 } from "../migrations/1796000000000-CreateIssueAnalytics.js";

// Analytics Service'in PostgreSQL bağlantısını ve TypeORM yapılandırmasını oluşturur.
const AnalyticsDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  schema: "analytics",

  synchronize: false,
  logging: env.nodeEnv === "development",

  entities: [
    IssueAnalytics,
  ],

  migrations: [
    CreateIssueAnalytics1796000000000,
  ],

  migrationsTableName: "analytics_service_migrations",
});

export default AnalyticsDataSource;
