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

// CORS configuration
const allowedOriginsEnv = process.env.CORS_ORIGIN || "";
const allowedOrigins = [
  "http://localhost:5173",
  "https://coding-club-frontend-three.vercel.app",
  "https://coding-club-frontend-git-letest-gec-buxars-projects.vercel.app",
  "https://coding-club-frontend-git-dev-gec-buxars-projects.vercel.app",
  ...allowedOriginsEnv.split(",").filter((origin) => origin.trim()),
];

console.log("Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS policy`);
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

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

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

// Add a route handler for .well-known/version endpoint
app.get("/.well-known/version", (req, res) => {
  res.json({
    version: "1.0.0",
    status: "ok",
  });
});

// Global error handler middleware - improved with more detailed error info
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  // Set CORS headers even for errors
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
    res.header(
      "Access-Control-Allow-Headers",
      corsOptions.allowedHeaders.join(",")
    );
  }

  // Enhanced error response with additional details for debugging
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      body: req.body,
    }),
  });
});

// 404 handler
app.use((req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

export default app;
