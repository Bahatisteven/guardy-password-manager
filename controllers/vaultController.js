import { createVaultItem, getVaultItemByNameAndType, deleteVaultItemById, getFilteredVaultItems, getTotalFilteredVaultItems, updateVaultItem, shareVault  } from "../models/VaultItem.js";
import logger  from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";
import fs from "fs/promises"

// add vault item
const addVaultItem = async (req, res, next) => {
  try {
    const userId = req.user_id;

    if (!userId) {
      throw new Error("User ID is missing in the request.");
    }

    const { name, type, password, data } = req.body;
  
    // check if the vault item alredy exists
    
    const existingVaultItem = await getVaultItemByNameAndType(userId, name, type);
    if (existingVaultItem) {
      return res.status(409).json({ message: "Vault item already exists."});
    }
    
    // create the vault item

    const vaultItem = await createVaultItem (userId, name, type, password, data);    
    if (!vaultItem) {
      return res.status(500).json({ message: "Failed to create vault item." });
    } 

    // remove sensitive data from the response
    
    const { data: encryptedData, ...safeVaultItem } = vaultItem;
    logger.info(`Vault item created successfully for user ${userId}.`);
    return res.status(201).json({ message: "Vault item created successfully.", vaultItem: safeVaultItem });

  } catch (error) {
    next(error);
  }
};



// get user vault items
const getUserVaultItems = async (req, res, next) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      throw new Error("Unauthorized. Please log in and try again.");
    }

    // pagination support 

    const { search, type, page= 1, limit = 10 } = req.query;

    if (page < 1 || limit < 1 ) {
      return res.status(400).json({ message: "Page and limit must be positive integers." });
    }

    const offset = (page - 1) * limit;

    const vaultItems = await getFilteredVaultItems(userId,search,type, limit, offset);
    const totalItems = await getTotalFilteredVaultItems(userId, search, type);
    const totalPages = Math.ceil(totalItems / limit);

    if (vaultItems.length === 0) {
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
    next(error);
  }
};


// update vault item 
const updateUserVaultItem = async (req, res, next) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing." });
    }

    const userId = req.user_id;
    const itemId = req.params.id;
    const { name, type, password, ...data } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    logger.info("Updating vault item:", { userId, itemId, name, type, password, data });

    // update the item in the database
    const result = await updateVaultItem(userId, itemId, name, type, password, data);

    if (!result || result.rows.length === 0) {
      throw new Error("Vault item not found or not authorized.");
    }

    logger.info(`Vault item ${itemId} updated successfully for user ${userId}.`);
    res.json({ message: "Vault item updated successfully.", item: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// delete vault item
const deleteVaultItem = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const { id } = req.params;

    if (!userId) {
      throw new Error("Unauthorized. Please log in and try again.");
    }

    const result = await deleteVaultItemById(userId, id);

    if (!result) {
      return res.status(404).json({ message: "Failed to delete vault item. Item not found"});
    }

    logger.info(`Vault item with ID ${id} deleted successfully for user ${userId}.`);
    return res.status(200).json({ message: "Vault item deleted successfully."});
  } catch (error) {
    next(error);
  }
};


// export vault controller
const exportVault = async (req, res, next) => {
  // authentiating the user 
  const userId = req.user_id; 
  if (!userId) {
    throw new Error("Unauthorized. Please log in and try again.");
  }
  try {
    const vaultItems = await getAllVaultItemsForUser(userId);
    if (!vaultItems || vaultItems.length === 0) {
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
    next(error);
  }
};


// share vault controller
const shareVaultController = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const { itemId, recipientEmail, accessLevel } = req.body;
    // sharing the vault item
    const sharedItem = await shareVault(userId, itemId, recipientEmail, accessLevel);
    if (!sharedItem) {
      return res.status(400).json({ message: "Failed to share vault item." });
    }
    res.status(200).json({ message: "Vault item shared successfully.", sharedItem });
  } catch (error) {
    next(error);
  }
};



// import vault controller
const importVault = async (req, res, next) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      throw new Error("Unauthorized. Please log in and try again.");
    }
    // i assume file is uploaded as req.file 
    const fileContent = await fs.readFile(req.file.path, "utf-8");
    const items = JSON.parse(fileContent);

    // insert each item 
    for (const item of items) {
      // await to create vault item
      await createVaultItem(userId, item.name, item.type, item.password, item.data);
    }
    await fs.unlink(req.file.path); // clean up uploaded file
    res.status(200).json({ message: "Vault imported successfully." });
  } catch (error) {
    next(error);
  }
};


export { addVaultItem, getUserVaultItems, deleteVaultItem, updateUserVaultItem, exportVault, importVault, shareVaultController };
