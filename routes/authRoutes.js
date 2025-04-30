import express from 'express';
import { signUp, login, logout } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin, authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// router to handle auth routes

router.post("/signup",validateSignUp, signUp);

router.post("/login", validateLogin, authenticateLogin, login);

router.post("/logout",authenticateToken, logout);


export default router;