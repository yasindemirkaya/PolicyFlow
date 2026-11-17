import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerIdentityFields1794925418758 implements MigrationInterface {
    name = 'AddCustomerIdentityFields1794925418758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" ADD "national_id" character varying(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_81cef023276a6e88202edaae642" UNIQUE ("national_id")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "birth_date" date NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "birth_date"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_81cef023276a6e88202edaae642"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "national_id"`);
    }

}
