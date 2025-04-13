import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiRespons from "../utils/ApiRespons.js";
import ApiError from "../utils/ApiError.js";
import {
  generateTokens,
  verifyToken,
  invalidateTokens,
} from "../utils/tokenManager.js";

// This function is now replaced by the tokenManager.js utility

export const createUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    registrationNumber,
    branch,
    semester,
    role,
  } = req.body;

  console.log("Registration data received:", req.body);

  if (
    !fullName ||
    !email ||
    !phoneNumber ||
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

  const newUser = await User.create({
    name: fullName,
    email,
    mobile: phoneNumber,
    registrationNumber,
    branch,
    semester,
    password,
    role: role || "user",
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(new ApiRespons(200, createdUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find the user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Generate tokens with enhanced security
  const { accessToken, refreshToken, tokenId } = await generateTokens(user);

  // Get user data without sensitive information
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Configure cookie options based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: isProduction ? "none" : "lax", // Use 'none' in production for cross-site requests
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespons(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          tokenId, // Include tokenId for potential client-side token management
        },
        "User logged in successfully"
      )
    );
});

export const logOutUser = asyncHandler(async (req, res) => {
  // Invalidate tokens using the token manager
  await invalidateTokens(req.user._id, req.user.role || "user");

  // Configure cookie options based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction, // Only use secure in production
    sameSite: isProduction ? "none" : "lax", // Use 'none' in production for cross-site requests
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
    .json(new ApiRespons(200, {}, "User logged out successfully"));
});

// New endpoint specifically for getting the user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    // User is already authenticated via verifyJWT middleware
    // Just return the user data from req.user
    if (!req.user) {
      throw new ApiError(401, "Authentication required. Please login.");
    }

    return res
      .status(200)
      .json(new ApiRespons(200, req.user, "User profile fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Authentication required. Please login.");
  }
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

export const getUserByToken = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new ApiError(404, "Token not found");
    }

    // Use the enhanced token verification
    const decoded = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiRespons(200, user, "User retrieved successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired token");
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      mobile,
      registrationNumber,
      branch,
      semester,
      isSubscribed,
    } = req.body;

    if (!id) {
      return res.status(404).json(new ApiRespons(404, "User ID is required"));
    }
    const updatedField = {};
    if (name) {
      updatedField.name = name;
    }
    if (email) updatedField.email = email;
    if (mobile) updatedField.mobile = mobile;
    if (registrationNumber)
      updatedField.registrationNumber = registrationNumber;
    if (branch) updatedField.branch = branch;
    if (semester) updatedField.semester = semester;
    if (isSubscribed) updatedField.isSubscribed = isSubscribed;
    const updatedUser = await user
      .findByIdAndUpdate(
        id,
        {
          $set: updatedField,
        },
        {
          new: true,
        }
      )
      .select("-password");
    res.status(200).json(updatedUser, "user updated successfully");
  } catch (error) {
    res.status(400).send(error);
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const id = req.body;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json(404, "user not found");
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
