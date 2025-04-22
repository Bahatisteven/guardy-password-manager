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

router.post("/items",(req, res, next) => {
  console.log("Rate limiter middleware called");
  next();
}, rateLimiter,(req, res, next) => {
  console.log("Authentication middleware hit");
  next();
}, authenticateToken,(req, res, next) => {
  console.log("Validation middleware hit");
  next();
}, validateVaultItem,(req, res, next) => {
  console.log("validate vault item middleware hit");
  next();
  }, addVaultItem,(req, res, next)=>{
  console.log("Add vault item handler hit");
  next();
  });
router.get("/items", authenticateToken, getAllVaultItems);
router.get("/items/:id",authenticateToken, validateVaultItemId, getVaultItemsByUserId);
router.post("/test", rateLimiter, (req, res) => {
  res.send("Test route");
});
router.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default router;