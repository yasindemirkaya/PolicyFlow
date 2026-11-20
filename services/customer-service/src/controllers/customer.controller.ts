import type { Request, Response, NextFunction } from "express";

import { CustomerRepository } from "../repositories/customer.repository.js";
import {
  CustomerService,
  CustomerServiceError,
} from "../services/customer.service.js";

export class CustomerController {
  private customerService = new CustomerService(
    new CustomerRepository(),
  );

  // Get Customer By ID
  getCustomerById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const customer = await this.customerService.getCustomerById(
        req.params.id,
      );

      if (!customer) {
        res.status(404).json({
          success: false,
          error: {
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Customer By Email
  getCustomerByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const email = req.query.email;

      if (typeof email !== "string" || !email.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email query parameter is required",
          },
        });
        return;
      }

      const customer = await this.customerService.getCustomerByEmail(email);

      if (!customer) {
        res.status(404).json({
          success: false,
          error: {
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  // Create Customer
  createCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.customerService.findOrCreateCustomer({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        nationalId: req.body.nationalId,
        birthDate: req.body.birthDate,
        email: req.body.email,
        phone: req.body.phone,
      });

      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.customer,
        message: result.created
          ? "Customer created successfully"
          : "Existing customer found",
      });
    } catch (error) {
      if (error instanceof CustomerServiceError) {
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
  };
}