import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiRespons from "../utils/ApiRespons.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/generateToken.js";
import { generateRefreshToken } from "../utils/generateToken.js";

const generateAccessRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = generateAccessToken(userID);
    
    const refreshToken = generateRefreshToken(userID);

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

export const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    registrationNumber,
    branch,
    semester,
    password,
    isSubscribed
  } = req.body;

  if (
    !name ||
    !email ||
    !mobile ||
    !registrationNumber ||
    !branch ||
    !semester ||
    !password
  ) {
    throw new ApiError(400, "Please fill in all required fields.");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { registrationNumber }],
  });
  if (existingUser) {
    throw new ApiError(
      409,
      "User already exists with this email or registration number."
    );
  }

  // const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    mobile,
    registrationNumber,
    branch,
    semester,
    password,
    isSubscribed
  });

  // const userToSend = newUser.toObject();

  const createdUser = await User.findById(newUser._id).select(
    " -password -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while SignUp the user");
  }

  return res
    .status(200)
    .json(new ApiRespons(200, createdUser, "User registerd Successfully"));

  // res.status(200).json(userToSend)
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // console.log(req.body);

  const user = await User.findOne({ email });
  if (!user) {
    // return res.status(401).json({ message: "Invalid email Id " });
    throw new ApiError(404, "User not Found");
  }

  // const isPasswordValid = await bcrypt.compare(password, user.password);
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // const accessToken = generateAccessToken(user);
  // const refreshToken = generateRefreshToken(user);
  // user.refreshToken = refreshToken;
  // await user.save();

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    partitioned: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // const userToSend = user.toObject();
  // delete userToSend.password;
  // delete userToSend.refreshToken;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespons(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});

export const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
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

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).send();
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const getUserByToken = asyncHandler(async (req,res)=>{
 try {
   const {token} = req.body;
   if(!token){
     throw new ApiError(404,"token not found");
   }   
   const decode = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
   const user = await User.findById(decode.id).select("-password");
   
   return res.status(200).json(new ApiRespons(200,user))
 } catch (error) {
  throw new ApiError(401, error);
 }
})

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const {id,name,email,mobile,registrationNumber,branch,semester,isSubscribed} = req.body;
    
    if (!id) {
      return res.status(404).json(new ApiRespons(404,"User ID is required"));
    }
    const updatedField={};
    if(name){
      updatedField.name=name;
    }
    if(email)
      updatedField.email=email;
    if(mobile)
      updatedField.mobile=mobile;
    if(registrationNumber)
      updatedField.registrationNumber=registrationNumber;
    if(branch)
      updatedField.branch=branch;
    if(semester)
      updatedField.semester=semester;
    if(isSubscribed)
      updatedField.isSubscribed=isSubscribed;
    const updatedUser = await user.findByIdAndUpdate(
      id,{
        $set:updatedField
      },
      {
        new:true,
      }
    ).select("-password");
    res.status(200).json(updatedUser,"user updated successfully");
  } catch (error) {
    res.status(400).send(error);
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const id = req.body;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json(404,"user not found");
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

export const subscribe = asyncHandler(async (req, res) => {
  const userEmail = req.body.email;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { isSubscribed: true },
      { new: true, upsert: true }
    );

    res.status(200).send("Subscription successful.");
  } catch (error) {
    res.status(500).send("Error subscribing user.");
  }
});
// export const changePassword = asyncHandler(async(req,res)=>{
//   const {id,newpassword} = req.body;
// })
