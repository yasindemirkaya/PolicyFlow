import CustomerDataSource from "./data-source.js";

const connectDatabase = async (): Promise<void> => {
  try {
    if (CustomerDataSource.isInitialized) {
      return;
    }

    await CustomerDataSource.initialize();

    console.log(
      "Customer Service PostgreSQL connection established successfully.",
    );
  } catch (error) {
    console.error(
      "Customer Service PostgreSQL connection failed:",
      error,
    );

    throw error;
  }
};

export default connectDatabase;