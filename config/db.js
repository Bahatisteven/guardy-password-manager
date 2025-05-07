import dotenv from "dotenv";
dotenv.config();

import pg from "pg";
const { Pool } = pg;


const dbName = process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME;

let jest;
if (process.env.NODE_ENV === "test") {
  jest = await import('jest-mock');
}


const dbPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: dbName,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ...(process.env.NODE_ENV === "test" && { query: jest.fn() })
});

export { dbPool };

if (process.env.NODE_ENV !== "test") {
dbPool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database", err);
  } else {
    console.log("Database connected successfully", res.rows[0]);
  }
});
}