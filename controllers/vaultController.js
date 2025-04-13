import { createVaultItem } from "../models/VaultItem.js";
import { validateVaultSchema } from "../validators/vaultValidator.js";
import { logger } from "../utils/logger.js";
const addVaultItem = async (req, res) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      logger.error("User ID is missing in the request.");
      return res.status(400).json({ message: "User ID is missing." });
    }

    const { name, type, data } = req.body;

    const { error } = validateVaultSchema(req.body);
    if (error) {
      logger.error("Validation error:", error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }
  
    const vaultItem = await createVaultItem (userId, name, type, data);    
    if (!vaultItem) {
      logger.error(`Failed to create vault item for user ${userId}.`);
      return res.status(500).json({ message: "Failed to create vault item." });
    } else {
      logger.info(`Vault item created successfully for user ${userId}.`);
    }
    res.status(201).json({ vaultItem });
  } catch (error) {
    if (error.code === "23505") {
      logger.error("Vault item already exists:", error.detail);
      return res.status(409).json({ message: "Vault item already exists." });
    }
    logger.error("Error creating vault item:", error);
    res.status(500).json({ message: "An error occurred while creating the vault item." });
  }
};


export { addVaultItem };
