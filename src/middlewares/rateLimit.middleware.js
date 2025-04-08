import rateLimit from "express-rate-limit";

// Basic rate limiter for general API endpoints - TEMPORARILY DISABLED
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // TEMPORARILY SET VERY HIGH - effectively disabled
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});

// More strict rate limiter for authentication endpoints - TEMPORARILY DISABLED
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100000, // TEMPORARILY SET VERY HIGH - effectively disabled
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many login attempts, please try again after an hour.",
  },
});

// Rate limiter for user creation endpoints - TEMPORARILY DISABLED
export const createUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // TEMPORARILY SET VERY HIGH - effectively disabled
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many accounts created from this IP, please try again after an hour.",
  },
});
