import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1794923875538 implements MigrationInterface {
    name = 'CreateProductsTable1794923875538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_code" character varying(50) NOT NULL, "insurance_company_name" character varying(100) NOT NULL, "product_name" character varying(150) NOT NULL, "product_type" character varying(30) NOT NULL, "product_sub_type" character varying(60) NOT NULL, "base_price" numeric(12,2) NOT NULL, "currency" character(3) NOT NULL DEFAULT 'TRY', "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_70b3f77ca8de13149b7f08d725c" UNIQUE ("product_code"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
