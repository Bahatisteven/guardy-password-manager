export const DB_ERRORS = {
  VALIDATION: {
    UNIQUE_VAULT_NAME: { message:"Vault name must be unique", statusCode: 400},
    INVALID_VAULT_TYPE: { message: "Invalid vault type", statusCode: 400},
    INVALID_VAULT_DATA: { message: "Invalid vault data", statusCode: 404},
  },
  NOT_FOUND: {
    VAULT_NOT_FOUND: { message: "Vault not found", statusCode: 404 },
  },
  DUPLICATION: {
    VAULT_ALREADY_EXISTS: { message: "Vault already exists", statusCode: 409 },
    VAULT_VIOLATION: "23505",
  },
  CONNECTION: {
    DB_CONNECTION_ERROR: { message: "Database connection error", statusCode: 500 },
  },
  QUERY: {
    DB_QUERY_ERROR: { message: "Database query error", statusCode: 500},
    DB_TRANSACTION_ERROR: "Database transaction error",
    FOREIGN_KEY_VIOLATION: { message: "Foreign key constraint violation", statusCode: 400},
  },
};