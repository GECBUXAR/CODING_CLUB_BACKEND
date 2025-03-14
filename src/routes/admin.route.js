import express from "express";
import {
  createAdmin,
  loginAdmin,
  logOutAdmin,
  getAdminProfile,
  checkAdminByEmail,
  getEventById,
  getEvents,
  updateEvent,
  deleteEvent,
  createEvent,
} from "../controllers/admin.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes - these don't require authentication
router.post("/signup", createAdmin);
router.post("/login", loginAdmin);
router.get("/check-by-email", checkAdminByEmail);

// Event routes
router.get("/events", getEvents);
router.get("/events/:id", getEventById);
router.post("/events", verifyJWT, isAdmin, createEvent);
router.put("/events/:id", verifyJWT, isAdmin, updateEvent);
router.delete("/events/:id", verifyJWT, isAdmin, deleteEvent);

// Protected routes - these require authentication and admin role
router.post("/logout", verifyJWT, logOutAdmin);
router.get("/profile", verifyJWT, isAdmin, getAdminProfile);

export default router;
