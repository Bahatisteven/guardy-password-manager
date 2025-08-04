import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const accessCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60, // 1h
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
};

const generateToken = (payload) => {
  return jwt.sign(
    { id: payload.id, email: payload.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(
    { id: payload.id, email: payload.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );
};

export {
  generateToken,
  generateRefreshToken,
  accessCookieOptions,
  refreshTokenCookieOptions,
};
