import { dbPool as Pool } from "../config/db.js";
import argon2 from "argon2";



const createUser = async ( username, email, password) => {
  try {

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    const passwordHash = await argon2.hash(password);

    const result = await Pool.query(
      "INSERT INTO users ( username, email, password_hash ) VALUES ( $1, $2, $3 ) RETURNING *",
      [username, email, passwordHash]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};



const findUserByEmail = async (email) => {
  try {
    const result = await Pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};


export { createUser, findUserByEmail };
