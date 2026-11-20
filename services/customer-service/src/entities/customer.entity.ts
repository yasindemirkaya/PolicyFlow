import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "first_name",
    type: "varchar",
    length: 100,
  })
  firstName!: string;

  @Column({
    name: "last_name",
    type: "varchar",
    length: 100,
  })
  lastName!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
  })
  email!: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    name: "national_id",
    type: "varchar",
    length: 11,
    unique: true,
  })
  nationalId!: string;

  @Column({
    name: "birth_date",
    type: "date",
  })
  birthDate!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}