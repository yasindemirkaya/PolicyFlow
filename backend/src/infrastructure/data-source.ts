import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

import { Customer } from "../modules/customers/entities/customer.entity.js";
import { CreateCustomersTable1794916088608 } from "./migrations/1794916088608-CreateCustomersTable.js";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  synchronize: false,
  logging: env.nodeEnv === "development",

  entities: [Customer],
  migrations: [CreateCustomersTable1794916088608],
});

export default AppDataSource;