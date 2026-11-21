import ProductDataSource from "./data-source.js";

const connectDatabase = async (): Promise<void> => {
  try {
    if (ProductDataSource.isInitialized) {
      return;
    }

    await ProductDataSource.initialize();

    console.log(
      "Product Service PostgreSQL connection established successfully.",
    );
  } catch (error) {
    console.error(
      "Product Service PostgreSQL connection failed:",
      error,
    );

    throw error;
  }
};

export default connectDatabase;