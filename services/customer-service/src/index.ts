import "reflect-metadata";
import express from "express";

import { env } from "./config/env.js";
import connectDatabase from "./infrastructure/database.js";
import customerRoutes from "./routes/customer.routes.js";

const app = express();

// Middleware
app.use(express.json());

// Global Request Logger
app.use((req, _res, next) => {
  console.log(
    `[INCOMING REQUEST] ${req.method} ${req.originalUrl}`,
  );
  next();
});

// Customer Routes Logger
app.use(
  "/api/customers",
  (req, _res, next) => {
    console.log(
      `[CUSTOMER ROUTE MATCHED] ${req.method} ${req.originalUrl}`,
    );
    next();
  },
  customerRoutes,
);

console.log("[ROUTES] Customer routes registered");

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