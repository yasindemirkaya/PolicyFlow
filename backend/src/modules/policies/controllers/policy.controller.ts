
import { Request, Response, NextFunction } from "express";
import { PolicyRepository } from "../repositories/policy.repository.js";
import { PolicyService } from "../services/policy.service.js";

export class PolicyController {
  private policyService = new PolicyService(
    new PolicyRepository()
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
}
