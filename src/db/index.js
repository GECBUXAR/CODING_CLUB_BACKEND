import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URL;

    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string is not defined in environment variables"
      );
    }

    const options = {
      dbName: DB_NAME,
      retryWrites: true,
      w: "majority",
      retryReads: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const connectionInstance = await mongoose.connect(mongoURI, options);

    console.log(
      `\n MongoDB connected successfully! DB HOST: ${connectionInstance.connection.host}`
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully!");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

    return connectionInstance;
  } catch (error) {
    console.error("MongoDB Connection FAILED:");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // Additional debugging information
    if (error.name === "MongooseServerSelectionError") {
      console.error("\nPossible causes:");
      console.error("1. MongoDB Atlas IP whitelist needs to be updated");
      console.error("2. Network connectivity issues");
      console.error("3. Invalid connection string");
      console.error("\nPlease check:");
      console.error("- MongoDB Atlas IP whitelist settings");
      console.error("- Network connectivity");
      console.error("- Environment variables");
    }

    process.exit(1);
  }
};

export default connectDB;
