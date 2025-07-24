import express from "express";
import { updateUserProfileController, authenticateMiddleware } from "../controllers/userController.js";

const router = express.Router();

// apply authentication middleware to protect this route
router.put("/api/user/profile", authenticateMiddleware, updateUserProfileController);

export default router;
