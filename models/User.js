import { dbPool as Pool } from "../config/db.js";
import logger from "../utils/logger.js";


/**
 * Creates a new user in the database.
 * @param {string} email - The user's email address.
 * @param {string} passwordHash - The hashed master password.
 * @param {string} hint - A hint for the master password.
 * @returns {Promise<Object>} The newly created user object.
 * @throws {Error} If a user with the email already exists or other database error occurs.
 */
export const createUser = async ( email, passwordHash, hint, firstName, lastName, encryptedMasterKey, masterKeySalt) => {
  try {

    // check if user alredy exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    // insert the user into the database
    const result = await Pool.query(
      "INSERT INTO users ( email, password_hash, hint, first_name, last_name, encrypted_master_key, master_key_salt) VALUES ( $1, $2, $3, $4, $5, $6, $7 ) RETURNING *",
      [email, passwordHash, hint, firstName, lastName, encryptedMasterKey, masterKeySalt]
    );
    return result.rows[0];
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};


/**
 * Finds a user by their email address.
 * @param {string} email - The email address of the user to find.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const findUserByEmail = async (email) => {
  logger.info("Finding user by email:", email);
  
  try {
    // query from the database to find user by email
    const result = await Pool.query(
      "SELECT id, email, password_hash, hint, first_name, last_name, two_factor_secret, encrypted_master_key, master_key_salt FROM users WHERE email = $1",
      [email]
    );
    // if no user is found, return null
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by email:", error);
    throw error;
  }
};


/**
 * Finds a user by their ID.
 * @param {string} id - The ID of the user to find.
 * @returns {Promise<Object|null>} The user object if found, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const findUserById = async (id) => {
  try {
    // query from the database to find user by id
    const result = await Pool.query(
      "SELECT id, email, password_hash, hint, first_name, last_name, two_factor_secret, encrypted_master_key, master_key_salt FROM users WHERE id = $1", [id]
    );
    // if no user is found, return null
    return result.rows[0];
  } catch (error) {
    logger.error("Error finding user by ID:", error);
    throw error;
  }
} 


/**
 * Updates a user's profile information.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} updates - An object containing the fields to update (e.g., { firstName, lastName, email }).
 * @returns {Promise<Object|null>} The updated user object if successful, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const validColumns = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      hint: 'hint'
    };
    const setClauses = [];
    const values = [];
    let queryIndex = 1;

    for (const key in updates) {
      if (validColumns[key]) {
        setClauses.push(`${validColumns[key]} = $${queryIndex++}`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) {
      return null; // no fields to update
    }

    // add userId to values array for the WHERE clause
    values.push(userId);

    const query = `
      UPDATE users
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${queryIndex}
      RETURNING id, first_name AS "firstName", last_name AS "lastName", email; -- Return relevant updated fields
    `;

    const result = await Pool.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null; // user not found or no rows updated
  } catch (error) {
    logger.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Updates a user's privacy setting.
 * @param {string} userId - The ID of the user to update.
 * @param {string} privacySetting - The new privacy setting.
 * @returns {Promise<Object|null>} The updated user object with privacy setting if successful, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const updatePrivacy = async (userId, privacySetting) => {
  try {
    const query = `
      UPDATE users
      SET privacy_setting = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, privacy_setting;
    `;

    const values = [privacySetting, userId];
    const result = await Pool.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null; // no user found or no rows affected
  } catch (error) {
    logger.error("Error updating privacy setting:", error);
    throw error;
  }
};

/**
 * updates notification preferences for the given user ID.
 * @param {String|Number} userId - ID of the user in the DB
 * @param {Object} prefs - notification preferences to update
 * @returns {Object|null} updated user row, or null on failure
 */
export const updateNotificationPrefs = async (userId, prefs) => {
  try {
    const validColumns = {
      emailNotifications: 'email_notifications',
      securityAlerts: 'security_alerts',
      weeklyReports: 'weekly_reports',
      marketingEmails: 'marketing_emails',
      breachAlerts: 'breach_alerts'
    };

    const setClauses = [];
    const values = [];
    let queryIndex = 1;

    for (const key in prefs) {
      if (validColumns[key] && prefs[key] !== undefined) {
        setClauses.push(`${validColumns[key]} = $${queryIndex++}`);
        values.push(prefs[key]);
      }
    }

    if (setClauses.length === 0) {
      // nothing to update
      return null;
    }

    // add userId to the end of the values array
    values.push(userId);

   // query to update user notification preferences
    const query = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${queryIndex}
      RETURNING *;
    `;

    const result = await Pool.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    logger.error("Error updating notification preferences:", error);
    return null;
  }
};

/**
 * Updates a user's two-factor authentication secret.
 * @param {string} userId - The ID of the user to update.
 * @param {string|null} secret - The new 2FA secret (base32 encoded) or null to disable 2FA.
 * @returns {Promise<Object|null>} The updated user object with the 2FA secret if successful, otherwise null.
 * @throws {Error} If a database error occurs.
 */
export const updateTwoFactorSecret = async (userId, secret) => {
  try {
    const query = `
      UPDATE users
      SET two_factor_secret = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, two_factor_secret;
    `;
    const values = [secret, userId];
    const result = await Pool.query(query, values);

    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    logger.error("Error updating two-factor secret:", error);
    throw error;
  }
};