import Joi from "joi";


const validateVaultItem = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid("password", "note", "card").optional().messages({
    "any.only": "Type must be one of the following: password, note, card"
  }),
  data: Joi.string(),
  descrption: Joi.string().max(500).optional().messages({
    "string.max": "Description must be at most 500 characters long",
  }),
});

const validateVaultItemId = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.name": "Invalid vault item ID format",
  }),
});




export { validateVaultItem, validateVaultItemId };