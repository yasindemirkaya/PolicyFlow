import { Router } from "express";
import { CustomerController } from "../../modules/customers/controllers/customer.controller.js";
import { PolicyController } from "../../modules/policies/controllers/policy.controller.js";

const router = Router();

const customerController = new CustomerController();
const policyController = new PolicyController();

// Create customer
router.post("/", customerController.createCustomer);

// Get customer by ID
router.get("/:id", customerController.getCustomerById);

// Get customer by email
router.get("/", customerController.getCustomerByEmail);

// Get customer's policies
router.get("/:customerId/policies", policyController.getPoliciesByCustomerId);

export default router;