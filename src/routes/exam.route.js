import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getResultsByEventId } from "../controllers/result.controller.js";
import {
  getUserAnswersByEventId,
  createUserAnswer,
  getUserAnswerById,
  updateUserAnswer,
  deleteUserAnswer,
} from "../controllers/userAnswer.controller.js";

const router = express.Router();

// Get exam results by exam (event) ID
router.get("/:examId/results", verifyJWT, (req, res) => {
  req.body.eventId = req.params.examId;
  return getResultsByEventId(req, res);
});

// Get exam responses (user answers) for a specific exam
router.get("/:examId/responses", verifyJWT, (req, res) => {
  req.body.eventId = req.params.examId;
  return getUserAnswersByEventId(req, res);
});

// Get a specific exam response by ID
router.get("/:examId/responses/:responseId", verifyJWT, (req, res) => {
  req.params.id = req.params.responseId;
  return getUserAnswerById(req, res);
});

// Create a new exam response (submit answers)
router.post("/:examId/submit", verifyJWT, (req, res) => {
  req.body.eventId = req.params.examId;
  return createUserAnswer(req, res);
});

// Update an exam response
router.put("/:examId/responses/:responseId", verifyJWT, (req, res) => {
  req.params.id = req.params.responseId;
  return updateUserAnswer(req, res);
});

// Delete an exam response
router.delete("/:examId/responses/:responseId", verifyJWT, (req, res) => {
  req.params.id = req.params.responseId;
  return deleteUserAnswer(req, res);
});

export default router;
