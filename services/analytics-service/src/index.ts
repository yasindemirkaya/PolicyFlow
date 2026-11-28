
import express from "express";
import type { Request, Response } from "express";
import connectDatabase, {
  closeDatabase,
} from "./infrastructure/database.js";

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
    await connectDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Analytics Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Analytics Service startup failed:", error);
    process.exit(1);
  }
};

// Uygulama kapanırken veritabanı bağlantısını kapat.
const shutdown = async (): Promise<void> => {
  console.log("[Analytics Service] Shutting down...");

  try {
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error("[Analytics Service] Shutdown failed:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

void startServer();
