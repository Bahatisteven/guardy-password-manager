import { createVaultItem, getVaultItemByNameAndType, deleteVaultItemById, getFilteredVaultItems, getTotalFilteredVaultItems, updateVaultItem, shareVault  } from "../models/VaultItem.js";
import logger  from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";
import fs from "fs/promises"

// add vault item
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



// get user vault items
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


// update vault item 
const updateUserVaultItem = async (req, res) => {
  try {
    if (!req.body) {
      logger.error("Request body is missing.");
      return res.status(400).json({ message: "Request body is missing." });
    }

    const userId = req.user_id;
    const itemId = req.params.id;
    const { name, username, password, uri, notes, favorite } = req.body;

    if (!name || !username) {
      logger.error("Missing required fields for update.");
      return res.status(400).json({ message: "Missing required fields." });
    }

    logger.info("Updating vault item:", { userId, itemId, name, username, password, uri, notes, favorite });

    // update the item in the database
    const result = await updateVaultItem(userId, itemId, name, username, password, uri, notes, favorite);

    if (!result || result.rows.length === 0) {
      logger.warn(`Vault item not found or not authorized for user ${userId}, item ${itemId}`);
      return res.status(404).json({ message: "Vault item not found or not authorized." });
    }

    logger.info(`Vault item ${itemId} updated successfully for user ${userId}.`);
    res.json({ message: "Vault item updated successfully.", item: result.rows[0] });
  } catch (error) {
    logger.error("Error updating vault item:", error);
    res.status(500).json({ message: "Failed to update vault item." });
  }
};

// delete vault item
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


// export vault controller
const exportVault = async (req, res) => {
  // authentiating the user 
  const userId = req.user_id; 
  if (!userId) {
    logger.error("User ID is missing in the request. Ensure the user is authenticated.");
    return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
  }
  try {
    const vaultItems = await getAllVaultItemsForUser(userId);
    if (!vaultItems || vaultItems.length === 0) {
      logger.info(`No vault items found for user ${userId}.`);
      return res.status(404).json({ message: "No vault items found." });
    }

    // convert vault items to JSON format
    const jsonData = JSON.stringify(vaultItems, null, 2);

    // set headers for file download
    res.setHeader("Content-Disposition", `attachment; filename=vault_${userId}.json`);
    res.setHeader("Content-Type", "application/json");

    // send the JSON data as a response
    res.status(200).send(jsonData);
  } catch (error) {
    logger.error("Error exporting vault items:", error.message);
    res.status(500).json({ message: "An error occurred while exporting the vault items." });
  }
};


// share vault controller
const shareVaultController = async (req, res) => {
  const userId = req.user_id;
  const { itemId, recipientEmail, accessLevel } = req.body;
  try {
    // sharing the vault item
    const sharedItem = await shareVault(userId, itemId, recipientEmail, accessLevel);
    if (!sharedItem) {
      logger.error(`Failed to share vault item with ID ${itemId} for user ${recipientEmail}`);
      return res.status(400).json({ message: "Failed to share vault item." });
    }
    res.status(200).json({ message: "Vault item shared successfully.", sharedItem });
  } catch (error) {
    logger.error("Error sharing vault item:", error.message);
    res.status(400).json({ message: "An error occurred while sharing the vault item." });
  }
};



// import vault controller
const importVault = async (req, res) => {
  const userId = req.user_id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized. Please log in and try again." });
  }
  try {
    // i assume file is uploaded as req.file 
    const fileContent = await fs.readFile(req.file.path, "utf-8");
    const items = JSON.parse(fileContent);

    // insert each item 
    for (const item of items) {
      // await to create vault item
      await createVaultItem(userId, item.name, item.type, item.data);
    }
    await fs.unlink(req.file.path); // clean up uploaded file
    res.status(200).json({ message: "Vault imported successfully." });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while importing the vault items." });
  }
};


export { addVaultItem, getUserVaultItems, deleteVaultItem, updateUserVaultItem, exportVault, importVault, shareVaultController };
