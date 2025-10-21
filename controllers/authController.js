import { createUser, findUserByEmail, findUserById } from "../models/User.js";
import { generateToken, generateRefreshToken, refreshTokenCookieOptions, accessCookieOptions } from "../utils/jwt.js";
import argon2 from "argon2";
import logger from "../utils/logger.js";


// signUp function to create a new user and generate tokens

const signUp = async (req, res, next) => {
  try {
    const { email, masterPassword, hint, firstName, lastName } = req.body;

    const passwordHash = await argon2.hash(masterPassword);
    const user = await createUser(email, passwordHash, hint, { firstName, lastName }); // adapt to your createUser signature

    const token = generateToken({ id: user.id, email: user.email, name: user.first_name || user.name });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (err) {
    if (err.code === '23505') { // Handle unique constraint violation
      return res.status(409).json({ message: "User with this email already exists." });
    }
    next(err);
  }
};


// login function to authenticate the user and generate tokens

/**
 * login function to authenticate the user and generate tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const login = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn(`Login failed: User with email ${email} not found.`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await argon2.verify(user.password_hash, masterPassword);
    if (!isValid) {
      logger.warn(`Login failed: Invalid password for user with email ${email}.`);
      return res.status(401).json({ message: "Invalid credentials." });
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


// logout function to clear cookies and invalidate the session
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



/**
 * me function to return authenticated user's information
 * requires authenticate middleware to have run
 */
const me = async (req, res) => {
  // retrieve user from request object
  const user = req.user;

  // check if user is authenticated
  if (!user) {
    return res.status(401).json({ message: "Not authenticated." });
  }

  // return user information
  res.status(200).json({ user });
};

export { signUp, login, logout, me };
