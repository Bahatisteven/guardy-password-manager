import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

// generate a token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
};


// generate a refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
};

// verify a token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
};

// cookie options for refresh token and access token
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION)
};


// cookie options for access token
const accessCookieOptions = {
  httpOnly: true,
  //secure: true,
  sameSite: "lax",
  maxAge: parseInt(process.env.COOKIE_EXPIRATION * 10) || 36000, 
};




export { generateToken, generateRefreshToken, verifyToken, refreshTokenCookieOptions, accessCookieOptions };