import { dbPool as pool } from "../config/db.js";
import argon2 from "argon2";
import { debugObject } from "../utils/debugObj.js";
import util from "util";
import { type } from "os";

// create vault item modal to interact with the database
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


// get vault items by user id with pagination to be interacted with the database
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


// get vault item by name and type to be interacted with the database
const getVaultItemByNameAndType = async (userId, name, type) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE user_id = $1 AND name = $2 AND type = $3",
      [userId, name, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error retrieving vault item:", error.message);
    throw error;
  }
}


// get total vault items by user id to be interacted with the database
const getTotalVaultItemsByUserId = async (userId) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS TOTAL FROM vault_items WHERE user_id = $1",
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error retrieving total vault items:", error);
    throw error;
  }
};

// get filtered vault item by user 
const getFilteredVaultItems = async (userId, search, type, limit, offset) => {
  try {
    const conditions = ["user_id = $1"];
    const values = [userId];

    if (search) {
      conditions.push(` name ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    if (type) {
      conditions.push(` type = $${values.length + 1}`);
      values.push(type);
    }

    // query to get filtered vault items 
    const query = `
      SELECT * FROM vault_items
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${values.length +1 } OFFSET $${values.length + 2}
      `;

      // add limit and offset to the values array
    values.push(limit, offset);
     
    // execute the query
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving filtered vault items:", error.message);
    throw error;
  }
};


// get total filtered vault items by user
const getTotalFilteredVaultItems = async (userId, search, type) => {
  try {
    // build the conditions and values for the query
    const conditions = ["user_id = $1"];
    const values = [userId];

    // check if search and type are provided and add them to the conditions 
    if (search) {
      conditions.push( ` name ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    if (type) {
      conditions.push(` type = $${values.length + 1}`);
      values.push(type);
    }

    // query to get total filtered vault items
    const query = `
      SELECT COUNT(*) AS total
      FROM vault_items
      WHERE ${conditions.join(" AND ")}`

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  } catch(error) {
    console.error("Error retrieving total filtered vault items:", error.message);
    throw error;
  }
};

// update vault item 
const updateVaultItem = async (userId, id, name, type, data) => {
  try {
    const encryptedData = await argon2.hash(data);

    const result = await pool.query(
      "UPDATE vault_items SET name = $1, type = $2, data = $3 WHERE user_id = $4 AND id = $5 RETURNING *",
      [name, type, encryptedData, userId, id]
    );

    if (result.rows.length === 0) {
      throw new Error("Vault item not found or not authorized.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error updating vault item:", util.inspect(error, { depth: null, colors: true}));
    throw error;
  }
};


const deleteVaultItemById = async (userId, id) => {
  try {
    const result = await pool.query(
      "DELETE FROM vault_items WHERE user_id = $1 AND id = $2 RETURNING *",
      [userId, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting vault item:", util.inspect(error, { depth: null, colors: true}));
    throw error;
  }
};


export { createVaultItem, getVaultItemsByUserId, getVaultItemByNameAndType, getTotalVaultItemsByUserId, deleteVaultItemById, getFilteredVaultItems, getTotalFilteredVaultItems, updateVaultItem };