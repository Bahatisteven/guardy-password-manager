import { createVaultItem, getVaultItemByNameAndType, deleteVaultItemById, getFilteredVaultItems, getTotalFilteredVaultItems } from "../models/VaultItem.js";
import logger  from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";

const addVaultItem = async (req, res) => {
  try {
    const userId = req.user_id;

    if (!userId) {
      logger.error("User ID is missing in the request.");
      return res.status(400).json({ message: "User ID is missing. Please log in and try again." });
    }

    const { name, type, data } = req.body;
  
    // check if the vault item alredy exists
    
    const existingVaultItem = await getVaultItemByNameAndType(userId, name, type);
    if (existingVaultItem) {
      logger.error(`Vault item with name ${name} and type ${type} already exists for user $ {userId}.`);
      console.log("Existing item details:", existingVaultItem);
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
    if (error.code === DB_ERRORS.VAULT_ALREADY_EXISTS) {
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



const getUserVaultItems = async (req, res) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
    }

    // pagination support 

    const { search, type, page= 1, limit = 10 } = req.query;

    if (page < 1 || limit < 1 ) {
      logger.error("Invalid pagination paramaters.");
      return res.status(400).json({ message: "Page and limit must be positive integers." });
    }

    const offset = (page - 1) * limit;

    const vaultItems = await getFilteredVaultItems(userId,search,type, limit, offset);
    const totalItems = await getTotalFilteredVaultItems(userId, search, type);
    const totalPages = Math.ceil(totalItems / limit);

    if (vaultItems.length === 0) {
      logger.info(`No vault items found for user ${userId}.`);
      return res.status(404).json({ message: "No vault items found.", vaultItems: [] });
    }

    logger.info(`Vault items retrieved successfully for user ${userId}.`);

    return res.status(200).json({
      message: "Vault items retrieved successfully.",
        vaultItems,
        pagination: {
          currentPage: parseInt(page, 10),
          pageSize: parseInt(limit, 10),
          totalItems,
          totalPages
        }
    });
  } catch (error) {
    logger.error("Error retrieving vault items:", error.message);
    res.status(500).json({ message: "An error occurred while retrieving the vault items." });
  }
};


const deleteVaultItem = async (req, res) => {
  try {
    const userId = req.user_id;
    const { id } = req.params;

    if (!userId) {
      logger.error("User ID is missing in the request. Ensure the user is authenticated.");
      return res.status(401).json({ message: "Unauthorized. Please log in and try again."});
    }

    const result = await deleteVaultItemById(userId, id);

    if (!result) {
      logger.error(`Failed to delete vault item with ID ${id} for user ${userId}.`);
      return res.status(404).json({ message: "Failed to delete vault item. Item not found"});
    }

    logger.info(`Vault item with ID ${id} deleted successfully for user ${userId}.`);
    return res.status(200).json({ message: "Vault item deleted successfully."});
  } catch (error) {
    logger.error("Error deleting vault item:", error.message);
    res.status(500).json({ message: "An error occurred while deleting the vault item."});
  }
};


export { addVaultItem, getUserVaultItems, deleteVaultItem };
