import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import Question from "../models/question.model.js";
import Result from "../models/result.model.js";
import UserAnswer from "../models/userAnswer.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiRespons.js";

/**
 * Submit exam answers
 * Access: Authenticated user who is registered for the exam
 */
export const submitExamAnswers = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user._id;

    if (!answers || !Array.isArray(answers)) {
      throw new ApiError(400, "Answers must be provided as an array");
    }

    // Find the exam and ensure it's actually an exam
    const exam = await Event.findOne({ _id: id, isExam: true }).populate("questions");

    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Check if exam is open
    if (exam.status !== "published" && exam.status !== "ongoing") {
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

    const maxAttempts = exam.examDetails?.allowedAttempts || 1;
    if (existingAttempts >= maxAttempts) {
      throw new ApiError(400, `You have reached the maximum allowed attempts (${maxAttempts})`);
    }

    // Calculate score
    let totalScore = 0;
    let maxPossibleScore = 0;
    const processedAnswers = [];
    const userAnswerDocs = [];

    // Create a map of questions for easy lookup
    const questionMap = {};
    exam.questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
      maxPossibleScore += (q.points || 1);
    });

    // Process each answer
    for (const answer of answers) {
      const questionId = answer.questionId || answer.question;
      if (!questionId) {
        continue; // Skip answers without question ID
      }

      const question = questionMap[questionId.toString()];
      if (!question) {
        continue; // Skip answers for questions not in this exam
      }

      let isCorrect = false;
      let pointsAwarded = 0;
      const questionPoints = question.points || 1;

      // Determine correctness based on question type
      switch (question.questionType) {
        case "mcq":
          // Single choice question
          isCorrect = question.correctOption === answer.chosenOption || 
                     (question.options && 
                      question.options.findIndex(opt => opt.isCorrect && opt.text === answer.chosenOption) >= 0);
          pointsAwarded = isCorrect ? questionPoints : 0;
          break;

        case "multiselect":
          // Multiple choice question
          if (Array.isArray(answer.chosenOptions) && Array.isArray(question.options)) {
            // Get all correct options
            const correctOptions = question.options
              .filter(opt => opt.isCorrect)
              .map(opt => opt.text);
            
            // Check if chosen options match correct options
            const correctCount = answer.chosenOptions.filter(opt => correctOptions.includes(opt)).length;
            const incorrectCount = answer.chosenOptions.length - correctCount;
            
            // Award partial points based on correct selections
            if (correctCount > 0 && incorrectCount === 0 && correctCount === correctOptions.length) {
              // All correct options selected and no incorrect ones
              isCorrect = true;
              pointsAwarded = questionPoints;
            } else if (correctCount > 0) {
              // Partial credit
              const partialPoints = (correctCount / correctOptions.length) * questionPoints;
              // Deduct for incorrect selections
              const deduction = (incorrectCount / question.options.length) * questionPoints;
              pointsAwarded = Math.max(0, partialPoints - deduction);
              isCorrect = pointsAwarded >= questionPoints * 0.5; // Consider correct if at least 50% points
            }
          }
          break;

        case "true/false":
          isCorrect = question.correctAnswer === answer.answerText;
          pointsAwarded = isCorrect ? questionPoints : 0;
          break;

        case "short answer":
        case "long answer":
        case "fill-in-blanks":
          // These require manual grading, so we mark them for review
          isCorrect = null; // Pending review
          pointsAwarded = null; // To be determined
          break;

        case "code":
          // Code answers require execution and testing, mark for review
          isCorrect = null; // Pending review
          pointsAwarded = null; // To be determined
          break;

        default:
          // Unknown question type
          isCorrect = false;
          pointsAwarded = 0;
      }

      // If the answer is automatically graded, add to total score
      if (pointsAwarded !== null) {
        totalScore += pointsAwarded;
      }

      // Create processed answer object
      const processedAnswer = {
        question: questionId,
        answerGiven: answer.chosenOption || answer.chosenOptions || answer.answerText || answer.codeAnswer,
        isCorrect,
        pointsAwarded,
        timeSpent: answer.timeSpent || null,
      };

      processedAnswers.push(processedAnswer);

      // Create UserAnswer document for detailed tracking
      const userAnswer = new UserAnswer({
        user: userId,
        question: questionId,
        event: id,
        answerText: answer.answerText,
        chosenOption: answer.chosenOption,
        chosenOptions: answer.chosenOptions,
        isCorrect,
        pointsAwarded,
        timeSpent: answer.timeSpent,
        codeLanguage: answer.codeLanguage,
        codeAnswer: answer.codeAnswer,
      });

      userAnswerDocs.push(userAnswer);
    }

    // Save all user answers
    const savedUserAnswers = await UserAnswer.insertMany(userAnswerDocs);

    // Calculate percentage score
    const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const passingScore = exam.examDetails?.passingScore || 40;
    const passed = percentageScore >= passingScore;

    // Create result record
    const result = await Result.create({
      event: id,
      user: userId,
      answers: processedAnswers,
      score: totalScore,
      totalScore: maxPossibleScore,
      percentageScore,
      passed,
      duration: timeSpent || null,
      attemptNumber: existingAttempts + 1,
    });

    // Update UserAnswer documents with result reference
    await UserAnswer.updateMany(
      { _id: { $in: savedUserAnswers.map(a => a._id) } },
      { result: result._id }
    );

    // Update participant status in exam
    const participantIndex = exam.participants.findIndex(
      (p) => p.user.toString() === userId.toString()
    );

    if (participantIndex !== -1) {
      exam.participants[participantIndex].status = "completed";
      exam.participants[participantIndex].completedAt = new Date();
      await exam.save();
    }

    // Generate appropriate feedback based on score
    let feedback = "";
    if (passed) {
      feedback = `Congratulations! You passed the exam with a score of ${Math.round(percentageScore)}%.`;
      if (percentageScore >= 90) {
        feedback += " Outstanding performance!";
      } else if (percentageScore >= 75) {
        feedback += " Great job!";
      } else {
        feedback += " Well done!";
      }
    } else {
      feedback = `You scored ${Math.round(percentageScore)}%, which is below the passing score of ${passingScore}%.`;
      if (existingAttempts + 1 < maxAttempts) {
        feedback += ` You have ${maxAttempts - existingAttempts - 1} attempts remaining.`;
      }
    }

    // Update result with feedback
    result.feedback = feedback;
    await result.save();

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

