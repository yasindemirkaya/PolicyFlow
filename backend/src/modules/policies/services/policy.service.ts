
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

    if (!this.isValidUuid(dto.customerId)) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid customer ID",
      );
    }

    if (!this.isValidUuid(dto.productId)) {
      throw new PolicyServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid product ID",
      );
    }

    // Find the existing customer
    const customer = await this.customerService.getCustomerById(
      dto.customerId,
    );

    if (!customer) {
      throw new PolicyServiceError(
        404,
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
      );
    }

    // Find the selected product
    const product = await this.productRepository.findActiveById(
      dto.productId,
    );

    if (!product) {
      throw new PolicyServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Product not found or inactive",
      );
    }

    // Set policy start date when the issue request is processed.
    const startDate = this.getCurrentDate();

    const endDate = this.calculateEndDate(startDate);
    const policyNumber = this.generatePolicyNumber();

    return this.policyRepository.create({
      policyNumber,
      customer,
      policyType: this.mapProductType(product.productType),
      premiumAmount: product.basePrice,
      startDate,
      endDate,
      status: PolicyStatus.ACTIVE,
      insuranceCompanyName: product.insuranceCompanyName,
      productName: product.productName,
    });
  }

  // Validate UUID
  private isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  // Get current date in Turkey
  private getCurrentDate(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateParts = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
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

  // Calculate End Date
  private calculateEndDate(startDate: string): string {
    const [year, month, day] = startDate.split("-").map(Number);

    const nextYear = year + 1;

    const lastDayOfMonth = new Date(
      Date.UTC(nextYear, month, 0),
    ).getUTCDate();

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
