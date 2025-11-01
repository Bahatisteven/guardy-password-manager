import { createUser, findUserByEmail, findUserById, updateTwoFactorSecret } from "../models/User.js";
import { generateToken, generateRefreshToken, refreshTokenCookieOptions, accessCookieOptions } from "../utils/jwt.js";
import argon2 from "argon2";
import logger from "../utils/logger.js";
import { AuthenticationError, ValidationError, AppError } from "../utils/errors.js";
import { generateTwoFactorSecret, verifyTwoFactorToken } from "../utils/twoFactorAuth.js";
import { deriveKey, generateSalt } from "../utils/pbkdf.js";

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

    // Derive the encryption key from the master password
    const salt = generateSalt();
    const encryptionKey = await deriveKey(masterPassword, salt);

    // For simplicity, we'll store the key directly. In a real app, you'd encrypt this key with another key (e.g., a key managed by a KMS).
    // We'll convert the buffer to a hex string for storage.
    const encryptedMasterKey = encryptionKey.toString('hex');
    const masterKeySalt = salt.toString('hex');


    const user = await createUser(email, passwordHash, hint, firstName, lastName, encryptedMasterKey, masterKeySalt);

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

    // Verify the master key
    const salt = Buffer.from(user.master_key_salt, 'hex');
    const derivedKey = await deriveKey(masterPassword, salt);

    if (derivedKey.toString('hex') !== user.encrypted_master_key) {
      logger.warn(`Login failed: Invalid master key for user with email ${email}.`);
      return next(new AuthenticationError("Invalid credentials."));
    }

    if (user.two_factor_secret) {
      // If 2FA is enabled, prompt for 2FA token
      return res.status(200).json({ requires2FA: true, email: user.email });
    }

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, two_factor_secret, encrypted_master_key, master_key_salt, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    logger.error("Login error:", err);
    next(err);
  }
};

/**
 * Verifies a 2FA token during the login process.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response with user data and tokens in cookies if 2FA is successful.
 */
const verify2FA = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    const user = await findUserByEmail(email);
    if (!user || !user.two_factor_secret) {
      return next(new AuthenticationError("2FA not enabled for this user."));
    }

    if (!verifyTwoFactorToken(user.two_factor_secret, token)) {
      return next(new AuthenticationError("Invalid 2FA token."));
    }

    const jwtToken = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", jwtToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, two_factor_secret, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    logger.error("2FA verification error:", err);
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

const me = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return next(new NotFoundError("User not found."));
    }
    const { password_hash, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (err) {
    logger.error("Error fetching user profile:", err);
    next(err);
  }
};

const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const { secret, otpauthUrl, qrcodeDataUrl } = await generateTwoFactorSecret(userEmail);

    // Temporarily store the secret in the session or a cache, not directly in the DB yet
    // The user must confirm with a token before saving it permanently
    req.session.twoFactorSecret = secret; // session middleware is used

    res.status(200).json({ secret, otpauthUrl, qrcodeDataUrl });
  } catch (err) {
    logger.error("Error setting up 2FA:", err);
    next(new AppError("Failed to setup 2FA.", 500));
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    const tempSecret = req.session.twoFactorSecret; // Retrieve temporary secret

    if (!tempSecret) {
      return next(new ValidationError("2FA setup not initiated or session expired."));
    }

    if (!verifyTwoFactorToken(tempSecret, token)) {
      return next(new AuthenticationError("Invalid 2FA token."));
    }

    await updateTwoFactorSecret(userId, tempSecret);
    delete req.session.twoFactorSecret; // Clear temporary secret

    res.status(200).json({ message: "2FA enabled successfully." });
  } catch (err) {
    logger.error("Error enabling 2FA:", err);
    next(new AppError("Failed to enable 2FA.", 500));
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await updateTwoFactorSecret(userId, null); // Clear the 2FA secret in the database

    res.status(200).json({ message: "2FA disabled successfully." });
  } catch (err) {
    logger.error("Error disabling 2FA:", err);
    next(new AppError("Failed to disable 2FA.", 500));
  }
};


export { signUp, login, logout, me, setup2FA, enable2FA, disable2FA, verify2FA };
