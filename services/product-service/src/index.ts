import "reflect-metadata";
import express from "express";

import { env } from "./config/env.js";
import connectDatabase from "./infrastructure/database.js";
import productRoutes from "./routes/product.routes.js";

import type { Request, Response, NextFunction } from "express";

const app = express();

// Middleware
app.use(express.json());

// Product Routes
app.use("/api/products", productRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "product-service",
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
    console.error("Product Service error:", error);

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
        `Product Service is running on port ${env.port}`,
      );
    });
  } catch (error) {
    console.error("Product Service startup failed:", error);
    process.exit(1);
  }
};

void startServer();