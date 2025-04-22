import express from 'express';
import { signUp, login, logout } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin } from '../middleware/authMiddleware.js';

const router = express.Router();

// router to handle auth routes

router.post("/signup", (req, res, next) => {
  console.log("validation middleware hit");
  next();
}, validateSignUp, (req, res, next) => {
  console.log("signup handler hit");
  next();
}, signUp);
router.post("/login", validateLogin, authenticateLogin, login);
router.post("/logout", logout);


export default router;