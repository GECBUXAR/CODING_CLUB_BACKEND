import { Router } from "express";
import { 
  getUserResults,
  getResultById,
  getExamLeaderboard,
  getExamStatistics,
  getUserPerformance
} from "../controllers/result.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Get results for a specific user
router.get("/user/:userId", getUserResults);

// Get a specific result by ID
router.get("/:resultId", getResultById);

// Get leaderboard for an exam
router.get("/exam/:examId/leaderboard", getExamLeaderboard);

// Get statistics for all exams (admin only)
router.get("/statistics/exams", getExamStatistics);

// Get user performance across all exams
router.get("/user/:userId/performance", getUserPerformance);

export default router;
