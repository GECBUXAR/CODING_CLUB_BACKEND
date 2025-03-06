import express from "express";
import { createQuestion, updateQuestion, deleteQuestion, getQuestionsByEvent, getQuestionById } from "../controller/question.controller.js";


const router = express.Router();


router.post("/createQuestion", createQuestion);
router.get("/getQuestionsByEvent", getQuestionsByEvent);
router.get("/getQuestionById/:id", getQuestionById);
router.put("/updateQuestion/:id", updateQuestion);
router.delete("/deleteQuestion/:id", deleteQuestion);

export default router;
