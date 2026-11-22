import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const PORT = Number(process.env.PORT ?? 3000);

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "api-gateway",
    message: "API Gateway is running"
  });
});

// Service proxy configurations
const services = [
  {
    name: "Customer Service",
    target: requiredEnv("CUSTOMER_SERVICE_URL"),
    pathFilter: "/api/customers"
  },
  {
    name: "Product Service",
    target: requiredEnv("PRODUCT_SERVICE_URL"),
    pathFilter: "/api/products"
  },
  {
    name: "Proposal Service",
    target: requiredEnv("PROPOSAL_SERVICE_URL"),
    pathFilter: "/api/proposals"
  },
  {
    name: "Policy Service",
    target: requiredEnv("POLICY_SERVICE_URL"),
    pathFilter: "/api/policies"
  }
] as const;

// Register proxy middlewares
for (const service of services) {
  app.use(
    createProxyMiddleware({
      target: service.target,
      changeOrigin: true,
      pathFilter: service.pathFilter
    })
  );

  console.log(
    `[Gateway] ${service.name} registered: ${service.pathFilter}`
  );
}

// Gateway does not need to parse proxied request bodies.
app.use(express.json());

// Handle unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Requested route was not found"
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
});