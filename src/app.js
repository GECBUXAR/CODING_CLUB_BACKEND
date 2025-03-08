import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://coding-club-frontend-three.vercel.app",
  "https://coding-club-frontend-git-letest-gec-buxars-projects.vercel.app",
  "https://coding-club-frontend-git-dev-gec-buxars-projects.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Routes Import
import router from "./routes/admin.route.js";
import eventRoutes from "./routes/event.route.js";
import userRoutes from "./routes/user.route.js";
import resultRoutes from "./routes/result.route.js";
import userAnswerRoutes from "./routes/userAnswer.route.js";

// Routes Declaration
app.use("/api/v1/admin", router);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/results", resultRoutes);
app.use("/api/v1/user-answers", userAnswerRoutes);

// Add a route handler for .well-known/version endpoint
app.get("/.well-known/version", (req, res) => {
  res.json({
    version: "1.0.0",
    status: "ok",
  });
});

// Error handling middleware
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

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
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
    message: "Route not found",
  });
});

export default app;
