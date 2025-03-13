import express from "express";
import {
  createUserAnswer,
  getAnswerByEventTitleOrRegistrationNumber,
  getAnswerByUserRegistrationNumber,
} from "../controllers/userAnswer.controller.js";

const router = express.Router();

router.post("/create", createUserAnswer);
router.post("/get-answer", getAnswerByUserRegistrationNumber);
router.post(
  "/get-answer-by-event-title-or-registration-number",
  getAnswerByEventTitleOrRegistrationNumber
);

export default router;
