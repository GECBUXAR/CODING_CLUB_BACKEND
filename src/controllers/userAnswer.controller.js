import Question from "../models/question.model.js";
import User from "../models/user.model.js";
import UserAnswer from "../models/userAnswer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import Event from "../models/event.model.js";

export const createUserAnswer = asyncHandler(async (req, res) => {
  try {
    const {
      userId,
      questionId,
      answerText,
      chosenOption,
      isCorrect,
      eventTitle,
      eventId,
    } = req.body;

    if (
      !userId ||
      (!questionId && !req.body.answers) ||
      (!eventTitle && !eventId)
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle single answer submission
    if (questionId) {
      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      let event;
      if (eventId) {
        event = await Event.findById(eventId);
      } else if (eventTitle) {
        event = await Event.findOne({ title: eventTitle });
      }

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const userAnswer = await UserAnswer.create({
        userId,
        questionId,
        answerText,
        chosenOption,
        isCorrect,
        eventTitle: event._id,
      });

      return res.status(201).json(userAnswer);
    }

    // Handle batch answer submission (for exam)
    if (req.body.answers && Array.isArray(req.body.answers)) {
      let event;
      if (eventId) {
        event = await Event.findById(eventId);
      } else if (eventTitle) {
        event = await Event.findOne({ title: eventTitle });
      }

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const answers = [];
      for (const answer of req.body.answers) {
        const question = await Question.findById(answer.questionId);
        if (!question) {
          continue; // Skip invalid questions
        }

        const userAnswer = await UserAnswer.create({
          userId,
          questionId: answer.questionId,
          answerText: answer.answerText,
          chosenOption: answer.chosenOption,
          isCorrect: answer.isCorrect,
          eventTitle: event._id,
        });

        answers.push(userAnswer);
      }

      return res.status(201).json({
        message: "Answers submitted successfully",
        count: answers.length,
        data: answers,
      });
    }

    return res.status(400).json({ message: "Invalid request format" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export const getAnswerByUserRegistrationNumber = asyncHandler(
  async (req, res) => {
    try {
      const { registrationNumber } = req.body;
      if (!registrationNumber) {
        return res
          .status(400)
          .json({ message: "Registration number is required" });
      }
      const user = await User.findOne({ registrationNumber });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userAnswers = await UserAnswer.find({ userId: user._id })
        .populate("questionId")
        .populate("eventTitle");
      res.status(200).json(userAnswers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export const getAnswerByEventTitleOrRegistrationNumber = asyncHandler(
  async (req, res) => {
    try {
      const { eventTitle, registrationNumber } = req.body;
      if (!eventTitle && !registrationNumber) {
        return res.status(400).json({
          message: "Either event title or registration number is required",
        });
      }
      const user = await User.findOne({ registrationNumber });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const event = await Event.findOne({ title: eventTitle });
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      const userAnswers = await UserAnswer.find({
        userId: user._id,
        eventTitle: event._id,
      })
        .populate("questionId")
        .populate("eventTitle");
      res.status(200).json(userAnswers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all user answers for a specific event/exam
export const getUserAnswersByEventId = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userAnswers = await UserAnswer.find({ eventTitle: eventId })
      .populate("questionId")
      .populate("userId", "name email registrationNumber")
      .populate("eventTitle");

    res.status(200).json({
      success: true,
      message: "User answers retrieved successfully",
      count: userAnswers.length,
      data: userAnswers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific user answer by ID
export const getUserAnswerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Answer ID is required" });
    }

    const userAnswer = await UserAnswer.findById(id)
      .populate("questionId")
      .populate("userId", "name email registrationNumber")
      .populate("eventTitle");

    if (!userAnswer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    res.status(200).json({
      success: true,
      data: userAnswer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a user answer
export const updateUserAnswer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { answerText, chosenOption, isCorrect } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Answer ID is required" });
    }

    const userAnswer = await UserAnswer.findById(id);
    if (!userAnswer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    userAnswer.answerText = answerText || userAnswer.answerText;
    userAnswer.chosenOption = chosenOption || userAnswer.chosenOption;
    userAnswer.isCorrect =
      isCorrect !== undefined ? isCorrect : userAnswer.isCorrect;

    const updatedAnswer = await userAnswer.save();

    res.status(200).json({
      success: true,
      message: "Answer updated successfully",
      data: updatedAnswer,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a user answer
export const deleteUserAnswer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Answer ID is required" });
    }

    const userAnswer = await UserAnswer.findById(id);
    if (!userAnswer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    await userAnswer.deleteOne();

    res.status(200).json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
