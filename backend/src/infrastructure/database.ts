
import AppDataSource from "./data-source.js";

const connectDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();

    console.log("PostgreSQL connected successfully.");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exit(1);
  }
};

export default connectDatabase;
