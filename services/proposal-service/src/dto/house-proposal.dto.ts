import { ApplicantDto } from "./applicant.dto.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";

export interface HouseProposalDto {
  applicant: ApplicantDto;
  productSubType:
    | ProductSubType.DASK
    | ProductSubType.HOME_AND_GOODS;

  home: {
    floor: number;
    squareMeters: number;
    constructionYear: number;
  };
}