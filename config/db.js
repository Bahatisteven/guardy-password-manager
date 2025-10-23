import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;

// deterine database name based on the environment
const dbName = process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME;

/**
 * if the env is test, we"ll use jest to mock the database connection 
 * to avoid actual database calls during testing
 */
let jest;
if (process.env.NODE_ENV === "test") {
  import ('jest-mock').then(({ default: jestMock }) => {
    jestMock = jest;
  });
}

// new pool instance to connect to the database
const dbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: dbName,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ...(process.env.NODE_ENV === "test" && { query: jest.fn() })
});

export { dbPool };

/**
 * if the env is not test, we"ll connect to the database and log the connection status
 */
if (process.env.NODE_ENV !== "test") {
dbPool.query("SELECT NOW()", (err, res) => {
  if (err) {
    logger.error("Error connecting to the database", err);
  } else {
    logger.info("Database connected successfully", res.rows[0]);
  }
});
}