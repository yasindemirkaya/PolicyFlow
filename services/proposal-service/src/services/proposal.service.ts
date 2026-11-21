import { ApplicantDto } from "../dto/applicant.dto.js";

import {
  VehicleProposalDto,
  VehicleInformationDto,
} from "../dto/vehicle-proposal.dto.js";

import { HouseProposalDto } from "../dto/house-proposal.dto.js";
import { HealthProposalDto } from "../dto/health-proposal.dto.js";

import { CustomerServiceClient } from "../clients/customer-service.client.js";

import {
  ProductServiceClient,
  ProductResponse,
} from "../clients/product-service.client.js";

import { ProductType } from "../enums/product-type.enum.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";

export class ProposalServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProposalServiceError";
  }
}

export interface ProposalResult {
  customerId: string;
  products: ProductResponse[];
}

export class ProposalService {
  constructor(
    private readonly customerClient: CustomerServiceClient,
    private readonly productClient: ProductServiceClient,
  ) {}

  // Create Vehicle Proposal
  async createVehicleProposal(
    dto: VehicleProposalDto,
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.TRAFFIC &&
      dto.productSubType !== ProductSubType.INSURANCE
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid vehicle product subtype",
      );
    }

    this.validateVehicleInformation(dto.vehicleInformation);

    if (!dto.customerId?.trim()) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Customer ID is required",
      );
    }

    const customer = await this.customerClient.getCustomerById(
      dto.customerId,
    );

    const products =
      await this.productClient.getProductsByTypeAndSubType(
        ProductType.VEHICLE,
        dto.productSubType,
      );

    return {
      customerId: customer.id,
      products,
    };
  }

  // Create Home Proposal
  async createHomeProposal(
    dto: HouseProposalDto,
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.DASK &&
      dto.productSubType !== ProductSubType.HOME_AND_GOODS
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid home product subtype",
      );
    }

    if (
      !dto.home ||
      typeof dto.home.squareMeters !== "number" ||
      dto.home.squareMeters <= 0 ||
      typeof dto.home.floor !== "number" ||
      typeof dto.home.constructionYear !== "number"
    ) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Valid home information is required",
      );
    }

    return this.createProposal(
      dto.applicant,
      ProductType.HOME,
      dto.productSubType,
    );
  }

  // Create Health Proposal
  async createHealthProposal(
    dto: HealthProposalDto,
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.COMPLEMENTARY_HEALTH &&
      dto.productSubType !== ProductSubType.TRAVEL
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid health product subtype",
      );
    }

    if (
      dto.productSubType === ProductSubType.TRAVEL &&
      (
        !dto.travel?.destinationCountry ||
        !dto.travel.departureDate ||
        !dto.travel.returnDate
      )
    ) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Travel information is required",
      );
    }

    return this.createProposal(
      dto.applicant,
      ProductType.HEALTH,
      dto.productSubType,
    );
  }

  // Validate Vehicle Information
  private validateVehicleInformation(
    vehicle: VehicleInformationDto,
  ): void {
    if (
      !vehicle ||
      !vehicle.brand?.trim() ||
      !vehicle.model?.trim()
    ) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Vehicle brand and model are required",
      );
    }

    if (typeof vehicle.isNewVehicle !== "boolean") {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Vehicle type information is required",
      );
    }

    if (
      !vehicle.isNewVehicle &&
      (
        !vehicle.plate?.trim() ||
        !/^[A-Za-z]{2}$/.test(vehicle.registrationSerial) ||
        !/^\d{6}$/.test(vehicle.registrationNumber)
      )
    ) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Valid plate and registration information are required",
      );
    }
  }

  // Create Home / Health Proposal
  private async createProposal(
    applicant: ApplicantDto,
    productType: ProductType,
    productSubType: ProductSubType,
  ): Promise<ProposalResult> {
    const customer =
      await this.customerClient.findOrCreateCustomer(applicant);

    const products =
      await this.productClient.getProductsByTypeAndSubType(
        productType,
        productSubType,
      );

    return {
      customerId: customer.id,
      products,
    };
  }
}