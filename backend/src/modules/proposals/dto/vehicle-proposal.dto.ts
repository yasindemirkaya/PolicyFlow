import { ApplicantDto } from "./applicant.dto.js";
import { ProductSubType } from "../../products/enums/product-sub-type.enum.js";

export interface VehicleProposalDto {
  applicant: ApplicantDto;
  productSubType: ProductSubType.TRAFFIC | ProductSubType.INSURANCE;

  vehicle: {
    hasPlate: boolean;
    plate?: string;
  };
}