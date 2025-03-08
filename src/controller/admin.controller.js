import { Admin } from "../model/admin.model.js";
import Event from "../model/event.model.js";
import nodemailer from "nodemailer";
import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiRespons from "../utils/ApiRespons.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import { generateAccessToken } from "../utils/generateToken.js";
import { generateRefreshToken } from "../utils/generateToken.js";

const generateAccessRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genreting RefreshToken and AccessToken "
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

  const isPasswordValid = await bcrypt.compare(password, admin.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    admin._id
  );

  const loggedInAdmin = await Admin.findById(admin._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
  };
  // const adminToSend = admin.toObject();
  // delete adminToSend.password;
  // delete adminToSend.refreshToken;

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
    req.admin._id,
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
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json(error);
  }
  try {
    const subscribedUsers = await User.find({ isSubscribed: true });
    const emails = subscribedUsers.map((user) => user.email).join(",");

    // Email notification logic
    const mailOptions = {
      from: "your-email@gmail.com",
      to: emails, // Send to all subscribed users
      subject: "New Event Added",
      text: `A new event has been added: ${JSON.stringify(eventDetails)}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Error sending email");
      }
      res.status(200).send("Event created and email sent to subscribers.");
    });
  } catch (error) {
    res.status(500).send("Error retrieving subscribed users.");
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
