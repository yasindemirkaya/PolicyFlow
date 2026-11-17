
import { PolicyRepository } from "../repositories/policy.repository.js";

export class PolicyService {
  constructor(
    private readonly policyRepository: PolicyRepository
  ) {}

//   Get Policy By ID
  async getPolicyById(id: string) {
    const policy = await this.policyRepository.findById(id);

    if (!policy) {
      throw new Error("Policy not found");
    }

    return policy;
  }

//   Get Policy by Policy Number
  async getPolicyByPolicyNumber(policyNumber: string) {
    return this.policyRepository.findByPolicyNumber(policyNumber);
  }

//   Get Policies By Customer ID
  async getPoliciesByCustomerId(customerId: string) {
    return this.policyRepository.findByCustomerId(customerId);
  }
}
