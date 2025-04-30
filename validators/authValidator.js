import Joi from "joi";
import logger from "../utils/logger.js";

const signUpSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.empty": "Username is required",
    "string.base": "Username must be a string",
    "string.pattern.name": "Username must contain only alphanumeric characters",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must be at most 30 characters long",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string()
  .min(4)
  .max(64)
  .pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/), 
  { name: "strongPassword" })
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.name": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  }),
});

export const validateSignUp = (req, res, next) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);// return all error msg as an array
    logger.warn(`Validation error: ${messages.join(', ')}`);
    return res.status(400).json({ errors: messages  }); 
  }

  next();
};


const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});


export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.info(`Validation on login error: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};