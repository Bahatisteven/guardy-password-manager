import Joi from "joi";
import jwt from "jsonwebtoken";

const signUpSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required,
});

export const validateSignUp = (data) => {
  return signUpSchema.validate(data);
};



const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const { error } = loginSchema.validate(req.body);
if (error) {
  return res.status(400).json({ message: error.details[0].message });
}






const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split("")[1];
  if (!token) return res.status(401).json({ message: "Access token is missing or invalid." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token or expired token." });
  }
};

export { authenticateToken };