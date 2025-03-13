import express from "express";
import {
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  getResultsByEventTitle,
} from "../controllers/result.controller.js";

const router = express.Router();

// Get results by event title
router.post("/by-event", getResultsByEventTitle);

// Create new result
router.post("/", createResult);

// Get all results
router.get("/", getAllResults);

// Get result by ID
router.get("/:id", getResultById);

// Update result
router.put("/:id", updateResult);

// Delete result
router.delete("/:id", deleteResult);

export default router;
