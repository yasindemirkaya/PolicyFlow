// Express kütüphanesini içe aktarır.
import express from "express";

// Merkezi environment ayarlarını içe aktarır.
import { env } from "./config/env.js";

// RabbitMQ bağlantı ve kapatma metotlarını içe aktarır.
import {
  connectRabbitMQ,
  isRabbitMQConnected,
  closeRabbitMQ,
} from "./infrastructure/rabbitmq.js";

// SMS, Email ve CRM Consumer kayıt metotlarını içe aktarır.
import { registerSmsConsumer } from "./consumers/sms.consumer.js";
import { registerEmailConsumer } from "./consumers/email.consumer.js";
import { registerCrmConsumer } from "./consumers/crm.consumer.js";

// Express uygulamasını oluşturur.
const app = express();

// Gelen JSON isteklerini parse eder.
app.use(express.json());

// Gelen HTTP isteklerini loglar.
app.use((req, _res, next) => {
  console.log(
    `[INCOMING REQUEST] ${req.method} ${req.originalUrl}`,
  );

  next();
});

// Servisin ve RabbitMQ bağlantısının durumunu döndürür.
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "integration-service",
      status: "healthy",
      dependencies: {
        rabbitmq: isRabbitMQConnected()
          ? "connected"
          : "disconnected",
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Express ve RabbitMQ servislerini başlatır.
const startServer = async (): Promise<void> => {
  try {
    // HTTP sunucusunu başlatır.
    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `Integration Service is running on port ${env.port}`,
      );
    });

    // RabbitMQ bağlantısını kurar ve üç Consumer'ı kaydeder.
    void connectRabbitMQ(async (channel) => {
      // Her Consumer'ın aynı anda birer mesaj işlemesini sağlar.
      await channel.prefetch(1);

      // SMS, Email ve CRM Consumer'larını paralel olarak başlatır.
      await Promise.all([
        registerSmsConsumer(channel),
        registerEmailConsumer(channel),
        registerCrmConsumer(channel),
      ]);
    });

    // Servis kapatılırken kaynakları güvenli şekilde temizler.
    const shutdown = async (signal: string): Promise<void> => {
      console.log(
        `${signal} received. Shutting down Integration Service...`,
      );

      // Önce HTTP sunucusunu kapatır.
      server.close(() => {
        // HTTP sunucusu kapandıktan sonra RabbitMQ bağlantısını kapatır.
        void closeRabbitMQ().then(() => {
          process.exit(0);
        });
      });
    };

    // Uygulamanın SIGINT ve SIGTERM sinyallerini yakalamasını sağlar.
    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    // Başlangıç sırasında oluşan hataları loglar ve uygulamayı sonlandırır.
    console.error("Integration Service startup failed:", error);
    process.exit(1);
  }
};

// Integration Service başlangıç işlemini çalıştırır.
void startServer();