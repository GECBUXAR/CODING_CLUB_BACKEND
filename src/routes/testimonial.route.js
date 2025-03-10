import express from "express";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controller/testimonial.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/getAllTestimonial", getAllTestimonials);

// Protected routes (admin only)
router.post("/createTestimonial", verifyJWT, createTestimonial);
router.put("/updateTestimonial/:id", verifyJWT, updateTestimonial);
router.delete("/delTestimonial/:id", verifyJWT, deleteTestimonial);

export default router;
