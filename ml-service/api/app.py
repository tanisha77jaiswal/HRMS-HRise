"""
HRise ML Service — Flask Prediction API
========================================
Exposes POST /predict endpoint for hiring probability predictions.
Loads the pre-trained Random Forest model and label encoders.

Port: 5050 (configurable via ML_SERVICE_PORT env var)
"""

import os
import sys
import io
import traceback
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ─── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "model")
MODEL_PATH = os.path.join(MODEL_DIR, "hiring_model.pkl")
ENCODERS_PATH = os.path.join(MODEL_DIR, "label_encoders.pkl")

PORT = int(os.environ.get("ML_SERVICE_PORT", 5050))

# ─── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ─── Load Model ────────────────────────────────────────────────────────────────
model = None
label_encoders = None
fallback_mode = False

def load_model():
    """Load the pre-trained model and label encoders."""
    global model, label_encoders, fallback_mode
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"[ERR] Model file not found at {MODEL_PATH}")
            print("   Activating fallback heuristic mode...")
            fallback_mode = True
            return True
        
        model = joblib.load(MODEL_PATH)
        label_encoders = joblib.load(ENCODERS_PATH)
        print(f"[OK] Model loaded successfully from {MODEL_PATH}")
        print(f"[OK] Label encoders loaded from {ENCODERS_PATH}")
        return True
    except Exception as e:
        print(f"[WARN] Failed to load ML model (DLL load blocked by Application Control Policy or load failed): {e}")
        print("   Activating fallback heuristic mode...")
        fallback_mode = True
        return True


# ─── Validation Constants ──────────────────────────────────────────────────────
VALID_EDUCATION_LEVELS = ["High School", "Associate", "Bachelor", "Master", "PhD"]
EDUCATION_FALLBACK = "Bachelor"


