import Joi from "joi";

/**
 * Middleware to validate user profile update data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const validateUpdateUserProfile = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    hint: Joi.string().max(100).allow('', null),
  }).min(1); // Require at least one field to be present

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};