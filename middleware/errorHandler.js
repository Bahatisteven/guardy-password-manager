import logger from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";
import { AppError, AuthenticationError, NotFoundError, ValidationError } from "../utils/errors.js";

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.isJoi) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.details.map(detail => detail.message)
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message, ...(err.errors && { errors: err.errors }) });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired." });
  }

  if (err.code === DB_ERRORS.DUPLICATION.VAULT_VIOLATION) {
    return res.status(409).json({ message: "A resource with this unique identifier already exists." });
  }

  // Generic error for any unhandled exceptions
  res.status(500).json({ status: "error", message: "An unexpected error occurred" });
};

export default errorHandler;
