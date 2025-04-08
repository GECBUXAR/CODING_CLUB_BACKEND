import Faculty from "../models/faculty.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiRespons from "../utils/ApiRespons.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
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
    }
  }),
];

/**
 * Update a faculty member
 * Access: Admin only
 */
export const updateFaculty = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
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
      }

      return res.status(200).json({
        status: "success",
        data: updatedFaculty,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error updating faculty status"
      );
    }
  }),
];

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
