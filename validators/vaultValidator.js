import Joi from "joi";


const validateVaultSchema = Joi.object({
  name: Joi.string(),
  type: Joi.string().valid("password", "note", "card").required().messages({
    "any.only": "Type must be one of the following: password, note, card"
  }),
  data: Joi.string()
});

export { validateVaultSchema };