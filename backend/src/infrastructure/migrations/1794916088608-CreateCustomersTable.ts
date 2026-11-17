
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomersTable1794916088608
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "customers";
    `);
  }
}
