import jwt from "jsonwebtoken";
import { findUserByEmail } from "../models/User.js";
import { validateLogin } from "../validators/authValidator.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/sendEmail.js";


// middleware to authenticate JWT token

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



// middleware to authenticate login

const authenticateLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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





// middleware to send verification email


const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const token = jwt.sign({ id: user.id, email: user.email } , process.env.JWT_SECRET, { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRATION });

    const verificationUrl = `${process.env.FRONTEND_URL }/verify?token=${token}`;

    const emailContent = await sendEmail({
      to: email,
      subject: "Verify Your Email Address.",
      text: `Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\n If you did not sign up for ${process.env.APP_NAME}, please ignore this email.\n\n This is an automated message, Please do not reply.\n\n Thanks!`,
      html: `<p>Please verify your email address by clicking the link below:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
    });
    
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