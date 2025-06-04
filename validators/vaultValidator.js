import Joi from "joi";


// validate vault item schema

const validateVaultItemSchema = Joi.object({
  name: Joi.string().optional().default("Unnamed Item"),
  type: Joi.string()
    .valid("password", "note", "card")
    .required()
    .optional().messages({
      "any.only": "Type must be one of the following: password, note, card",
      "any.required": "Type is required"
    }),
  data: Joi.string(),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description must be at most 500 characters long",
  }),
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


// validate vault item middleware
const validateVaultItem = (req, res, next) => {
  const { error } = validateVaultItemSchema.validate(req.body, { abortEarly: false});

  if (error) {
    const errorMessages = error.details.map((details) => ({
      message: details.message,
      path: details.path.join("."),
      type: details.type,
    }));
    console.error("Validation error:", errorMessages);
    return res.status(400).json({ message: "Validation failed.", errors: errorMessages });
  }
  next();
};


// validate vault item id middleware
const validateVaultItemId = (req, res, next) => {
  const { error } = validateVaultItemIdSchema.validate(req.params, { abortEarly: false });

  if (error) {
   const errorMessages = error.details.map((details) => ({
      message: details.message,
      path: details.path.join("."),
      type: details.type
   }));
   return res.status(400).json({ message: errorMessages });
  }
  next();
};

export { validateVaultItem, validateVaultItemId };