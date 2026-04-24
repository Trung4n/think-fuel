import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { AppError } from "./utils/AppError.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by"); // Security best practice
  app.use(helmet()); // Security headers
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true })); // CORS
  app.use(express.json({ limit: "1mb" })); // Body parser
  if (env.NODE_ENV !== "production") {
    app.use(morgan("dev")); // Logger
  }
  app.use(cookieParser()); // Cookie parser

  // Routes
  app.use("/api", routes);
  // 404 handler
  app.use((_req, _res, next) => next(new AppError("Not Found", 404)));
  // Error handler
  app.use(errorHandler);

  return app;
};
