/**
 * HRise — ML Prediction Routes
 * ==============================
 * POST /api/ml/hiring-prediction  — Single prediction
 * POST /api/ml/batch-predict      — Batch predictions
 * GET  /api/ml/health             — ML service health
 */

import express from "express";
import {
  predictHiring,
  batchPredict,
  mlHealthCheck,
} from "../controllers/mlPredictionController.js";

const router = express.Router();

router.post("/hiring-prediction", predictHiring);
router.post("/batch-predict", batchPredict);
router.get("/health", mlHealthCheck);

export default router;
