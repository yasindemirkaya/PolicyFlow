import { MigrationInterface, QueryRunner } from "typeorm";

// Outbox tablosunu veritabanında oluşturur.
export class CreateOutboxEvents1795445724093
  implements MigrationInterface
{
  name = "CreateOutboxEvents1795445724093";

  // Outbox event tablosunu oluşturur.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_type" character varying(100) NOT NULL,
        "routing_key" character varying(100) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_events_id" PRIMARY KEY ("id")
      )
    `);
  }

  // Migration geri alındığında Outbox tablosunu kaldırır.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "outbox_events"
    `);
  }
}