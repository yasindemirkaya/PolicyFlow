
import {
  CreateDateColumn,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({
  name: "issue_analytics",
  schema: "analytics",
})
export class IssueAnalytics {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "event_id",
    type: "uuid",
    unique: true,
  })
  eventId!: string;

  @Column({
    name: "policy_id",
    type: "uuid",
  })
  policyId!: string;

  @Column({
    name: "policy_number",
    type: "varchar",
    length: 100,
  })
  policyNumber!: string;

  @Column({
    name: "customer_id",
    type: "uuid",
  })
  customerId!: string;

  @Column({
    name: "policy_type",
    type: "varchar",
    length: 100,
  })
  policyType!: string;

  @Column({
    name: "premium_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  premiumAmount!: string;

  @Column({
    name: "start_date",
    type: "date",
  })
  startDate!: string;

  @Column({
    name: "end_date",
    type: "date",
  })
  endDate!: string;

  @Column({
    name: "insurance_company_name",
    type: "varchar",
    length: 255,
  })
  insuranceCompanyName!: string;

  @Column({
    name: "product_name",
    type: "varchar",
    length: 255,
  })
  productName!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
