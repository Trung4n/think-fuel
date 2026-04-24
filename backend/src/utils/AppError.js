export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Operational errors are expected and handled
    Error.captureStackTrace(this, this.constructor);
  }
}
