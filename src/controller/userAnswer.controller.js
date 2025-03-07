import Question from "../model/question.model.js";
import User from "../model/user.model.js";
import UserAnswer from "../model/userAnswer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import Event from "../model/event.model.js";

export const createUserAnswer = asyncHandler(async(req,res)=>{
    try {
        const {userId, questionId, answerText, chosenOption, isCorrect, eventTitle} = req.body;
        if(!userId || !questionId || !eventTitle){
            return res.status(400).json({message:"All fields are required"});
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const question = await Question.findById(questionId);
        if(!question){
            return res.status(404).json({message:"Question not found"});
        }
        const event = await Event.findOne({title: eventTitle});
        if(!event){
            return res.status(404).json({message:"Event not found"});
        }
        const userAnswer = await UserAnswer.create({
            userId,
            questionId,
            answerText,
            chosenOption,
            isCorrect,
            eventTitle: event._id
        });
        res.status(201).json(userAnswer);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})

export const getAnswerByUserRegistratrionNumber = asyncHandler(async(req,res)=>{
    try {
        const {registrationNumber} = req.body;
        if(!registrationNumber){
            return res.status(400).json({message:"Registration number is required"});
        }
        const user = await User.findOne({registrationNumber});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const userAnswers = await UserAnswer.find({ userId: user._id })
            .populate('questionId')
            .populate('eventTitle');
        res.status(200).json(userAnswers);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
export const getAnswerByEventTitleOrRegistrationNumber = asyncHandler(async(req,res)=>{
    try {
        const {eventTitle, registrationNumber} = req.body;
        if(!eventTitle && !registrationNumber){
            return res.status(400).json({message:"Either event title or registration number is required"});
        }
        const user = await User.findOne({registrationNumber});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const event = await Event.findOne({title: eventTitle});
        if(!event){
            return res.status(404).json({message:"Event not found"});
        }
        const userAnswers = await UserAnswer.find({userId: user._id, eventTitle: event._id})
        .populate('questionId')
        .populate('eventTitle');
        res.status(200).json(userAnswers);
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
