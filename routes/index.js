import express from "express";
import { authRoutes } from "./authRoutes";
import { vaultRoutes } from "./vaultRoutes";

const router = express.Router();

router.use("/auth", authRoutes());
router.use("/vault", vaultRoutes());

export { router };