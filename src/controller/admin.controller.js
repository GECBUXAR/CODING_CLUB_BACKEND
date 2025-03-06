import Admin from "../model/admin.model.js";
import Event from "../model/event.model.js";
import nodemailer from "nodemailer";
import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import bcrypt from 'bcryptjs';
import {generateAccessToken} from "../utils/generateToken.js";
import {generateRefreshToken} from "../utils/generateToken.js";
export const createAdmin = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    if (!name || !email || !password || !secretKey) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (secretKey !== process.env.ADMINSECRETKEY) {
      return res.status(403).json({ message: "Invalid secret key." });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });
    await admin.save();
    const adminToSend = admin.toObject();
    delete adminToSend.password;
    res.status(201).json(adminToSend);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
});

export const loginAdmin = asyncHandler(async (req, res) => {
  try {
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
      return res
        .status(401)
        .json({ message: "Invalid  password" });
    }
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);
    admin.refreshToken = refreshToken;
    await admin.save();
    const options = {
        httpOnly: true,
        secure: true,
      };
      const adminToSend = admin.toObject();
    delete adminToSend.password;
    delete adminToSend.refreshToken;
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json({Useradmin:adminToSend,accessToken});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error." },error);
  }
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
