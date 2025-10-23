import express from "express";
import rateLimiter from "../middleware/rateLimit.js";
import { addVaultItem, getUserVaultItems, updateUserVaultItem, exportVault, importVault, shareVaultController, deleteVaultItem, getVaultItemById } from "../controllers/vaultController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateVaultItem, validateVaultItemId } from "../validators/vaultValidator.js";
import multer from "multer";



const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // configure multer to save files in 'uploads' directory

// router to handle vault item routes

router.post("/items", authenticate, validateVaultItem, addVaultItem);

router.get("/items", authenticate, getUserVaultItems);

router.get("/items/:id",authenticate, validateVaultItemId, getVaultItemById);

router.put("/items/:id", authenticate, validateVaultItemId, validateVaultItem, updateUserVaultItem);

router.get("/export", authenticate, exportVault);

router.post("/import", authenticate, upload.single('file'), importVault);

router.post("/share", authenticate, shareVaultController);

router.delete("/items/:id", authenticate, validateVaultItemId, deleteVaultItem);

router.post("/test", rateLimiter, (req, res) => {
  res.send("Test route");
});

router.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


export default router;