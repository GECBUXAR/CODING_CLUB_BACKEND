import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
  },
  category: {
    type: String,
  },
  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
  },
  speakers: {
    type: Array,
  },
  isExam: {
    type: Boolean,
    default: false,
  },
  results: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result'
    }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
});
const Event = mongoose.model("Event", eventSchema);
export default Event;