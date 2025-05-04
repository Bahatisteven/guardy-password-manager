import { dbPool as pool } from "../config/db.js";
import argon2 from "argon2";
import { debugObject } from "../utils/debugObj.js";

const createVaultItem = async (userId, name, type, data) => {
  try {
    const encryptedData = await argon2.hash(data);

    const result = await pool.query(
      "INSERT INTO vault_items (user_id, name, type, data) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, type, encryptedData]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating vault item:", error);
    throw error;
  }
};


const getVaultItemsByUserId = async (userId, limits, offset) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limits, offset]
    );
    debugObject(result.rows);
    return result.rows;
  } catch (error) {
    debugObject(error);
    console.error("Error retrieving vault items:", { error: error.message});
    throw error;
  }
};



const getVaultItemByNameAndType = async (userId, name, type) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE user_id = $1 AND name = $2 AND type = $3",
      [userId, name, type]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error retrieving vault item:", error);
    throw error;
  }
}


export { createVaultItem, getVaultItemsByUserId, getVaultItemByNameAndType };