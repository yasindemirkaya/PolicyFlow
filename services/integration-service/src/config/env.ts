// Environment değişkenlerini servis içerisindeki .env dosyasından yükler.
import "dotenv/config";

// Uygulamanın ihtiyaç duyduğu ortam değişkenlerini merkezi olarak tanımlar.
export const env = {
  // HTTP Health Check sunucusunun portunu belirler.
  port: Number(process.env.PORT) || 3000,

  // RabbitMQ bağlantı ayarlarını tanımlar.
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || "policyflow-rabbitmq",
    port: Number(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USERNAME || "",
    password: process.env.RABBITMQ_PASSWORD || "",
    vhost: process.env.RABBITMQ_VHOST || "policyflow",

    // Bağlantı koptuğunda yeniden bağlantı aralığını belirler.
    reconnectDelay: 5000,
  },
};