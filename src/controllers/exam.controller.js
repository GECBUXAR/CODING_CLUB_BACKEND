import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiRespons from "../utils/ApiRespons.js";
const createExam = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxParticipants,
      registrationFee,
      location,
      organizer,
      category,
      tags,
      isPublic,
    } = req.body;
    const exam = await Event.create({
      title,
      description,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxParticipants,
      registrationFee,
      location,
      organizer,
      category,
      tags,
      isPublic,
    });
    return res.status(201).json({
      status: "success",
      data: exam,
      message: "exam created successfully",
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error creating exam");
  }
});
const getExam = asyncHandler(async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Event.findById(examId);
    if (!exam) {
      throw new ApiError(404, "exam not found");
    }
    return res.status(200).json({
      status: "success",
      data: exam,
      message: "exam retrieved successfully",
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error retrieving exam");
  }
});

export { createExam, getExam };
