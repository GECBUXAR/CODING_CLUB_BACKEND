import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiRespons from "../utils/ApiRespons.js";

// Middleware to check if user is admin
const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.");
  }
  next();
});

/**
 * Get all events (both regular events and exams)
 * Access: Public
 */
export const getAllEvents = asyncHandler(async (req, res) => {
  try {
    const { category, status, isExam, skillLevel } = req.query;

    // Build filter object based on query parameters
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (isExam !== undefined) filter.isExam = isExam === "true";
    if (skillLevel) filter.skillLevel = skillLevel;

    const events = await Event.find(filter)
      .sort({ date: -1 })
      .select("-questions -results"); // Don't send all questions and results in listing

    return res.status(200).json({
      status: "success",
      count: events.length,
      data: events,
    });
  } catch (error) {
    throw new ApiError(500, error.message || "Error fetching events");
  }
});

/**
 * Get event by ID
 * Access: Public
 */
export const getEventById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    return res.status(200).json({
      status: "success",
      data: event,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching event"
    );
  }
});

/**
 * Create a new event
 * Access: Admin only
 */
export const createEvent = [
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
        isExam,
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

      // Create the event
      const newEvent = await Event.create({
        title,
        description,
        date,
        location,
        category,
        skillLevel,
        speakers,
        isExam: isExam || false,
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
        data: newEvent,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error creating event"
      );
    }
  }),
];

/**
 * Update an event
 * Access: Admin only
 */
export const updateEvent = [
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
        isExam,
        examDetails,
        status,
        image,
        attachments,
        capacity,
        isRegistrationRequired,
        isFeatured,
        tags,
      } = req.body;

      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          title,
          description,
          date,
          location,
          category,
          skillLevel,
          speakers,
          isExam,
          examDetails,
          status,
          image,
          attachments,
          capacity,
          isRegistrationRequired,
          isFeatured,
          tags,
        },
        { new: true, runValidators: true }
      );

      if (!updatedEvent) {
        throw new ApiError(404, "Event not found");
      }

      return res.status(200).json({
        status: "success",
        data: updatedEvent,
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error updating event"
      );
    }
  }),
];

/**
 * Delete an event
 * Access: Admin only
 */
export const deleteEvent = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const deletedEvent = await Event.findByIdAndDelete(id);

      if (!deletedEvent) {
        throw new ApiError(404, "Event not found");
      }

      // Also delete related questions and results
      await Question.deleteMany({ event: id });
      await Result.deleteMany({ event: id });

      return res.status(200).json({
        status: "success",
        message: "Event deleted successfully",
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error deleting event"
      );
    }
  }),
];

/**
 * Get all questions for an event
 * Access: Depends on the event status
 */
export const getEventQuestions = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate("questions");

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    // If exam and not admin, check if user can access questions
    if (event.isExam && req.user?.role !== "admin") {
      // Check if exam is open
      if (!event.examDetails?.isOpen) {
        throw new ApiError(403, "This exam is not currently open");
      }

      // Check if user is registered
      const isRegistered = event.participants.some(
        (p) => p.user.toString() === req.user._id.toString()
      );

      if (!isRegistered) {
        throw new ApiError(403, "You are not registered for this exam");
      }
    }

    return res.status(200).json({
      status: "success",
      count: event.questions.length,
      data: event.questions,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching event questions"
    );
  }
});

/**
 * Register for an event
 * Access: Authenticated users
 */
export const registerForEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    // Check if registration is required
    if (!event.isRegistrationRequired) {
      throw new ApiError(400, "Registration is not required for this event");
    }

    // Check if event is full
    if (event.capacity && event.participants.length >= event.capacity) {
      throw new ApiError(400, "This event is already at full capacity");
    }

    // Check if user is already registered
    const isAlreadyRegistered = event.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (isAlreadyRegistered) {
      throw new ApiError(400, "You are already registered for this event");
    }

    // Add user to participants
    event.participants.push({
      user: req.user._id,
      registeredAt: new Date(),
    });

    await event.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully registered for the event",
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error registering for event"
    );
  }
});

/**
 * Unregister from an event
 * Access: Authenticated users
 */
export const unregisterFromEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    // Remove user from participants
    event.participants = event.participants.filter(
      (p) => p.user.toString() !== req.user._id.toString()
    );

    await event.save();

    return res.status(200).json({
      status: "success",
      message: "Successfully unregistered from the event",
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error unregistering from event"
    );
  }
});

/**
 * Mark attendance for an event
 * Access: Admin only
 */
export const markAttendance = [
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, attended } = req.body;

      if (!userId) {
        throw new ApiError(400, "User ID is required");
      }

      const event = await Event.findById(id);

      if (!event) {
        throw new ApiError(404, "Event not found");
      }

      // Find the participant
      const participantIndex = event.participants.findIndex(
        (p) => p.user.toString() === userId
      );

      if (participantIndex === -1) {
        throw new ApiError(404, "User is not registered for this event");
      }

      // Update attendance
      event.participants[participantIndex].attended = attended || false;

      await event.save();

      return res.status(200).json({
        status: "success",
        message: "Attendance marked successfully",
      });
    } catch (error) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Error marking attendance"
      );
    }
  }),
];

/**
 * Submit feedback for an event
 * Access: Authenticated users
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    if (!feedback || !rating) {
      throw new ApiError(400, "Feedback and rating are required");
    }

    const event = await Event.findById(id);

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    // Find the participant
    const participantIndex = event.participants.findIndex(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      throw new ApiError(404, "You are not registered for this event");
    }

    // Update feedback
    event.participants[participantIndex].feedback = feedback;
    event.participants[participantIndex].rating = rating;

    await event.save();

    return res.status(200).json({
      status: "success",
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error submitting feedback"
    );
  }
});

/**
 * Search events
 * Access: Public
 */
export const searchEvents = asyncHandler(async (req, res) => {
  try {
    const { query, category, isExam } = req.query;

    // Build search filter
    const filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (isExam !== undefined) {
      filter.isExam = isExam === "true";
    }

    const events = await Event.find(filter)
      .sort({ date: -1 })
      .select("-questions -results");

    return res.status(200).json({
      status: "success",
      count: events.length,
      data: events,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error searching events"
    );
  }
});

/**
 * Get upcoming events
 * Access: Public
 */
export const getUpcomingEvents = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();

    const events = await Event.find({
      date: { $gte: currentDate },
      status: { $in: ["published", "upcoming"] },
    })
      .sort({ date: 1 })
      .limit(5)
      .select("-questions -results");

    return res.status(200).json({
      status: "success",
      count: events.length,
      data: events,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching upcoming events"
    );
  }
});

/**
 * Get user's registered events
 * Access: Authenticated users
 */
export const getUserEvents = asyncHandler(async (req, res) => {
  try {
    const events = await Event.find({
      "participants.user": req.user._id,
    })
      .sort({ date: -1 })
      .select("-questions -results");

    return res.status(200).json({
      status: "success",
      count: events.length,
      data: events,
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error fetching user events"
    );
  }
});
