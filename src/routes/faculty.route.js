import express from "express";
import {
  getAllfacultys,
  createfaculty,
  updatefaculty,
  deletefaculty,
  getFacultyByName,
} from "../controller/faculty.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/getAllfaculty", getAllfacultys);
router.post("/getFacultyByName",getFacultyByName);
// Protected routes (admin only)
router.post("/createfaculty", verifyJWT, createfaculty);
router.put("/updatefaculty/:id", verifyJWT, updatefaculty);
router.delete("/delfaculty/:id", verifyJWT, deletefaculty);

export default router;
