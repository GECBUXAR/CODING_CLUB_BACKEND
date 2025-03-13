import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema(
  {
    // User who submitted the answer
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Question being answered
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    // Event/exam this answer belongs to
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // For tracking exam session/attempt
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
    },
    // For text-based answers
    answerText: {
      type: String,
    },
    // For MCQ/multiselect answers (can be single value or array)
    chosenOptions: {
      type: mongoose.Schema.Types.Mixed,
    },
    // For tracking single option answers (for backward compatibility)
    chosenOption: {
      type: String,
    },
    // Correctness status
    isCorrect: {
      type: Boolean,
    },
    // Points awarded for this answer
    pointsAwarded: {
      type: Number,
      default: 0,
    },
    // Time spent on this question in seconds
    timeSpent: {
      type: Number,
    },
    // Whether this answer has been reviewed (for subjective questions)
    isReviewed: {
      type: Boolean,
      default: false,
    },
    // Reviewer comments
    reviewComments: {
      type: String,
    },
    // For code answers
    codeLanguage: {
      type: String,
    },
    codeAnswer: {
      type: String,
    },
    // For code execution results
    codeExecutionResults: [
      {
        testCase: {
          input: String,
          expectedOutput: String,
        },
        actualOutput: String,
        passed: Boolean,
        executionTime: Number, // in milliseconds
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("UserAnswer", userAnswerSchema);
