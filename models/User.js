import { dbPool as Pool } from "../config/db.js";
import logger from "../utils/logger.js";


// create a new user
const createUser = async ( email, passwordHash, hint) => {
  try {

    // check if user alredy exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    // insert the user into the database
    const result = await Pool.query(
      "INSERT INTO users ( email, password_hash, hint) VALUES ( $1, $2, $3 ) RETURNING *",
      [email, passwordHash, hint]
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
    // query from the database to find user by email
    const result = await Pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    // if no user is found, return null
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by email:", error);
    throw error;
  }
};


// find user by id 

const findUserById = async (id) => {
  try {
    // query from the database to find user by id
    const result = await Pool.query(
      "SELECT * FROM users WHERE id = $1", [id]
    );
    // if no user is found, return null
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by ID:", error);
    throw error;
  }
} 


// update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const fields = [];
    const values = [];
    let queryIndex = 1;

    for (const key in updates) {
      fields.push(`${key} = $${queryIndex++}`);
      values.push(updates[key]);
    }

    if (fields.length === 0) {
      return null; // no fields to update
    }

    // add userId to values array for the WHERE clause
    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${queryIndex}
      RETURNING id, firstName, lastName, email; -- Return relevant updated fields
    `;

    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null; // user not found or no rows updated
  } catch (error) {
    logger.error("Error updating user profile:", error);
    throw error;
  }
};



export { createUser, findUserByEmail, findUserById };
