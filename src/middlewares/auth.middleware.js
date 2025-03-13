import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Users from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Prioritize cookie-based authentication
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // First try to find a user
    let user = await Users.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    // If no user found, try to find an admin
    if (!user) {
      user = await Admin.findById(decodedToken?.id).select(
        "-password -refreshToken"
      );
    }

    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});

// Middleware to check if user has admin role
export const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    // First verify that the user is authenticated
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if the user has admin role
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Access denied. Admin privileges required");
    }

    // If the user is an admin, continue
    next();
  } catch (error) {
    throw new ApiError(
      error.statusCode || 403,
      error.message || "Access denied. Admin privileges required"
    );
  }
});
