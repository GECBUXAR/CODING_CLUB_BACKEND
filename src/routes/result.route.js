import express from 'express';
import { createResult, getAllResults, getResultById, updateResult, deleteResult, getResultsByEventTitle } from '../controller/result.controller.js';

const resultRoutes = express.Router();

resultRoutes.post('/create', createResult);
resultRoutes.post('/getResultbyEventTitle', getResultsByEventTitle);
resultRoutes.get('/', getAllResults);
resultRoutes.get('/:id', getResultById);
resultRoutes.put('/:id', updateResult);
resultRoutes.delete('/:id', deleteResult);

export default resultRoutes;
