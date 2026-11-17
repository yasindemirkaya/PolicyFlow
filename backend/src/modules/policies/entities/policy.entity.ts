import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

import { Customer } from "../../customers/entities/customer.entity.js";
import { PolicyType } from "../enums/policy-type.enum.js";
import { PolicyStatus } from "../enums/policy-status.enum.js";

@Entity("policies")
export class Policy {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "policy_number",
    type: "varchar",
    length: 50,
    unique: true
  })
  policyNumber!: string;

  @Column({
    name: "policy_type",
    type: "varchar",
    length: 30
  })
  policyType!: PolicyType;

  @Column({
    name: "premium_amount",
    type: "numeric",
    precision: 12,
    scale: 2
  })
  premiumAmount!: string;

  @Column({
    name: "start_date",
    type: "date"
  })
  startDate!: string;

  @Column({
    name: "end_date",
    type: "date"
  })
  endDate!: string;

  @Column({
    type: "varchar",
    length: 20,
    default: PolicyStatus.PENDING
  })
  status!: PolicyStatus;

  @Column({
    name: "insurance_company_name",
    type: "varchar",
    length: 100
  })
  insuranceCompanyName!: string;

  @Column({
    name: "product_name",
    type: "varchar",
    length: 150
  })
  productName!: string;

    @ManyToOne(() => Customer, (customer) => customer.policies, {
    nullable: false,
    onDelete: "RESTRICT"
    })
    @JoinColumn({ name: "customer_id" })
    customer!: Customer;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz"
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz"
  })
  updatedAt!: Date;
}
