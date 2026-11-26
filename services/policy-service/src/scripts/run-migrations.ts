import PolicyDataSource from "../infrastructure/data-source.js";

const run = async (): Promise<void> => {
  try {
    await PolicyDataSource.initialize();

    console.log("[MIGRATION] Starting migrations...");

    const migrations = await PolicyDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log("[MIGRATION] No pending migrations.");
    } else {
      migrations.forEach((migration) => {
        console.log(`[MIGRATION] Executed: ${migration.name}`);
      });
    }
  } catch (error) {
    console.error("[MIGRATION] Failed:", error);
    process.exitCode = 1;
  } finally {
    if (PolicyDataSource.isInitialized) {
      await PolicyDataSource.destroy();
    }
  }
};

void run();