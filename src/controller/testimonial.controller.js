import Testimonial from "../model/testimonial.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
});

// Get all active testimonials (public endpoint)
export const getAllTestimonials = asyncHandler(async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: "success",
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get all testimonials (admin only)
export const getAllTestimonialsAdmin = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const testimonials = await Testimonial.find().sort({ createdAt: -1 });

      return res.status(200).json({
        status: "success",
        count: testimonials.length,
        data: testimonials,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Create testimonial (admin only)
export const createTestimonial = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { name, role, content, rating, image } = req.body;

      if (!name || !role || !content) {
        return res.status(400).json({
          status: "error",
          message: "Name, role, and content are required fields",
        });
      }

      const testimonial = await Testimonial.create({
        name,
        role,
        content,
        rating: rating || 5,
        image: image || "",
        isActive: true,
      });

      return res.status(201).json({
        status: "success",
        data: testimonial,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Update testimonial (admin only)
export const updateTestimonial = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { name, role, content, rating, image, isActive } = req.body;

      const testimonial = await Testimonial.findByIdAndUpdate(
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

      if (!testimonial) {
        return res.status(404).json({
          status: "error",
          message: "Testimonial not found",
        });
      }

      return res.status(200).json({
        status: "success",
        data: testimonial,
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];

// Delete testimonial (admin only)
export const deleteTestimonial = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const testimonial = await Testimonial.findByIdAndDelete(id);

      if (!testimonial) {
        return res.status(404).json({
          status: "error",
          message: "Testimonial not found",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Testimonial deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }),
];
