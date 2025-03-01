import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

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

export default app;
