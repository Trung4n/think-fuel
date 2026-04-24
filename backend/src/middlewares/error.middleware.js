import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Server error";

  if (env.NODE_ENV !== "production") {
    // If you want to see detailed error, uncomment this
    logger.error(err);
  }

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = err.message;
  } else if (err.code === 11000) {
    status = 409; // Conflict
    message = "Duplicate field value entered";
  } else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    status = 400;
    message = "Invalid JSON payload";
  }

  res.status(status).json({
    success: false,
    message,
  });
};
