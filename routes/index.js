import express from "express";
import authRoutes from "./authRoutes.js";
import vaultRoutes from "./vaultRoutes.js";
import userRoutes from "./userRoutes.js";
 
const router = express.Router();

// router to handle auth and vault routes

router.use("/auth", authRoutes);
router.use("/vault", vaultRoutes);
router.use("/user",userRoutes);

export default router;