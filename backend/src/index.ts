
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

// Middleware
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
