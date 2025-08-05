import express from 'express';
import { signUp, login, logout } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin, authenticate, refreshToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// router to handle auth routes

router.post("/signup",validateSignUp, signUp, login);

router.post("/login", validateLogin, authenticateLogin, login);

router.post("/logout", authenticate, logout);

router.post("/refresh", refreshToken );

export default router;