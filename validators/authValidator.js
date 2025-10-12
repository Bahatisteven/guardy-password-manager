import Joi from "joi";
import logger from "../utils/logger.js";

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  masterPassword: Joi.string()
    .min(8)
    .max(64)
    .pattern(strongPasswordPattern, { name: "strongPassword" })
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.name": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('masterPassword'))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "string.empty": "Confirm password is required",
    }),
  hint: Joi.string().max(100).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  masterPassword: Joi.string()
    .pattern(strongPasswordPattern, { name: "strongPassword" })
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.name": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

// Reusable validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    logger.warn(`Validation error: ${messages.join(', ')}`);
    return res.status(400).json({ errors: messages });
  }
  next();
};

export const validateSignUp = validate(signUpSchema);
export const validateLogin = validate(loginSchema);