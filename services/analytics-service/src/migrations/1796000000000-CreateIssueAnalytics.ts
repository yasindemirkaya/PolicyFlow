
import {
  MigrationInterface,
  QueryRunner,
  Table,
} from "typeorm";

export class CreateIssueAnalytics1796000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "issue_analytics",
        schema: "analytics",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "gen_random_uuid()",
          },
          {
            name: "event_id",
            type: "uuid",
            isUnique: true,
          },
          {
            name: "policy_id",
            type: "uuid",
          },
          {
            name: "policy_number",
            type: "varchar",
            length: "100",
          },
          {
            name: "customer_id",
            type: "uuid",
          },
          {
            name: "policy_type",
            type: "varchar",
            length: "100",
          },
          {
            name: "premium_amount",
            type: "numeric",
            precision: 12,
            scale: 2,
          },
          {
            name: "start_date",
            type: "date",
          },
          {
            name: "end_date",
            type: "date",
          },
          {
            name: "insurance_company_name",
            type: "varchar",
            length: "255",
          },
          {
            name: "product_name",
            type: "varchar",
            length: "255",
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(
      "analytics.issue_analytics",
    );
  }
}
