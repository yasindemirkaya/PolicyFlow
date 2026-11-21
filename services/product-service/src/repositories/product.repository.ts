import ProductDataSource from "../infrastructure/data-source.js";
import { Product } from "../entities/product.entity.js";
import { ProductType } from "../enums/product-type.enum.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";

export class ProductRepository {
  private repository = ProductDataSource.getRepository(Product);

  // Find active products by type and subtype
  async findActiveByTypeAndSubType(
    productType: ProductType,
    productSubType: ProductSubType,
  ): Promise<Product[]> {
    return this.repository.find({
      where: {
        productType,
        productSubType,
        isActive: true,
      },
      order: {
        basePrice: "ASC",
      },
    });
  }

  // Find active product by ID
  async findActiveById(id: string): Promise<Product | null> {
    return this.repository.findOneBy({
      id,
      isActive: true,
    });
  }
}