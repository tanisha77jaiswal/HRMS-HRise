import { useState, useEffect } from "react";
import { Brain, TrendingUp, Shield, Sparkles, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import { api } from "../utils/api";

/**
 * AI Hiring Prediction Card
 * ==========================
 * Enterprise-grade prediction display with:
 * - Animated probability meter
 * - Recommendation badge
 * - Confidence indicator
 * - Feature contribution breakdown
 * 
 * @param {Object} candidate - Candidate data with aiScore, matchPercentage, experienceYears, education
 * @param {number} interviewScore - Optional interview score
 * @param {boolean} compact - Compact mode for table rows
 */
export function HiringPredictionCard({ candidate, interviewScore, compact = false }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [animatedProb, setAnimatedProb] = useState(0);

  const realInterviewScore = interviewScore || candidate?.interviewScore;
  const hasInterviewScore = realInterviewScore != null && realInterviewScore > 0;
  const hasResumeScore = candidate?.aiScore != null && candidate.aiScore > 0;

  const fetchPrediction = async () => {
    if (!candidate || !hasResumeScore || !hasInterviewScore) return;
    setLoading(true);
    setError(null);

    try {
      // Map candidate fields to ML model input
      const eduLevel = getEducationLevel(candidate.education);
      const result = await api.ml.predict({
        resumeScore: candidate.aiScore,
        interviewScore: realInterviewScore,
        skillsMatch: candidate.matchPercentage,
        experienceYears: candidate.experienceYears,
        educationLevel: eduLevel,
      });

      setPrediction(result);
    } catch (e) {
      console.error("ML Prediction failed:", e);
      setError("ML service unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidate?.id && hasResumeScore && hasInterviewScore) {
      fetchPrediction();
    } else {
      setPrediction(null);
    }
  }, [candidate?.id, hasResumeScore, hasInterviewScore]);

  // Animate probability counter
  useEffect(() => {
    if (prediction?.hiringProbability != null) {
      const target = prediction.hiringProbability;
      let current = 0;
      const increment = target / 40;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedProb(Math.round(current * 10) / 10);
      }, 20);
      return () => clearInterval(timer);
    }
  }, [prediction?.hiringProbability]);

  // Compact inline badge for table rows
  if (compact) {
    return (
      <CompactPredictionBadge
        prediction={prediction}
        loading={loading}
        error={error}
        animatedProb={animatedProb}
        hasInterviewScore={hasInterviewScore}
        hasResumeScore={hasResumeScore}
      />
    );
  }

  // Full card
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)" }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Brain size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-white tracking-tight">AI Hiring Prediction</h3>
          <p className="text-[11px] text-indigo-200">Random Forest ML Model • Decision Support</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {!hasInterviewScore ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800">Interview Required Before Hiring Prediction</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Please complete the video interview and evaluation first.</p>
            </div>
          </div>
        ) : !hasResumeScore ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800">Resume Analysis Required Before Hiring Prediction</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Please complete the AI resume analysis first.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={28} className="text-indigo-500 animate-spin mb-3" />
            <p className="text-xs font-bold text-gray-400">Analyzing candidate profile...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800">{error}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Ensure Python ML service is running on port 5050</p>
            </div>
            <button
              onClick={fetchPrediction}
              className="ml-auto text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : prediction ? (
          <>
            {/* Probability Meter */}
            <div className="flex items-center gap-5 mb-5">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={getGradientColor(animatedProb)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(animatedProb / 100) * 251.2} 251.2`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-gray-900" style={{ lineHeight: 1 }}>
                    {animatedProb}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">%</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5">
                {/* Recommendation */}
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500">Recommendation</span>
                  <RecommendationBadge recommendation={prediction.recommendation} />
                </div>
                {/* Confidence */}
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500">Confidence</span>
                  <ConfidenceBadge confidence={prediction.confidence} />
                </div>
              </div>
            </div>

            {/* Feature Contributions */}
            {prediction.featureContributions && (
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <BarChart3 size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Feature Influence</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(prediction.featureContributions)
                    .sort(([, a], [, b]) => b - a)
                    .map(([feature, value]) => (
                      <FeatureBar key={feature} feature={feature} value={value} />
                    ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 mt-4 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
              <Sparkles size={12} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-600 leading-relaxed">
                This prediction is AI-assisted and intended for decision support only. 
                Final hiring decisions should always involve human review and judgement.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Compact inline prediction badge for table rows
 */
function CompactPredictionBadge({ prediction, loading, error, animatedProb, hasInterviewScore, hasResumeScore }) {
  if (!hasInterviewScore) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
        <AlertTriangle size={10} className="text-amber-500" /> Interview Required
      </span>
    );
  }

  if (!hasResumeScore) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
        <AlertTriangle size={10} className="text-amber-500" /> Resume Required
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 size={12} className="text-indigo-400 animate-spin" />
        <span className="text-[11px] text-gray-400">Predicting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-[10px] font-semibold">
        <AlertTriangle size={10} /> N/A
      </span>
    );
  }

  if (!prediction) return null;

  const color = animatedProb >= 70 ? "#10b981" : animatedProb >= 45 ? "#f59e0b" : "#ef4444";
  const bgColor = animatedProb >= 70 ? "bg-emerald-50 border-emerald-200" : animatedProb >= 45 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const textColor = animatedProb >= 70 ? "text-emerald-700" : animatedProb >= 45 ? "text-amber-700" : "text-red-700";

  return (
    <div className="flex items-center gap-2">
      {/* Mini probability ring */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12" fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(animatedProb / 100) * 75.4} 75.4`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-extrabold text-gray-700">{Math.round(animatedProb)}</span>
        </div>
      </div>
      {/* Recommendation badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${bgColor} ${textColor}`}>
        {prediction.recommendation === "Recommended" ? "✓" : prediction.recommendation === "Under Review" ? "~" : "✗"}
        {prediction.recommendation}
      </span>
    </div>
  );
}

/**
 * ML Analytics Summary Panel for Dashboard
 */
export function MLAnalyticsPanel({ candidates }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlHealthy, setMlHealthy] = useState(null);

  const eligibleCandidates = candidates ? candidates.filter(
    (c) => c.aiScore != null && c.aiScore > 0 && c.interviewScore != null && c.interviewScore > 0
  ) : [];

  const skippedCount = candidates ? candidates.length - eligibleCandidates.length : 0;

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const h = await api.ml.health();
      setMlHealthy(h.model_loaded);
    } catch {
      setMlHealthy(false);
    }
  };

  useEffect(() => {
    if (eligibleCandidates.length > 0 && mlHealthy) {
      fetchBatchPredictions();
    } else {
      setPredictions([]);
    }
  }, [candidates, mlHealthy]);

  const fetchBatchPredictions = async () => {
    if (eligibleCandidates.length === 0) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const batchData = eligibleCandidates.slice(0, 20).map((c) => ({
        candidateId: c.id,
        resumeScore: c.aiScore,
        interviewScore: c.interviewScore,
        skillsMatch: c.matchPercentage,
        experienceYears: c.experienceYears,
        educationLevel: getEducationLevel(c.education),
      }));

      const result = await api.ml.batchPredict(batchData);
      if (result.predictions) {
        setPredictions(result.predictions);
      }
    } catch (e) {
      console.error("Batch prediction failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const recommended = predictions.filter((p) => p.recommendation === "Recommended");
  const underReview = predictions.filter((p) => p.recommendation === "Under Review");
  const notRecommended = predictions.filter((p) => p.recommendation === "Not Recommended");
  const avgProbability = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.hiringProbability, 0) / predictions.length)
    : 0;

  // Top candidates
  const topCandidates = predictions
    .sort((a, b) => b.hiringProbability - a.hiringProbability)
    .slice(0, 5)
    .map((p) => {
      const cand = candidates.find((c) => c.id === p.candidateId);
      return { ...p, name: cand?.name || "Unknown", aiScore: cand?.aiScore || 0 };
    });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <Brain size={17} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-extrabold text-white">ML Hiring Analytics</h3>
          <p className="text-[10px] text-indigo-200">AI-powered prediction insights</p>
        </div>
        {mlHealthy === false && (
          <span className="text-[10px] font-bold text-amber-200 bg-amber-500/30 px-2 py-0.5 rounded-full">Offline</span>
        )}
        {mlHealthy === true && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/15 rounded-full border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-white/80">Active</span>
          </div>
        )}
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="text-indigo-400 animate-spin mr-2" />
            <span className="text-xs text-gray-400 font-semibold">Running batch predictions...</span>
          </div>
        ) : mlHealthy === false ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <p className="text-xs font-bold text-amber-800">ML Service Offline</p>
              <p className="text-[11px] text-amber-600">Start the Python ML service on port 5050</p>
            </div>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-6 px-4 bg-gray-50 border border-dashed border-gray-205 rounded-xl">
            <AlertTriangle size={18} className="text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-700">No Predictions Available</p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
              Hiring predictions require both resume analysis and a completed video interview.
            </p>
            {skippedCount > 0 && (
              <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 mt-3 font-semibold inline-block">
                ⚠️ {skippedCount} candidates pending interview/resume score
              </p>
            )}
          </div>
        ) : (
          <>
            {skippedCount > 0 && (
              <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 mb-4 font-semibold">
                ⚠️ {skippedCount} candidates excluded (interview or resume analysis pending)
              </p>
            )}
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-center">
                <p className="text-2xl font-extrabold text-indigo-700">{avgProbability}%</p>
                <p className="text-[10px] font-bold text-indigo-400 mt-0.5">Avg Probability</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                <p className="text-2xl font-extrabold text-emerald-700">{recommended.length}</p>
                <p className="text-[10px] font-bold text-emerald-400 mt-0.5">Recommended</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                <p className="text-2xl font-extrabold text-amber-700">{underReview.length}</p>
                <p className="text-[10px] font-bold text-amber-400 mt-0.5">Under Review</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
                <p className="text-2xl font-extrabold text-red-700">{notRecommended.length}</p>
                <p className="text-[10px] font-bold text-red-400 mt-0.5">Not Recommended</p>
              </div>
            </div>

            {/* Distribution bar */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-gray-500 mb-1.5">Prediction Distribution</p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                {recommended.length > 0 && (
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(recommended.length / predictions.length) * 100}%` }}
                  />
                )}
                {underReview.length > 0 && (
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${(underReview.length / predictions.length) * 100}%` }}
                  />
                )}
                {notRecommended.length > 0 && (
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${(notRecommended.length / predictions.length) * 100}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {Math.round((recommended.length / predictions.length) * 100)}% Recommended
                </span>
                <span className="text-[10px] text-red-600 font-semibold">
                  {Math.round((notRecommended.length / predictions.length) * 100)}% Not Recommended
                </span>
              </div>
            </div>

            {/* Top Candidates */}
            {topCandidates.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-2">Top Recommended Candidates</p>
                <div className="space-y-1.5">
                  {topCandidates.map((tc, i) => (
                    <div key={tc.candidateId} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center text-[10px] font-extrabold text-indigo-600 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{tc.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-900">{tc.hiringProbability}%</span>
                        <RecommendationBadge recommendation={tc.recommendation} small />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared Sub-Components ──────────────────────────────────────────────────────

function RecommendationBadge({ recommendation, small = false }) {
  const styles = {
    "Recommended": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    "Under Review": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    "Not Recommended": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
  };
  const s = styles[recommendation] || styles["Under Review"];
  const sizeClass = small ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold border ${s.bg} ${s.text} ${s.border} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {recommendation}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const styles = {
    "High": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "Medium": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Low": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  };
  const s = styles[confidence] || styles["Medium"];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <Shield size={10} />
      {confidence}
    </span>
  );
}

function FeatureBar({ feature, value }) {
  const labels = {
    resumeScore: "Resume Score",
    interviewScore: "Interview Score",
    skillsMatch: "Skills Match",
    experienceYears: "Experience",
    educationLevel: "Education",
  };

  const colors = {
    resumeScore: "#6366f1",
    interviewScore: "#8b5cf6",
    skillsMatch: "#10b981",
    experienceYears: "#f59e0b",
    educationLevel: "#ef4444",
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-gray-600 w-24 truncate">{labels[feature] || feature}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value * 3, 100)}%`, background: colors[feature] || "#6366f1" }}
        />
      </div>
      <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function getEducationLevel(education) {
  if (!education || !Array.isArray(education) || education.length === 0) return "Bachelor";
  const degree = (education[0]?.degree || "").toLowerCase();
  if (degree.includes("phd") || degree.includes("doctor")) return "PhD";
  if (degree.includes("m.s") || degree.includes("master") || degree.includes("mba") || degree.includes("m.tech")) return "Master";
  if (degree.includes("b.s") || degree.includes("bachelor") || degree.includes("b.tech") || degree.includes("b.e")) return "Bachelor";
  if (degree.includes("associate") || degree.includes("diploma")) return "Associate";
  if (degree.includes("high school") || degree.includes("12th") || degree.includes("hsc")) return "High School";
  return "Bachelor";
}

function getGradientColor(probability) {
  if (probability >= 70) return "#10b981";
  if (probability >= 45) return "#f59e0b";
  return "#ef4444";
}
