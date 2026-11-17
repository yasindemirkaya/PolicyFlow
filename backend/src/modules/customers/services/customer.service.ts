import { Customer } from "../entities/customer.entity.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { CreateCustomerDto } from "../dto/create-customer.dto.js";

export class CustomerServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepository.findById(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findByEmail(email);
  }

  async findOrCreateCustomer(
    data: CreateCustomerDto
  ): Promise<Customer> {
    this.validateApplicant(data);

    const existingCustomer =
      await this.customerRepository.findByNationalId(data.nationalId);

    if (existingCustomer) {
      return existingCustomer;
    }

    const existingEmail =
      await this.customerRepository.findByEmail(data.email);

    if (existingEmail) {
      throw new CustomerServiceError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "Email address is already associated with another customer"
      );
    }

    return this.customerRepository.create(data);
  }

  private validateApplicant(data: CreateCustomerDto): void {
    if (
      !data.firstName?.trim() ||
      !data.lastName?.trim() ||
      !data.email?.trim() ||
      !data.nationalId ||
      !data.birthDate
    ) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "Applicant information is required"
      );
    }

    if (!/^\d{11}$/.test(data.nationalId)) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "National ID must contain 11 digits"
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid email address"
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate) ||
      Number.isNaN(Date.parse(data.birthDate))
    ) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid birth date"
      );
    }
  }
}