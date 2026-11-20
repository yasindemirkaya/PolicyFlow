import { Customer } from "../entities/customer.entity.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { CreateCustomerDto } from "../dto/create-customer.dto.js";

export interface FindOrCreateCustomerResult {
  customer: Customer;
  created: boolean;
}

export class CustomerServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
  ) {}

  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepository.findById(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findByEmail(email);
  }

  async findOrCreateCustomer(
    data: CreateCustomerDto,
  ): Promise<FindOrCreateCustomerResult> {
    const normalizedData: CreateCustomerDto = {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      nationalId: data.nationalId?.trim(),
      birthDate: data.birthDate?.trim(),
      email: data.email?.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
    };

    this.validateApplicant(normalizedData);

    const [existingByNationalId, existingByEmail] = await Promise.all([
      this.customerRepository.findByNationalId(
        normalizedData.nationalId,
      ),
      this.customerRepository.findByEmail(
        normalizedData.email,
      ),
    ]);

    // National ID and email belong to different customers.
    if (
      existingByNationalId &&
      existingByEmail &&
      existingByNationalId.id !== existingByEmail.id
    ) {
      throw new CustomerServiceError(
        409,
        "CUSTOMER_INFORMATION_CONFLICT",
        "The national ID number and email address are associated with different customers.",
      );
    }

    // Customer already exists with either national ID or email.
    const existingCustomer =
      existingByNationalId ?? existingByEmail;

    if (existingCustomer) {
      return {
        customer: existingCustomer,
        created: false,
      };
    }

    // Neither national ID nor email exists. Create a new customer.
    const customer =
      await this.customerRepository.create(normalizedData);

    return {
      customer,
      created: true,
    };
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
        "Applicant information is required",
      );
    }

    if (!/^\d{11}$/.test(data.nationalId)) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "National ID must contain 11 digits",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid email address",
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate) ||
      Number.isNaN(Date.parse(data.birthDate))
    ) {
      throw new CustomerServiceError(
        400,
        "VALIDATION_ERROR",
        "Invalid birth date",
      );
    }
  }
}