import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";

const router = Router();

const productController = new ProductController();

// Get active products by type and subtype
router.get("/", productController.getProductsByTypeAndSubType);

// Get active product by ID
router.get("/:id", productController.getProductById);

export default router;