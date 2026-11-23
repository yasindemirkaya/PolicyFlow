import PolicyDataSource from "./data-source.js";

// PostgreSQL bağlantısını kurar ve bekleyen migration'ları çalıştırır.
const connectDatabase = async (): Promise<void> => {
  try {
    // Daha önce bağlantı kurulmuşsa tekrar bağlantı oluşturmaz.
    if (PolicyDataSource.isInitialized) {
      return;
    }

    // PostgreSQL bağlantısını başlatır.
    await PolicyDataSource.initialize();

    console.log(
      "Policy Service PostgreSQL connection established successfully.",
    );

    // Bekleyen veritabanı migration'larını uygular.
    const migrations = await PolicyDataSource.runMigrations();

    console.log(
      `Policy Service migrations completed. Executed: ${migrations.length}`,
    );
  } catch (error) {
    // Veritabanı veya migration hatalarını loglar.
    console.error(
      "Policy Service PostgreSQL connection failed:",
      error,
    );

    throw error;
  }
};

// Uygulama kapanırken PostgreSQL bağlantısını güvenli şekilde kapatır.
export const closeDatabase = async (): Promise<void> => {
  if (PolicyDataSource.isInitialized) {
    await PolicyDataSource.destroy();

    console.log(
      "Policy Service PostgreSQL connection closed.",
    );
  }
};

export default connectDatabase;