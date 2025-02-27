import express from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controller/admin.controller.js';    

const EventRouter = express.Router();

EventRouter.post('/events', createEvent);
EventRouter.get('/events', getEvents);
EventRouter.get('/events/:id', getEventById);    
EventRouter.put('/events/:id', updateEvent);
EventRouter.delete('/events/:id', deleteEvent);

    export default EventRouter;
