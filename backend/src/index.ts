
import express from "express";

import connectDatabase from "./infrastructure/database.js";

import notFoundMiddleware from "./middleware/not-found.middleware.js";
import errorHandlerMiddleware from "./middleware/error.middleware.js";

import { env } from "./config/env.js";

import customerRoutes from "./api/routes/customer.routes.js";
import healthRoutes from "./api/routes/health.routes.js";
import policyRoutes from "./api/routes/policy.routes.js";
import proposalRoutes from "./api/routes/proposal.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

// Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

// Routes
app.use("/api", healthRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/proposals", proposalRoutes);

// 404 Middleware
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorHandlerMiddleware);

// Start Server
const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`PolicyFlow API is running on port ${env.port}`);
  });
};

startServer();
