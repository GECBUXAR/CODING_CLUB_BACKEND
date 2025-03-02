import mongoose from "mongoose";
    const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    registrationLink: {
        type: String,
        required: true
    }
});
        const Event = mongoose.model('Event', eventSchema);
export default Event;