import express from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, loginUser } from '../controller/user.controller.js';

const UserRouter = express.Router();

UserRouter.get('/', getAllUsers);
UserRouter.get('/:id', getUserById);
UserRouter.post('/signup', createUser);
UserRouter.post('/login', loginUser);
UserRouter.put('/:id', updateUser);
UserRouter.delete('/:id', deleteUser);

export default UserRouter;