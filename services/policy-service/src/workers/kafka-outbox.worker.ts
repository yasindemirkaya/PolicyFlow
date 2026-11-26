
import PolicyDataSource from "../infrastructure/data-source.js";

import {
  OutboxEvent,
  OutboxEventStatus,
  OutboxEventDestination,
} from "../entities/outbox-event.entity.js";

import { publishKafkaEvent } from "../infrastructure/kafka.publisher.js";

// Worker'ın çalışma aralığını ve tek seferde işleyeceği event sayısını belirler.
const POLL_INTERVAL = 5000;
const BATCH_SIZE = 10;

// Worker zamanlayıcısını ve devam eden işlemi takip eder.
let workerTimer: NodeJS.Timeout | null = null;
let activeProcess: Promise<void> | null = null;

// Bekleyen Kafka Outbox event'lerini Kafka'ya gönderir.
const processPendingEvents = async (): Promise<void> => {
  try {
    // Outbox tablosuna erişmek için Repository oluşturur.
    const repository = PolicyDataSource.getRepository(OutboxEvent);

    // Yalnızca Kafka için bekleyen ilk 10 event'i getirir.
    const pendingEvents = await repository.find({
      where: {
        status: OutboxEventStatus.PENDING,
        destination: OutboxEventDestination.KAFKA,
      },
      order: {
        createdAt: "ASC",
      },
      take: BATCH_SIZE,
    });

    // Bekleyen event bulunmadığında işlemi sonlandırır.
    if (pendingEvents.length === 0) {
      return;
    }

    // Bekleyen event'leri sırasıyla Kafka'ya gönderir.
    for (const event of pendingEvents) {
      // Gönderim denemesi sayısını artırır.
      event.attempts += 1;

      // Güncel deneme sayısını veritabanına kaydeder.
      await repository.save(event);

      try {
        // Event'i Kafka'ya gönderir.
        await publishKafkaEvent(event);

        // Kafka gönderimi başarılı olduğunda event'i yayınlandı olarak işaretler.
        event.status = OutboxEventStatus.PUBLISHED;
        event.publishedAt = new Date();
        event.lastError = null;

        // Güncellenen event durumunu veritabanına kaydeder.
        await repository.save(event);

        console.log(
          `[KAFKA OUTBOX] Event published successfully: ${event.id}`,
        );
      } catch (error) {
        // Başarısız gönderimin hata bilgisini saklar.
        event.status = OutboxEventStatus.PENDING;
        event.lastError =
          error instanceof Error ? error.message : String(error);

        // Başarısız event'i sonraki deneme için beklemede bırakır.
        await repository.save(event);

        console.error(
          `[KAFKA OUTBOX] Event publishing failed: ${event.id}`,
          error,
        );

        // Kafka bağlantısındaki sorun nedeniyle diğer event'leri bekletir.
        break;
      }
    }
  } catch (error) {
    // Worker'ın genel çalışma sırasında oluşan hatalarını loglar.
    console.error("[KAFKA OUTBOX] Worker processing error:", error);
  }
};

// Aynı anda birden fazla Worker sorgusu çalışmasını engeller.
const runKafkaOutboxWorker = (): Promise<void> => {
  if (activeProcess) {
    return activeProcess;
  }

  // Yeni Outbox kontrol işlemini başlatır.
  activeProcess = processPendingEvents().finally(() => {
    activeProcess = null;
  });

  return activeProcess;
};

// Kafka Outbox Worker'ı başlatır.
export const startKafkaOutboxWorker = (): void => {
  if (workerTimer) {
    return;
  }

  console.log("[KAFKA OUTBOX] Background worker started");

  // Uygulama başladığında bekleyen event'leri hemen kontrol eder.
  void runKafkaOutboxWorker();

  // Her 5 saniyede bir yeni event kontrolü gerçekleştirir.
  workerTimer = setInterval(() => {
    void runKafkaOutboxWorker();
  }, POLL_INTERVAL);
};

// Uygulama kapanırken Worker'ı durdurur.
export const stopKafkaOutboxWorker = async (): Promise<void> => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }

  // Devam eden event işleminin tamamlanmasını bekler.
  if (activeProcess) {
    await activeProcess;
  }

  console.log("[KAFKA OUTBOX] Background worker stopped");
};
