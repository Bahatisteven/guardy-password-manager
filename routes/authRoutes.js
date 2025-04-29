import express from 'express';
import { signUp, login, logout } from '../controllers/authController.js';
import { validateSignUp, validateLogin } from '../validators/authValidator.js';
import { authenticateLogin, authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// router to handle auth routes

router.post("/signup", (req, res, next) => {
  console.log("validation middleware hit");
  next();
}, validateSignUp, (req, res, next) => {
  console.log("signup handler hit");
  next();
}, signUp);

router.post("/login", validateLogin,(req, res, next) => {
  console.log("validate login handler hit!");
  next();
}, authenticateLogin,(req, res, next) => {
  console.log("authenticate login handler hit!");
  next();
}, login,(req, res, next) => {
  console.log("login handler hit!");
  next();
});

router.post("/logout",authenticateToken, logout);


export default router;