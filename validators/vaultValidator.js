import Joi from "joi";


// validate vault item schema

const validateVaultItemSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
  }),
  type: Joi.string()
    .valid("password", "note", "card")
    .required()
    .messages({
      "any.only": "Type must be one of the following: password, note, card",
      "any.required": "Type is required"
    }),
  data: Joi.string().optional().allow('', null),
  description: Joi.string().max(500).optional().allow('', null).messages({
    "string.max": "Description must be at most 500 characters long",
  }),
  password: Joi.string().optional().allow('', null), // Add password validation if needed
});

// validate vault item id schema

const validateVaultItemIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "string.base": "Vault item ID must be a number",
      "number.integer": "Vault item ID must be an integer",
      "number.positive": "Vault item ID must be a positive number",
      "any.required": "Vault item ID is required",
    }),
});

const typeMap = {
  "any.required": "required",
  "number.base": "number",
  "number.integer": "integer",
  "number.positive": "positive",
  "string.base": "string",
  "string.max": "maxLength",
  "any.only": "enum"
};

const formatErrorType = (type) => typeMap[type] || type; 


/**
 * Middleware to validate vault item data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const validateVaultItem = (req, res, next) => {
  const { error } = validateVaultItemSchema.validate(req.body, { abortEarly: false});

  if (error) {
    const errorMessages = error.details.map((details) => ({
      message: details.message,
      path: details.path.join("."),
      type: formatErrorType(details.type),
    }));
    logger.error("Validation error:", errorMessages);
    return res.status(400).json({ message: "Validation failed.", errors: errorMessages });
  }
  next();
};


/**
 * Middleware to validate vault item ID from request parameters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const validateVaultItemId = (req, res, next) => {
  const { error } = validateVaultItemIdSchema.validate(req.params, { abortEarly: false });

  if (error) {
   const errorMessages = error.details.map((details) => ({
      message: details.message,
      path: details.path.join("."),
      type: formatErrorType(details.type),
   }));
   return res.status(400).json({ message: "Validation failed.", errors: errorMessages });
  }
  next();
};

export { validateVaultItem, validateVaultItemId };