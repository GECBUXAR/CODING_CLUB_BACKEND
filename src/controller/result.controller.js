import Result from '../model/result.model.js';
import User from '../model/user.model.js';
import Event from '../model/event.model.js';
import  asyncHandler  from '../utils/asyncHandler.js';

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
         if (user && user.role === 'admin') {   
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
    }
});

export const createResult = [isAdmin, asyncHandler(async (req, res) => {
    const { totalScore, score, userId, eventTitle } = req.body;
    
    const event = await Event.findOne({ title: eventTitle });
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    const result = new Result({ 
        totalScore, 
        score, 
        userId, 
        eventTitle: event._id 
    });
    await result.save();

    await Event.findByIdAndUpdate(
        event._id,
        { $push: { results: result } },
        { new: true }
    );
    
    res.status(201).json(result);
})];

export const getAllResults = asyncHandler(async (req, res) => {
    const results = await Result.find()
        .populate('userId', 'name email')
        .populate('eventTitle', 'title category');
    res.status(200).json(results);
});  

export const getResultsByEventTitle = asyncHandler(async (req, res) => {
    const { eventTitle } = req.body;
    const event = await Event.findOne({ title: eventTitle });
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    const results = await Result.find({ eventTitle: event._id })
        .populate('userId', 'name email')
        .populate('eventTitle', 'title category');
    
    res.status(200).json(results);
});

export const getResultById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await Result.findById(id)
        .populate('userId', 'name email')
        .populate('eventTitle', 'title category');
    
    if (!result) {
        return res.status(404).json({ message: 'Result not found' });
    }
    
    res.status(200).json(result);
});  

export const updateResult = [isAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { totalScore, score, userId, eventTitle } = req.body;
    
    const result = await Result.findByIdAndUpdate(
        id, 
        { totalScore, score, userId, eventTitle }, 
        { new: true }
    ).populate('userId eventTitle');
    
    if (!result) {
        return res.status(404).json({ message: 'Result not found' });
    }
    
    res.status(200).json(result);
})];

export const deleteResult = [isAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await Result.findById(id);
    if (!result) {
        return res.status(404).json({ message: 'Result not found' });
    }
    await Event.findByIdAndUpdate(
        result.eventTitle,  
        { $pull: { results: id } }
    );
    
    await Result.findByIdAndDelete(id);
    res.status(200).json({ message: 'Result deleted successfully' });
})]; 
