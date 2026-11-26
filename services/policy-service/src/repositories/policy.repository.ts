import PolicyDataSource from "../infrastructure/data-source.js";

import { Policy } from "../entities/policy.entity.js";

import {
  OutboxEvent,
  OutboxEventStatus,
  OutboxEventDestination,
} from "../entities/outbox-event.entity.js";

// Outbox event oluşturulurken kullanılacak bilgileri tanımlar.
interface OutboxEventInput {
  eventType: string;
  routingKey: string;
  buildPayload: (policy: Policy) => Record<string, unknown>;
}

export class PolicyRepository {
  // Policy entity'sinin Repository nesnesini oluşturur.
  private repository = PolicyDataSource.getRepository(Policy);

  // ID üzerinden poliçe arar.
  async findById(id: string): Promise<Policy | null> {
    return this.repository.findOneBy({ id });
  }

  // Poliçe numarası üzerinden poliçe arar.
  async findByPolicyNumber(
    policyNumber: string,
  ): Promise<Policy | null> {
    return this.repository.findOneBy({ policyNumber });
  }

  // Müşteriye ait poliçeleri oluşturulma tarihine göre getirir.
  async findByCustomerId(customerId: string): Promise<Policy[]> {
    return this.repository.find({
      where: {
        customerId,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  // Yalnızca poliçe oluşturma işlemini gerçekleştirir.
  async create(data: Partial<Policy>): Promise<Policy> {
    const policy = this.repository.create(data);

    return this.repository.save(policy);
  }

  // Poliçe ve Outbox event kaydını aynı transaction içerisinde oluşturur.
  async createWithOutbox(
    data: Partial<Policy>,
    eventInput: OutboxEventInput,
  ): Promise<Policy> {
    return PolicyDataSource.transaction(async (manager) => {
      // Transaction içerisinde Policy Repository oluşturur.
      const policyRepository = manager.getRepository(Policy);

      // Transaction içerisinde Outbox Repository oluşturur.
      const outboxRepository = manager.getRepository(OutboxEvent);

      // Poliçeyi oluşturup veritabanına kaydeder.
      const policy = await policyRepository.save(
        policyRepository.create(data),
      );

      // Kaydedilen poliçeden event payload oluşturur.
      const payload = eventInput.buildPayload(policy);

      // RabbitMQ için Outbox event oluşturur.
      const rabbitMQEvent = outboxRepository.create({
        eventType: eventInput.eventType,
        routingKey: eventInput.routingKey,
        payload,
        destination: OutboxEventDestination.RABBITMQ,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
        lastError: null,
        publishedAt: null,
      });

      // Kafka için Outbox event oluşturur.
      const kafkaEvent = outboxRepository.create({
        eventType: eventInput.eventType,
        routingKey: eventInput.routingKey,
        payload,
        destination: OutboxEventDestination.KAFKA,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
        lastError: null,
        publishedAt: null,
      });

      // Her iki event'i aynı transaction içerisinde kaydeder.
      await outboxRepository.save([rabbitMQEvent, kafkaEvent]);

      // Transaction tamamlandığında oluşturulan poliçeyi döndürür.
      return policy;
    });
  }

}