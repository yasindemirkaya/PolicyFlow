
import "reflect-metadata";
import express from "express";

import type { Request, Response, NextFunction } from "express";

import { env } from "./config/env.js";
import connectDatabase, { closeDatabase } from "./infrastructure/database.js";
import policyRoutes from "./routes/policy.routes.js";

import { PolicyServiceError } from "./services/policy.service.js";
import { ServiceClientError } from "./clients/service-client.error.js";

// RabbitMQ Worker
import {
  startOutboxWorker,
  stopOutboxWorker,
} from "./workers/rabbitmq-outbox.worker.js";

// Kafka Worker
import {
  startKafkaOutboxWorker,
  stopKafkaOutboxWorker,
} from "./workers/kafka-outbox.worker.js";

// Publisher bağlantıları
import { closeRabbitMQPublisher } from "./infrastructure/rabbitmq.publisher.js";
import { closeKafkaProducer } from "./infrastructure/kafka.publisher.js";

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

// HTTP Server referansı
let httpServer: ReturnType<typeof app.listen> | null = null;

// Shutdown işleminin birden fazla kez çalışmasını önler.
let isShuttingDown = false;

// Uygulamayı kontrollü şekilde kapatır.
const shutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`[POLICY SERVICE] ${signal} received. Shutting down...`);

  try {
    // Yeni HTTP isteklerini kabul etmeyi durdurur.
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      console.log("[POLICY SERVICE] HTTP server closed");
    }

    // RabbitMQ ve Kafka Worker'larını durdurur.
    // Devam eden event işlemlerinin tamamlanmasını bekler.
    await Promise.all([
      stopOutboxWorker(),
      stopKafkaOutboxWorker(),
    ]);

    // RabbitMQ ve Kafka Publisher bağlantılarını kapatır.
    await Promise.all([
      closeRabbitMQPublisher(),
      closeKafkaProducer(),
    ]);

    // PostgreSQL bağlantısını kapatır.
    await closeDatabase();

    console.log("[POLICY SERVICE] Shutdown completed");

    process.exit(0);
  } catch (error) {
    console.error("[POLICY SERVICE] Shutdown failed:", error);
    process.exit(1);
  }
};

// İşletim sistemi kapatma sinyallerini dinler.
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

// Start Server
const startServer = async (): Promise<void> => {
  try {
    // PostgreSQL bağlantısını kurar ve migration'ları çalıştırır.
    await connectDatabase();

    // RabbitMQ Outbox Worker'ı başlatır.
    startOutboxWorker();

    // Kafka Outbox Worker'ı başlatır.
    startKafkaOutboxWorker();

    // HTTP sunucusunu başlatır.
    httpServer = app.listen(env.port, "0.0.0.0", () => {
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
