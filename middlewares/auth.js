import { User } from "../models/user.js";
import ErrorHandler from "../utils/error.js";
import jwt from "jsonwebtoken";
import { asyncError } from "./error.js";

export const isAuthenticated = asyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Not Logged In", 401));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined in environment variables");
    }

    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    // Check token expiration if applicable
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decodeData.exp && decodeData.exp < currentTimestamp) {
      throw new Error("Token expired");
    }

    req.user = await User.findById(decodeData._id);

    if (!req.user) {
      throw new ErrorHandler("User not found", 401);
    }

    next();
  } catch (error) {
    // Handle JWT verification or user retrieval errors
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

export const isAdmin = asyncError(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(new ErrorHandler("Admin Area Only ", 401));
  next();
});
