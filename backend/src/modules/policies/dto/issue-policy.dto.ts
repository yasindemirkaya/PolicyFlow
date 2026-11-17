import { ApplicantDto } from "../../proposals/dto/applicant.dto.js";

export interface IssuePolicyDto {
  applicant: ApplicantDto;

  productId: string;

  startDate: string;

  payment: {
    cardHolderName: string;
    cardBrand: "VISA" | "MASTERCARD";
    last4: string;
    mockTransactionId: string;
    threeDSecureStatus: "SUCCESS" | "FAILED";
  };
}