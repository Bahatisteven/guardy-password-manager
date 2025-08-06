import { createUser, findUserByEmail, findUserById } from "../models/User.js";
import { generateToken, generateRefreshToken, refreshTokenCookieOptions, accessCookieOptions } from "../utils/jwt.js";
import argon2 from "argon2";
import logger from "../utils/logger.js";


// signUp function to create a new user and generate tokens

const signUp = async (req, res) => {
  try {
    const { email, masterPassword, hint } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: "User with this email already exists." });

    const passwordHash = await argon2.hash(masterPassword);
    const user = await createUser(email, passwordHash, hint, { firstName, lastName }); // adapt to your createUser signature

    const token = generateToken({ id: user.id, email: user.email, name: user.first_name || user.name });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (err) {
    logger.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed." });
  }
};


// login function to authenticate the user and generate tokens

const login = async (req, res) => {
  try {
    const { email, masterPassword } = req.body;

    // find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      logger.error("User not found during login");
      return res.status(404).json({ message: "Invalid email or password." });
    }

    // verify password
    const isPasswordValid = await argon2.verify(user.password_hash, masterPassword);
    if (!isPasswordValid) {
      logger.error("Invalid password during login");
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // generate tokens
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    // set the tokens in cookies 
    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;

    logger.info(`User ${user.email} logged in successfully.`);
    res.status(200).json({ user: safeUser });
  } catch(error) {
    logger.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login." });
  }
};


// logout function to clear cookies and invalidate the session

const logout = async (req, res) => {
  try {

    const userId = req.user_id;

    const user = await findUserById(userId);

    if (!user) {
      logger.error("User not found during logout");
      return res.status(404).json({ message: "User not found."});
    }

    // clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    logger.info("User logged out successfully.");
    res.status(200).json({ message: "Logged out successfully." });

  } catch (error) {
    logger.error("Error during logout:", error);
    res.status(500).json({ message: "An error occurred during logout." });
  }
};



export { signUp, login, logout };
