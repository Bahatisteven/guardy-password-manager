import { createVaultItem, getVaultItemByNameAndType, deleteVaultItemById, getFilteredVaultItems, getTotalFilteredVaultItems, updateVaultItem, shareVault, getVaultItemsByUserId, findVaultItemById  } from "../models/VaultItem.js";
import logger  from "../utils/logger.js";
import { DB_ERRORS } from "../utils/dbErrors.js";
import fs from "fs/promises";
import { AuthenticationError, NotFoundError, ValidationError, AppError } from "../utils/errors.js";

// add vault item
const addVaultItem = async (req, res, next) => {
  try {
    const userId = req.user_id;

    if (!userId) {
      return next(new AuthenticationError("User ID is missing in the request."));
    }

    const { name, type, password, data } = req.body;

    const vaultItem = await createVaultItem(userId, name, type, password, data);
    if (!vaultItem) {
      return next(new AppError("Failed to create vault item.", 500));
    }

    const { data: encryptedData, ...safeVaultItem } = vaultItem;
    logger.info(`Vault item created successfully for user ${userId}.`);
    return res.status(201).json({ message: "Vault item created successfully.", vaultItem: safeVaultItem });

  } catch (error) {
    if (error.code === '23505') { // Handle unique constraint violation
      return next(new AppError("Vault item already exists.", 409));
    }
    next(error);
  }
};



// get user vault items
const getUserVaultItems = async (req, res, next) => {
  try {
    const userId = req.user_id;
    if (!userId) {
      return next(new AuthenticationError("Unauthorized. Please log in and try again."));
    }

    const { search, type, page= 1, limit = 10 } = req.query;

    if (page < 1 || limit < 1 ) {
      return next(new ValidationError("Page and limit must be positive integers."));
    }

    const offset = (page - 1) * limit;

    const vaultItems = await getFilteredVaultItems(userId,search,type, limit, offset);
    const totalItems = await getTotalFilteredVaultItems(userId, search, type);
    const totalPages = Math.ceil(totalItems / limit);

    if (vaultItems.length === 0) {
      return next(new NotFoundError("No vault items found."));
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

/**
 * Retrieves a single vault item by its ID for the authenticated user.
 * @param {Object} req - Express request object, expected to have `req.user_id` populated and `req.params.id`.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} A JSON response with the requested vault item.
 */
const getVaultItemById = async (req, res, next) => {
  try {
    const userId = req.user_id;
    const itemId = req.params.id;

    if (!userId) {
      return next(new AuthenticationError("Unauthorized. Please log in and try again."));
    }

    const vaultItem = await findVaultItemById(userId, itemId);

    if (!vaultItem) {
      return next(new NotFoundError("Vault item not found."));
    }

    logger.info(`Vault item ${itemId} retrieved successfully for user ${userId}.`);
    res.status(200).json({ message: "Vault item retrieved successfully.", vaultItem });
  } catch (error) {
    next(error);
  }
};


// update vault item 
const updateUserVaultItem = async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new ValidationError("Request body is missing."));
    }

    const userId = req.user_id;
    const itemId = req.params.id;
    const { name, type, password, ...data } = req.body;

    if (!name) {
      return next(new ValidationError("Missing required fields."));
    }

    logger.info("Updating vault item:", { userId, itemId, name, type, password, data });

    const result = await updateVaultItem(userId, itemId, name, type, password, data);

    if (!result || result.rows.length === 0) {
      return next(new NotFoundError("Vault item not found or not authorized."));
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
      return next(new AuthenticationError("Unauthorized. Please log in and try again."));
    }

    const result = await deleteVaultItemById(userId, id);

    if (!result) {
      return next(new NotFoundError("Failed to delete vault item. Item not found"));
    }

    logger.info(`Vault item with ID ${id} deleted successfully for user ${userId}.`);
    return res.status(200).json({ message: "Vault item deleted successfully."});
  } catch (error) {
    next(error);
  }
};


// export vault controller
const exportVault = async (req, res, next) => {
  const userId = req.user_id; 
  if (!userId) {
    return next(new AuthenticationError("Unauthorized. Please log in and try again."));
  }
  try {
    const totalItems = await getTotalFilteredVaultItems(userId);
    const vaultItems = await getVaultItemsByUserId(userId, totalItems, 0);
    if (!vaultItems || vaultItems.length === 0) {
      return next(new NotFoundError("No vault items found."));
    }

    const jsonData = JSON.stringify(vaultItems, null, 2);

    res.setHeader("Content-Disposition", `attachment; filename=vault_${userId}.json`);
    res.setHeader("Content-Type", "application/json");

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
    const sharedItem = await shareVault(userId, itemId, recipientEmail, accessLevel);
    if (!sharedItem) {
      return next(new AppError("Failed to share vault item.", 400));
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
      return next(new AuthenticationError("Unauthorized. Please log in and try again."));
    }
    const fileContent = await fs.readFile(req.file.path, "utf-8");
    const items = JSON.parse(fileContent);

    const importResults = { success: [], failed: [] };

    for (const item of items) {
      try {
        await createVaultItem(userId, item.name, item.type, item.password, item.data);
        importResults.success.push(item.name);
      } catch (itemError) {
        logger.error(`Failed to import vault item '${item.name}':`, itemError);
        importResults.failed.push({ name: item.name, error: itemError.message });
      }
    }
    await fs.unlink(req.file.path); // clean up uploaded file
    res.status(200).json({ message: "Vault import process completed.", results: importResults });
  } catch (error) {
    next(error);
  }
};


export { addVaultItem, getUserVaultItems, deleteVaultItem, updateUserVaultItem, exportVault, importVault, shareVaultController, getVaultItemById };
