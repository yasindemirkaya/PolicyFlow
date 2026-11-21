import express from "express";

import { env } from "./config/env.js";
import proposalRoutes from "./routes/proposal.routes.js";

import { ProposalServiceError } from "./services/proposal.service.js";
import { ServiceClientError } from "./clients/service-client.error.js";

const app = express();

// Middleware
app.use(express.json());

// Proposal Routes
app.use("/api/proposals", proposalRoutes);

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "proposal-service",
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
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (
      error instanceof ProposalServiceError ||
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

    console.error("Proposal Service error:", error);

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
app.listen(env.port, "0.0.0.0", () => {
  console.log(`Proposal Service is running on port ${env.port}`);
});