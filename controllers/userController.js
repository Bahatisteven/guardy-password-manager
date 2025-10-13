import { updateUserProfile, updatePrivacy, updateNotificationPrefs } from "../models/User.js";  
import logger from "../utils/logger.js";
import jwt from 'jsonwebtoken';

const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user_id;  
    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
    }

    const { firstName, lastName, email } = req.body;

    // check if at least one update field is provided
    if (!firstName && !lastName && !email) {
      logger.error("No valid fields provided for profile update.");
      return res.status(400).json({ message: "No valid fields provided to update." });
    }

    // build update object with only provided fields
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;

    const updatedUser = await updateUserProfile(userId, updates);

    if (!updatedUser) {
      logger.warn(`User profile update failed or user not found for ID ${userId}.`);
      return res.status(404).json({ message: "User not found or update failed." });
    }

    logger.info(`User profile updated successfully for user ${userId}.`);
    return res.status(200).json({
      message: "User profile updated successfully.",
      user: updatedUser,  
    });

  } catch (error) {
    if (error.code === "23505" && error.detail && error.detail.includes("email")) {
      // postgreSQL unique violation error code for duplicate email
      logger.error("Email already in use:", error.detail);
      return res.status(409).json({ message: "Email is already in use." });
    }
    logger.error("Error updating user profile:", error);
    return res.status(500).json({ message: "An error occurred while updating the user profile." });
  }
};



// update privacy settings
const updatePrivacySetting = async (req, res) => {
  try {
    const userId = req.user_id;
    const { privacySetting } = req.body;  
    const result = await updatePrivacy (userId, privacySetting);
    if (!result) {
      logger.error(`Failed to update privacy setting for user ${userId}.`);
      return res.status(500).json({ message: "Failed to update privacy setting." });
    }
    logger.info(`Privacy setting updated successfully for user ${userId}.`);
    res.status(200).json({ message: "Privacy setting updated successfully." });
  } catch (error) {
    logger.error("Error updating privacy setting:", error.message);
    res.status(500).json({ message: "An error occurred while updating the privacy setting." });
  }
};


// update notification preferences 
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user_id;
    const {
      emailNotifications,
      securityAlerts,
      weeklyReports,
      marketingEmails,
      breachAlerts
    } = req.body;

    // only update allowed fields
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
      return res.status(500).json({ message: "Failed to update notification preferences." });
    }

    logger.info(`Notification preferences updated successfully for user ${userId}.`);
    res.status(200).json({ message: "Notification preferences updated successfully." });
  } catch (error) {
    logger.error("Error updating notification preferences:", error.message);
    res.status(500).json({ message: "An error occurred while updating notification preferences." });
  }
};


export { updateUserProfileController, updateNotificationPreferences, updatePrivacySetting };
