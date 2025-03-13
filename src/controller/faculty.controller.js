import faculty from "../model/faculty.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
});



// Get all facultys (admin only)
export const getAllfacultys = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const facultys = await faculty.find().sort({ createdAt: -1 });

      return res.status(200).json({
        status: "success",
        count: facultys.length,
        data: facultys,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Create faculty (admin only)
export const createfaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { name, role, content } = req.body;

      if (!name || !role || !content ) {
        return res.status(400).json({
          status: "error",
          message: "Name, role, and content are required fields",
        });
      }
      let imageUrl = null;
      if(req.files?.image?.[0]){
        imageUrl = await uploadOnCloudinary(req.files.image[0].buffer);
      }

      const faculty = await faculty.create({
        name,
        role,
        content,
        image: imageUrl || "",
        isActive: true,
      });

      return res.status(201).json({
        status: "success",
        data: faculty,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Update faculty (admin only)
export const updatefaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, content, rating, image, isActive } = req.body;

      const faculty = await faculty.findByIdAndUpdate(
        id,
        {
          name,
          role,
          content,
          rating,
          image,
          isActive,
        },
        { new: true }
      );

      if (!faculty) {
        return res.status(404).json({
          status: "error",
          message: "faculty not found",
        });
      }

      return res.status(200).json({
        status: "success",
        data: faculty,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Delete faculty (admin only)
export const deletefaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const faculty = await faculty.findByIdAndDelete(id);

      if (!faculty) {
        return res.status(404).json({
          status: "error",
          message: "faculty not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "faculty deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];
