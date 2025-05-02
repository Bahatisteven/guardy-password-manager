import express from "express";
import rateLimiter from "../middleware/rateLimit.js";
import { addVaultItem, getAllVaultItems } from "../controllers/vaultController.js";
import { getVaultItemsByUserId } from "../models/VaultItem.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateVaultItem, validateVaultItemId } from "../validators/vaultValidator.js";



const router = express.Router();

// router to handle vault item routes

router.post("/items", authenticateToken, validateVaultItem, addVaultItem);

router.get("/items", authenticateToken, getAllVaultItems);

router.get("/items/:id",authenticateToken, validateVaultItemId, getVaultItemsByUserId);

router.post("/test", rateLimiter, (req, res) => {
  res.send("Test route");
});

router.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default router;