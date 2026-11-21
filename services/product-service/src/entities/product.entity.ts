import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { ProductType } from "../enums/product-type.enum.js";
import { ProductSubType } from "../enums/product-sub-type.enum.js";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "product_code",
    type: "varchar",
    length: 50,
    unique: true,
  })
  productCode!: string;

  @Column({
    name: "insurance_company_name",
    type: "varchar",
    length: 100,
  })
  insuranceCompanyName!: string;

  @Column({
    name: "product_name",
    type: "varchar",
    length: 150,
  })
  productName!: string;

  @Column({
    name: "product_type",
    type: "varchar",
    length: 30,
  })
  productType!: ProductType;

  @Column({
    name: "product_sub_type",
    type: "varchar",
    length: 60,
  })
  productSubType!: ProductSubType;

  @Column({
    name: "base_price",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  basePrice!: string;

  @Column({
    type: "char",
    length: 3,
    default: "TRY",
  })
  currency!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}