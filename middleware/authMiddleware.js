import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { findUserByEmail } from "../models/User.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/sendEmail.js";


// middleware to authenticate JWT token

const authenticateToken = (req, res, next) => {
  const authHeader = req.get("authorization");
  console.log("Authorization header:", authHeader);

  const token = authHeader?.split(" ")[1];
  console.log("Extracted token:", token);
  if (!token) {
    logger.error("Access token is missing or invalid");
    return res.status(401).json({ message: "Access token is missing or invalid." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    req.user_id = decoded.id;
    next();
  } catch (error) {
    logger.error("Error during token authentication:", error);
    return res.status(403).json({ message: "Invalid token or expired token." });
  }
};



// middleware to authenticate login

const authenticateLogin = async (req, res, next) => {
  try {
    //const { email, password } = req.body;
    const rawEmail = String(req.body.email).trim().toLowerCase();
    const rawPassword = String(req.body.password).trim();

    console.log("Login attempt:");
    console.log("Email:", `--${rawEmail}--`);
    console.log("Password:", `--${rawPassword}--`);


    // check if user exists
    const user = await findUserByEmail(rawEmail);//email
    if (!user) {
      logger.error("Invalid email or password at the user check");
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // check if password is correct
    console.log("Hash from DB:", `--${user.password_hash}--`);
    console.log("Hash length:", user.password_hash.length);


    console.log(rawPassword, user.password_hash);
    
    // check if password is correct
    let isPasswordValid = await argon2.verify(user.password_hash, rawPassword);
    console.log("Password verification result test:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("Password verification failed");
      logger.error("Invalid email or password at the isPasswordValid check");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // set user_id in request
    req.user_id = user.id;
    console.log("user authenticated successfully");
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

export { authenticateToken, authenticateLogin, sendVerificationEmail };