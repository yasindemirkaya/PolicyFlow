
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDestinationToOutboxEvents1795690000000
  implements MigrationInterface
{
  name = "AddDestinationToOutboxEvents1795690000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ADD COLUMN "destination" character varying(20)
      NOT NULL DEFAULT 'RABBITMQ'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      DROP COLUMN "destination"
    `);
  }
}
