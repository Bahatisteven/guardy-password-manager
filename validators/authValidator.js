import Joi from "joi";

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
  password: Joi.string().min(8).pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.name": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  }),
});

export const validateSignUp = (data) => {
  const { error } = signUpSchema.validate(data, { abortEarly: false });
  if (error) {
    return { error: error.details.map((detail) => detail.message) }; // return all error msg as an array
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
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};