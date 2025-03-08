import express from "express";
import {
  getAllTestimonials,
  getAllTestimonialsAdmin,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controller/testimonial.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllTestimonials);

// Protected routes (admin only)
router.get("/admin", verifyJWT, getAllTestimonialsAdmin);
router.post("/", verifyJWT, createTestimonial);
router.put("/:id", verifyJWT, updateTestimonial);
router.delete("/:id", verifyJWT, deleteTestimonial);

export default router;
