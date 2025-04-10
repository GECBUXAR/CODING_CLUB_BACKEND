import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiRespons.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }
  next();
});

/**
 * Get all exams
 * Access: Public
 */
export const getAllExams = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      examType,
      skillLevel,
      page = 1,
      limit = 10,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    // Build filter object based on query parameters
    const filter = { isExam: true }; // Only get exams
    if (status) filter.status = status;
    if (examType) filter["examDetails.examType"] = examType;
    if (skillLevel) filter.skillLevel = skillLevel;

    // Parse pagination parameters
    const pageNum = Number.parseInt(page, 10);
    const limitNum = Number.parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Count total documents for pagination metadata
    const total = await Event.countDocuments(filter);

    // Get exams with pagination and sorting
    const exams = await Event.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("organizer", "name email")
      .select("-__v");

    return res.status(200).json({
      status: "success",
      count: exams.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: exams,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching exams"
    );
  }
});

/**
 * Get exam by ID
 * Access: Public
 */
export const getExamById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Event.findOne({ _id: id, isExam: true })
      .populate("organizer", "name email")
      .populate("participants.user", "name email")
      .select("-__v");

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    return res.status(200).json({
      status: "success",
      data: exam,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching exam details"
    );
  }
});

/**
 * Create a new exam
 * Access: Admin only
 */
export const createExam = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const {
        title,
        description,
        date,
        location,
        category,
        skillLevel,
        speakers,
        examDetails,
        status,
        image,
        attachments,
        capacity,
        isRegistrationRequired,
        isFeatured,
        tags,
      } = req.body;

      // Validate required fields
      if (!title || !description || !date) {
        throw new ApiError(
          400,
          "Title, description, and date are required fields"
        );
      }

      // Create the exam
      const newExam = await Event.create({
        title,
        description,
        date,
        location,
        category: category || "exam",
        skillLevel,
        speakers,
        isExam: true, // Always true for exams
        examDetails,
        status: status || "draft",
        image,
        attachments,
        capacity,
        isRegistrationRequired,
        isFeatured,
        tags,
        organizer: req.user._id,
      });

      return res.status(201).json({
        status: "success",
        data: newExam,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error creating exam"
      );
    }
  }),
];

/**
 * Update an exam
 * Access: Admin only
 */
export const updateExam = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        date,
        location,
        category,
        skillLevel,
        speakers,
        examDetails,
        status,
        image,
        attachments,
        capacity,
        isRegistrationRequired,
        isFeatured,
        tags,
      } = req.body;

      // Find the exam and ensure it's actually an exam
      const exam = await Event.findOne({ _id: id, isExam: true });

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      const updatedExam = await Event.findByIdAndUpdate(
        id,
        {
          title,
          description,
          date,
          location,
          category,
          skillLevel,
          speakers,
          examDetails,
          status,
          image,
          attachments,
          capacity,
          isRegistrationRequired,
          isFeatured,
          tags,
          // isExam remains true, cannot be changed
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        status: "success",
        data: updatedExam,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error updating exam"
      );
    }
  }),
];

/**
 * Delete an exam
 * Access: Admin only
 */
export const deleteExam = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      // Find the exam and ensure it's actually an exam
      const exam = await Event.findOne({ _id: id, isExam: true });

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      const deletedExam = await Event.findByIdAndDelete(id);

      // Also delete related questions and results
      await Question.deleteMany({ event: id });
      await Result.deleteMany({ event: id });

      return res.status(200).json({
        status: "success",
        message: "Exam deleted successfully",
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error deleting exam"
      );
    }
  }),
];

/**
 * Get all questions for an exam
 * Access: Depends on the exam status
 */
export const getExamQuestions = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Event.findOne({ _id: id, isExam: true }).populate(
      "questions"
    );

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // If not admin, check if user can access questions
    if (req.user?.role !== "admin") {
      // Check if exam is open
      if (!exam.examDetails?.isOpen) {
        throw new ApiError(403, "This exam is not currently open");
      }

      // Check if user is registered
      const isRegistered = exam.participants.some(
        (p) => p.user.toString() === req.user._id.toString()
      );

      if (!isRegistered) {
        throw new ApiError(403, "You are not registered for this exam");
      }
    }

    return res.status(200).json({
      status: "success",
      count: exam.questions.length,
      data: exam.questions,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching exam questions"
    );
  }
});

/**
 * Add a question to an exam
 * Access: Admin only
 */
export const addExamQuestion = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { question } = req.body;

      if (!question) {
        throw new ApiError(400, "Question data is required");
      }

      // Find the exam and ensure it's actually an exam
      const exam = await Event.findOne({ _id: id, isExam: true });

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      // Create the question
      const newQuestion = await Question.create({
        ...question,
        event: id,
      });

      // Add question to exam's questions array
      exam.questions.push(newQuestion._id);
      await exam.save();

      return res.status(201).json({
        status: "success",
        data: newQuestion,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error adding question to exam"
      );
    }
  }),
];

