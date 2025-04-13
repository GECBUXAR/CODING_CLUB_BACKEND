import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import ApiError from "./ApiError.js";

/**
 * Generate a secure token ID for tracking token revocation
 * @returns {string} A random token ID
 */
export const generateTokenId = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Generate access and refresh tokens with enhanced security
 * @param {Object} user - User or Admin document
 * @returns {Object} Object containing accessToken and refreshToken
 */
export const generateTokens = async (user) => {
  try {
    // Generate a unique token ID for this token pair
    const tokenId = generateTokenId();

    // Current timestamp for token creation
    const issuedAt = Math.floor(Date.now() / 1000);

    // Access token with additional security claims
    const accessToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        tokenId,
        iat: issuedAt,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h",
        audience: "coding-club-api",
        issuer: "coding-club-auth",
      }
    );

    // Refresh token with minimal claims
    const refreshToken = jwt.sign(
      {
        id: user._id,
        tokenId,
        iat: issuedAt,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
        audience: "coding-club-api",
        issuer: "coding-club-auth",
      }
    );

    // Store the token ID and expiry in the user document
    // This allows for token revocation
    const tokenData = {
      tokenId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    // Update the user's refresh token
    if (user.role === "admin") {
      await Admin.findByIdAndUpdate(
        user._id,
        { refreshToken: tokenData.refreshToken },
        { new: true }
      );
    } else {
      await User.findByIdAndUpdate(
        user._id,
        { refreshToken: tokenData.refreshToken },
        { new: true }
      );
    }

    return { accessToken, refreshToken, tokenId };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating authentication tokens"
    );
  }
};

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @param {string} secret - The secret key to use for verification
 * @returns {Object} The decoded token payload
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret, {
      audience: "coding-club-api",
      issuer: "coding-club-auth",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }
    throw new ApiError(401, "Token validation failed");
  }
};

/**
 * Refresh an access token using a refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Object} Object containing new accessToken and refreshToken
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decodedToken = verifyToken(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find the user by ID
    let user = await User.findById(decodedToken.id);

    // If not a regular user, try to find an admin
    if (!user) {
      user = await Admin.findById(decodedToken.id);
    }

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify that the refresh token matches what's stored
    if (user.refreshToken !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Generate new tokens
    return await generateTokens(user);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid refresh token");
  }
};

/**
 * Invalidate a user's tokens (logout)
 * @param {string} userId - The user ID
 * @param {string} role - The user role (user or admin)
 */
export const invalidateTokens = async (userId, role) => {
  try {
    if (role === "admin") {
      await Admin.findByIdAndUpdate(
        userId,
        { refreshToken: null },
        { new: true }
      );
    } else {
      await User.findByIdAndUpdate(
        userId,
        { refreshToken: null },
        { new: true }
      );
    }
  } catch (error) {
    console.error("Token invalidation error:", error);
    throw new ApiError(500, "Failed to invalidate tokens");
  }
};

export default {
  generateTokens,
  verifyToken,
  refreshAccessToken,
  invalidateTokens,
  generateTokenId,
};
