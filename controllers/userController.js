import { updateUserProfile } from "../models/User.js";  
import logger from "../utils/logger.js";

const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user_id;  
    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
    }

    const { firstName, lastName, email /* add other fields as needed */ } = req.body;

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

export { updateUserProfileController };
