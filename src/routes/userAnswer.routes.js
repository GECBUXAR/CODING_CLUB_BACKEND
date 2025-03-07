import router from "express";
import { createUserAnswer, getAnswerByEventTitleOrRegistrationNumber, getAnswerByUserRegistratrionNumber } from "../controller/userAnswer.controller.js";

const router = router();

router.post("/create",createUserAnswer);
router.post("/get-answer",getAnswerByUserRegistratrionNumber);
router.post("/get-answer-by-event-title-or-registration-number",getAnswerByEventTitleOrRegistrationNumber);
export default router;      
