import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "../config/env.js";

import { Customer } from "../modules/customers/entities/customer.entity.js";
import { Policy } from "../modules/policies/entities/policy.entity.js";
import { Product } from "../modules/products/entities/product.entity.js";

import { CreateCustomersTable1794916088608 } from "./migrations/1794916088608-CreateCustomersTable.js";
import { CreatePoliciesTable1794917662847 } from "./migrations/1794917662847-CreatePoliciesTable.js";
import { CreateProductsTable1794923875538 } from "./migrations/1794923875538-CreateProductsTable.js";
import { AddCustomerIdentityFields1794925418758 } from "./migrations/1794925418758-AddCustomerIdentityFields.js";

const AppDataSource = new DataSource({
  type: "postgres",
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,

  synchronize: false,
  logging: env.nodeEnv === "development",

  entities: [Customer, Policy, Product],
  migrations: [
    CreateCustomersTable1794916088608,
    CreatePoliciesTable1794917662847,
    CreateProductsTable1794923875538,
    AddCustomerIdentityFields1794925418758
  ],
});

export default AppDataSource;