/**
 * HRise — ML Prediction Controller
 * ==================================
 * Thin controller — validates input, delegates to service layer.
 */

import {
  getHiringPrediction,
  getBatchPredictions,
  checkMLHealth,
} from "../services/mlPredictionService.js";

/**
 * POST /api/ml/hiring-prediction
 * Single candidate hiring prediction.
 */
export const predictHiring = async (req, res) => {
  try {
    const { resumeScore, interviewScore, skillsMatch, experienceYears, educationLevel } = req.body;

    const parsedInterviewScore = Number(interviewScore);
    const parsedResumeScore = Number(resumeScore);
    const parsedSkillsMatch = Number(skillsMatch);

    if (interviewScore === undefined || interviewScore === null || isNaN(parsedInterviewScore) || parsedInterviewScore <= 0) {
      return res.status(400).json({
        error: "Interview Required Before Hiring Prediction",
      });
    }

    if (resumeScore === undefined || resumeScore === null || isNaN(parsedResumeScore) || parsedResumeScore <= 0) {
      return res.status(400).json({
        error: "Resume Analysis Required Before Hiring Prediction",
      });
    }

    if (skillsMatch === undefined || skillsMatch === null || isNaN(parsedSkillsMatch) || parsedSkillsMatch <= 0) {
      return res.status(400).json({
        error: "Skills Match evaluation required before prediction",
      });
    }

    const result = await getHiringPrediction({
      resumeScore: parsedResumeScore,
      interviewScore: parsedInterviewScore,
      skillsMatch: parsedSkillsMatch,
      experienceYears,
      educationLevel,
    });

    res.json(result);
  } catch (e) {
    console.error("ML Prediction Error:", e.message);
    if (e.message.includes("Required Before Hiring") || e.message.includes("required before prediction")) {
      return res.status(400).json({
        error: e.message,
      });
    }
    res.status(503).json({
      error: "ML prediction service unavailable. Ensure the Python ML service is running.",
      details: e.message,
    });
  }
};

/**
 * POST /api/ml/batch-predict
 * Batch hiring predictions for multiple candidates.
 */
export const batchPredict = async (req, res) => {
  try {
    const { candidates } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        error: "candidates must be a non-empty array.",
      });
    }

    const result = await getBatchPredictions(candidates);
    res.json(result);
  } catch (e) {
    console.error("ML Batch Prediction Error:", e.message);
    res.status(503).json({
      error: "ML prediction service unavailable.",
      details: e.message,
    });
  }
};

/**
 * GET /api/ml/health
 * Check ML service health status.
 */
export const mlHealthCheck = async (req, res) => {
  try {
    const result = await checkMLHealth();
    res.json(result);
  } catch (e) {
    res.status(503).json({
      status: "unhealthy",
      error: "ML service is not reachable.",
      details: e.message,
    });
  }
};
