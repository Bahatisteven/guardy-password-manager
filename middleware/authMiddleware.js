import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { findUserByEmail } from "../models/User";
import { validateLogin } from "../validators/authValidator";
import logger from "../utils/logger";



const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split("")[1];
  if (!token) return res.status(401).json({ message: "Access token is missing or invalid." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token or expired token." });
  }
};





const authenticateLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await user.argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.user_id = user.id;
    next();
    
  } catch (error) {
    logger.error("Error during login authentication:", error);
    return res.status(500).json({ message: "An error occurred during login authentication." });
  }
};




export { authenticateToken, authenticateLogin };