import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  logOutUser,
  subscribe,
  getUserByToken,
  getUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  authLimiter,
  createUserLimiter,
} from "../middlewares/rateLimit.middleware.js";

const UserRouter = express.Router();

// Public routes
UserRouter.post("/signup", createUserLimiter, createUser);
UserRouter.post("/login", authLimiter, loginUser);
UserRouter.post("/subscribe", subscribe);

// Protected routes
UserRouter.get("/profile", verifyJWT, getUserProfile);
UserRouter.post("/logout", verifyJWT, logOutUser);
UserRouter.get("/AllUsers", verifyJWT, getAllUsers);
UserRouter.post("/me", verifyJWT, getUserByToken);

// Routes with parameters - also protected
UserRouter.get("/:id", verifyJWT, getUserById);
UserRouter.put("/:id", verifyJWT, updateUser);
UserRouter.delete("/:id", verifyJWT, deleteUser);

export default UserRouter;
