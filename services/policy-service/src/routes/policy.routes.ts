import { Router } from "express";
import { PolicyController } from "../controllers/policy.controller.js";

const router = Router();

const policyController = new PolicyController();

// Issue a new policy
router.post("/issue", policyController.issuePolicy);

// Get policies by customer ID
router.get(
  "/customer/:customerId",
  policyController.getPoliciesByCustomerId,
);

// Get policy by ID
router.get("/:id", policyController.getPolicyById);

export default router;