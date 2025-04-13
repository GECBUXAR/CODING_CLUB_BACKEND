import rateLimit from "express-rate-limit";

/**
 * Enhanced rate limiting middleware with security headers
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
const createEnhancedLimiter = (options) => {
  const limiter = rateLimit(options);

  return (req, res, next) => {
    // Add security headers to all rate-limited routes
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Apply the rate limiter
    limiter(req, res, next);
  };
};

// General API rate limiter
export const apiLimiter = createEnhancedLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
  skipSuccessfulRequests: false, // Count all requests
});

// Authentication endpoints rate limiter (login, token refresh)
export const authLimiter = createEnhancedLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many login attempts, please try again after 15 minutes.",
  },
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

// User creation endpoints rate limiter
export const createUserLimiter = createEnhancedLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 account creations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many accounts created from this IP, please try again after an hour.",
  },
  skipSuccessfulRequests: false, // Count all requests
});

// Password reset rate limiter
export const passwordResetLimiter = createEnhancedLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message:
      "Too many password reset requests, please try again after an hour.",
  },
  skipSuccessfulRequests: false, // Count all requests
});
