import express from "express";
import rateLimiter from "../middleware/rateLimit.js";
import { addVaultItem } from "../controllers/vaultController.js";
import { getVaultItemsByUserId } from "../models/VaultItem.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { validateVaultItem } from "../validators/vaultValidator.js";
import { validateVaultItemId } from "../validators/vaultValidator.js";
import { getAllVaultItems } from "../controllers/vaultController.js";


const router = express.Router();

// router to handle vault item routes

router.post("/vault/items",(req, res, next) => {
  console.log("Rate limiter middleware called");
  next();
}, rateLimiter,(req, res, next) => {
  console.log("Rate limiter middleware called");
  next();
}, authenticateToken,(req, res, next) => {console.log("Rate limiter middleware called");next();}, validateVaultItem,(req, res, next) => {console.log("Rate limiter middleware called");next();}, addVaultItem,(req, res, next)=>{console.log("Rate limiter middleware called");next();});
router.get("/vault/items", authenticateToken, getAllVaultItems);
router.get("/vault/items/:id",authenticateToken, validateVaultItemId, getVaultItemsByUserId);
router.post("/vault/items", (req, res) => {
  res.send("Test route");
});
router.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default router;