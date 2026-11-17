import { ApplicantDto } from "./applicant.dto.js";
import { ProductSubType } from "../../products/enums/product-sub-type.enum.js";

export interface HealthProposalDto {
  applicant: ApplicantDto;
  productSubType:
    | ProductSubType.COMPLEMENTARY_HEALTH
    | ProductSubType.TRAVEL;

  travel?: {
    destinationCountry: string;
    departureDate: string;
    returnDate: string;
  };
}