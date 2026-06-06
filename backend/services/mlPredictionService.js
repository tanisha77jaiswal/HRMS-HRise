/**
 * HRise — ML Prediction Service Layer
 * ====================================
 * Communicates with the Python ML microservice.
 * Handles HTTP calls, retries, and error translation.
 * 
 * Architecture: Controller → Service → Python ML API
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5050";

/**
 * Get a single hiring prediction from the ML service.
 * @param {Object} candidateData - { resumeScore, interviewScore, skillsMatch, experienceYears, educationLevel }
 * @returns {Object} - { hiringProbability, recommendation, confidence, featureContributions }
 */
export async function getHiringPrediction(candidateData) {
  const { resumeScore, interviewScore, skillsMatch, experienceYears, educationLevel } = candidateData;

  const parsedResumeScore = Number(resumeScore);
  const parsedInterviewScore = Number(interviewScore);
  const parsedSkillsMatch = Number(skillsMatch);
  const parsedExperience = Number(experienceYears);

  if (interviewScore === undefined || interviewScore === null || isNaN(parsedInterviewScore) || parsedInterviewScore <= 0) {
    throw new Error("Interview Required Before Hiring Prediction");
  }

  if (resumeScore === undefined || resumeScore === null || isNaN(parsedResumeScore) || parsedResumeScore <= 0) {
    throw new Error("Resume Analysis Required Before Hiring Prediction");
  }

  if (skillsMatch === undefined || skillsMatch === null || isNaN(parsedSkillsMatch) || parsedSkillsMatch <= 0) {
    throw new Error("Skills Match evaluation required before prediction");
  }

  const payload = {
    resumeScore: parsedResumeScore,
    interviewScore: parsedInterviewScore,
    skillsMatch: parsedSkillsMatch,
    experienceYears: isNaN(parsedExperience) ? 0 : parsedExperience,
    educationLevel: educationLevel || "Bachelor",
  };

  const response = await fetch(`${ML_SERVICE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ML Service error (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

/**
 * Get batch hiring predictions from the ML service.
 * @param {Array} candidates - Array of candidate data objects
 * @returns {Object} - { predictions: [...] }
 */
export async function getBatchPredictions(candidates) {
  // Filter out any candidates that don't have valid resumeScore or interviewScore
  const validCandidates = candidates.filter(c => {
    const interviewScoreVal = Number(c.interviewScore);
    const resumeScoreVal = Number(c.resumeScore);
    return c.interviewScore !== undefined && c.interviewScore !== null && !isNaN(interviewScoreVal) && interviewScoreVal > 0 &&
           c.resumeScore !== undefined && c.resumeScore !== null && !isNaN(resumeScoreVal) && resumeScoreVal > 0;
  });

  if (validCandidates.length === 0) {
    return { predictions: [] };
  }

  const payload = {
    candidates: validCandidates.map((c) => ({
      candidateId: c.candidateId || c.id || "",
      resumeScore: Number(c.resumeScore),
      interviewScore: Number(c.interviewScore),
      skillsMatch: Number(c.skillsMatch) || 0,
      experienceYears: Number(c.experienceYears) || 0,
      educationLevel: c.educationLevel || "Bachelor",
    })),
  };

  const response = await fetch(`${ML_SERVICE_URL}/batch-predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ML Service batch error (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

/**
 * Check ML service health status.
 * @returns {Object} - { status, service, model_loaded }
 */
export async function checkMLHealth() {
  const response = await fetch(`${ML_SERVICE_URL}/health`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`ML Service health check failed (${response.status})`);
  }

  return await response.json();
}