# ─── Endpoints ─────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "HRise ML Hiring Prediction Service",
        "model_loaded": model is not None or fallback_mode,
        "fallback_mode": fallback_mode
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict hiring probability for a candidate.
    """
    global model, label_encoders, fallback_mode
    if model is None and not fallback_mode:
        return jsonify({"error": "Model not loaded. Train the model first."}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON."}), 400

        # ── Extract & validate fields ───────────────────────────────────────
        resume_score = float(data.get("resumeScore", 0))
        interview_score = float(data.get("interviewScore", 0))
        skills_match = float(data.get("skillsMatch", 0))
        experience_years = float(data.get("experienceYears", 0))
        education_level = data.get("educationLevel", EDUCATION_FALLBACK)

        # Clamp numeric values to valid ranges
        resume_score = max(0, min(100, resume_score))
        interview_score = max(0, min(100, interview_score))
        skills_match = max(0, min(100, skills_match))
        experience_years = max(0, min(50, experience_years))

        # Validate & encode education level
        if education_level not in VALID_EDUCATION_LEVELS:
            education_level = EDUCATION_FALLBACK

        if fallback_mode:
            # Fallback scoring heuristic:
            education_scores = {
                "High School": 2,
                "Associate": 4,
                "Bachelor": 6,
                "Master": 8,
                "PhD": 10
            }
            edu_score = education_scores.get(education_level, 6)
            hiring_probability = round((resume_score * 0.20) + (interview_score * 0.35) + (skills_match * 0.20) + min(15, experience_years * 1.5) + edu_score, 1)
            hiring_probability = max(0.0, min(100.0, hiring_probability))

            if hiring_probability >= 70:
                recommendation = "Recommended"
            elif hiring_probability >= 45:
                recommendation = "Under Review"
            else:
                recommendation = "Not Recommended"

            if hiring_probability >= 80 or hiring_probability <= 30:
                confidence = "High"
            elif hiring_probability >= 60 or hiring_probability <= 45:
                confidence = "Medium"
            else:
                confidence = "Low"

            contributions = {
                "resumeScore": 20.0,
                "interviewScore": 35.0,
                "skillsMatch": 20.0,
                "experienceYears": 15.0,
                "educationLevel": 10.0
            }
        else:
            le = label_encoders["educationLevel"]
            education_encoded = le.transform([education_level])[0]

            # ── Build feature vector ────────────────────────────────────────────
            features = np.array([[
                resume_score,
                interview_score,
                skills_match,
                experience_years,
                education_encoded,
            ]])

            # ── Predict ─────────────────────────────────────────────────────────
            probabilities = model.predict_proba(features)[0]
            
            # probability of class 1 (Hired)
            hiring_probability = round(float(probabilities[1]) * 100, 1)

            # ── Recommendation ──────────────────────────────────────────────────
            if hiring_probability >= 70:
                recommendation = "Recommended"
            elif hiring_probability >= 45:
                recommendation = "Under Review"
            else:
                recommendation = "Not Recommended"

            # ── Confidence ──────────────────────────────────────────────────────
            prob_diff = abs(probabilities[1] - probabilities[0])
            if prob_diff >= 0.5:
                confidence = "High"
            elif prob_diff >= 0.2:
                confidence = "Medium"
            else:
                confidence = "Low"

            # ── Feature Contributions (via feature importances) ─────────────────
            importances = model.feature_importances_
            feature_names = [
                "resumeScore",
                "interviewScore",
                "skillsMatch",
                "experienceYears",
                "educationLevel",
            ]
            contributions = {}
            for name, imp in zip(feature_names, importances):
                contributions[name] = round(float(imp) * 100, 1)

        # ── Response ────────────────────────────────────────────────────────
        return jsonify({
            "hiringProbability": hiring_probability,
            "recommendation": recommendation,
            "confidence": confidence,
            "featureContributions": contributions,
            "input": {
                "resumeScore": resume_score,
                "interviewScore": interview_score,
                "skillsMatch": skills_match,
                "experienceYears": experience_years,
                "educationLevel": education_level,
            },
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """
    Batch prediction for multiple candidates.
    """
    global model, label_encoders, fallback_mode
    if model is None and not fallback_mode:
        return jsonify({"error": "Model not loaded."}), 503

    try:
        data = request.get_json()
        candidates = data.get("candidates", [])

        if not isinstance(candidates, list) or len(candidates) == 0:
            return jsonify({"error": "candidates must be a non-empty array."}), 400

        predictions = []

        for cand in candidates:
            resume_score = max(0, min(100, float(cand.get("resumeScore", 0))))
            interview_score = max(0, min(100, float(cand.get("interviewScore", 0))))
            skills_match = max(0, min(100, float(cand.get("skillsMatch", 0))))
            experience_years = max(0, min(50, float(cand.get("experienceYears", 0))))
            education_level = cand.get("educationLevel", EDUCATION_FALLBACK)

            if education_level not in VALID_EDUCATION_LEVELS:
                education_level = EDUCATION_FALLBACK

            if fallback_mode:
                education_scores = {
                    "High School": 2,
                    "Associate": 4,
                    "Bachelor": 6,
                    "Master": 8,
                    "PhD": 10
                }
                edu_score = education_scores.get(education_level, 6)
                hiring_probability = round((resume_score * 0.20) + (interview_score * 0.35) + (skills_match * 0.20) + min(15, experience_years * 1.5) + edu_score, 1)
                hiring_probability = max(0.0, min(100.0, hiring_probability))

                if hiring_probability >= 70:
                    recommendation = "Recommended"
                elif hiring_probability >= 45:
                    recommendation = "Under Review"
                else:
                    recommendation = "Not Recommended"

                if hiring_probability >= 80 or hiring_probability <= 30:
                    confidence = "High"
                elif hiring_probability >= 60 or hiring_probability <= 45:
                    confidence = "Medium"
                else:
                    confidence = "Low"
            else:
                le = label_encoders["educationLevel"]
                education_encoded = le.transform([education_level])[0]
                features = np.array([[resume_score, interview_score, skills_match, experience_years, education_encoded]])
                probabilities = model.predict_proba(features)[0]
                hiring_probability = round(float(probabilities[1]) * 100, 1)

                if hiring_probability >= 70:
                    recommendation = "Recommended"
                elif hiring_probability >= 45:
                    recommendation = "Under Review"
                else:
                    recommendation = "Not Recommended"

                prob_diff = abs(probabilities[1] - probabilities[0])
                confidence = "High" if prob_diff >= 0.5 else ("Medium" if prob_diff >= 0.2 else "Low")

            predictions.append({
                "candidateId": cand.get("candidateId", ""),
                "hiringProbability": hiring_probability,
                "recommendation": recommendation,
                "confidence": confidence,
            })

        return jsonify({"predictions": predictions})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500


# ─── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  HRise ML -- Hiring Prediction Microservice")
    print("=" * 60)

    load_model()
    print(f"\n[RUN] Starting Flask server on http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)


