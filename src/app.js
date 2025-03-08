import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Add this to your app.js file (before any route declarations)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Modify your CORS setup in app.js
app.use((req, res, next) => {
  // Always set CORS headers, even for errors
  res.header(
    "Access-Control-Allow-Origin",
    process.env.CORS_ORIGIN === "*"
      ? "http://localhost:5173"
      : process.env.CORS_ORIGIN
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle OPTIONS requests explicitly
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Then your regular CORS middleware
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? ["http://localhost:5173"]
        : process.env.CORS_ORIGIN.split(","),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);

// Handle preflight requests properly
app.options("*", cors());

app.use(express.json());

app.use(cookieParser());

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

// Routes Import

import router from "./routes/admin.route.js";
import eventRoutes from "./routes/event.route.js";
import userRoutes from "./routes/user.route.js";
import resultRoutes from "./routes/result.route.js";

// Routes Decleration

app.use("/api/v1/admin", router);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/results", resultRoutes);

// Add a route handler for .well-known/version endpoint
app.get("/.well-known/version", (req, res) => {
  res.json({
    version: "1.0.0",
    status: "ok",
  });
});

export default app;
