import { updateUserProfile, updatePrivacy, updateNotificationPrefs } from "../models/User.js";  
import logger from "../utils/logger.js";
import jwt from 'jsonwebtoken';
import { AuthenticationError, NotFoundError, ValidationError, AppError } from "../utils/errors.js";

/**
 * Handles updating a user's profile information.
 * @param {Object} req - Express request object, expected to have `req.user_id` populated.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response with the updated user profile.
 */
const updateUserProfileController = async (req, res, next) => {
  try {
    const userId = req.user_id;  
    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return next(new AuthenticationError("Unauthorized. Please log in and try again."));
    }

    const { firstName, lastName, email } = req.body;

    // check if at least one update field is provided
    if (!firstName && !lastName && !email) {
      logger.error("No valid fields provided for profile update.");
      return next(new ValidationError("No valid fields provided to update."));
    }

    // build update object with only provided fields
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;

    const updatedUser = await updateUserProfile(userId, updates);

    if (!updatedUser) {
      logger.warn(`User profile update failed or user not found for ID ${userId}.`);
      return next(new NotFoundError("User not found or update failed."));
    }

    logger.info(`User profile updated successfully for user ${userId}.`);
    return res.status(200).json({
      message: "User profile updated successfully.",
      user: updatedUser,  
    });

  } catch (error) {
    if (error.code === "23505" && error.detail && error.detail.includes("email")) {
      logger.warn(`Attempted to update with duplicate email: ${req.body.email}`);
      return next(new AppError("The email address provided is already in use by another account.", 409));
    }
    logger.error("Error updating user profile:", error);
    return next(new AppError("An error occurred while updating the user profile.", 500));
  }
};



/**
 * Handles updating a user's privacy setting.
 * @param {Object} req - Express request object, expected to have `req.user_id` populated.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response indicating successful update.
 */
const updatePrivacySetting = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const { privacySetting } = req.body;  
    const result = await updatePrivacy (userId, privacySetting);
    if (!result) {
      logger.error(`Failed to update privacy setting for user ${userId}.`);
      return next(new AppError("Failed to update privacy setting.", 500));
    }
    logger.info(`Privacy setting updated successfully for user ${userId}.`);
    res.status(200).json({ message: "Privacy setting updated successfully." });
  } catch (error) {
    logger.error("Error updating privacy setting:", error.message);
    next(error);
  }
};


/**
 * Handles updating a user's notification preferences.
 * @param {Object} req - Express request object, expected to have `req.user_id` populated.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response indicating successful update.
 */
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const {
      emailNotifications,
      securityAlerts,
      weeklyReports,
      marketingEmails,
      breachAlerts
    } = req.body;

    const notificationPrefs = {
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(securityAlerts !== undefined && { securityAlerts }),
      ...(weeklyReports !== undefined && { weeklyReports }),
      ...(marketingEmails !== undefined && { marketingEmails }),
      ...(breachAlerts !== undefined && { breachAlerts }),
    };

    const result = await updateNotificationPrefs(userId, notificationPrefs);

    if (!result) {
      logger.error(`Failed to update notification preferences for user ${userId}.`);
      return next(new AppError("Failed to update notification preferences.", 500));
    }

    logger.info(`Notification preferences updated successfully for user ${userId}.`);
    res.status(200).json({ message: "Notification preferences updated successfully." });
  } catch (error) {
    logger.error("Error updating notification preferences:", error.message);
    next(error);
  }
};


export { updateUserProfileController, updateNotificationPreferences, updatePrivacySetting };
