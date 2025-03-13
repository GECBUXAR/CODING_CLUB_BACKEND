import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    // Total possible score
    totalScore: {
      type: Number,
      required: true,
    },
    // Score achieved by the user
    score: {
      type: Number,
      required: true,
    },
    // Score as percentage
    percentageScore: {
      type: Number,
      default: function () {
        return (this.score / this.totalScore) * 100;
      },
    },
    // Pass/fail status
    passed: {
      type: Boolean,
      default: function () {
        if (!this.event) return false;
        return (
          this.percentageScore >= (this.event.examDetails?.passingScore || 40)
        );
      },
    },
    // Duration in seconds the user took to complete
    duration: {
      type: Number,
    },
    // User who took the exam
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Event or exam reference
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Attempt number for this user
    attemptNumber: {
      type: Number,
      default: 1,
    },
    // Detailed answers given by user
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        answerGiven: {
          type: mongoose.Schema.Types.Mixed, // Can be string, array, or object depending on question type
        },
        isCorrect: {
          type: Boolean,
        },
        pointsAwarded: {
          type: Number,
          default: 0,
        },
        feedback: {
          type: String,
        },
        timeSpent: {
          type: Number, // Time in seconds spent on this question
        },
      },
    ],
    // Certificate details if passed
    certificate: {
      issued: {
        type: Boolean,
        default: false,
      },
      issuedAt: {
        type: Date,
      },
      certificateId: {
        type: String,
      },
      certificateUrl: {
        type: String,
      },
    },
    // Feedback from the system
    feedback: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating grade
resultSchema.virtual("grade").get(function () {
  const percentage = this.percentageScore;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
});

const Result = mongoose.model("Result", resultSchema);
export default Result;
