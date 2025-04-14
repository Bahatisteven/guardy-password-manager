import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
};


export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });
};


export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
};


export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: parseInt(process.env.JWT_REFRESH_EXPIRATION)
};



export const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "attribute",
  maxAge: parseInt(process.env.COOKIE_EXPIRATION * 10), 
};