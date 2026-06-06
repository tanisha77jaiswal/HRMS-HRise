import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import {
  Brain,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Briefcase,
  Award,
  Video,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";

export default function CandidateEvaluationPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(true);

  useEffect(() => {
    const fetchEvaluationData = async () => {
      setLoading(true);
      setError("");
      try {
        const { api } = await import("../utils/api");
        const res = await api.candidates.getEvaluation(candidateId);
        setData(res);
      } catch (err) {
        console.error("Failed to fetch candidate evaluation:", err);
        setError(err.message || "Failed to load candidate evaluation data.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluationData();
  }, [candidateId]);

  const handleDecision = async (newStatus) => {
    setDecisionLoading(true);
    try {
      const { api } = await import("../utils/api");
      await api.candidates.update(candidateId, { status: newStatus });

      const candidateName = data?.candidate?.name || "Candidate";

      if (newStatus === "selected") {
        // Create Onboarding record
        let onboardingRecords = [];
        const savedOnboarding = localStorage.getItem("hrise_onboarding_records");
        if (savedOnboarding) {
          try { onboardingRecords = JSON.parse(savedOnboarding); } catch (e) {}
        }
        const exists = onboardingRecords.some((r) => r.candidateId === candidateId);
        if (!exists) {
          const newOnboarding = {
            id: `onb-${Date.now()}`,
            candidateId: candidateId,
            candidateName,
            jobTitle: data.candidate.jobTitle || "Software Engineer",
            status: "in-progress",
            welcomeLetter: `Dear ${candidateName},\n\nWelcome to the team! We are absolutely thrilled to offer you the position of ${data.candidate.jobTitle || "Software Engineer"}.\n\nYour background stood out during our AI-screening and video interview evaluations, and we are confident that you will be a tremendous asset to our growth.\n\nFirst day is scheduled for Monday, June 15, 2026. Please complete the tasks in the smart checklist below to get set up with our systems.\n\nBest regards,\nHR Operations Team`,
            tasks: [
              { id: "t-offer", title: "Offer Letter Sent", description: "HR generates and sends offer letter.", type: "document", completed: false, dueDate: "2026-06-10" },
              { id: "t-accept", title: "Offer Letter Accepted", description: "Candidate accepts offer letter.", type: "document", completed: false, dueDate: "2026-06-12" },
              { id: "t-id", title: "Identity Proof Uploaded", description: "Candidate uploads Aadhaar/Passport/DL.", type: "document", completed: false, dueDate: "2026-06-11" },
              { id: "t-addr", title: "Address Proof Uploaded", description: "Candidate uploads Utility bill/Rent agreement.", type: "document", completed: false, dueDate: "2026-06-11" },
              { id: "t-res", title: "Resume Uploaded", description: "Candidate uploads final resume for records.", type: "document", completed: false, dueDate: "2026-06-11" },
              { id: "t-photo", title: "Passport Photo Uploaded", description: "Candidate uploads professional headshot.", type: "document", completed: false, dueDate: "2026-06-11" },
              { id: "t-bank", title: "Bank Details Submitted", description: "Direct deposit setup information completed.", type: "form", completed: false, dueDate: "2026-06-12" },
              { id: "t-profile", title: "Personal Profile Completed", description: "Verify contact phone and location coordinates.", type: "form", completed: false, dueDate: "2026-06-12" },
              { id: "t-verify", title: "Documents Verified", description: "Recruiter reviews and signs off files.", type: "task", completed: false, dueDate: "2026-06-14" },
              { id: "t-join", title: "Joining Date Assigned", description: "Confirm date and onboarding schedule details.", type: "meeting", completed: false, dueDate: "2026-06-15" }
            ]
          };
          onboardingRecords = [newOnboarding, ...onboardingRecords];
          localStorage.setItem("hrise_onboarding_records", JSON.stringify(onboardingRecords));
          try { await api.onboarding.create(newOnboarding); } catch (err) {}
        }

        addHriseNotification(
          "Candidate Hired 🎉",
          `${candidateName} has been selected! Onboarding checklist is generated.`,
          "onboarding",
          "recruiter"
        );
        addHriseNotification(
          "Congratulations! 🎉",
          `Congratulations! You have been selected for the position. Complete your onboarding.`,
          "onboarding",
          "candidate"
        );
        alert("Candidate selected successfully! Onboarding checklist has been generated.");
      } else if (newStatus === "rejected") {
        addHriseNotification(
          "Application Rejected",
          `${candidateName}'s application has been reviewed and will not proceed further.`,
          "info",
          "recruiter"
        );
        addHriseNotification(
          "Application Update",
          `Thank you for your interest. We have reviewed your application and decided not to proceed at this time.`,
          "info",
          "candidate"
        );
        alert("Candidate application status updated to rejected.");
      } else if (newStatus === "shortlisted") {
        // Request Additional Interview
        const interviews = await api.interviews.getAll();
        const candidateSession = interviews.find((s) => s.candidateId === candidateId);
        if (candidateSession) {
          await api.interviews.reschedule(candidateSession.id, {
            daysFromNow: 3,
            reason: "HR requested an additional evaluation session."
          });
        }
        addHriseNotification(
          "Interview Requested",
          `Additional interview session requested for ${candidateName}.`,
          "interview",
          "recruiter"
        );
        alert("Additional interview requested successfully. Status set back to Shortlisted.");
      }

      navigate("/resumes");
    } catch (err) {
      console.error("Decision failed:", err);
      alert("Failed to submit decision: " + err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500">Loading candidate evaluation data...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.candidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="recruiter" />
        <div className="lg:ml-64">
          <Header title="Candidate Evaluation" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-xl mx-auto text-center mt-12 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Error Loading Data</h2>
              <p className="text-gray-500 text-sm mb-6">{error || "Candidate not found."}</p>
              <Link to="/resumes" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-100 hover:bg-indigo-700">
                Back to Resumes
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { candidate, interview, mlPrediction } = data;

  // Format experience
  const formattedExperience = candidate.experienceYears === 0 
    ? "Fresher" 
    : (candidate.experienceYears === 1 ? "0-1 Years Experience" : `${candidate.experienceYears} yrs`);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="recruiter" />
      <div className="lg:ml-64">
        <Header title="Candidate Evaluation" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link to="/resumes" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-2">
                <ArrowLeft size={14} /> Back to Resumes
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2.5">
                {interview ? `Evaluate: ${candidate.name}` : `Profile: ${candidate.name}`}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Role: <span className="font-semibold text-indigo-600">{candidate.jobTitle || "Software Engineer"}</span> &mdash; {candidate.email}
              </p>
              {!interview && (
                <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Interview not completed — hiring decision locked until interview is done
                </p>
              )}
            </div>
            <div>
              <Badge variant={
                candidate.status === "selected" ? "purple" : 
                candidate.status === "rejected" ? "danger" : 
                candidate.status === "interviewed" ? "info" : "default"
              }>
                {candidate.status}
              </Badge>
            </div>
          </div>

          {/* Grid Layout: Resume on left, Interview on right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Resume Analysis */}
            <Card className="shadow-md border-gray-200">
              <div className="p-6 space-y-6">
                <h3 className="font-extrabold text-gray-950 text-lg border-b pb-3 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  Resume Analysis
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Resume Score</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{candidate.aiScore ?? "Not Available"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skills Match %</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">{candidate.matchPercentage ? `${candidate.matchPercentage}%` : "Not Available"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                    <p className="text-sm font-extrabold text-gray-900 mt-1.5">{formattedExperience}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Education Level</p>
                    <p className="text-sm font-extrabold text-gray-900 mt-1.5">
                      {candidate.education?.[0] 
                        ? `${candidate.education[0].degree} (${candidate.education[0].institution})` 
                        : "Not Available"}
                    </p>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Skills Found</p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills && candidate.skills.length > 0 ? (
                      candidate.skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-lg text-xs font-medium">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">None found</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.missingSkills && candidate.missingSkills.length > 0 ? (
                      candidate.missingSkills.map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-150 rounded-lg text-xs font-medium">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">None missing</span>
                    )}
                  </div>
                </div>

                {/* AI assessment expandable card */}
                <div className="border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setIsAssessmentOpen(!isAssessmentOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Brain size={14} /> AI Assessment Summary
                    </span>
                    <span className="text-xs text-indigo-500 font-bold">{isAssessmentOpen ? "Collapse" : "Expand"}</span>
                  </button>
                  {isAssessmentOpen && (
                    <div className="p-4 bg-white text-sm text-gray-700 leading-relaxed border-t border-indigo-50 whitespace-pre-line">
                      {candidate.matchExplanation || "No resume analysis summary available."}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Interview Evaluation */}
            <Card className="shadow-md border-gray-200">
              <div className="p-6 space-y-6">
                <h3 className="font-extrabold text-gray-950 text-lg border-b pb-3 flex items-center gap-2">
                  <Video size={18} className="text-indigo-600" />
                  Interview Evaluation
                </h3>

                {interview ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interview Score</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{interview.interviewScore}%</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Technical Score</p>
                        <p className="text-2xl font-black text-indigo-600 mt-1">{interview.technicalScore}%</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Communication Score</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{interview.communicationScore}%</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confidence Score</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{interview.confidenceScore}%</p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/30 border border-indigo-50 rounded-xl space-y-2">
                      <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-indigo-600" /> Interview Summary
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {interview.interviewSummary || "Interview completed with overall successful scores."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-250 rounded-2xl p-6">
                    <Video size={36} className="text-gray-400 mx-auto mb-3 animate-pulse" />
                    <h4 className="font-bold text-gray-800 text-sm">Interview Not Completed Yet</h4>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      This candidate has not finished their scheduled video interview. Video evaluation scores and ML predictions will unlock once the interview is completed and analyzed.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ML Hiring Prediction Section (Only shown if both exist) */}
          <Card className="shadow-md border-gray-250 overflow-hidden">
            <div className="p-6 space-y-6">
              <h3 className="font-extrabold text-gray-950 text-lg border-b pb-3 flex items-center gap-2">
                <Brain size={18} className="text-purple-600" />
                ML Hiring Prediction
              </h3>

              {interview && mlPrediction ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Gauge/Metrics */}
                  <div className="flex flex-col items-center justify-center text-center p-4 border-r border-gray-100">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Circular border gauge */}
                      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          fill="none" 
                          stroke={mlPrediction.hiringProbability >= 70 ? "#10b981" : mlPrediction.hiringProbability >= 45 ? "#f59e0b" : "#ef4444"} 
                          strokeWidth="8" 
                          strokeDasharray="264" 
                          strokeDashoffset={264 - (264 * mlPrediction.hiringProbability) / 100}
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-3xl font-black text-gray-900">{mlPrediction.hiringProbability}%</span>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Probability</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recommendation</p>
                      <Badge variant={
                        mlPrediction.recommendation === "Recommended" ? "success" : 
                        mlPrediction.recommendation === "Under Review" ? "warning" : "danger"
                      }>
                        {mlPrediction.recommendation}
                      </Badge>
                    </div>
                  </div>

                  {/* Prediction features list */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
                        Feature Influence on Decision
                      </h4>
                      <span className="text-xs font-bold text-gray-500">
                        Confidence: <span className="text-purple-700 font-extrabold">{mlPrediction.confidence}</span>
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        { 
                          label: "Skills Match %", 
                          val: candidate.matchPercentage, 
                          weight: mlPrediction.featureContributions?.skillsMatch 
                        },
                        { 
                          label: "Interview Score", 
                          val: interview.interviewScore, 
                          weight: mlPrediction.featureContributions?.interviewScore 
                        },
                        { 
                          label: "AI Resume Score", 
                          val: candidate.aiScore, 
                          weight: mlPrediction.featureContributions?.resumeScore 
                        },
                        { 
                          label: "Experience Years", 
                          val: `${candidate.experienceYears} yrs`, 
                          weight: mlPrediction.featureContributions?.experienceYears 
                        },
                        { 
                          label: "Education Level", 
                          val: candidate.education?.[0]?.degree ? "Provided" : null, 
                          weight: mlPrediction.featureContributions?.educationLevel,
                          isEdu: true 
                        }
                      ].map((item, idx) => {
                        const isValAvailable = item.val !== undefined && item.val !== null;
                        const weightDisplay = !isValAvailable 
                          ? "Not Available" 
                          : (item.isEdu && item.weight === 0) 
                          ? "Qualifying Feature" 
                          : `${item.weight}%`;

                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-700">{item.label}</span>
                              <span className="text-gray-500 font-bold">
                                {isValAvailable ? `Value: ${item.val}` : "Not Available"} &mdash; Influence: <span className="font-extrabold text-gray-900">{weightDisplay}</span>
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all" 
                                style={{ width: `${isValAvailable ? (item.weight || 5) : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : !interview ? (
                <div className="flex items-center gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-amber-800">
                    Interview Required Before Hiring Prediction
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-850">
                    ML Hiring Prediction is currently <span className="font-bold">Not Available</span>. Ensure the Python ML service is running.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recruiter Decisions */}
          <Card className="shadow-lg border-gray-300 bg-white">
            <div className="p-6 text-center space-y-6">
              <div>
                <h3 className="font-black text-gray-950 text-xl tracking-tight">Recruiter Decision</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                  {interview
                    ? "The AI prediction serves purely as decision-support. The final decision rests entirely with the hiring manager."
                    : "Complete the interview stage first before making a final hiring decision."}
                </p>
              </div>

              {!interview && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Interview Required Before Hiring Decision</p>
                    <p className="text-xs text-amber-700 mt-0.5">Use the 🎥 button on the Resumes page to schedule and complete a video interview first. Once the candidate completes the interview, the 'Select & Hire' button will unlock here.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Button
                  variant="success"
                  disabled={decisionLoading || !interview}
                  onClick={() => handleDecision("selected")}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-md ${
                    !interview ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  title={!interview ? "Complete the interview first to unlock hiring decision" : "Select and hire this candidate"}
                >
                  <ShieldCheck size={18} /> Select &amp; Hire Candidate
                </Button>
                <Button
                  variant="ghost"
                  disabled={decisionLoading}
                  onClick={() => handleDecision("shortlisted")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-gray-350 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-sm text-gray-700 bg-white cursor-pointer"
                >
                  <Clock size={18} /> {interview ? "Request Additional Interview" : "Move to Shortlisted"}
                </Button>
                <Button
                  variant="danger"
                  disabled={decisionLoading}
                  onClick={() => handleDecision("rejected")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-md cursor-pointer"
                >
                  <X size={18} /> Reject Candidate
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
