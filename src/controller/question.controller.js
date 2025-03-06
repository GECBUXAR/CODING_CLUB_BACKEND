import Question from "../model/question.model.js";
import asyncHandler from "../utils/asyncHandler.js";
export const createQuestion = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { questionText, options, correctOption, answerText, eventTitle, questionType } =
      req.body;
    if (
      !questionText ||
      !options ||
      !correctOption ||
      !answerText ||
      !eventTitle ||
      !questionType
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const event = await Event.findById(eventTitle);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }
    const question = await Question.create({
      questionText,
      options,
      correctOption,
      answerText,
      eventTitle,
      questionType,
    });
    event.questions.push(question._id);
    await event.save();
    res
      .status(201)
      .json({ message: "Question created successfully.", question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const getQuestionsByEvent = asyncHandler(async (req, res) => {
  try {
    const { eventTitle } = req.body;
    const questions = await Question.find({ eventTitle });
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const getQuestionById = asyncHandler(async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });   
  }
}); 

export const updateQuestion = asyncHandler(async (req, res) => {
  try {
    
    const { questionId } = req.params;
    const { questionText, options, correctOption, answerText, eventTitle, questionType } = req.body;
    const question = await Question.findByIdAndUpdate(questionId, { questionText, options, correctOption, answerText, eventTitle, questionType }, { new: true });
    res.status(200).json({ message: "Question updated successfully.", question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { questionId } = req.body;
    const question = await Question.findByIdAndDelete(questionId);
    res.status(200).json({ message: "Question deleted successfully.", question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



