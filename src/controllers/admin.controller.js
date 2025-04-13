import { Admin } from "../models/admin.model.js";
import Event from "../models/event.model.js";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiRespons from "../utils/ApiRespons.js";
import ApiError from "../utils/ApiError.js";
import { generateTokens, invalidateTokens } from "../utils/tokenManager.js";

// This function is now replaced by the tokenManager.js utility

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, secretKey } = req.body;

  if (!name || !email || !password || !secretKey) {
    throw new ApiError(400, "Please fill in all required fields.");
  }

  if (secretKey !== process.env.ADMINSECRETKEY) {
    throw new ApiError(400, "Invalid secret key.");
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new ApiError(409, "User already exists with this email");
  }

  const newAdmin = await Admin.create({
    name,
    email,
    password,
    role: "admin",
  });

  const createdAdmin = await Admin.findById(newAdmin._id).select(
    " -password -refreshToken "
  );

  if (!createdAdmin) {
    throw new ApiError(500, "something went wrong while SignUp the admin");
  }

  return res
    .status(200)
    .json(new ApiRespons(200, createdAdmin, "Admin registerd Successfully"));
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password, secretKey } = req.body;

  // Input validation
  if (!email || !password || !secretKey) {
    throw new ApiError(400, "All fields are required");
  }

  // Verify admin secret key
  if (secretKey !== process.env.ADMINSECRETKEY) {
    throw new ApiError(403, "Invalid secret key");
  }

  // Find the admin
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  // Verify password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Generate tokens with enhanced security
  const { accessToken, refreshToken, tokenId } = await generateTokens(admin);

  // Get admin data without sensitive information
  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  // Ensure the role is set to admin
  loggedInAdmin.role = "admin";

  // Configure cookie options
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespons(
        200,
        {
          user: loggedInAdmin,
          accessToken,
          refreshToken,
          tokenId, // Include tokenId for potential client-side token management
        },
        "Admin logged in successfully"
      )
    );
});

const logOutAdmin = asyncHandler(async (req, res) => {
  // Invalidate tokens using the token manager
  await invalidateTokens(req.user._id, "admin");

  // Configure cookie options
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespons(200, {}, "Admin logged out successfully"));
});

const createEvent = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const {
      title,
      description,
      date,
      location,
      category,
      skillLevel,
      speakers,
      isExam,
    } = req.body;
    const event = new Event({
      title,
      description,
      date,
      location,
      category,
      skillLevel,
      speakers,
      isExam,
    });
    await event.save();

    // Try to send email notifications to subscribed users
    try {
      const subscribedUsers = await User.find({ isSubscribed: true });

      // Only proceed if there are subscribed users
      if (subscribedUsers && subscribedUsers.length > 0) {
        const emails = subscribedUsers.map((user) => user.email).join(",");

        // Create a transporter for nodemailer
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        // Email notification logic
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: emails, // Send to all subscribed users
          subject: "New Event Added",
          text: `A new event has been added: ${title}\n\nDescription: ${description}\nDate: ${date}\nLocation: ${location}`,
        };

        // Send email asynchronously without blocking the response
        transporter.sendMail(mailOptions).catch((err) => {
          console.error("Error sending email notification:", err);
        });
      }
    } catch (emailError) {
      // Log the error but don't fail the request
      console.error("Error with email notifications:", emailError);
    }

    // Return success response with the created event
    return res.status(201).json({
      status: "success",
      data: event,
      message: "Event created successfully",
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error creating event");
  }
});

const updateEvent = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { id } = req.params;
    const { title, description, date, location, isExam } = req.body;
    const event = await Event.findByIdAndUpdate(
      id,
      { title, description, date, location, isExam },
      { new: true }
    );
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

const deleteEvent = asyncHandler(async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

const getEvents = asyncHandler(async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

const getEventById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

const getAdminProfile = asyncHandler(async (req, res) => {
  try {
    // The user object is already attached to req by the verifyJWT middleware
    // and the isAdmin middleware ensures the user has admin role
    const admin = req.user;

    return res
      .status(200)
      .json(new ApiRespons(200, admin, "Admin profile fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error retrieving admin profile");
  }
});

// Check if a user is an admin by email (no authentication required)
const checkAdminByEmail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    // Check if the email belongs to an admin
    const admin = await Admin.findOne({ email });

    // Return whether the email belongs to an admin or not
    return res.status(200).json({
      success: true,
      isAdmin: !!admin, // Convert to boolean
      message: admin
        ? "Email belongs to an admin"
        : "Email does not belong to an admin",
    });
  } catch (error) {
    throw error.statusCode ? error : new ApiError(500, "Internal server error");
  }
});

export {
  getAdminProfile,
  getEventById,
  getEvents,
  updateEvent,
  deleteEvent,
  createEvent,
  createAdmin,
  loginAdmin,
  logOutAdmin,
  checkAdminByEmail,
};
