
import { Request, Response, NextFunction } from "express";

import { PolicyRepository } from "../repositories/policy.repository.js";
import {
  PolicyService,
  PolicyServiceError
} from "../services/policy.service.js";

import { CustomerRepository } from "../../customers/repositories/customer.repository.js";
import {
  CustomerService,
  CustomerServiceError
} from "../../customers/services/customer.service.js";

import { ProductRepository } from "../../products/repositories/product.repository.js";
import { IssuePolicyDto } from "../dto/issue-policy.dto.js";

export class PolicyController {
  private policyService = new PolicyService(
    new PolicyRepository(),
    new CustomerService(new CustomerRepository()),
    new ProductRepository()
  );

  // Get policy by ID
  getPolicyById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policy = await this.policyService.getPolicyById(
        req.params.id
      );

      if (!policy) {
        res.status(404).json({
          success: false,
          error: {
            code: "POLICY_NOT_FOUND",
            message: "Policy not found"
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: policy
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all policies by customer ID
  getPoliciesByCustomerId = async (
    req: Request<{ customerId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policies = await this.policyService.getPoliciesByCustomerId(
        req.params.customerId
      );

      res.status(200).json({
        success: true,
        data: policies
      });
    } catch (error) {
      next(error);
    }
  };

  // Issue a new policy
  issuePolicy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const policy = await this.policyService.issuePolicy(
        req.body as IssuePolicyDto
      );

      res.status(201).json({
        success: true,
        data: policy
      });
    } catch (error) {
      if (
        error instanceof PolicyServiceError ||
        error instanceof CustomerServiceError
      ) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      next(error);
    }
  };
}
