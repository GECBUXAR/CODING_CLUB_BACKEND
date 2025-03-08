import Result from "../model/result.model.js";
import User from "../model/user.model.js";
import Event from "../model/event.model.js";
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

export const getResultsByEventTitle = asyncHandler(async (req, res) => {
  const { eventTitle } = req.body;

  if (!eventTitle) {
    return res.status(400).json({
      status: "error",
      message: "Event title is required",
    });
  }

  const event = await Event.findOne({ title: eventTitle });
  if (!event) {
    return res.status(404).json({
      status: "error",
      message: "Event not found",
    });
  }

  const results = await Result.find({ eventId: event._id })
    .populate("userId", "name email registrationNumber")
    .sort({ score: -1 });

  return res.status(200).json({
    status: "success",
    data: results,
  });
});

export const createResult = [
  isAdmin,
  asyncHandler(async (req, res) => {
    const { score, userId, eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    const result = new Result({ score, userId, eventId });
    await result.save();

    await Event.findByIdAndUpdate(
      eventId,
      { $push: { results: result._id } },
      { new: true }
    );

    return res.status(201).json({
      status: "success",
      data: result,
    });
  }),
];

export const getAllResults = asyncHandler(async (req, res) => {
  const results = await Result.find()
    .populate("userId", "name email registrationNumber")
    .populate("eventId", "title");

  return res.status(200).json({
    status: "success",
    data: results,
  });
});

export const getResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await Result.findById(id)
    .populate("userId", "name email registrationNumber")
    .populate("eventId", "title");

  if (!result) {
    return res.status(404).json({
      status: "error",
      message: "Result not found",
    });
  }

  return res.status(200).json({
    status: "success",
    data: result,
  });
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
    )
      .populate("userId", "name email registrationNumber")
      .populate("eventId", "title");

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Result not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: result,
    });
  }),
];

export const deleteResult = [
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Result not found",
      });
    }

    await Event.findByIdAndUpdate(result.eventId, {
      $pull: { results: id },
    });

    await Result.findByIdAndDelete(id);

    return res.status(200).json({
      status: "success",
      message: "Result deleted successfully",
    });
  }),
];
