import Result from "../models/result.model.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiRespons.js";

/**
 * Get results for a specific user
 * Access: Admin or the user themselves
 */
export const getUserResults = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Only allow admins or the user themselves to view their results
    if (!isAdmin && requestingUserId.toString() !== userId) {
      throw new ApiError(403, "You are not authorized to view these results");
    }

    // Get all results for this user
    const results = await Result.find({ user: userId })
      .populate("event", "title date status")
      .sort({ createdAt: -1 }); // Most recent first

    return res.status(200).json({
      status: "success",
      count: results.length,
      data: results
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving user results"
    );
  }
});

/**
 * Get a specific result by ID
 * Access: Admin or the user who owns the result
 */
export const getResultById = asyncHandler(async (req, res) => {
  try {
    const { resultId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Find the result
    const result = await Result.findById(resultId)
      .populate("event", "title date status examDetails")
      .populate("user", "name email")
      .populate({
        path: "answers.question",
        model: "Question",
        select: "questionText questionType options correctAnswer correctOption points"
      });

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    // Check authorization
    if (!isAdmin && result.user._id.toString() !== requestingUserId.toString()) {
      throw new ApiError(403, "You are not authorized to view this result");
    }

    // Check if the exam allows viewing detailed results
    const showDetails = isAdmin || 
                       (result.event.examDetails && result.event.examDetails.showResultsImmediately) ||
                       result.event.status === "completed";

    // If not allowed to see details, remove answer details
    if (!showDetails) {
      result.answers = result.answers.map(answer => ({
        ...answer.toObject(),
        isCorrect: undefined,
        pointsAwarded: undefined
      }));
    }

    return res.status(200).json({
      status: "success",
      data: result
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving result"
    );
  }
});

/**
 * Get leaderboard for an exam
 * Access: Public (if enabled for the exam)
 */
export const getExamLeaderboard = asyncHandler(async (req, res) => {
  try {
    const { examId } = req.params;

    // Find the exam
    const exam = await Event.findOne({ _id: examId, isExam: true });
    if (!exam) {
      throw new ApiError(404, "Exam not found");
    }

    // Check if leaderboard is enabled
    if (!exam.examDetails || !exam.examDetails.enableLeaderboard) {
      throw new ApiError(403, "Leaderboard is not enabled for this exam");
    }

    // Get top results for this exam
    const results = await Result.find({ event: examId })
      .populate("user", "name avatar")
      .sort({ percentageScore: -1, duration: 1 }) // Highest score first, then fastest time
      .limit(20); // Top 20 results

    // Format the leaderboard data
    const leaderboard = results.map((result, index) => ({
      rank: index + 1,
      user: {
        id: result.user._id,
        name: result.user.name,
        avatar: result.user.avatar
      },
      score: Math.round(result.percentageScore),
      duration: result.duration,
      grade: result.grade,
      submittedAt: result.createdAt
    }));

    return res.status(200).json({
      status: "success",
      data: leaderboard
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving leaderboard"
    );
  }
});

/**
 * Get statistics for all exams
 * Access: Admin only
 */
export const getExamStatistics = asyncHandler(async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    if (!isAdmin) {
      throw new ApiError(403, "Only administrators can access exam statistics");
    }

    // Get all exams
    const exams = await Event.find({ isExam: true });
    
    // Get statistics for each exam
    const examStats = [];
    
    for (const exam of exams) {
      const results = await Result.find({ event: exam._id });
      
      const totalParticipants = results.length;
      const passedCount = results.filter(r => r.passed).length;
      const passRate = totalParticipants > 0 ? (passedCount / totalParticipants) * 100 : 0;
      
      let highestScore = 0;
      let lowestScore = 100;
      let totalScore = 0;
      
      results.forEach(result => {
        highestScore = Math.max(highestScore, result.percentageScore);
        lowestScore = totalParticipants > 0 ? Math.min(lowestScore, result.percentageScore) : 0;
        totalScore += result.percentageScore;
      });
      
      const averageScore = totalParticipants > 0 ? totalScore / totalParticipants : 0;
      
      examStats.push({
        exam: {
          id: exam._id,
          title: exam.title,
          date: exam.date,
          status: exam.status
        },
        statistics: {
          totalParticipants,
          passedCount,
          passRate: Math.round(passRate),
          highestScore: Math.round(highestScore),
          lowestScore: Math.round(lowestScore),
          averageScore: Math.round(averageScore)
        }
      });
    }
    
    return res.status(200).json({
      status: "success",
      count: examStats.length,
      data: examStats
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving exam statistics"
    );
  }
});

/**
 * Get user performance across all exams
 * Access: Admin or the user themselves
 */
export const getUserPerformance = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;
    const isAdmin = req.user.role === "admin";

    // Only allow admins or the user themselves to view their performance
    if (!isAdmin && requestingUserId.toString() !== userId) {
      throw new ApiError(403, "You are not authorized to view this performance data");
    }

    // Get all results for this user
    const results = await Result.find({ user: userId })
      .populate("event", "title date status")
      .sort({ createdAt: -1 });

    // Calculate overall statistics
    const totalExams = results.length;
    const passedExams = results.filter(r => r.passed).length;
    const passRate = totalExams > 0 ? (passedExams / totalExams) * 100 : 0;
    
    let totalScore = 0;
    let bestScore = 0;
    let worstScore = 100;
    
    results.forEach(result => {
      totalScore += result.percentageScore;
      bestScore = Math.max(bestScore, result.percentageScore);
      worstScore = totalExams > 0 ? Math.min(worstScore, result.percentageScore) : 0;
    });
    
    const averageScore = totalExams > 0 ? totalScore / totalExams : 0;
    
    // Group results by month for trend analysis
    const monthlyPerformance = {};
    
    results.forEach(result => {
      const date = new Date(result.createdAt);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyPerformance[monthYear]) {
        monthlyPerformance[monthYear] = {
          month: monthYear,
          examCount: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      
      monthlyPerformance[monthYear].examCount += 1;
      monthlyPerformance[monthYear].totalScore += result.percentageScore;
    });
    
    // Calculate monthly averages
    Object.keys(monthlyPerformance).forEach(key => {
      const month = monthlyPerformance[key];
      month.averageScore = month.totalScore / month.examCount;
    });
    
    // Convert to array and sort by month
    const performanceTrend = Object.values(monthlyPerformance)
      .sort((a, b) => a.month.localeCompare(b.month));
    
    return res.status(200).json({
      status: "success",
      data: {
        overall: {
          totalExams,
          passedExams,
          passRate: Math.round(passRate),
          averageScore: Math.round(averageScore),
          bestScore: Math.round(bestScore),
          worstScore: Math.round(worstScore)
        },
        trend: performanceTrend,
        results: results.map(result => ({
          id: result._id,
          exam: result.event.title,
          date: result.createdAt,
          score: Math.round(result.percentageScore),
          passed: result.passed,
          grade: result.grade
        }))
      }
    });
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving user performance"
    );
  }
});
