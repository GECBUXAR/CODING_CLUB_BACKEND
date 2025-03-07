import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
  eventTitle: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  answerText: { type: String },
  chosenOption: { type: String},
  isCorrect: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("UserAnswer", userAnswerSchema);
