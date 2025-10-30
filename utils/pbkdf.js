import argon2 from "argon2";
import crypto from "crypto";

const KEY_LENGTH = 32; // 32 bytes for AES-256
const SALT_LENGTH = 16; // 16 bytes for salt

/**
 * Derives a key from a password and salt using Argon2.
 * @param {string} password - The master password.
 * @param {Buffer} salt - The salt.
 * @returns {Promise<Buffer>} The derived key.
 */
const deriveKey = async (password, salt) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    hashLength: KEY_LENGTH,
    salt,
    raw: true,
  });
};

/**
 * Generates a random salt.
 * @returns {Buffer} The generated salt.
 */
const generateSalt = () => {
  return crypto.randomBytes(SALT_LENGTH);
};

export { deriveKey, generateSalt };
