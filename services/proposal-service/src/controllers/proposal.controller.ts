import type { Request, Response, NextFunction } from "express";

import { CustomerServiceClient } from "../clients/customer-service.client.js";
import { ProductServiceClient } from "../clients/product-service.client.js";
import { ServiceClientError } from "../clients/service-client.error.js";

import {
  ProposalService,
  ProposalServiceError,
  ProposalResult,
} from "../services/proposal.service.js";

import { VehicleProposalDto } from "../dto/vehicle-proposal.dto.js";
import { HouseProposalDto } from "../dto/house-proposal.dto.js";
import { HealthProposalDto } from "../dto/health-proposal.dto.js";

export class ProposalController {
  private proposalService = new ProposalService(
    new CustomerServiceClient(),
    new ProductServiceClient(),
  );

  // Create Vehicle Proposal
  createVehicleProposal = async (
    req: Request<{}, {}, VehicleProposalDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.proposalService.createVehicleProposal(
        req.body,
      );

      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  // Create Home Proposal
  createHomeProposal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.proposalService.createHomeProposal(
        req.body as HouseProposalDto,
      );

      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  // Create Health Proposal
  createHealthProposal = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.proposalService.createHealthProposal(
        req.body as HealthProposalDto,
      );

      this.sendSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  private sendSuccess(
    res: Response,
    result: ProposalResult,
  ): void {
    res.status(200).json({
      success: true,
      data: {
        customerId: result.customerId,
        products: result.products.map((product) => ({
          id: product.id,
          productCode: product.productCode,
          insuranceCompanyName: product.insuranceCompanyName,
          productName: product.productName,
          productType: product.productType,
          productSubType: product.productSubType,
          basePrice: product.basePrice,
          currency: product.currency,
        })),
      },
    });
  }

  private handleError(
    error: unknown,
    res: Response,
    next: NextFunction,
  ): void {
    if (
      error instanceof ProposalServiceError ||
      error instanceof ServiceClientError
    ) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });

      return;
    }

    next(error);
  }
}