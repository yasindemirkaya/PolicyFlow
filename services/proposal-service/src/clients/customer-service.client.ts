import { env } from "../config/env.js";
import { ApplicantDto } from "../dto/applicant.dto.js";
import { requestService } from "./service-client.js";

export interface CustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  email: string;
  phone: string | null;
}

export class CustomerServiceClient {
  private readonly baseUrl = env.customerServiceUrl;

  async getCustomerById(id: string): Promise<CustomerResponse> {
    return requestService<CustomerResponse>(
      "Customer",
      `${this.baseUrl}/api/customers/${encodeURIComponent(id)}`,
    );
  }

  async findOrCreateCustomer(
    applicant: ApplicantDto,
  ): Promise<CustomerResponse> {
    return requestService<CustomerResponse>(
      "Customer",
      `${this.baseUrl}/api/customers`,
      {
        method: "POST",
        body: JSON.stringify(applicant),
      },
    );
  }
}