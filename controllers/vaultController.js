import { createVaultItem, getVaultItemsByUserId, getVaultItemByNameAndType } from "../models/VaultItem.js";
import { validateVaultItem } from "../validators/vaultValidator.js";
import logger  from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";

const addVaultItem = async (req, res) => {
  try {

    const userId = req.user_id;
    if (!userId) {
      logger.error("User ID is missing in the request.");
      return res.status(400).json({ message: "User ID is missing. Please log in and try again." });
    }

    // validate the request body
    const { error } = validateVaultItem.validate(req.body, { abortEarly: false });
    if (error) {
      logger.error("Validation error:", error.details[0].message);
      return res.status(400).json({ message: error.details[0].map((details) => details.message) });
    }

    const { name, type, data } = req.body;
  
    // check if the vault item alredy exists
    const existingVaultItem = await getVaultItemByNameAndType(userId, name, type);
    if (existingVaultItem) {
      logger.error(`Vault item with name ${name} and type ${type} already exists for user $ {userId}.`);
      return res.status(409).json({ message: "Vault item already exists."});
    }
    
    // create the vault item
    const vaultItem = await createVaultItem (userId, name, type, data);    
    if (!vaultItem) {
      logger.error(`Failed to create vault item for user ${userId}.`);
      return res.status(500).json({ message: "Failed to create vault item." });
    } 

    // remove sensitive data from the response
    const { data: encryptedData, ...safeVaultItem } = vaultItem;
    logger.info(`Vault item created successfully for user ${userId}.`);
    return res.status(201).json({ message: "Vault item created successfully.", vaultItem: safeVaultItem });

  } catch (error) {
    if (error.code === DB_ERRORS.UNIQUE_VIOLATION) {
      logger.error("Vault item already exists:", error.detail);
      return res.status(409).json({ message: "Vault item already exists." });
    }
    if (error.code === DB_ERRORS.FOREIGN_KEY_VIOLATION) {
      logger.error("Foreign key violation:", error.detail);
      return res.status(400).json({ message: "Invalid user ID." });
    }
    logger.error("Error creating vault item:", error);
    res.status(500).json({ message: "An error occurred while creating the vault item." });
  }
};



const getAllVaultItems = async (req, res) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
    }

    // pagination support 

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const vaultItems = await getVaultItemsByUserId(userId, limit, offset);
    if (!vaultItems.length === 0) {
      logger.info(`No vault items found for user ${userId}.`);
      return res.status(500).json({ message: "No vault items found.", vaultItems: [] });
    }

    logger.info(`Vault items retrieved successfully for user ${userId}.`);
    return res.status(200).json({ message: "Vault items retrieved successfully.", vaultItems, pagination: { page, limit } });
  } catch (error) {
    logger.error("Error retrieving vault items:", error);
    res.status(500).json({ message: "An error occurred while retrieving the vault items." });
  }
};

export { addVaultItem, getAllVaultItems };
