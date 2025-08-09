import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { findUserByEmail } from "../models/User.js";
import { generateToken, accessCookieOptions } from "../utils/jwt.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/sendEmail.js";


// middleware to authenticate JWT token

 const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required: token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.first_name || user.name || "", // adapt field names
    };

    next();
  } catch (err) {
    logger.warn("Authentication failed:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
};



// middleware to refresh the access token

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is missing."});
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
    res.status(403).json({ message: "Invalid or expired refresh token." });
  }
};


// middleware to authenticate login

const authenticateLogin = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;
    
    // check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      logger.error("Invalid email or password at the user check");
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // check if password is correct
    const isPasswordValid = await argon2.verify(user.password_hash, masterPassword);

    if (!isPasswordValid) {
      logger.error("Invalid email or password at the isPasswordValid check");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // set user_id in request
    req.user_id = user.id;
    next();
    
  } catch (error) {
    logger.error("Error during login authentication:", error);
    return res.status(500).json({ message: "An error occurred during login authentication." });
  }
};


// middleware to send verification email

const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // generate verification token
    const token = jwt.sign({ id: user.id, email: user.email } , process.env.JWT_SECRET, { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRATION });

    const verificationUrl = `${process.env.FRONTEND_URL }/verify?token=${token}`;

    // send verification email
    const emailContent = await sendEmail({
      to: email,
      subject: "Verify Your Email Address.",
      text: `Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\n If you did not sign up for ${process.env.APP_NAME}, please ignore this email.\n\n This is an automated message, Please do not reply.\n\n Thanks!`,
      html: `<p>Please verify your email address by clicking the link below:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });
    
    // check if email sent
    const emailSent = await sendEmail({ emailContent });
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email." });
    }

    logger.info(`Verification email sent to ${email}`);
    res.status(200).json({ message: "Verification email sent successfully." });
  } catch (error) {
    logger.error("Error sending verification email:", error);
    return res.status(500).json({ message: "An error occurred while sending verification email." });
  }
};

export { authenticate, refreshToken, authenticateLogin, sendVerificationEmail };