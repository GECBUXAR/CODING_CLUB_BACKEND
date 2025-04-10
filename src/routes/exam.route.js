import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getResultsByEventId } from "../controllers/result.controller.js";

import {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamQuestions,
  addExamQuestion,
  registerForExam,
  getExamParticipants,
  getExamResults,
  submitExamAnswers,
} from "../controllers/exam.controller.js";

import {
  getUserAnswersByEventId,
  getUserAnswerById,
  updateUserAnswer,
  deleteUserAnswer,
} from "../controllers/userAnswer.controller.js";

const router = express.Router();

// Public routes
router.get("/", getAllExams);
router.get("/:id", getExamById);

// Protected routes - require authentication
router.post("/", verifyJWT, createExam);
router.put("/:id", verifyJWT, updateExam);
router.delete("/:id", verifyJWT, deleteExam);

// Exam questions routes
router.get("/:id/questions", verifyJWT, getExamQuestions);
router.post("/:id/questions", verifyJWT, addExamQuestion);

// Exam registration
router.post("/:id/register", verifyJWT, registerForExam);

// Exam participants
router.get("/:id/participants", verifyJWT, getExamParticipants);

// Exam results // Get exam results by exam (event) ID
router.get("/:id/results", verifyJWT, getExamResults);

// Submit exam answers
router.post("/:id/submit", verifyJWT, submitExamAnswers);

// //////

// Get exam responses (user answers) for a specific exam
router.get("/:id/responses", verifyJWT, (req, res) => {
  req.body.eventId = req.params.examId;
  return getUserAnswersByEventId(req, res);
});

// Get a specific exam response by ID
router.get("/:id/responses/:responseId", verifyJWT, (req, res) => {
  req.params.id = req.params.responseId;
  return getUserAnswerById(req, res);
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
