// Poliçe başarıyla oluşturulduğunda policy.issued event'ini RabbitMQ'ya göndermek istiyoruz.
// Ancak RabbitMQ o sırada erişilemez olabilir. Event'i doğrudan göndermeye çalışırsak poliçe kaydedilmiş olsa bile event kaybolabilir.

// Bunun önüne geçmek için Outbox Pattern kullanıyoruz.

// Outbox Entity, RabbitMQ'ya gönderilmeyi bekleyen event'leri PostgreSQL'de saklayacağımız tablonun modelidir.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Outbox event'inin yayınlanma durumunu tanımlar.
export enum OutboxEventStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
}

@Entity("outbox_events")
export class OutboxEvent {
  // Her event için benzersiz UUID oluşturur.
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Gerçekleşen iş olayının adını tutar.
  @Column({
    name: "event_type",
    type: "varchar",
    length: 100,
  })
  eventType!: string;

  // RabbitMQ üzerinde kullanılacak routing key değerini tutar.
  @Column({
    name: "routing_key",
    type: "varchar",
    length: 100,
  })
  routingKey!: string;

  // RabbitMQ'ya gönderilecek event verisini JSON olarak saklar.
  @Column({
    type: "jsonb",
  })
  payload!: Record<string, unknown>;

  // Event'in yayınlanma durumunu takip eder.
  @Column({
    type: "varchar",
    length: 20,
    default: OutboxEventStatus.PENDING,
  })
  status!: OutboxEventStatus;

  // Event'in kaç kez gönderilmeye çalışıldığını tutar.
  @Column({
    type: "integer",
    default: 0,
  })
  attempts!: number;

  // Son gönderim denemesinde oluşan hatayı saklar.
  @Column({
    name: "last_error",
    type: "text",
    nullable: true,
  })
  lastError!: string | null;

  // Event'in RabbitMQ tarafından onaylandığı zamanı tutar.
  @Column({
    name: "published_at",
    type: "timestamptz",
    nullable: true,
  })
  publishedAt!: Date | null;

  // Event'in oluşturulma zamanını otomatik kaydeder.
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  // Event'in son güncellenme zamanını otomatik kaydeder.
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}