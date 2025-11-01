import express from 'express';
import { signUp, login, logout, me, setup2FA, enable2FA, disable2FA, verify2FA } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin, authenticate, refreshToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimit.js';


const router = express.Router();

// router to handle auth routes

router.post("/signup", authLimiter, validateSignUp, signUp);

router.post("/login", authLimiter, validateLogin, authenticateLogin, login);

router.post("/logout", authenticate, logout);

router.get("/me", authenticate, me);

router.post("/2fa/setup", authenticate, setup2FA);
router.post("/2fa/enable", authenticate, enable2FA);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/verify", authLimiter, verify2FA);

export default router;