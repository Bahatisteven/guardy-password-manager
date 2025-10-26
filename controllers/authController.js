import { createUser, findUserByEmail, findUserById } from "../models/User.js";
import { generateToken, generateRefreshToken, refreshTokenCookieOptions, accessCookieOptions } from "../utils/jwt.js";
import argon2 from "argon2";
import logger from "../utils/logger.js";
import { AuthenticationError, ValidationError, AppError } from "../utils/errors.js";


/**
 * Handles user registration, creates a new user, and generates authentication tokens.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response with the new user and tokens in cookies.
 */
const signUp = async (req, res, next) => {
  try {
    const { email, masterPassword, hint, firstName, lastName } = req.body;

    const passwordHash = await argon2.hash(masterPassword);
    const user = await createUser(email, passwordHash, hint, firstName, lastName);

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (err) {
    if (err.code === '23505') { // Handle unique constraint violation
      return next(new AppError("User with this email already exists.", 409));
    }
    next(err);
  }
};


// login function to authenticate the user and generate tokens

/**
 * Authenticates a user and generates access and refresh tokens.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response with user data and tokens in cookies.
 */
const login = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn(`Login failed: User with email ${email} not found.`);
      return next(new AuthenticationError("Invalid credentials."));
    }

    const isValid = await argon2.verify(user.password_hash, masterPassword);
    if (!isValid) {
      logger.warn(`Login failed: Invalid password for user with email ${email}.`);
      return next(new AuthenticationError("Invalid credentials."));
    }

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    logger.error("Login error:", err);
    next(err);
  }
};


/**
 * Logs out a user by clearing authentication cookies.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response indicating successful logout.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    logger.error("Logout error:", err);
    next(err);
  }
};


export { signUp, login, logout, me };
