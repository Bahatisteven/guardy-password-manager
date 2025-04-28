import { dbPool as Pool } from "../config/db.js";
import logger from "../utils/logger.js";


// create a new user
const createUser = async ( username, email, passwordHash) => {
  try {

    // check if user alredy exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    // insert the user into the database
    const result = await Pool.query(
      "INSERT INTO users ( username, email, password_hash ) VALUES ( $1, $2, $3 ) RETURNING *",
      [username, email, passwordHash]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};


// find user by email
const findUserByEmail = async (email) => {
  console.log("Finding user by email:", email);
  
  try {
    const result = await Pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by email:", error);
    throw error;
  }
};


// find user by id 

const findUserById = async (id) => {
  try {
    const result = await Pool.query(
      "SELECT * FROM users WHERE id = $1", [id]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by ID:", error);
    throw error;
  }
} 


export { createUser, findUserByEmail, findUserById };
