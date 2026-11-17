import { Router } from "express";
import { CustomerController } from "../../modules/customers/controllers/customer.controller.js";

const router = Router();
const customerController = new CustomerController();

// Get customer by ID
router.get("/:id", customerController.getCustomerById);
router.get("/", customerController.getCustomerByEmail);

export default router;