import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
};


const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
};


const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
};


const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION)
};



const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: parseInt(process.env.COOKIE_EXPIRATION * 10) || 36000, 
};




export { generateToken, generateRefreshToken, verifyToken, refreshTokenCookieOptions, accessCookieOptions };