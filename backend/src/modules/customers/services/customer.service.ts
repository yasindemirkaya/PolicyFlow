
import { CustomerRepository } from "../repositories/customer.repository.js";
import { Customer } from "../entities/customer.entity.js";

export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository
  ) {}

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    return this.customerRepository.findById(id);
  }

  // Get customer by email
  async getCustomerByEmail(email: string) {
    return this.customerRepository.findByEmail(email);
  }
}
