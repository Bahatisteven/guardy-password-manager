import speakeasy from "speakeasy";
import qrcode from "qrcode";

/**
 * Generates a new TOTP secret and a QR code for it.
 * @param {string} email - The user's email, used for the issuer in the QR code.
 * @returns {Promise<{secret: string, otpauthUrl: string, qrcodeDataUrl: string}>} An object containing the secret, otpauth URL, and QR code data URL.
 */
export const generateTwoFactorSecret = async (email) => {
  const secret = speakeasy.generateSecret({
    name: `Guardy (${email})`,
    length: 20,
  });

  const otpauthUrl = secret.otpauth_url;
  const qrcodeDataUrl = await qrcode.toDataURL(otpauthUrl);

  return {
    secret: secret.base32,
    otpauthUrl,
    qrcodeDataUrl,
  };
};

/**
 * Verifies a TOTP token.
 * @param {string} secret - The user's TOTP secret (base32 encoded).
 * @param {string} token - The TOTP token provided by the user.
 * @returns {boolean} True if the token is valid, false otherwise.
 */
export const verifyTwoFactorToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, // Allow a 30-second window either side of the current time
  });
};
