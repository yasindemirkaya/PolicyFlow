import "reflect-metadata";
import express from "express";

import { env } from "./config/env.js";
import connectDatabase from "./infrastructure/database.js";

const app = express();

// Middleware
app.use(express.json());

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "customer-service",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// Start Server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `Customer Service is running on port ${env.port}`,
      );
    });
  } catch (error) {
    console.error("Customer Service startup failed:", error);
    process.exit(1);
  }
};

void startServer();