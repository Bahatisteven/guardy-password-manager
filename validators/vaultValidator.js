import Joi from "joi";


// validate vault item schema
const validateVaultItemSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid("password", "note", "card").optional().messages({
    "any.only": "Type must be one of the following: password, note, card"
  }),
  data: Joi.string(),
  descrption: Joi.string().max(500).optional().messages({
    "string.max": "Description must be at most 500 characters long",
  }),
});

// validate vault item id schema
const validateVaultItemIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.name": "Invalid vault item ID format",
  }),
});


// validate vault item middleware
const validateVaultItem = (req, res, next) => {
  const { error } = validateVaultItemSchema.validate(req.body, { abortEarly: false});
  if (error) {
    return res.status(400).json({ message: error.details[0].map((details) => details.message) });
  }
  next();
};


// validate vault item id middleware
const validateVaultItemId = (req, res, next) => {
  const { error } = validateVaultItemIdSchema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details[0].map((details) => details.message) });
  }
  next();
};

export { validateVaultItem, validateVaultItemId };