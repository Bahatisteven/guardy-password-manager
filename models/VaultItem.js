import CryptoJS from "crypto-js";
import dotenv from "dotenv";
dotenv.config();
import { dbPool as pool } from "../config/db.js";
import util from "util";
import logger from "../utils/logger.js";

/**
 * Encrypts a given text using AES encryption.
 * @param {string} text - The text to encrypt.
 * @returns {string} The encrypted text.
 */
const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, process.env.ENCRYPTION_KEY).toString();
};

/**
 * Decrypts a given encrypted text using AES decryption.
 * @param {string} encryptedText - The text to decrypt.
 * @returns {string} The decrypted text.
 */
const decrypt = (encryptedText) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, process.env.ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Creates a new vault item in the database.
 * @param {string} userId - The ID of the user who owns the vault item.
 * @param {string} name - The name of the vault item.
 * @param {string} type - The type of the vault item (e.g., 'password', 'note', 'card').
 * @param {string} password - The password associated with the vault item (will be encrypted).
 * @param {Object} data - Additional data for the vault item.
 * @returns {Promise<Object>} The newly created vault item object.
 * @throws {Error} If a database error occurs.
 */
export const createVaultItem = async (userId, name, type, password, data) => {
  try {
    // encrypt the password
    const encryptedPassword = encrypt(password);

    // insert the vault item into the database
    const result = await pool.query(
      "INSERT INTO vault_items (user_id, name, type, password, data) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, name, type, encryptedPassword, data]
    );
    // return null if no rows are returned
    return result.rows[0];
  } catch (error) {
    logger.error("Error creating vault item:", error);
    throw error;
  }
};


/**
 * Retrieves vault items for a specific user with pagination.
 * @param {string} userId - The ID of the user.
 * @param {number} limits - The maximum number of items to return.
 * @param {number} offset - The number of items to skip.
 * @returns {Promise<Array<Object>>} An array of vault item objects.
 * @throws {Error} If a database error occurs.
 */
export const getVaultItemsByUserId = async (userId, limits, offset) => {
  try {
    // check if limits and offset are provided, if not set default values
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limits, offset]
    );
    result.rows.forEach((row) => {
      row.password = decrypt(row.password);
    });
    return result.rows;
  } catch (error) {
    logger.error("Error retrieving vault items:", { error: error.message});
    throw error;
  }
};


/**
 * Retrieves a vault item by its name and type for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} name - The name of the vault item.
 * @param {string} type - The type of the vault item.
 * @returns {Promise<Object|null>} The vault item object if found, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const getVaultItemByNameAndType = async (userId, name, type) => {
  try {
    // query to get vault item by name and type
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE user_id = $1 AND name = $2 AND type = $3",
      [userId, name, type]
    );
    // if no rows are returned, return null
    if (result.rows[0]) {
      result.rows[0].password = decrypt(result.rows[0].password);
    }
    return result.rows[0];
  } catch (error) {
    logger.error("Error retrieving vault item:", error.message);
    throw error;
  }
}


/**
 * Retrieves the total count of vault items for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number>} The total number of vault items.
 * @throws {Error} If a database error occurs.
 */
export const getTotalVaultItemsByUserId = async (userId) => {
  try {
    // query to get total vault items by user id
    const result = await pool.query(
      "SELECT COUNT(*) AS TOTAL FROM vault_items WHERE user_id = $1",
      [userId]
    );
    // if no rows are returned, return 0
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    logger.error("Error retrieving total vault items:", error);
    throw error;
  }
};

/**
 * Retrieves filtered vault items for a specific user with pagination.
 * @param {string} userId - The ID of the user.
 * @param {string} search - The search term to filter by name.
 * @param {string} type - The type to filter by.
 * @param {number} limit - The maximum number of items to return.
 * @param {number} offset - The number of items to skip.
 * @returns {Promise<Array<Object>>} An array of filtered vault item objects.
 * @throws {Error} If a database error occurs.
 */
export const getFilteredVaultItems = async (userId, search, type, limit, offset) => {
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
    result.rows.forEach((row) => {
      row.password = decrypt(row.password);
    });
    return result.rows;
  } catch (error) {
    logger.error("Error retrieving filtered vault items:", error.message);
    throw error;
  }
};


/**
 * Retrieves the total count of filtered vault items for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} search - The search term to filter by name.
 * @param {string} type - The type to filter by.
 * @returns {Promise<number>} The total number of filtered vault items.
 * @throws {Error} If a database error occurs.
 */
