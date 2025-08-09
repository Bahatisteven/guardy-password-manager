import Joi from "joi";

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


const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  masterPassword: Joi.string().min(8).required(),
});


export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ errors: messages });
  }
  next();
};

export const validateSignUp = validate(signUpSchema);
export const validateLogin = validate(loginSchema);