import Joi from "joi";

export const validateUpdateUserProfile = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),
  }).min(1); // Require at least one field to be present

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};