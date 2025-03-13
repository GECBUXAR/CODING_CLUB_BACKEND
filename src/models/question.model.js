import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: [
      {
        text: { type: String },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    questionType: {
      type: String,
      enum: [
        "mcq",
        "multiselect",
        "true/false",
        "short answer",
        "long answer",
        "code",
        "fill-in-blanks",
      ],
      required: true,
    },
    // For non-MCQ questions
    correctAnswer: {
      type: String,
    },
    // For MCQ questions, this can be an index or value
    correctOption: {
      type: String,
    },
    // Related event - either an event or exam
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Difficulty level of the question
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    // Points/marks for this question
    points: {
      type: Number,
      default: 1,
    },
    // Time limit in seconds (if applicable)
    timeLimit: {
      type: Number,
    },
    // Hints that can be provided to students
    hints: [
      {
        text: { type: String },
        pointsDeduction: { type: Number, default: 0 },
      },
    ],
    // Topics/tags for categorization
    topics: [
      {
        type: String,
      },
    ],
    // Explanation of the correct answer (for review)
    explanation: {
      type: String,
    },
    // For code questions
    codeLanguages: [
      {
        type: String,
        enum: [
          "javascript",
          "python",
          "java",
          "c++",
          "c",
          "ruby",
          "go",
          "rust",
          "php",
        ],
      },
    ],
    // Sample code template (for code questions)
    codeTemplate: {
      type: String,
    },
    // Test cases (for code questions)
    testCases: [
      {
        input: { type: String },
        expectedOutput: { type: String },
        isHidden: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
