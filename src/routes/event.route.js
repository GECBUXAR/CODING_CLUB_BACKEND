import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventQuestions,
  registerForEvent,
  unregisterFromEvent,
  markAttendance,
  submitFeedback,
  searchEvents,
  getUpcomingEvents,
  getUserEvents,
} from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllEvents);
router.get("/search", searchEvents);
router.get("/upcoming", getUpcomingEvents);

// Protected routes - IMPORTANT: Make sure this is defined BEFORE the /:id route
router.get("/user-events", verifyJWT, getUserEvents);

// Dynamic parameter routes
router.get("/:id", getEventById);
router.get("/:id/questions", getEventQuestions);

// Other protected routes
router.post("/", verifyJWT, createEvent);
router.put("/:id", verifyJWT, updateEvent);
router.delete("/:id", verifyJWT, deleteEvent);
router.post("/:id/register", verifyJWT, registerForEvent);
router.post("/:id/unregister", verifyJWT, unregisterFromEvent);
router.post("/:id/enroll", verifyJWT, registerForEvent);
router.post("/:id/unenroll", verifyJWT, unregisterFromEvent);
router.post("/:id/attendance", verifyJWT, markAttendance);
router.post("/:id/feedback", verifyJWT, submitFeedback);

export default router;
