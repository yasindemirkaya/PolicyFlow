
import { Request, Response, NextFunction } from "express";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { CustomerService } from "../services/customer.service.js";

export class CustomerController {
  private customerService = new CustomerService(
    new CustomerRepository()
  );

  getCustomerById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const customer = await this.customerService.getCustomerById(
        req.params.id
      );

      if (!customer) {
        res.status(404).json({
        success: false,
        error: {
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer not found"
        }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  };
}
