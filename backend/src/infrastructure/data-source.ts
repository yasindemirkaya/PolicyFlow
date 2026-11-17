import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

import { Customer } from "../modules/customers/entities/customer.entity.js";
import { Policy } from "../modules/policies/entities/policy.entity.js";
import { CreateCustomersTable1794916088608 } from "./migrations/1794916088608-CreateCustomersTable.js";
import { CreatePoliciesTable1794917662847 } from "./migrations/1794917662847-CreatePoliciesTable.js";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  synchronize: false,
  logging: env.nodeEnv === "development",

  entities: [Customer, Policy],
  migrations: [
    CreateCustomersTable1794916088608,
    CreatePoliciesTable1794917662847
  ],
});

export default AppDataSource;