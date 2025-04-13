import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Enhanced CORS configuration with better security
const allowedOriginsEnv = process.env.CORS_ORIGIN || "";
const allowedOrigins = [
  "http://localhost:5173",
  "https://coding-club-frontend-three.vercel.app",
  "https://coding-club-frontend-git-letest-gec-buxars-projects.vercel.app",
  "https://coding-club-frontend-git-dev-gec-buxars-projects.vercel.app",
  ...allowedOriginsEnv.split(",").filter((origin) => origin.trim()),
];

// Log allowed origins in non-production environments only
if (process.env.NODE_ENV !== "production") {
  console.log("Allowed CORS origins:", allowedOrigins);
}

// Create a CORS middleware factory function
const createCorsMiddleware = (options = {}) => {
  const defaultOptions = {
    origin: (origin, callback) => {
      // In development, allow requests with no origin (like Postman)
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // In production, only allow specific origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Origin ${origin} blocked by CORS policy`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // Create and return the CORS middleware
  return cors(mergedOptions);
};

// Create the main CORS middleware
const corsMiddleware = createCorsMiddleware();

// Apply CORS middleware
app.use(corsMiddleware);

// Handle preflight requests explicitly
app.options("*", corsMiddleware);

// Add security headers to all responses
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
});

// Parse JSON request body (reasonable limit for security)
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static("public"));

// Routes Import
import router from "./routes/admin.route.js";
import eventRoutes from "./routes/event.route.js";
import userRoutes from "./routes/user.route.js";
import resultRoutes from "./routes/result.route.js";
import userAnswerRoutes from "./routes/userAnswer.route.js";
import facultyRoutes from "./routes/faculty.route.js";
import examRoutes from "./routes/exam.route.js";
import enhancedExamRoutes from "./routes/enhanced-exam.route.js";

// Request logging middleware for debugging
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Apply API rate limiter to all API routes
app.use("/api/v1", apiLimiter);

// Routes Declaration
app.use("/api/v1/admin", router);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/results", resultRoutes);
app.use("/api/v1/user-answers", userAnswerRoutes);
app.use("/api/v1/faculty", facultyRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/enhanced-exams", enhancedExamRoutes);

// Add a route handler for .well-known/version endpoint
app.get("/.well-known/version", (req, res) => {
  res.json({
    version: "1.0.0",
    status: "ok",
  });
});

// Global error handler middleware with enhanced security and debugging
app.use((err, req, res, next) => {
  // Log error details (but sanitize sensitive information)
  console.error("Error:", err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error("Stack:", err.stack);
  }

  // Determine if this is a CORS error
  const isCorsError = err.message?.includes("CORS");

  // For CORS errors, provide a more helpful message
  if (isCorsError) {
    return res.status(403).json({
      status: "error",
      code: "CORS_ERROR",
      message: "Cross-Origin Request Blocked",
      detail:
        "The server rejected this request because it came from an unauthorized origin.",
      allowedOrigins:
        process.env.NODE_ENV === "production" ? undefined : allowedOrigins,
      requestOrigin: req.headers.origin || "unknown",
    });
  }

  // Enhanced error response with appropriate details based on environment
  res.status(err.status || 500).json({
    status: "error",
    code: err.code || "SERVER_ERROR",
    message: err.message || "Internal server error",
    path: req.path,
    method: req.method,
    // Only include detailed debugging info in development
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
      // Sanitize request body to avoid logging sensitive data
      body: req.body ? sanitizeRequestBody(req.body) : undefined,
    }),
  });
});

// Helper function to sanitize request body for logging
function sanitizeRequestBody(body) {
  // Create a shallow copy of the body
  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = [
    "password",
    "token",
    "refreshToken",
    "accessToken",
    "secretKey",
  ];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

// 404 handler with consistent error format
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

export default app;
