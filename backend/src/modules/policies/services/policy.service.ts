
import { Policy } from "../entities/policy.entity.js";
import { PolicyRepository } from "../repositories/policy.repository.js";

export class PolicyService {
  constructor(
    private readonly policyRepository: PolicyRepository
  ) {}

  async getPolicyById(id: string): Promise<Policy | null> {
    return this.policyRepository.findById(id);
  }

  async getPoliciesByCustomerId(customerId: string): Promise<Policy[]> {
    return this.policyRepository.findByCustomerId(customerId);
  }
}
