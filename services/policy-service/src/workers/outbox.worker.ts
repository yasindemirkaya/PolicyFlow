// PostgreSQL bağlantısını ve TypeORM yapılandırmasını içe aktarır.
import PolicyDataSource from "../infrastructure/data-source.js";

// Outbox Entity ve event durumlarını içe aktarır.
import {
  OutboxEvent,
  OutboxEventStatus,
} from "../entities/outbox-event.entity.js";

// RabbitMQ Publisher metodunu içe aktarır.
import { publishOutboxEvent } from "../infrastructure/rabbitmq.publisher.js";

// Worker'ın çalışma aralığını ve tek seferde işleyeceği event sayısını belirler.
const POLL_INTERVAL = 5000;
const BATCH_SIZE = 10;

// Worker zamanlayıcısını ve devam eden işlemi takip eder.
let workerTimer: NodeJS.Timeout | null = null;
let activeProcess: Promise<void> | null = null;

// Bekleyen Outbox event'lerini RabbitMQ'ya gönderir.
const processPendingEvents = async (): Promise<void> => {
  try {
    // Outbox tablosuna erişmek için Repository oluşturur.
    const repository = PolicyDataSource.getRepository(OutboxEvent);

    // Yayınlanmayı bekleyen ilk 10 event'i getirir.
    const pendingEvents = await repository.find({
      where: {
        status: OutboxEventStatus.PENDING,
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

    // Bekleyen event'leri sırasıyla RabbitMQ'ya gönderir.
    for (const event of pendingEvents) {
      // Gönderim denemesi sayısını artırır.
      event.attempts += 1;

      // Güncel deneme sayısını veritabanına kaydeder.
      await repository.save(event);

      try {
        // Event'i RabbitMQ'ya gönderir ve broker onayını bekler.
        await publishOutboxEvent(event);

        // RabbitMQ onayı geldikten sonra event'i yayınlandı olarak işaretler.
        event.status = OutboxEventStatus.PUBLISHED;
        event.publishedAt = new Date();
        event.lastError = null;

        // Güncellenen event durumunu veritabanına kaydeder.
        await repository.save(event);

        console.log(
          `[OUTBOX] Event published successfully: ${event.id}`,
        );
      } catch (error) {
        // Başarısız gönderimin hata bilgisini saklar.
        event.status = OutboxEventStatus.PENDING;
        event.lastError =
          error instanceof Error ? error.message : String(error);

        // Başarısız event'i sonraki deneme için beklemede bırakır.
        await repository.save(event);

        console.error(
          `[OUTBOX] Event publishing failed: ${event.id}`,
          error,
        );

        // RabbitMQ bağlantısındaki sorun nedeniyle diğer event'leri bekletir.
        break;
      }
    }
  } catch (error) {
    // Worker'ın genel çalışma sırasında oluşan hatalarını loglar.
    console.error("[OUTBOX] Worker processing error:", error);
  }
};

// Aynı anda birden fazla Worker sorgusu çalışmasını engeller.
const runOutboxWorker = (): Promise<void> => {
  if (activeProcess) {
    return activeProcess;
  }

  // Yeni Outbox kontrol işlemini başlatır.
  activeProcess = processPendingEvents().finally(() => {
    activeProcess = null;
  });

  return activeProcess;
};

// Outbox Worker'ı başlatır ve ilk kontrolü hemen gerçekleştirir.
export const startOutboxWorker = (): void => {
  if (workerTimer) {
    return;
  }

  console.log("[OUTBOX] Background worker started");

  // Uygulama başladığında bekleyen event'leri hemen kontrol eder.
  void runOutboxWorker();

  // Her 5 saniyede bir yeni event kontrolü gerçekleştirir.
  workerTimer = setInterval(() => {
    void runOutboxWorker();
  }, POLL_INTERVAL);
};

// Uygulama kapanırken Worker zamanlayıcısını durdurur.
export const stopOutboxWorker = async (): Promise<void> => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }

  // Devam eden event işleminin tamamlanmasını bekler.
  if (activeProcess) {
    await activeProcess;
  }

  console.log("[OUTBOX] Background worker stopped");
};