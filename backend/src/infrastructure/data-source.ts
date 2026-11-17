
import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  synchronize: false,
  logging: env.nodeEnv === "development",

  entities: [],
  migrations: []
});

export default AppDataSource;
