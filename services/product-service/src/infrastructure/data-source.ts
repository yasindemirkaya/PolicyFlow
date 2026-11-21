import "reflect-metadata";
import { DataSource } from "typeorm";

import { env } from "../config/env.js";
import { Product } from "../entities/product.entity.js";

const ProductDataSource = new DataSource({
  type: "postgres",

  host: env.database.host,
  port: env.database.port,

  username: env.database.username,
  password: env.database.password,

  database: env.database.name,

  synchronize: false,

  logging: env.nodeEnv === "development",

  entities: [Product],
});

export default ProductDataSource;