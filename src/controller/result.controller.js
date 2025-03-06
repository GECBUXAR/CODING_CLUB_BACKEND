import Result from "../model/result.model.js";
import User from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
});

export const createResult = [
  isAdmin,
  asyncHandler(async (req, res) => {
    const { score, userId, eventId } = req.body;
    const result = new Result({ score, userId, eventId });
    await result.save();

    await Event.findByIdAndUpdate(
      event._id,
      { $push: { results: result } },
      { new: true }
    );

    res.status(201).json(result);
  }),
];

export const getAllResults = asyncHandler(async (req, res) => {
  const results = await Result.find();
  res.status(200).json(results);
});

export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await Result.findById(id);
  res.status(200).json(result);
});

export const updateResult = [
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { score, userId, eventId } = req.body;
    const result = await Result.findByIdAndUpdate(
      id,
      { score, userId, eventId },
      { new: true }
    );
    res.status(200).json(result);
  }),
];

export const deleteResult = [
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }
    await Event.findByIdAndUpdate(result.eventTitle, {
      $pull: { results: id },
    });

    await Result.findByIdAndDelete(id);
    res.status(200).json({ message: "Result deleted successfully" });
  }),
];
