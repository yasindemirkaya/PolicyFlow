import { env } from "../config/env.js";
import { ProductType } from "../enums/product-type.enum.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";
import { requestService } from "./service-client.js";

export interface ProductResponse {
  id: string;
  productCode: string;
  insuranceCompanyName: string;
  productName: string;
  productType: ProductType;
  productSubType: ProductSubType;
  basePrice: string;
  currency: string;
}

export class ProductServiceClient {
  private readonly baseUrl = env.productServiceUrl;

  async getProductsByTypeAndSubType(
    productType: ProductType,
    productSubType: ProductSubType,
  ): Promise<ProductResponse[]> {
    const query = new URLSearchParams({
      productType,
      productSubType,
    });

    return requestService<ProductResponse[]>(
      "Product",
      `${this.baseUrl}/api/products?${query.toString()}`,
    );
  }
}