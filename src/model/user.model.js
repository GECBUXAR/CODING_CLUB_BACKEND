
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
   mobile: {
        type: Number,
        required: true
    },
   registrationNumber: {
        type: String,
        required: true,
        unique: true,
    },
    branch: {
        type: String,
        required: true,
        enum: ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'],
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    isSuscribed: {
        type: Boolean,
        default: false
    },
    
});

const User = mongoose.model('User', userSchema);

export default User;