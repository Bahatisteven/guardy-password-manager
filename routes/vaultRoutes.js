import express from "express";
import { addVaultItem } from "../controllers/vaultController.js";
import { getVaultItemsByUserId } from "../models/VaultItem.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { rateLimiter } from "../middleware/rateLimit.js";
import { validateVaultItem } from "../validators/vaultValidator.js";
import { validateVaultItemId } from "../validators/vaultValidator.js";
import { getAllVaultItems } from "../controllers/vaultController.js";


const router = express.Router();

router.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// router to handle vault item routes

router.post("/vault/items", rateLimiter, authenticateToken, validateVaultItem, addVaultItem);
router.get("/vault/items", authenticateToken, getAllVaultItems);
router.get("/vault/items/:id",authenticateToken, validateVaultItemId, getVaultItemsByUserId);
