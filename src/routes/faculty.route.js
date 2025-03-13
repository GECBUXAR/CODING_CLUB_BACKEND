import express from "express";
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  updateFacultyStatus,
  searchFaculty,
} from "../controllers/faculty.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllFaculty);
router.get("/search", searchFaculty);
// Testimonials endpoint - uses the same getAllFaculty function with format parameter
router.get(
  "/testimonials",
  (req, res, next) => {
    req.query.format = "testimonials";
    next();
  },
  getAllFaculty
);
router.get("/:id", getFacultyById);

// Protected routes
router.post("/", verifyJWT, createFaculty);
router.put("/:id", verifyJWT, updateFaculty);
router.delete("/:id", verifyJWT, deleteFaculty);
router.patch("/:id/status", verifyJWT, updateFacultyStatus);

export default router;
