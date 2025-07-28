import express from "express";
import { updateUserProfileController, authenticateMiddleware, updateNotificationPreferences, updatePrivacySetting } from "../controllers/userController.js";
import { validateVaultItemId } from "../validators/vaultValidator.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();

router.put("/profile", authenticateMiddleware, updateUserProfileController);

router.put("/privacy", authenticateToken, validateVaultItemId, updatePrivacySetting);

router.put("/notification", authenticateToken, updateNotificationPreferences);

export default router;
