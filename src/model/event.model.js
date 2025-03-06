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
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  skillLevel: {
    type: String,
    required: true,
    enum: ["beginner", "intermediate", "advanced"],
  },
  speakers: {
    type: Array,
    required: true,
  },
  results: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result'
  }]
});
const Event = mongoose.model("Event", eventSchema);
export default Event;