import "reflect-metadata";
import express from "express";

import type { Request, Response, NextFunction } from "express";

import { env } from "./config/env.js";
import connectDatabase from "./infrastructure/database.js";
import policyRoutes from "./routes/policy.routes.js";

import { PolicyServiceError } from "./services/policy.service.js";
import { ServiceClientError } from "./clients/service-client.error.js";

const app = express();

// Middleware
app.use(express.json());

// Policy Routes
app.use("/api/policies", policyRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "policy-service",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// Not Found Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route not found",
    },
  });
});

// Global Error Handler
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (
      error instanceof PolicyServiceError ||
      error instanceof ServiceClientError
    ) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error("Policy Service error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  },
);

// Start Server
const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `Policy Service is running on port ${env.port}`,
      );
    });
  } catch (error) {
    console.error("Policy Service startup failed:", error);
    process.exit(1);
  }
};

void startServer();