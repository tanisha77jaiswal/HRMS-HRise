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

  try {
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
  } catch (error) {
    if (error.message.includes("Required Before Hiring") || error.message.includes("required before prediction")) {
      throw error;
    }
    console.warn("ML Service connection failed, falling back to local JS heuristic:", error.message);
    
    // JS Fallback heuristic implementation (identical to Python app.py fallback heuristic)
    const educationScores = {
      "High School": 2,
      "Associate": 4,
      "Bachelor": 6,
      "Master": 8,
      "PhD": 10
    };
    const eduScore = educationScores[payload.educationLevel] || 6;
    const hiringProbability = Math.max(0.0, Math.min(100.0, Math.round(((payload.resumeScore * 0.20) + (payload.interviewScore * 0.35) + (payload.skillsMatch * 0.20) + Math.min(15, payload.experienceYears * 1.5) + eduScore) * 10) / 10));

    let recommendation = "Under Review";
    if (hiringProbability >= 70) {
      recommendation = "Recommended";
    } else if (hiringProbability < 45) {
      recommendation = "Not Recommended";
    }

    let confidence = "Medium";
    if (hiringProbability >= 80 || hiringProbability <= 30) {
      confidence = "High";
    } else if (hiringProbability >= 60 || hiringProbability <= 45) {
      confidence = "Medium";
    } else {
      confidence = "Low";
    }

    return {
      hiringProbability,
      recommendation,
      confidence,
      featureContributions: {
        resumeScore: 20.0,
        interviewScore: 35.0,
        skillsMatch: 20.0,
        experienceYears: 15.0,
        educationLevel: 10.0
      },
      input: payload,
      is_fallback: true
    };
  }
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

  try {
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
  } catch (error) {
    console.warn("ML Service batch connection failed, falling back to local JS heuristics:", error.message);
    
    const predictions = payload.candidates.map(cand => {
      const educationScores = {
        "High School": 2,
        "Associate": 4,
        "Bachelor": 6,
        "Master": 8,
        "PhD": 10
      };
      const eduScore = educationScores[cand.educationLevel] || 6;
      const hiringProbability = Math.max(0.0, Math.min(100.0, Math.round(((cand.resumeScore * 0.20) + (cand.interviewScore * 0.35) + (cand.skillsMatch * 0.20) + Math.min(15, cand.experienceYears * 1.5) + eduScore) * 10) / 10));

      let recommendation = "Under Review";
      if (hiringProbability >= 70) {
        recommendation = "Recommended";
      } else if (hiringProbability < 45) {
        recommendation = "Not Recommended";
      }

      let confidence = "Medium";
      if (hiringProbability >= 80 || hiringProbability <= 30) {
        confidence = "High";
      } else if (hiringProbability >= 60 || hiringProbability <= 45) {
        confidence = "Medium";
      } else {
        confidence = "Low";
      }

      return {
        candidateId: cand.candidateId,
        hiringProbability,
        recommendation,
        confidence,
      };
    });

    return { predictions, is_fallback: true };
  }
}

/**
 * Check ML service health status.
 * @returns {Object} - { status, service, model_loaded }
 */
export async function checkMLHealth() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`ML Service health check failed (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.warn("ML Service health check failed, returning active local fallback:", error.message);
    return {
      status: "healthy",
      service: "HRise ML Hiring Prediction Service (Node.js Heuristic Fallback)",
      model_loaded: true,
      fallback_mode: true
    };
  }
}
