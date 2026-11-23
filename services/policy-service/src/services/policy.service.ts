import { randomUUID } from "node:crypto";

import { Policy } from "../entities/policy.entity.js";
import { PolicyRepository } from "../repositories/policy.repository.js";

import { PolicyStatus } from "../enums/policy-status.enum.js";
import { PolicyType } from "../enums/policy-type.enum.js";

import { ProductType } from "../clients/product-service.client.js";
import { CustomerServiceClient } from "../clients/customer-service.client.js";
import { ProductServiceClient } from "../clients/product-service.client.js";

import { IssuePolicyDto } from "../dto/issue-policy.dto.js";

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
    private readonly customerClient: CustomerServiceClient,
    private readonly productClient: ProductServiceClient,
  ) { }

  // Get policy by ID
  async getPolicyById(id: string): Promise<Policy | null> {
    return this.policyRepository.findById(id);
  }

  // Get policies by customer ID
  async getPoliciesByCustomerId(customerId: string): Promise<Policy[]> {
    return this.policyRepository.findByCustomerId(customerId);
  }

  // Issue a new policy
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

    // Validate customer through Customer Service
    const customer = await this.customerClient.getCustomerById(
      dto.customerId,
    );

    // Validate active product through Product Service
    const product = await this.productClient.getProductById(
      dto.productId,
    );

    // Set policy start date using Turkey local date
    const startDate = this.getCurrentDate();

    const endDate = this.calculateEndDate(startDate);
    const policyNumber = this.generatePolicyNumber(startDate);

    // Poliçeyi ve ilgili event'i aynı database transaction içerisinde kaydeder.
    return this.policyRepository.createWithOutbox(
      {
        policyNumber,
        customerId: customer.id,
        policyType: this.mapProductType(product.productType),
        premiumAmount: product.basePrice,
        startDate,
        endDate,
        status: PolicyStatus.ACTIVE,
        insuranceCompanyName: product.insuranceCompanyName,
        productName: product.productName,
      },
      {
        // Oluşturulan event'in türünü ve RabbitMQ routing key değerini belirler.
        eventType: "policy.issued",
        routingKey: "policy.issued",

        // Kaydedilen poliçe ve müşteri bilgileriyle event içeriğini hazırlar.
        buildPayload: (policy) => ({
          event: "policy.issued",
          data: {
            policyId: policy.id,
            policyNumber: policy.policyNumber,
            customerId: policy.customerId,
            customerName: `${customer.firstName} ${customer.lastName}`,
            phoneNumber: customer.phone,
            email: customer.email,
            policyType: policy.policyType,
            premiumAmount: policy.premiumAmount,
            startDate: policy.startDate,
            endDate: policy.endDate,
            insuranceCompanyName: policy.insuranceCompanyName,
            productName: policy.productName,
          },
        }),
      },
    );
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

  // Validate payment
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

  // Calculate end date
  private calculateEndDate(startDate: string): string {
    const [year, month, day] = startDate.split("-").map(Number);

    const nextYear = year + 1;

    const lastDayOfMonth = new Date(
      Date.UTC(nextYear, month, 0),
    ).getUTCDate();

    const endDay = Math.min(day, lastDayOfMonth);

    return `${nextYear}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  }

  // Generate policy number
  private generatePolicyNumber(startDate: string): string {
    const year = startDate.substring(0, 4);

    const uniqueCode = randomUUID()
      .replace(/-/g, "")
      .substring(0, 12)
      .toUpperCase();

    return `POL-${year}-${uniqueCode}`;
  }

  // Map product type to policy type
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