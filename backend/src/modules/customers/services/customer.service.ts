
import { CustomerRepository } from "../repositories/customer.repository.js";

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  // Get customer by ID
  async getCustomerById(id: string) {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  // Get customer by email
  async getCustomerByEmail(email: string) {
    return this.customerRepository.findByEmail(email);
  }
}
