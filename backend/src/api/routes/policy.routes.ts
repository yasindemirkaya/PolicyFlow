import { Router } from "express";
import { PolicyController } from "../../modules/policies/controllers/policy.controller.js";

const router = Router();
const policyController = new PolicyController();

router.get("/:id", policyController.getPolicyById);

export default router;