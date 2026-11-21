import { Product } from "../entities/product.entity.js";
import { ProductRepository } from "../repositories/product.repository.js";

import { ProductType } from "../enums/product-type.enum.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";

export class ProductServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProductServiceError";
  }
}

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  // Get active product by ID
  async getProductById(id: string): Promise<Product | null> {
    if (!this.isValidUuid(id)) {
      throw new ProductServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid product ID",
      );
    }

    return this.productRepository.findActiveById(id);
  }

  // Get active products by type and subtype
  async getProductsByTypeAndSubType(
    productType: string,
    productSubType: string,
  ): Promise<Product[]> {
    if (
      !Object.values(ProductType).includes(productType as ProductType)
    ) {
      throw new ProductServiceError(
        400,
        "INVALID_PRODUCT_TYPE",
        "Invalid product type",
      );
    }

    if (
      !Object.values(ProductSubType).includes(
        productSubType as ProductSubType,
      )
    ) {
      throw new ProductServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid product subtype",
      );
    }

    return this.productRepository.findActiveByTypeAndSubType(
      productType as ProductType,
      productSubType as ProductSubType,
    );
  }

  private isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}