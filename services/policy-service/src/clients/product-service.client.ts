import { env } from "../config/env.js";
import { requestService } from "./service-client.js";

export enum ProductType {
  VEHICLE = "VEHICLE",
  HOME = "HOME",
  HEALTH = "HEALTH",
}

export interface ProductResponse {
  id: string;
  productCode: string;
  insuranceCompanyName: string;
  productName: string;
  productType: ProductType;
  basePrice: string;
  currency: string;
}

export class ProductServiceClient {
  private readonly baseUrl = env.productServiceUrl;

  async getProductById(id: string): Promise<ProductResponse> {
    return requestService<ProductResponse>(
      "Product",
      `${this.baseUrl}/api/products/${encodeURIComponent(id)}`,
    );
  }
}