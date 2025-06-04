import express from "express";
import authRoutes from "./authRoutes.js";
import vaultRoutes from "./vaultRoutes.js";
 
const router = express.Router();

// router to handle auth and vault routes

router.use("/auth", authRoutes);
router.use("/vault", vaultRoutes);

export default router;