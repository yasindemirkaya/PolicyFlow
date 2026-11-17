import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from "typeorm";

import { Policy } from "../../policies/entities/policy.entity.js";

@Entity("customers")
export class Customer {
  @OneToMany(() => Policy, (policy) => policy.customer)
  policies!: Policy[];

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "first_name",
    type: "varchar",
    length: 100
  })
  firstName!: string;

  @Column({
    name: "last_name",
    type: "varchar",
    length: 100
  })
  lastName!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true
  })
  email!: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true
  })
  phone!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz"
  })
  createdAt!: Date;

  @Column({
    name: "national_id",
    type: "varchar",
    length: 11,
    unique: true
  })
  nationalId!: string;

  @Column({
    name: "birth_date",
    type: "date"
  })
  birthDate!: string;
}