export const getTotalFilteredVaultItems = async (userId, search, type) => {
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
    logger.error("Error retrieving total filtered vault items:", error.message);
    throw error;
  }
};

/**
 * Updates an existing vault item.
 * @param {string} userId - The ID of the user who owns the vault item.
 * @param {string} id - The ID of the vault item to update.
 * @param {string} name - The new name of the vault item.
 * @param {string} type - The new type of the vault item.
 * @param {string} password - The new password for the vault item (will be encrypted).
 * @param {Object} data - The new additional data for the vault item.
 * @returns {Promise<Object>} The updated vault item object.
 * @throws {Error} If the vault item is not found or a database error occurs.
 */
export const updateVaultItem = async (userId, id, name, type, password, data) => {
  try {
    // encrypt the password
    const encryptedPassword = encrypt(password);

    // update the vault item in the database
    const result = await pool.query(
      "UPDATE vault_items SET name = $1, type = $2, password = $3, data = $4 WHERE user_id = $5 AND id = $6 RETURNING *",
      [name, type, encryptedPassword, data, userId, id]
    );

    // if no rows are returned, throw an error
    if (result.rows.length === 0) {
      throw new Error("Vault item not found or not authorized.");
    }

    // return the updated vault item
    result.rows[0].password = decrypt(result.rows[0].password);
    return result.rows[0];
  } catch (error) {
    logger.error("Error updating vault item:", util.inspect(error, { depth: null, colors: true}));
    throw error;
  }
};


/**
 * Deletes a vault item by its ID.
 * @param {string} userId - The ID of the user who owns the vault item.
 * @param {string} id - The ID of the vault item to delete.
 * @returns {Promise<Object|null>} The deleted vault item object if successful, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const deleteVaultItemById = async (userId, id) => {
  try {
    // query to delete the vault item by id
    const result = await pool.query(
      "DELETE FROM vault_items WHERE user_id = $1 AND id = $2 RETURNING *",
      [userId, id]
    );
    // if no rows, throw error
    return result.rows[0];
  } catch (error) {
    logger.error("Error deleting vault item:", util.inspect(error, { depth: null, colors: true}));
    throw error;
  }
};



/**
 * Shares a vault item with another user.
 * @param {string} userId - The ID of the user who owns the vault item.
 * @param {string} itemId - The ID of the vault item to share.
 * @param {string} recipientEmail - The email of the user to share with.
 * @param {string} [accessLevel="view"] - The access level for the shared item (e.g., "view", "edit").
 * @returns {Promise<Object>} The shared vault item object.
 * @throws {Error} If the recipient is not found, item not owned by user, duplicate sharing, or a database error occurs.
 */
export const shareVault = async (userId, itemId, recipientEmail, accessLevel = "view") => {
  try {
    // if the recipient exists
    const recipientRes = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [recipientEmail]
    );
    if (recipientRes.rows.length === 0) {
      throw new Error("Recipient not found.");
    }
    const recipientId = recipientRes.rows[0].id;

    // if the vault item exists and belongs to the user
    const itemRes = await pool.query(
      "SELECT id FROM vault_items WHERE id = $1 AND user_id = $2",
      [itemId, userId]
    );
    if (itemRes.rows.length === 0) {
      throw new Error("Vault item not found or not owned by user.");
    }

    // prevent duplicate sharing
    const duplicateRes = await pool.query(
      "SELECT id FROM shared_vault_items WHERE item_id = $1 AND recipient_id = $2",
      [itemId, recipientId]
    );
    if (duplicateRes.rows.length > 0) {
      throw new Error("This item is already shared with this user.");
    }

    // insert the shared vault item into the database
    const result = await pool.query(
      "INSERT INTO shared_vault_items (user_id, item_id, recipient_id, access_level) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, itemId, recipientId, accessLevel]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error sharing vault item:", util.inspect(error, { depth: null, colors: true }));
    throw error;
  }
};

/**
 * Finds a single vault item by its ID and the user ID.
 * @param {string} userId - The ID of the user who owns the vault item.
 * @param {string} itemId - The ID of the vault item to find.
 * @returns {Promise<Object|null>} The vault item object if found, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const findVaultItemById = async (userId, itemId) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vault_items WHERE id = $1 AND user_id = $2",
      [itemId, userId]
    );
    if (result.rows.length > 0) {
      result.rows[0].password = decrypt(result.rows[0].password);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    logger.error("Error finding vault item by ID:", error);
    throw error;
  }
};


