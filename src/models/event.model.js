import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    // Basic event information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        "workshop",
        "competition",
        "seminar",
        "hackathon",
        "exam",
        "quiz",
        "other",
      ],
    },
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"],
    },
    speakers: [
      {
        name: { type: String },
        bio: { type: String },
        image: { type: String },
      },
    ],

    // Flag to determine if this is an exam or a regular event
    isExam: {
      type: Boolean,
      default: false,
    },

    // Exam specific details
    examDetails: {
      duration: {
        type: Number, // Duration in minutes
        default: 60,
      },
      maxScore: {
        type: Number,
        default: 100,
      },
      passingScore: {
        type: Number,
        default: 40,
      },
      startTime: {
        type: Date,
      },
      endTime: {
        type: Date,
      },
      registrationDeadline: {
        type: Date,
      },
      isOpen: {
        type: Boolean,
        default: false,
      },
      allowedAttempts: {
        type: Number,
        default: 1,
      },
      examType: {
        type: String,
        enum: ["quiz", "coding", "practical", "theoretical", "mixed"],
        default: "quiz",
      },
      instructions: {
        type: String,
      },
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      showResultsImmediately: {
        type: Boolean,
        default: true,
      },
    },

    // Related models
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    results: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Result",
      },
    ],

    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        attended: {
          type: Boolean,
          default: false,
        },
        feedback: {
          type: String,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],

    // Event status
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "upcoming",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "draft",
    },

    // Media
    image: {
      type: String,
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
      },
    ],

    // Organizational details
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    capacity: {
      type: Number,
    },
    isRegistrationRequired: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

// Methods
eventSchema.methods.isRegistrationOpen = function () {
  if (this.examDetails?.registrationDeadline) {
    return new Date() < this.examDetails.registrationDeadline;
  }
  return new Date() < this.date;
};

eventSchema.methods.hasCapacity = function () {
  if (!this.capacity) return true;
  return (this.participants || []).length < this.capacity;
};

const Event = mongoose.model("Event", eventSchema);
export default Event;
