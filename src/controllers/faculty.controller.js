<<<<<<< HEAD:src/controllers/faculty.controller.js
import Faculty from "../models/faculty.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiRespons from "../utils/ApiRespons.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
});

/**
 * Get all faculty members
 * Access: Public
 */
export const getAllFaculty = asyncHandler(async (req, res) => {
  try {
    const { format } = req.query;
    const faculty = await Faculty.find().sort({ name: 1 });

    // If testimonials format is requested, transform the data
    if (format === "testimonials") {
      const testimonials = faculty
        .filter((f) => f.testimonial || f.quote) // Only include faculty with testimonials
        .map((f) => ({
          id: `testimonial-${f._id}`,
          name: f.name,
          role: f.designation || f.role,
          quote: f.testimonial || f.quote,
          imageSrc: f.profileImage || f.imgUrl,
          altText: `${f.name}, ${f.designation || f.role}`,
        }));

      return res.status(200).json({
        status: "success",
        data: testimonials,
      });
    }

    // Regular faculty data format
    return res.status(200).json({
      status: "success",
      data: faculty,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error fetching faculty data");
  }
});

/**
 * Get testimonials from faculty
 * Access: Public
 */
export const getTestimonials = asyncHandler(async (req, res) => {
  try {
    // Get faculty members who have testimonials
    const faculty = await Faculty.find({
      testimonial: { $exists: true, $ne: "" },
    }).sort({ name: 1 });

    // Format testimonials data
    const testimonials = faculty.map((f) => ({
      id: `testimonial-${f._id}`,
      name: f.name,
      role: f.designation,
      quote: f.testimonial,
      imageSrc: f.profileImage,
      altText: `${f.name}, ${f.designation}`,
    }));

    return res.status(200).json({
      status: "success",
      data: testimonials,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error fetching testimonials");
  }
});

/**
 * Get faculty member by ID
 * Access: Public
 */
export const getFacultyById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findById(id);

    if (!faculty) {
      throw new ApiError(404, "Faculty member not found");
    }

    return res.status(200).json({
      status: "success",
      data: faculty,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching faculty member"
    );
  }
});

/**
 * Create a new faculty member
 * Access: Admin only
 */
export const createFaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { name, email, role, status, type, quote, imgUrl, joinDate } =
        req.body;

      // Check for required fields
      if (!name || !email || !role) {
        throw new ApiError(400, "Name, email, and role are required fields");
      }

      // Check if faculty member with the same email already exists
      const existingFaculty = await Faculty.findOne({ email });
      if (existingFaculty) {
        throw new ApiError(
          409,
          "Faculty member with this email already exists"
        );
      }

      // Create new faculty member
      const newFaculty = await Faculty.create({
        name,
        email,
        role,
        status: status || "active",
        type: type || "faculty",
        quote,
        imgUrl,
        joinDate: joinDate || new Date(),
      });

      return res.status(201).json({
        status: "success",
        data: newFaculty,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error creating faculty member"
      );
=======
import Faculty from "../model/faculty.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiRespons from "../utils/ApiRespons.js";
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
  asyncHandler(async (req, res) => {
    try {
      const facultys = await Faculty.find().sort({ createdAt: -1 });

      return res
        .status(200)
        .ApiRespons(
          "successfully fetched all faculty",
          facultys.length,
          facultys
        );
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
>>>>>>> 66e2afac091ba58ade411718f28233c14ccf18d6:src/controller/faculty.controller.js
    }
  }),
];

<<<<<<< HEAD:src/controllers/faculty.controller.js
/**
 * Update a faculty member
 * Access: Admin only
 */
export const updateFaculty = [
=======
// Create faculty (admin only)
export const createfaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { name, role, content } = req.body;

      if (!name || !role || !content) {
        return res.status(400).json({
          status: "error",
          message: "Name, role, and content are required fields",
        });
      }
      let imageUrl = null;
      if (req.files?.image?.[0]) {
        imageUrl = await uploadOnCloudinary(req.files.image[0].buffer);
      }

      const faculty = await Faculty.create({
        name,
        role,
        content,
        image: imageUrl || "",
        isActive: true,
      });

      return res
        .status(201)
        .ApiRespons("Faculty created successfully", faculty);
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

//get faculty by name

export const getFacultyByName = [
  asyncHandler(async (req, res) => {
    try {
      const { name } = req.body;
      const faculty = await Faculty.find(name);
      if (!faculty) {
        return new ApiError(404, "faculty not found with this name ");
      }
      return res.status(200).ApiRespons(200, "faculty found", faculty);
    } catch (error) {
      return new ApiError(500, error);
    }
  }),
];

// Update faculty (admin only)
export const updatefaculty = [
>>>>>>> 66e2afac091ba58ade411718f28233c14ccf18d6:src/controller/faculty.controller.js
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
<<<<<<< HEAD:src/controllers/faculty.controller.js
      const { name, email, role, status, type, quote, imgUrl, joinDate } =
        req.body;

      // Find and update the faculty member
      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        {
          name,
          email,
          role,
          status,
          type,
          quote,
          imgUrl,
          joinDate,
        },
        { new: true, runValidators: true }
      );

      if (!updatedFaculty) {
        throw new ApiError(404, "Faculty member not found");
      }

      return res.status(200).json({
        status: "success",
        data: updatedFaculty,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error updating faculty member"
      );
    }
  }),
];

/**
 * Delete a faculty member
 * Access: Admin only
 */
export const deleteFaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const deletedFaculty = await Faculty.findByIdAndDelete(id);

      if (!deletedFaculty) {
        throw new ApiError(404, "Faculty member not found");
      }

      return res.status(200).json({
        status: "success",
        message: "Faculty member deleted successfully",
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error deleting faculty member"
      );
    }
  }),
];

/**
 * Update faculty member status
 * Access: Admin only
 */
export const updateFacultyStatus = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["active", "inactive", "pending"].includes(status)) {
        throw new ApiError(400, "Valid status is required");
      }

      const updatedFaculty = await Faculty.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedFaculty) {
        throw new ApiError(404, "Faculty member not found");
=======
      const { name, role, content, rating, image, isActive } = req.body;

      const faculty = await Faculty.findByIdAndUpdate(
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
>>>>>>> 66e2afac091ba58ade411718f28233c14ccf18d6:src/controller/faculty.controller.js
      }

      return res.status(200).json({
        status: "success",
<<<<<<< HEAD:src/controllers/faculty.controller.js
        data: updatedFaculty,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error updating faculty status"
      );
=======
        data: faculty,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
>>>>>>> 66e2afac091ba58ade411718f28233c14ccf18d6:src/controller/faculty.controller.js
    }
  }),
];

<<<<<<< HEAD:src/controllers/faculty.controller.js
/**
 * Search faculty members by name or email
 * Access: Public
 */
export const searchFaculty = asyncHandler(async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return getAllFaculty(req, res);
    }

    const faculty = await Faculty.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { role: { $regex: query, $options: "i" } },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: faculty,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error searching faculty members");
  }
});
=======
// Delete faculty (admin only)
export const deletefaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const faculty = await Faculty.findByIdAndDelete(id);

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
>>>>>>> 66e2afac091ba58ade411718f28233c14ccf18d6:src/controller/faculty.controller.js
