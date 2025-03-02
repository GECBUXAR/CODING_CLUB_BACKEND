import User from "../model/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
export const createUser = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      registrationNumber,
      branch,
      semester,
      password,
    } = req.body;
    const existedUserGmail = await User.findOne({ email });
    if (existedUserGmail) {
      return res.status(409).json({ message: "User already exists with this email." });
    }
    const existedUserRegistrationNumber = await User.findOne({ registrationNumber });
    if (existedUserRegistrationNumber) {
      return res.status(409).json({ message: "User already exists with this registration number." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      mobile,
      registrationNumber,
      branch,
      semester,
      password: hashedPassword,
    });
    const newCreatedUser = await User.findById(newUser._id).select("-password");
    res.status(200).json(newCreatedUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "User does not exist with this email Id " });
    }
    
    const matchPassword = await bcrypt.compare(password,user.password);
    if (!matchPassword) {
      return res
        .status(401)
        .json({ message: "Invalid  password" });
    }
    const loggedInUser = await User.findById(user._id).select(
      "-password"
    );
    res.status(200).json(loggedInUser);
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send();
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);
    if (!user) {
      return res.status(404).send();
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send();
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const subscribe = asyncHandler(async (req, res) => {
  const userEmail = req.body.email;
  try {
    const User = await User.findOneAndUpdate(
      { email: userEmail },
      { isSubscribed: true },
      { new: true, upsert: true }
    );

    res.status(200).send("Subscription successful.");
  } catch (error) {
    res.status(500).send("Error subscribing user.");
  }
});
