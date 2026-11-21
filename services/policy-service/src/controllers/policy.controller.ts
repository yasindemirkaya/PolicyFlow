import type { Request, Response, NextFunction } from "express";

import { PolicyRepository } from "../repositories/policy.repository.js";

import {
  PolicyService,
  PolicyServiceError,
} from "../services/policy.service.js";

import { CustomerServiceClient } from "../clients/customer-service.client.js";
import { ProductServiceClient } from "../clients/product-service.client.js";
import { ServiceClientError } from "../clients/service-client.error.js";

import { IssuePolicyDto } from "../dto/issue-policy.dto.js";

export class PolicyController {
  private policyService = new PolicyService(
    new PolicyRepository(),
    new CustomerServiceClient(),
    new ProductServiceClient(),
  );

  // Get policy by ID
  getPolicyById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policy = await this.policyService.getPolicyById(
        req.params.id,
      );

      if (!policy) {
        res.status(404).json({
          success: false,
          error: {
            code: "POLICY_NOT_FOUND",
            message: "Policy not found",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: policy,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  // Get all policies by customer ID
  getPoliciesByCustomerId = async (
    req: Request<{ customerId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policies = await this.policyService.getPoliciesByCustomerId(
        req.params.customerId,
      );

      res.status(200).json({
        success: true,
        data: policies,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  // Issue a new policy
  issuePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policy = await this.policyService.issuePolicy(
        req.body as IssuePolicyDto,
      );

      res.status(201).json({
        success: true,
        data: policy,
      });
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  private handleError(
    error: unknown,
    res: Response,
    next: NextFunction,
  ): void {
    if (
      error instanceof PolicyServiceError ||
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