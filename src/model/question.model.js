import mongoose from "mongoose";
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: [{ type: String }],
    questionType: {
      type: String,
      enum: ["mcq", "true/false", "short answer", "code"],
      required: true,
    },
    correctOption: { type: String, required: true },
    answerText: { type: String },
    eventTitle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
