import { createUser, findUserByEmail } from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import argon2 from "argon2";
import { validateSignUp } from "../validators/authValidator.js";
import logger from "../utils/logger.js";
import { accessCookieOptions } from "../utils/jwt.js";
import { generateRefreshToken } from "../utils/jwt.js";
import { refreshTokenCookieOptions } from "../utils/jwt.js";


// signUp function to create a new user and generate tokens

const signUp = async (req, res) => {
  try {
    const { error } = validateSignUp(req.body);
    if (error) {
      return res.status(400).json({ messsage: error.details[0].message });
    }

    const {username, email, password} = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({message: "A user with this email already exists."});
    }
    const passwordHash = await argon2.hash(password);
    
    const user = await createUser(username, email, passwordHash);

    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({id: user.id, email: user.email});

    res.cookie("token", token, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    logger.info(`User ${email} signed up successfully.`);
    res.status(201).json({ user: safeUser });
  } catch (error) {
    logger.error("Error during signup:", error);
    res.status(500).json({message: "An error occurred during signup."})
  }
};


// login function to authenticate the user and generate tokens

const login = async (req, res) => {
  try {
    const userId = req.user_id;
    const user = await findUserById(userId);
    
    const token = generateToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

    res.cookie("token", token, cookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    const { password_hash, ...safeUser } = user;
    logger.info(`User ${email} logged in successfully.`);
    res.status(200).json({ user: safeUser });
  } catch(error) {
    logger.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login." });
  }
};


// logout function to clear cookies and invalidate the session

const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    logger.info("User logged out successfully.");
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    logger.error("Error during logout:", error);
    res.status(500).json({ message: "An error occurred during logout." });
  }
};



// middleware to refresh the access token using the refresh token

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is missing."});
    }
        
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





export { signUp, login, logout, refreshToken };
