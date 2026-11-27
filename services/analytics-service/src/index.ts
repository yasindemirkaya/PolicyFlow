
import express from "express";

import type { Request, Response } from "express";

// Express uygulamasını oluşturur.
const app = express();

// Server portunu environment üzerinden alır.
const PORT = Number(process.env.PORT) || 3000;

// JSON request body'lerini işler.
app.use(express.json());

// Health Check
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

app.get("/api/analytics/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: "analytics-service",
    status: "healthy",
  });
});

// HTTP Server'ı başlatır.
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Analytics Service is running on port ${PORT}`,
  );
});
