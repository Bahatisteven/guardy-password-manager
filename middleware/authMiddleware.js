import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { findUserByEmail, findUserById } from "../models/User.js";
import { generateToken, accessCookieOptions } from "../utils/jwt.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/sendEmail.js";
import { AuthenticationError, NotFoundError, AppError } from "../utils/errors.js";


/**
 * Middleware to authenticate JWT token from Authorization header or cookies.
 * Populates `req.user` with authenticated user's information.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Calls next() if authentication is successful, otherwise throws an AuthenticationError.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided.');
      return next(new AuthenticationError("Authentication required: token missing."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      logger.warn(`Authentication failed: User with id ${decoded.id} not found.`);
      return next(new AuthenticationError("User not found."));
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.first_name || user.name || "", // adapt field names
    };

    logger.info(`User ${req.user.id} authenticated successfully.`);
    next();
  } catch (err) {
    logger.warn("Authentication failed:", err.message);
    next(err);
  }
};



/**
 * Middleware to refresh the access token using a refresh token from cookies.
 * Sets a new access token in a cookie.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response indicating successful token refresh.
 */
const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AuthenticationError("Refresh token is missing."));
    }
     
    // verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // set the new access token in a cookie
    const token = generateToken({ id: decoded.id, email: decoded.email });

    res.cookie("token", token, accessCookieOptions);

    logger.info("Access token refreshed successfully.");
    res.status(200).json({ message: "Access token refreshed successfully." });
    
  } catch (error) {
    logger.error("Error during token refresh:", error);
    next(new AuthenticationError("Invalid or expired refresh token."));
  }
};


/**
 * Middleware to authenticate user login credentials (email and master password).
 * Populates `req.user_id` with the authenticated user's ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} Calls next() if authentication is successful, otherwise throws an AuthenticationError or AppError.
 */
const authenticateLogin = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;
    
    // check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      logger.error("Invalid email or password at the user check");
      return next(new AuthenticationError("Invalid email or password."));
    }

    // check if password is correct
    const isPasswordValid = await argon2.verify(user.password_hash, masterPassword);

    if (!isPasswordValid) {
      logger.error("Invalid email or password at the isPasswordValid check");
      return next(new AuthenticationError("Invalid email or password"));
    }

    // set user_id in request
    req.user_id = user.id;
    next();
    
  } catch (error) {
    logger.error("Error during login authentication:", error);
    return next(new AppError("An error occurred during login authentication.", 500));
  }
};


/**
 * Middleware to send a verification email to a user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response indicating successful email sending.
 */
const sendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return next(new NotFoundError("User not found."));
    }

    // generate verification token
    const token = jwt.sign({ id: user.id, email: user.email } , process.env.JWT_SECRET, { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRATION });

    const verificationUrl = `${process.env.FRONTEND_URL }/verify?token=${token}`;

    // send verification email
    await sendEmail({
      to: email,
      subject: "Verify Your Email Address.",
      text: `Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\n If you did not sign up for ${process.env.APP_NAME}, please ignore this email.\n\n This is an automated message, Please do not reply.\n\n Thanks!`,
      html: `<p>Please verify your email address by clicking the link below:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });

    logger.info(`Verification email sent to ${email}`);
    res.status(200).json({ message: "Verification email sent successfully." });
  } catch (error) {
    logger.error("Error sending verification email:", error);
    return next(new AppError("An error occurred while sending verification email.", 500));
  }
};

export { refreshToken, authenticateLogin, sendVerificationEmail };