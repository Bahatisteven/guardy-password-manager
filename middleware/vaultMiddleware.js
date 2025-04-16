import rateLimit from "express-rate-limit";

const vaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

export { vaultRateLimiter };