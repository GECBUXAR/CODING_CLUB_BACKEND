import express from "express";
import {
  createAdmin,
  loginAdmin,
  logOutAdmin,
  getAdminProfile,
} from "../controllers/admin.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes - these don't require authentication
router.post("/signup", createAdmin);
router.post("/login", loginAdmin);

// Protected routes - these require authentication and admin role
router.post("/logout", verifyJWT, logOutAdmin);
router.get("/profile", verifyJWT, isAdmin, getAdminProfile);

export default router;
