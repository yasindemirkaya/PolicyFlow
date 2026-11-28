
import express from "express";
import type { Request, Response } from "express";

import connectDatabase, {
  closeDatabase,
} from "./infrastructure/database.js";

import {
  connectKafkaConsumer,
  disconnectKafkaConsumer,
} from "./infrastructure/kafka.consumer.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Analytics Service doğrudan sağlık kontrolü.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "analytics-service",
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
});

// API Gateway üzerinden erişim testi.
app.get("/api/analytics/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "analytics-service",
    status: "healthy",
  });
});

// Uygulamayı başlat.
const startServer = async (): Promise<void> => {
  try {
    // Önce PostgreSQL bağlantısını kur.
    await connectDatabase();

    // Ardından Kafka Consumer bağlantısını kur ve dinlemeyi başlat.
    await connectKafkaConsumer();

    // Her iki bağlantı da başarılıysa HTTP sunucusunu başlat.
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Analytics Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Analytics Service startup failed:", error);
    await shutdown(1);
  }
};

// Uygulama kapanırken kaynakları temizle.
let isShuttingDown = false;

const shutdown = async (exitCode = 0): Promise<void> => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log("[Analytics Service] Shutting down...");

  try {
    await disconnectKafkaConsumer();
  } catch (error) {
    console.error("[Kafka] Shutdown error:", error);
    exitCode = 1;
  }

  try {
    await closeDatabase();
  } catch (error) {
    console.error("[Database] Shutdown error:", error);
    exitCode = 1;
  }

  process.exit(exitCode);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void startServer();
