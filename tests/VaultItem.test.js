import {
  createVaultItem,
  getVaultItemsByUserId,
  getFilteredVaultItems,
  getTotalFilteredVaultItems,
  deleteVaultItemById
} from "../models/VaultItem.js";

import { dbPool as pool } from "../config/db.js";


jest.mock("../config/db.js");


describe("VaultItem Model", () => {
  afterEach(() => {
    jest.clearAllMocks();  // clear mocks after each test
  });

  afterAll(() => {
    pool.end();  // close database connection after all tests
  });


  test("createVaultItem should insert a new vault item", async () => {
    const mockResult = { rows: [{ id: 1, name: "Test Item", type: "password", data: "secretData" }] };
    pool.query.mockResolvedValue(mockResult);

    const result = await createVaultItem(1, "Test Item", "password", "secretData" );
    expect(result).toEqual(mockResult.rows[0]);
    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO vault_items (user_id, name, type, data) VALUES ($1, $2, $3, $4) RETURNING *",
      expect.any(Array)
    );
  });

  test("getVaultItemsByUserId should retrieve items for user", async () => {
    const mockResult = { rows: [{ id: 1, name: "Test Item", type: "password"}] };
    pool.query.mockResolvedValue(mockResult);

    const result = await getVaultItemsByUserId(1, 10, 0);
    expect(result).toEqual(mockResult.rows);
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT * FROM vault_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3", 
      [1,10, 0]
    );
  });

  test("getFilteredVaultItems should retrieve filtered items ", async () => {
    const mockResult = { rows: [{ id: 1, name: "Filtered Item", type: "password" }] };
    pool.query.mockResolvedValue(mockResult);

    const result = await getFilteredVaultItems(1, "Filtered Item", "password", 10, 0);
    expect(result).toEqual(mockResult.rows);
    expect(pool.query).toHaveBeenCalled();
  });

  test("getTotalFilteredVaultItems should return the total count of filtered items", async () => {
    const mockResult = { rows: [{ total: 5}] };
    pool.query.mockResolvedValue(mockResult);

    const result = await getTotalFilteredVaultItems(1, "Filtered Item", "password");
    expect(result).toBe(5);
    expect(pool.query).toHaveBeenCalled();
  });

  test("deleteVaultItemById should delete an item by ID", async () => {
    const mockResult = { rows: [{ id: 1, name: "Deleted Item"}] };
    pool.query.mockResolvedValue(mockResult);

    const result = await deleteVaultItemById(1, 1);
    expect(result).toEqual(mockResult.rows[0]);
    expect(pool.query).toHaveBeenCalledWith(
      "DELETE FROM vault_items WHERE user_id = $1 AND id = $2 RETURNING *",
      [1, 1]
    );
  });
});