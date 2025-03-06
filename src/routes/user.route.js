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
} from "../controller/user.controller.js";

const UserRouter = express.Router();

UserRouter.get("/AllUsers", getAllUsers);
UserRouter.get("/:id", getUserById);
UserRouter.post("/signup", createUser);
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", logOutUser);
UserRouter.put("/:id", updateUser);
UserRouter.delete("/:id", deleteUser);
UserRouter.post("/subscribe", subscribe);

export default UserRouter;
