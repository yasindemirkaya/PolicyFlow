import type { Request, Response, NextFunction } from "express";

import { ProductRepository } from "../repositories/product.repository.js";
import {
  ProductService,
  ProductServiceError,
} from "../services/product.service.js";

export class ProductController {
  private productService = new ProductService(
    new ProductRepository(),
  );

  // Get product by ID
  getProductById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const product = await this.productService.getProductById(
        req.params.id,
      );

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: "PRODUCT_NOT_FOUND",
            message: "Product not found or inactive",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  // Get products by type and subtype
  getProductsByTypeAndSubType = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { productType, productSubType } = req.query;

      if (
        typeof productType !== "string" ||
        typeof productSubType !== "string"
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Product type and subtype are required",
          },
        });
        return;
      }

      const products =
        await this.productService.getProductsByTypeAndSubType(
          productType,
          productSubType,
        );

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  private handleError(
    error: unknown,
    res: Response,
    next: NextFunction,
  ): void {
    if (error instanceof ProductServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });

      return;
    }

    next(error);
  }
}