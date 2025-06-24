import Joi from "joi";
import logger from "../utils/logger.js";

const signUpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  masterPassword: Joi.string()
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
  confirmPassword: Joi.string().valid(Joi.ref('masterPassword')).required(),
  hint: Joi.string().allow('', null),
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
  masterPassword: Joi.string().min(8).required(),
});


export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.info(`Validation on login error: ${error.details[0].message}`);
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};