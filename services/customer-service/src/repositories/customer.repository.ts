import CustomerDataSource from "../infrastructure/data-source.js";
import { Customer } from "../entities/customer.entity.js";

export class CustomerRepository {
  private repository = CustomerDataSource.getRepository(Customer);

  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.repository.findOneBy({ email });
  }

  async findByNationalId(
    nationalId: string,
  ): Promise<Customer | null> {
    return this.repository.findOneBy({ nationalId });
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.repository.create(data);

    return this.repository.save(customer);
  }
}