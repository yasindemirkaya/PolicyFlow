import PolicyDataSource from "./data-source.js";

const connectDatabase = async (): Promise<void> => {
  try {
    if (PolicyDataSource.isInitialized) {
      return;
    }

    await PolicyDataSource.initialize();

    console.log(
      "Policy Service PostgreSQL connection established successfully.",
    );
  } catch (error) {
    console.error(
      "Policy Service PostgreSQL connection failed:",
      error,
    );

    throw error;
  }
};

export default connectDatabase;