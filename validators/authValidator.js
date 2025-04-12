import Joi from "joi";

const signUpSchema = joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required,
});

export const validateSignUp = (data) => {
  return signUpSchema.validate(data);
};