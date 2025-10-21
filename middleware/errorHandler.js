import logger from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed", errors: err.errors });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired." });
  }

  if (err.code === DB_ERRORS.VAULT_ALREADY_EXISTS) {
    return res.status(409).json({ message: "Vault item already exists." });
  }

  if (err.code === DB_ERRORS.FOREIGN_KEY_VIOLATION) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  if (err.message === "User ID is missing in the request.") {
    return res.status(400).json({ message: "User ID is missing. Please log in and try again." });
  }
  
  if (err.message === "Unauthorized. Please log in and try again.") {
    return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
  }

  if (err.message === "Vault item not found or not authorized.") {
    return res.status(404).json({ message: "Vault item not found or not authorized." });
  }

  res.status(500).json({ message: "An unexpected error occurred" });
};

export default errorHandler;
