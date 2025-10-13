import express from "express";
import { updateUserProfileController, updateNotificationPreferences, updatePrivacySetting } from "../controllers/userController.js";
import { validateVaultItemId } from "../validators/vaultValidator.js";
import { authenticate, authenticateMiddleware } from "../middleware/authMiddleware.js";
import { validateUpdateUserProfile } from "../validators/userValidator.js";
const router = express.Router();

router.put("/profile", authenticateMiddleware, validateUpdateUserProfile, updateUserProfileController);

router.put("/privacy", authenticate, validateVaultItemId, updatePrivacySetting);

router.put("/notification", authenticate, updateNotificationPreferences);

export default router;
