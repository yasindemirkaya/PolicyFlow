import AppDataSource from "../../../infrastructure/data-source.js";
import { Customer } from "../entities/customer.entity.js";

export class CustomerRepository {
  private repository = AppDataSource.getRepository(Customer);

  // Find by ID
  async findById(id: string): Promise<Customer | null> {
    return this.repository.findOneBy({ id });
  }

  // Find by Email
  async findByEmail(email: string): Promise<Customer | null> {
    return this.repository.findOneBy({ email });
  }
}
