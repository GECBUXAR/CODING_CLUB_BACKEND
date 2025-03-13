import express from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controller/admin.controller.js';    

const EventRouter = express.Router();

EventRouter.post('/createEvent', createEvent);
EventRouter.get('/getAllevents', getEvents);
EventRouter.get('/events/:id', getEventById);    
EventRouter.put('/events/updateEvent/:id', updateEvent);
EventRouter.delete('/events/deleteEvent/:id', deleteEvent);

export default EventRouter;
