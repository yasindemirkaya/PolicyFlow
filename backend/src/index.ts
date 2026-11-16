
import express from "express";
import healthRoutes from "./api/routes/health.routes.js";
import notFoundMiddleware from "./middleware/not-found.middleware.js";
import errorHandlerMiddleware from "./middleware/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api", healthRoutes);

// 404 Middleware
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorHandlerMiddleware);

// Start server
app.listen(env.port, () => {
  console.log(`PolicyFlow API is running on port ${env.port}`);
});
