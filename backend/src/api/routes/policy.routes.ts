import { Router } from "express";
import { PolicyController } from "../../modules/policies/controllers/policy.controller.js";

const router = Router();
const policyController = new PolicyController();

// Issue a new policy
router.post("/issue", policyController.issuePolicy);
// Get policy by ID
router.get("/:id", policyController.getPolicyById);

export default router;