import express from 'express';
import { signUp, login, logout } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin, authenticate, refreshToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// router to handle auth routes

router.post("/signup", authLimiter, validateSignUp, signUp);

router.post("/login", authLimiter, validateLogin, authenticateLogin, login);

router.post("/logout", authenticate, logout);

router.post("/refresh", refreshToken );

export default router;