/**
 * Register for an exam
 * Access: Authenticated users
 */
export const registerForExam = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the exam and ensure it's actually an exam
    const exam = await Event.findOne({ _id: id, isExam: true });

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Check if registration is open
    if (exam.status !== "published") {
      throw new ApiError(400, "Registration is not open for this exam");
    }

    // Check if user is already registered
    const isRegistered = exam.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (isRegistered) {
      throw new ApiError(400, "You are already registered for this exam");
    }

    // Check if exam has reached capacity
    if (exam.capacity && exam.participants.length >= exam.capacity) {
      throw new ApiError(400, "This exam has reached its capacity");
    }

    // Add user to participants
    exam.participants.push({
      user: userId,
      registeredAt: new Date(),
      status: "registered",
    });

    await exam.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully registered for the exam",
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error registering for exam"
    );
  }
});

/**
 * Get all participants for an exam
 * Access: Admin only
 */
export const getExamParticipants = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      // Find the exam and ensure it's actually an exam
      const exam = await Event.findOne({ _id: id, isExam: true })
        .populate("participants.user", "name email")
        .select("participants");

      if (!exam) {
        throw new ApiError(404, "Exam not found");
      }

      return res.status(200).json({
        status: "success",
        count: exam.participants.length,
        data: exam.participants,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error fetching exam participants"
      );
    }
  }),
];

/**
 * Get exam results
 * Access: Admin or the participant
 */
export const getExamResults = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Find the exam and ensure it's actually an exam
    const exam = await Event.findOne({ _id: id, isExam: true });

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Build query based on user role
    const query = { event: id };
    if (!isAdmin) {
      query.user = userId;
    }

    // Get results
    const results = await Result.find(query)
      .populate("user", "name email")
      .select("-__v");

    return res.status(200).json({
      status: "success",
      count: results.length,
      data: results,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching exam results"
    );
  }
});

/**
 * Submit exam answers
 * Access: Registered participants
 */
export const submitExamAnswers = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    if (!answers || !Array.isArray(answers)) {
      throw new ApiError(400, "Answers must be provided as an array");
    }

    // Find the exam and ensure it's actually an exam
    const exam = await Event.findOne({ _id: id, isExam: true }).populate(
      "questions"
    );

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Check if exam is open
    if (!exam.examDetails?.isOpen) {
      throw new ApiError(400, "This exam is not currently open for submission");
    }

    // Check if user is registered
    const isRegistered = exam.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (!isRegistered) {
      throw new ApiError(403, "You are not registered for this exam");
    }

    // Check if user has already submitted the maximum allowed attempts
    const existingAttempts = await Result.countDocuments({
      event: id,
      user: userId,
    });

    if (existingAttempts >= (exam.examDetails?.allowedAttempts || 1)) {
      throw new ApiError(400, "You have reached the maximum allowed attempts");
    }

    // Calculate score
    let score = 0;
    const questionMap = {};

    // Create a map of questions for easy lookup
    exam.questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    // Process answers and calculate score
    const processedAnswers = answers.map((answer) => {
      const question = questionMap[answer.question.toString()];
      let isCorrect = false;

      if (question) {
        // Check if answer is correct based on question type
        if (
          question.type === "multiple-choice" ||
          question.type === "single-choice"
        ) {
          isCorrect = question.correctOptions.includes(answer.answer);
        } else if (question.type === "true-false") {
          isCorrect = question.correctAnswer === answer.answer;
        }

        // Add to score if correct
        if (isCorrect) {
          score += question.points || 1;
        }
      }

      return {
        ...answer,
        isCorrect,
      };
    });

    // Calculate percentage score
    const maxPossibleScore = exam.questions.reduce(
      (total, q) => total + (q.points || 1),
      0
    );
    const percentageScore =
      maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

    // Create result record
    const result = await Result.create({
      event: id,
      user: userId,
      answers: processedAnswers,
      score,
      maxScore: maxPossibleScore,
      percentageScore,
      passed: percentageScore >= (exam.examDetails?.passingScore || 40),
      submittedAt: new Date(),
    });

    // Update participant status in exam
    const participantIndex = exam.participants.findIndex(
      (p) => p.user.toString() === userId.toString()
    );

    if (participantIndex !== -1) {
      exam.participants[participantIndex].status = "completed";
      exam.participants[participantIndex].completedAt = new Date();
      await exam.save();
    }

    return res.status(201).json({
      status: "success",
      data: {
        result,
        showResults: exam.examDetails?.showResultsImmediately || false,
      },
      message: "Exam submitted successfully",
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error submitting exam answers"
    );
  }
});
