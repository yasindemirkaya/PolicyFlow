import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";

const router = Router();

const customerController = new CustomerController();

router.post("/", customerController.createCustomer);

router.get("/:id", customerController.getCustomerById);

router.get("/", customerController.getCustomerByEmail);

export default router;