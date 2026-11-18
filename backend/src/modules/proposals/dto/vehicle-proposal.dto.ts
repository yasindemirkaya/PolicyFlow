import { ProductSubType } from "../../products/enums/product-sub-type.enum.js";

export type VehicleInformationDto =
  | {
      isNewVehicle: true;
      brand: string;
      model: string;
      plate?: never;
      registrationSerial?: never;
      registrationNumber?: never;
    }
  | {
      isNewVehicle: false;
      plate: string;
      registrationSerial: string;
      registrationNumber: string;
      brand: string;
      model: string;
    };

export interface VehicleProposalDto {
  customerId: string;

  productSubType: ProductSubType.TRAFFIC | ProductSubType.INSURANCE;

  vehicleInformation: VehicleInformationDto;
}