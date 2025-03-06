import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    totalScore: {
        type: String,
        required: true
    },
    score: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventTitle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
