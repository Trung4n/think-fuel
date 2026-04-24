import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDB = async (uri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri || env.MONGO_URI, {
    autoIndex: true,
  });
  logger.info("MongoDB connected");
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};
