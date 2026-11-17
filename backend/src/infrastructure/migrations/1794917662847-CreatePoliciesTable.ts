import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePoliciesTable1794917662847 implements MigrationInterface {
    name = 'CreatePoliciesTable1794917662847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "policy_number" character varying(50) NOT NULL, "policy_type" character varying(30) NOT NULL, "premium_amount" numeric(12,2) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'PENDING', "insurance_company_name" character varying(100) NOT NULL, "product_name" character varying(150) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "customer_id" uuid NOT NULL, CONSTRAINT "UQ_0a3ff12ee86e399e522e8ec7cef" UNIQUE ("policy_number"), CONSTRAINT "PK_603e09f183df0108d8695c57e28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "policies" ADD CONSTRAINT "FK_f7d30941e7f951eeeba747ae7ed" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "policies" DROP CONSTRAINT "FK_f7d30941e7f951eeeba747ae7ed"`);
        await queryRunner.query(`DROP TABLE "policies"`);
    }

}