/**
 * Get exam results for a specific user
 * Access: Admin or the user who took the exam
 */
export const getUserExamResults = asyncHandler(async (req, res) => {
  try {
    const { examId, userId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Only allow admins or the user themselves to view their results
    if (!isAdmin && requestingUserId.toString() !== userId) {
      throw new ApiError(403, "You are not authorized to view these results");
    }

    // Find the exam
    const exam = await Event.findOne({ _id: examId, isExam: true });
    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Get results
    const results = await Result.find({ event: examId, user: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .populate({
        path: "answers.question",
        model: "Question",
        select: "questionText questionType options correctAnswer correctOption points"
      });

    if (!results || results.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No results found for this user and exam",
        data: []
      });
    }

    return res.status(200).json({
      status: "success",
      count: results.length,
      data: results
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving exam results"
    );
  }
});

/**
 * Get all results for an exam
 * Access: Admin only
 */
export const getExamResultsAdmin = asyncHandler(async (req, res) => {
  try {
    const { examId } = req.params;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin) {
      throw new ApiError(403, "Only administrators can access all exam results");
    }

    // Find the exam
    const exam = await Event.findOne({ _id: examId, isExam: true });
    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Get all results for this exam
    const results = await Result.find({ event: examId })
      .populate("user", "name email registrationNumber")
      .sort({ percentageScore: -1 }); // Highest scores first

    // Calculate statistics
    const totalParticipants = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const passRate = totalParticipants > 0 ? (passedCount / totalParticipants) * 100 : 0;
    
    let highestScore = 0;
    let lowestScore = 100;
    let totalScore = 0;
    
    results.forEach(result => {
      highestScore = Math.max(highestScore, result.percentageScore);
      lowestScore = Math.min(lowestScore, result.percentageScore);
      totalScore += result.percentageScore;
    });
    
    const averageScore = totalParticipants > 0 ? totalScore / totalParticipants : 0;

    return res.status(200).json({
      status: "success",
      count: results.length,
      statistics: {
        totalParticipants,
        passedCount,
        passRate: Math.round(passRate),
        highestScore: Math.round(highestScore),
        lowestScore: Math.round(lowestScore),
        averageScore: Math.round(averageScore)
      },
      data: results
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving exam results"
    );
  }
});

/**
 * Evaluate a subjective answer (for manual grading)
 * Access: Admin only
 */
export const evaluateAnswer = asyncHandler(async (req, res) => {
  try {
    const { examId, resultId, answerId } = req.params;
    const { pointsAwarded, feedback, isCorrect } = req.body;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin) {
      throw new ApiError(403, "Only administrators can evaluate answers");
    }

    // Find the result
    const result = await Result.findOne({ _id: resultId, event: examId });
    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    // Find the answer in the result
    const answerIndex = result.answers.findIndex(a => a._id.toString() === answerId);
    if (answerIndex === -1) {
      throw new ApiError(404, "Answer not found in this result");
    }

    // Update the answer
    result.answers[answerIndex].pointsAwarded = pointsAwarded;
    result.answers[answerIndex].feedback = feedback;
    result.answers[answerIndex].isCorrect = isCorrect;

    // Recalculate total score
    let totalScore = 0;
    result.answers.forEach(answer => {
      if (answer.pointsAwarded !== null) {
        totalScore += answer.pointsAwarded;
      }
    });

    // Update result
    result.score = totalScore;
    result.percentageScore = (totalScore / result.totalScore) * 100;
    result.passed = result.percentageScore >= (result.event.examDetails?.passingScore || 40);

    await result.save();

    // Also update the UserAnswer document if it exists
    await UserAnswer.findOneAndUpdate(
      { result: resultId, question: result.answers[answerIndex].question },
      {
        pointsAwarded,
        isCorrect,
        reviewComments: feedback,
        isReviewed: true
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Answer evaluated successfully",
      data: result
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error evaluating answer"
    );
  }
});

/**
 * Generate certificate for a passed exam
 * Access: Admin or the user who passed the exam
 */
export const generateCertificate = asyncHandler(async (req, res) => {
  try {
    const { examId, resultId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Find the result
    const result = await Result.findOne({ _id: resultId, event: examId })
      .populate("user", "name email")
      .populate("event", "title");

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    // Check authorization
    if (!isAdmin && result.user._id.toString() !== requestingUserId.toString()) {
      throw new ApiError(403, "You are not authorized to generate this certificate");
    }

    // Check if the user passed the exam
    if (!result.passed) {
      throw new ApiError(400, "Cannot generate certificate for a failed exam");
    }

    // Check if certificate already exists
    if (result.certificate && result.certificate.issued) {
      return res.status(200).json({
        status: "success",
        message: "Certificate already generated",
        data: result.certificate
      });
    }

    // Generate certificate ID (in a real app, this would be more sophisticated)
    const certificateId = `CERT-${result.event._id.toString().substring(0, 6)}-${result.user._id.toString().substring(0, 6)}-${Date.now().toString(36)}`;

    // In a real app, you would generate a PDF certificate here
    // For now, we'll just update the certificate details
    result.certificate = {
      issued: true,
      issuedAt: new Date(),
      certificateId,
      certificateUrl: `/certificates/${certificateId}.pdf` // Placeholder URL
    };

    await result.save();

    return res.status(200).json({
      status: "success",
      message: "Certificate generated successfully",
      data: result.certificate
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error generating certificate"
    );
  }
});
