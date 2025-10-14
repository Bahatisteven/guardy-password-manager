import { dbPool as Pool } from "../config/db.js";
import logger from "../utils/logger.js";


// create a new user
export const createUser = async ( email, passwordHash, hint) => {
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
export const findUserByEmail = async (email) => {
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

export const findUserById = async (id) => {
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
    const validColumns = ['firstName', 'lastName', 'email', 'hint']; // another valid columns here
    const fields = [];
    const values = [];
    let queryIndex = 1;

    for (const key in updates) {
      if (validColumns.includes(key)) {
        fields.push(`${key} = $${queryIndex++}`);
        values.push(updates[key]);
      }
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

// update privacy setting for a user
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

    const columns = [];
    const values = [];
    let idx = 1;

    for (const key in prefs) {
      if (validColumns[key] && prefs[key] !== undefined) {
        columns.push(`${validColumns[key]} = $${idx++}`);
        values.push(prefs[key]);
      }
    }

    if (columns.length === 0) {
      // nothing to update
      return null;
    }

    // add userId to the end of the values array
    values.push(userId);

   // query to update user notification preferences
    const query = `
      UPDATE users
      SET ${columns.join(', ')}
      WHERE id = $${idx}
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