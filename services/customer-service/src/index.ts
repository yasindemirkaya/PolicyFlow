import "reflect-metadata";
import express from "express";

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

// Server Configuration
const PORT = Number(process.env.PORT) || 3000;

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Customer Service is running on port ${PORT}`);
});