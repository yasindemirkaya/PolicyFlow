import AnalyticsDataSource from "./data-source.js";

// PostgreSQL bağlantısını kurar ve bekleyen migration'ları çalıştırır.
const connectDatabase = async (): Promise<void> => {
  try {
    // Daha önce bağlantı kurulmuşsa tekrar bağlantı oluşturmaz.
    if (AnalyticsDataSource.isInitialized) {
      return;
    }

    // PostgreSQL bağlantısını başlatır.
    await AnalyticsDataSource.initialize();

    console.log(
      "Analytics Service PostgreSQL connection established successfully.",
    );

    // Bekleyen veritabanı migration'larını uygular.
    const migrations = await AnalyticsDataSource.runMigrations();

    console.log(
      `Analytics Service migrations completed. Executed: ${migrations.length}`,
    );
  } catch (error) {
    // Veritabanı veya migration hatalarını loglar.
    console.error(
      "Analytics Service PostgreSQL connection failed:",
      error,
    );

    throw error;
  }
};

// Uygulama kapanırken PostgreSQL bağlantısını güvenli şekilde kapatır.
export const closeDatabase = async (): Promise<void> => {
  if (AnalyticsDataSource.isInitialized) {
    await AnalyticsDataSource.destroy();

    console.log(
      "Analytics Service PostgreSQL connection closed.",
    );
  }
};

export default connectDatabase;