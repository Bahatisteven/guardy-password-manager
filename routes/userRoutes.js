import express from "express";
import { updateUserProfileController, authenticateMiddleware, updateNotificationPreferences, updatePrivacySetting } from "../controllers/userController.js";
import { validateVaultItemId } from "../validators/vaultValidator.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = express.Router();

router.put("/profile", authenticateMiddleware, updateUserProfileController);

router.put("/privacy", authenticate, validateVaultItemId, updatePrivacySetting);

router.put("/notification", authenticate, updateNotificationPreferences);

export default router;
