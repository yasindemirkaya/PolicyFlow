
import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.replace(/\/+$/, "");
};

const getNumberEnv = (
  key: string,
  defaultValue: number,
): number => {
  const value = process.env[key];

  if (!value) return defaultValue;

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid environment variable: ${key}`);
  }

  return parsedValue;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: getNumberEnv("PORT", 3000),

  database: {
    host: getRequiredEnv("DB_HOST"),
    port: getNumberEnv("DB_PORT", 5432),
    username: getRequiredEnv("DB_USERNAME"),
    password: getRequiredEnv("DB_PASSWORD"),
    name: getRequiredEnv("DB_NAME"),
  },

  kafka: {
    brokers: getRequiredEnv("KAFKA_BROKERS")
      .split(",")
      .map((broker) => broker.trim()),
  },
};
