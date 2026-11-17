
import { CustomerService } from "../../customers/services/customer.service.js";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { Product } from "../../products/entities/product.entity.js";
import { ProductType } from "../../products/enums/product-type.enum.js";
import { ProductSubType } from "../../products/enums/product-sub-type.enum.js";

import { ApplicantDto } from "../dto/applicant.dto.js";
import { VehicleProposalDto } from "../dto/vehicle-proposal.dto.js";
import { HouseProposalDto } from "../dto/house-proposal.dto.js";
import { HealthProposalDto } from "../dto/health-proposal.dto.js";

export class ProposalServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ProposalServiceError";
  }
}

export interface ProposalResult {
  customerId: string;
  products: Product[];
}

export class ProposalService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly productRepository: ProductRepository
  ) {}

  async createVehicleProposal(
    dto: VehicleProposalDto
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.TRAFFIC &&
      dto.productSubType !== ProductSubType.INSURANCE
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid vehicle product subtype"
      );
    }

    if (
      !dto.vehicle ||
      typeof dto.vehicle.hasPlate !== "boolean" ||
      (dto.vehicle.hasPlate && !dto.vehicle.plate?.trim())
    ) {
      throw new ProposalServiceError(
        400,
        "VALIDATION_ERROR",
        "Valid vehicle information is required"
      );
    }

    return this.createProposal(
      dto.applicant,
      ProductType.VEHICLE,
      dto.productSubType
    );
  }

  async createHomeProposal(
    dto: HouseProposalDto
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.DASK &&
      dto.productSubType !== ProductSubType.HOME_AND_GOODS
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid home product subtype"
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
        "Valid home information is required"
      );
    }

    return this.createProposal(
      dto.applicant,
      ProductType.HOME,
      dto.productSubType
    );
  }

  async createHealthProposal(
    dto: HealthProposalDto
  ): Promise<ProposalResult> {
    if (
      dto.productSubType !== ProductSubType.COMPLEMENTARY_HEALTH &&
      dto.productSubType !== ProductSubType.TRAVEL
    ) {
      throw new ProposalServiceError(
        400,
        "INVALID_PRODUCT_SUB_TYPE",
        "Invalid health product subtype"
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
        "Travel information is required"
      );
    }

    return this.createProposal(
      dto.applicant,
      ProductType.HEALTH,
      dto.productSubType
    );
  }

  private async createProposal(
    applicant: ApplicantDto,
    productType: ProductType,
    productSubType: ProductSubType
  ): Promise<ProposalResult> {
    const customer =
      await this.customerService.findOrCreateCustomer(applicant);

    const products =
      await this.productRepository.findActiveByTypeAndSubType(
        productType,
        productSubType
      );

    return {
      customerId: customer.id,
      products
    };
  }
}
