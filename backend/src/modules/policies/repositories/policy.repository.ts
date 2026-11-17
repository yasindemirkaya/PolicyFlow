
import AppDataSource from "../../../infrastructure/data-source.js";
import { Policy } from "../entities/policy.entity.js";

export class PolicyRepository {
  private repository = AppDataSource.getRepository(Policy);

//   Find by ID
  async findById(id: string): Promise<Policy | null> {
    return this.repository.findOneBy({ id });
  }

//   Find By Policy Number
  async findByPolicyNumber(policyNumber: string): Promise<Policy | null> {
    return this.repository.findOneBy({ policyNumber });
  }

//   Find By Customer ID
  async findByCustomerId(customerId: string): Promise<Policy[]> {
    return this.repository.find({
      where: {
        customer: { id: customerId }
      }
    });
  }
}
