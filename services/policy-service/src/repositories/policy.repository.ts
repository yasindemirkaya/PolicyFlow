import PolicyDataSource from "../infrastructure/data-source.js";
import { Policy } from "../entities/policy.entity.js";

export class PolicyRepository {
  private repository = PolicyDataSource.getRepository(Policy);

  // Find policy by ID
  async findById(id: string): Promise<Policy | null> {
    return this.repository.findOneBy({ id });
  }

  // Find policy by policy number
  async findByPolicyNumber(policyNumber: string): Promise<Policy | null> {
    return this.repository.findOneBy({ policyNumber });
  }

  // Find policies by customer ID
  async findByCustomerId(customerId: string): Promise<Policy[]> {
    return this.repository.find({
      where: {
        customerId,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  // Create policy
  async create(data: Partial<Policy>): Promise<Policy> {
    const policy = this.repository.create(data);

    return this.repository.save(policy);
  }
}