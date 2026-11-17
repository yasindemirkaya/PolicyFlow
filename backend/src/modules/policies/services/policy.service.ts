import { randomUUID } from "node:crypto";

import { Policy } from "../entities/policy.entity.js";
import { PolicyRepository } from "../repositories/policy.repository.js";
import { PolicyStatus } from "../enums/policy-status.enum.js";

import { CustomerService } from "../../customers/services/customer.service.js";
import { ProductRepository } from "../../products/repositories/product.repository.js";

import { IssuePolicyDto } from "../dto/issue-policy.dto.js";

import { ProductType } from "../../products/enums/product-type.enum.js";
import { PolicyType } from "../enums/policy-type.enum.js";

export class PolicyServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PolicyServiceError";
  }
}

export class PolicyService {
  constructor(
    private readonly policyRepository: PolicyRepository,
    private readonly customerService: CustomerService,
    private readonly productRepository: ProductRepository,
  ) {}

  // Get Policy by ID
  async getPolicyById(id: string): Promise<Policy | null> {
    return this.policyRepository.findById(id);
  }

  // Get all policies by Customer ID
  async getPoliciesByCustomerId(customerId: string): Promise<Policy[]> {
    return this.policyRepository.findByCustomerId(customerId);
  }

  // Issue Policy
  async issuePolicy(dto: IssuePolicyDto): Promise<Policy> {
    this.validatePayment(dto.payment);
    this.validateStartDate(dto.startDate);

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        dto.productId,
      )
    ) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid product ID",
      );
    }

    const product = await this.productRepository.findActiveById(dto.productId);

    if (!product) {
      throw new PolicyServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Product not found or inactive",
      );
    }

    const customer = await this.customerService.findOrCreateCustomer(
      dto.applicant,
    );

    const endDate = this.calculateEndDate(dto.startDate);

    const policyNumber = this.generatePolicyNumber();

    return this.policyRepository.create({
      policyNumber,
      customer,
      policyType: this.mapProductType(product.productType),
      premiumAmount: product.basePrice,
      startDate: dto.startDate,
      endDate,
      status: PolicyStatus.ACTIVE,
      insuranceCompanyName: product.insuranceCompanyName,
      productName: product.productName,
    });
  }

  // Validate Payment
  private validatePayment(payment: IssuePolicyDto["payment"]): void {
    if (
      !payment ||
      !payment.cardHolderName?.trim() ||
      !["VISA", "MASTERCARD"].includes(payment.cardBrand) ||
      !/^\d{4}$/.test(payment.last4) ||
      !payment.mockTransactionId?.trim() ||
      !["SUCCESS", "FAILED"].includes(payment.threeDSecureStatus)
    ) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid payment information",
      );
    }

    if (payment.threeDSecureStatus === "FAILED") {
      throw new PolicyServiceError(
        402,
        "PAYMENT_FAILED",
        "Payment simulation failed",
      );
    }
  }

  // Validate Start Date
  private validateStartDate(startDate: string): void {
    if (
      typeof startDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
    ) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid policy start date",
      );
    }

    const date = new Date(`${startDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== startDate
    ) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid policy start date",
      );
    }
  }

  // Calculate End Date
  private calculateEndDate(startDate: string): string {
    const [year, month, day] = startDate.split("-").map(Number);

    const nextYear = year + 1;

    const lastDayOfMonth = new Date(Date.UTC(nextYear, month, 0)).getUTCDate();

    const endDay = Math.min(day, lastDayOfMonth);

    return `${nextYear}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  }

  // Generate Policy Number
  private generatePolicyNumber(): string {
    const year = new Date().getFullYear();
    const uniqueCode = randomUUID()
      .replace(/-/g, "")
      .substring(0, 12)
      .toUpperCase();

    return `POL-${year}-${uniqueCode}`;
  }

  private mapProductType(productType: ProductType): PolicyType {
    switch (productType) {
      case ProductType.VEHICLE:
        return PolicyType.VEHICLE;

      case ProductType.HOME:
        return PolicyType.HOME;

      case ProductType.HEALTH:
        return PolicyType.HEALTH;

      default:
        throw new PolicyServiceError(
          400,
          "INVALID_PRODUCT_TYPE",
          "Invalid product type",
        );
    }
  }
}
