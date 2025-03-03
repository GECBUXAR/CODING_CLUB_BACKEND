import User from "../model/user.model.js";
import  asyncHandler  from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import {generateAccessToken} from "../utils/generateToken.js";
import {generateRefreshToken} from "../utils/generateToken.js";
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


    if (!name || !email || !mobile || !registrationNumber || !branch || !semester || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields.");
  }

    const existingUser = await User.findOne({ $or: [{ email }, { registrationNumber }] });
  if (existingUser) {
    res.status(409);
    throw new Error("User already exists with this email or registration number.");
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


    const userToSend = newUser.toObject();
    delete userToSend.password;

    res.status(200).json(userToSend);
  } catch (error) {
    // console.log(error);
    res.status(400).send(error);
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email Id " });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid  password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    const options = {
      httpOnly: true,
      secure: true,
    };

    const userToSend = user.toObject();
    delete userToSend.password;
    delete userToSend.refreshToken;

    res.status(200)
      .cookie("accessToken", accessToken, options)
      .json({User:userToSend,accessToken});
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.log(error);
    
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
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
