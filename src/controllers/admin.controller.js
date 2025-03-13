import { Admin } from "../models/admin.model.js";
import Event from "../models/event.model.js";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiRespons from "../utils/ApiRespons.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

const generateAccessRefreshToken = async (adminID) => {
  try {
    const admin = await Admin.findById(adminID);
    // Use the admin model's methods for token generation
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();

    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating RefreshToken and AccessToken"
    );
  }
};

export const createAdmin = asyncHandler(async (req, res) => {
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

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password, secretKey } = req.body;

  if (!email || !password || !secretKey) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (secretKey !== process.env.ADMINSECRETKEY) {
    return res.status(403).json({ message: "Invalid secret key." });
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found." });
  }

  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    admin._id
  );

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  // Ensure the role is set to admin
  loggedInAdmin.role = "admin";

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespons(
        200,
        { user: loggedInAdmin, accessToken, refreshToken },
        "Admin logged In Successfully"
      )
    );
});

export const logOutAdmin = asyncHandler(async (req, res) => {
  await Admin.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespons(200, {}, "User logged out Successfully"));
});

export const createEvent = asyncHandler(async (req, res) => {
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

export const updateEvent = asyncHandler(async (req, res) => {
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

export const deleteEvent = asyncHandler(async (req, res) => {
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

export const getEvents = asyncHandler(async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

export const getEventById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

export const getAdminProfile = asyncHandler(async (req, res) => {
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
