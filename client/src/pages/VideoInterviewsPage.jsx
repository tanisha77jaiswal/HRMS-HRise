import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import {
  Video,
  Sparkles,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  CalendarClock,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";
import { getTailoredQuestions } from "../utils/questions";
import { syncPush } from "../utils/sync";
import { api } from "../utils/api";

const femaleSpeakerVideo =
  "https://assets.mixkit.co/videos/preview/mixkit-woman-talking-on-a-video-call-with-laptop-42171-large.mp4";
const maleSpeakerVideo =
  "https://assets.mixkit.co/videos/preview/mixkit-young-man-having-a-video-call-on-laptop-42173-large.mp4";

const getFallbackVideo = (candidateName) => {
  const lowercaseName = candidateName.toLowerCase();
  if (
    lowercaseName.includes("james") ||
    lowercaseName.includes("marcus") ||
    lowercaseName.includes("david") ||
    lowercaseName.includes("thomas") ||
    lowercaseName.includes("wright") ||
    lowercaseName.includes("chen")
  ) {
    return maleSpeakerVideo;
  }
  return femaleSpeakerVideo;
};

// Estimates time stamps for transcripts to enable clickable seek navigation
function parseTranscriptToPhrases(transcript) {
  const sentences = transcript.split(/(?<=[.!?])\s+/);
  let currentTime = 0;
  return sentences.map((sentence) => {
    const wordCount = sentence.split(/\s+/).length;
    const duration = Math.max(2, Math.round(wordCount * 0.45));
    const start = currentTime;
    const end = start + duration;
    currentTime = end;
    return {
      text: sentence,
      start,
      end,
    };
  });
}

export default function VideoInterviewsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideoInterviewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsList, candidatesList, jobsList] = await Promise.all([
        api.interviews.getAll(),
        api.candidates.getAll(),
        api.jobs.getAll()
      ]);
      setSessions(Array.isArray(sessionsList) ? sessionsList : []);
      setCandidates(Array.isArray(candidatesList) ? candidatesList : []);
      setJobs(Array.isArray(jobsList) ? jobsList : []);
    } catch (err) {
      console.error("Failed to load video interview data:", err);
      setError("Failed to load video interview data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoInterviewsData();

    window.addEventListener("hrise_dashboard_refresh", fetchVideoInterviewsData);
    window.addEventListener("storage", fetchVideoInterviewsData);
    return () => {
      window.removeEventListener("hrise_dashboard_refresh", fetchVideoInterviewsData);
      window.removeEventListener("storage", fetchVideoInterviewsData);
    };
  }, []);

  const shortlistedCandidates = candidates.filter((c) => c.status === "shortlisted");

  const [selectedSession, setSelectedSession] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const videoPlayerRef = useRef(null);

  // Form states for creating interview
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [formNumQuestions, setFormNumQuestions] = useState(10);
  const [formDifficulty, setFormDifficulty] = useState("Mixed");

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDays, setRescheduleDays] = useState(3);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Inline delete confirmation state (stores session.id of the pending delete)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions.filter(
    (s) =>
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sessions are persisted directly on mutation

  // Sync active question automatically when selected session changes
  useEffect(() => {
    if (selectedSession) {
      const firstAnswered = selectedSession.questions.find((q) =>
        selectedSession.answers.some((a) => a.questionId === q.id),
      );
      if (firstAnswered) {
        setActiveQuestionId(firstAnswered.id);
      } else {
        setActiveQuestionId(selectedSession.questions[0]?.id || null);
      }
    } else {
      setActiveQuestionId(null);
    }
  }, [selectedSession]);

  const role = user?.role || "recruiter";
  const isHRAdmin = role === "recruiter";

  // ─── Delete Interview ───────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId) => {
    setConfirmDeleteId(null);

    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Remove from local state immediately
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (selectedSession?.id === sessionId) setSelectedSession(null);

    // Call backend
    try {
      await api.interviews.delete(sessionId);
      console.log(`[Delete] Interview ${sessionId} deleted from backend.`);
    } catch (err) {
      console.warn("Backend delete failed (local already removed):", err.message);
    }
  };

  // ─── Reschedule Interview ───────────────────────────────────────────────────
  const handleReschedule = async () => {
    if (!rescheduleTarget) return;
    setRescheduling(true);

    const newDate = new Date(Date.now() + rescheduleDays * 86400000).toISOString().slice(0, 10);

    const updatedSession = {
      ...rescheduleTarget,
      status: "scheduled",
      answers: [],
      scheduledDate: newDate,
      rescheduledAt: new Date().toISOString(),
      rescheduleReason: rescheduleReason || "Rescheduled by HR",
    };

    // Update local state
    setSessions((prev) => prev.map((s) => s.id === rescheduleTarget.id ? updatedSession : s));
    if (selectedSession?.id === rescheduleTarget.id) setSelectedSession(updatedSession);

    // Call backend
    try {
      await api.interviews.reschedule(rescheduleTarget.id, {
        daysFromNow: rescheduleDays,
        reason: rescheduleReason || "Rescheduled by HR",
      });
    } catch (err) {
      console.warn("Backend reschedule failed (local already updated):", err.message);
    }

    // Notify
    addHriseNotification(
      "Interview Rescheduled",
      `The interview for ${rescheduleTarget.candidateName} (${rescheduleTarget.jobTitle}) has been rescheduled to ${newDate}. ${rescheduleReason ? `Reason: ${rescheduleReason}` : ""}`,
      "interview",
      "recruiter"
    );
    addHriseNotification(
      "Interview Rescheduled",
      `Your interview for "${rescheduleTarget.jobTitle}" has been rescheduled to ${newDate}. ${rescheduleReason ? `Reason: ${rescheduleReason}` : "Please check the Video Interviews page to begin."}`,
      "interview",
      "candidate"
    );

    setRescheduling(false);
    setRescheduleTarget(null);
    setRescheduleReason("");
    setRescheduleDays(3);
  };

  const handleGenerateQuestions = async () => {
    const selectedCandidate = selectedCandidateId && selectedCandidateId !== "manual"
      ? candidates.find((c) => c.id === selectedCandidateId)
      : null;

    const candName = selectedCandidate
      ? (selectedCandidate.name || "New Candidate")
      : (manualName || "New Candidate");

    const jobId = selectedCandidate?.jobId || null;
    const associatedJob = jobId ? jobs.find((j) => j.id === jobId) : null;
    const jobTitle = associatedJob?.title || manualTitle || "Software Engineer";
    const jobDescription = associatedJob?.description || "";
    const requiredSkills = associatedJob?.requiredSkills || [];

    setGeneratingQuestions(true);

    let generatedQuestions = [];
    let questionSource = "local";

    try {
      // Call backend → Gemini AI to generate job-specific questions
      const result = await api.interviews.generateQuestions({
        jobId,
        jobTitle,
        jobDescription,
        requiredSkills,
        count: formNumQuestions,
        difficulty: formDifficulty
      });
      generatedQuestions = result.questions || [];
      questionSource = result.source || "gemini";
      console.log(`[Interview] Generated ${generatedQuestions.length} questions via ${questionSource} for: ${jobTitle}`);
    } catch (apiErr) {
      console.warn("Backend question generation failed, using local fallback:", apiErr.message);
      // Fallback to local hardcoded bank
      generatedQuestions = getTailoredQuestions(jobTitle, formNumQuestions);
      questionSource = "local";
    }

    setGeneratingQuestions(false);
    setShowCreateModal(false);

    const newSession = {
      id: `i-${Date.now()}`,
      candidateId: selectedCandidateId || "manual",
      candidateName: candName,
      jobId: jobId || "custom",
      jobTitle: jobTitle,
      questions: generatedQuestions,
      answers: [],
      status: "scheduled",
      questionSource,
      scheduledDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // Save session to backend
    try {
      await api.interviews.create(newSession);
      setSessions((prev) => [newSession, ...prev]);
    } catch (err) {
      console.error("Failed to create interview session on backend:", err);
    }

    addHriseNotification(
      "Interview Scheduled",
      `An AI video interview with ${generatedQuestions.length} ${questionSource === "gemini" ? "Gemini AI-generated" : "tailored"} questions has been scheduled for ${candName} — Role: ${jobTitle}.`,
      "interview",
      "recruiter"
    );

    addHriseNotification(
      "New Interview Invitation",
      `You have been invited to complete an AI video interview for the position of "${jobTitle}". Please go to the Video Interviews page to begin.`,
      "interview",
      "candidate"
    );

    if (selectedCandidateId && selectedCandidateId !== "manual") {
      try {
        await api.candidates.update(selectedCandidateId, {
          status: "shortlisted",
          interviewScheduled: true
        });
      } catch (err) {
        console.error("Failed to update candidate status on backend:", err);
      }
    }

    // Reset form
    setSelectedCandidateId("");
    setManualName("");
    setManualTitle("");
    setFormNumQuestions(10);
    setFormDifficulty("Mixed");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Video Interviews" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8">
          {!isHRAdmin && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-purple-50 border border-purple-200 rounded-2xl">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-purple-800">HR Access — Schedule &amp; Review</p>
                <p className="text-[11px] text-purple-600 mt-0.5">You can schedule AI video interviews and review candidate analysis results. Final hiring decisions are restricted to HR Recruiteristrators.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <p className="text-xs font-bold text-red-750">Warning: {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-750 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                AI Video Interviews
                {loading && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1">
                Generate questions, conduct interviews, and analyze answers with
                AI
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Sparkles size={16} /> Generate New Interview
            </Button>
          </div>

          {/* Feature Banner */}
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Video size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  AI-Powered Async Video Interviews
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  AI generates tailored interview questions based on the job
                  description. Candidates record answers via browser. AI
                  transcribes, analyzes communication, confidence, and keyword
                  matching — then generates a structured report.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant="default" className="bg-white/20 text-white">
                  MediaRecorder API
                </Badge>
                <Badge variant="default" className="bg-white/20 text-white">
                  AI Analysis
                </Badge>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="xl:col-span-1 space-y-4">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`transition-all hover:shadow-md ${selectedSession?.id === session.id ? "ring-2 ring-indigo-500 shadow-md" : ""}`}
                  >
                    <div
                      onClick={() => setSelectedSession(session)}
                      className="p-5 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                            {session.candidateName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {session.candidateName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {session.jobTitle}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            session.status === "analyzed"
                              ? "success"
                              : session.status === "completed"
                                ? "info"
                                : session.status === "in-progress"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {session.scheduledDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} /> {session.questions.length}{" "}Qs
                        </span>
                        {session.rescheduledAt && (
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <RotateCcw size={11} /> Rescheduled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action row: Reschedule + Delete */}
                    <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                      {confirmDeleteId === session.id ? (
                        /* Inline confirmation — replaces the two buttons */
                        <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[11px] font-semibold text-red-700 flex-1">Delete this session?</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                            className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1 transition-all"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white rounded-lg px-3 py-1 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* Normal action buttons */
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRescheduleTarget(session);
                              setRescheduleDays(3);
                              setRescheduleReason("");
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-lg px-3 py-1.5 transition-all"
                          >
                            <CalendarClock size={13} />
                            Reschedule
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                            className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg px-3 py-1.5 transition-all"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 border-indigo-100 bg-white shadow-sm rounded-xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                    <Video size={20} className="text-indigo-600 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-gray-950">No Scheduled Sessions</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                    Click the <strong>"Generate New Interview"</strong> button above to invite shortlisted candidates or add custom applicants manually.
                  </p>
                </Card>
              )}
            </div>

            {/* Detail Panel */}
            <div className="xl:col-span-2">
              {selectedSession ? (
                <div className="space-y-6">
                  {/* Premium Custom Review Video Player & Interactive Transcripts */}
                  {activeQuestionId &&
                    selectedSession.status !== "scheduled" && (
                      <Card className="overflow-hidden border-2 border-indigo-100 shadow-md">
                        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles
                              size={18}
                              className="text-indigo-600 animate-pulse"
                            />
                            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                              AI Interactive Playback Panel
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-950 mb-4">
                            Q:{" "}
                            {
                              selectedSession.questions.find(
                                (q) => q.id === activeQuestionId,
                              )?.question
                            }
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HTML5 Player */}
                            <div>
                              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
                                <video
                                  ref={videoPlayerRef}
                                  src={
                                    window.__hrise_video_blobs?.[
                                      `${activeQuestionId}_candidate`
                                    ] ||
                                    selectedSession.answers.find(
                                      (a) => a.questionId === activeQuestionId,
                                    )?.videoUrl ||
                                    getFallbackVideo(
                                      selectedSession.candidateName,
                                    )
                                  }
                                  controls
                                  className="w-full h-full object-cover"
                                  onTimeUpdate={() => {
                                    if (videoPlayerRef.current) {
                                      setCurrentTime(
                                        videoPlayerRef.current.currentTime,
                                      );
                                    }
                                  }}
                                />

                                {/* Overlay tag */}
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {window.__hrise_video_blobs?.[
                                    `${activeQuestionId}_candidate`
                                  ]
                                    ? "LIVE RECORDED ATTEMPT"
                                    : "DEMO VIDEO"}
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                                <Clock size={12} className="text-gray-400" />
                                <span>
                                  Click on any transcript segment on the right
                                  to navigate the candidate's audio.
                                </span>
                              </div>
                            </div>

                            {/* Time-Stamped Transcripts */}
                            <div className="flex flex-col max-h-[220px] md:max-h-full">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Review Transcript
                              </p>
                              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {selectedSession.answers.find(
                                  (a) => a.questionId === activeQuestionId,
                                )?.transcript ? (
                                  parseTranscriptToPhrases(
                                    selectedSession.answers.find(
                                      (a) => a.questionId === activeQuestionId,
                                    ).transcript,
                                  ).map((phrase, idx) => {
                                    const isActive =
                                      currentTime >= phrase.start &&
                                      currentTime <= phrase.end;
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          if (videoPlayerRef.current) {
                                            videoPlayerRef.current.currentTime =
                                              phrase.start;
                                            videoPlayerRef.current.play();
                                          }
                                        }}
                                        className={`text-left p-2.5 rounded-xl border text-xs leading-relaxed transition-all w-full flex items-start ${
                                          isActive
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm font-medium scale-[1.01]"
                                            : "bg-white hover:bg-indigo-50/50 border-gray-200 text-gray-600 hover:text-gray-900"
                                        }`}
                                      >
                                        <span
                                          className={`inline-block font-mono text-[9px] font-bold px-1.5 py-0.5 rounded mr-2 flex-shrink-0 ${isActive ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-500"}`}
                                        >
                                          {Math.floor(phrase.start / 60)}:
                                          {(phrase.start % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                        </span>
                                        <span>{phrase.text}</span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <p className="text-xs text-gray-400 italic">
                                    No transcript recorded yet for this
                                    question.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                  {/* Session Info */}
                  <Card>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {selectedSession.candidateName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedSession.jobTitle} •{" "}
                            {selectedSession.questions.length} Questions
                          </p>
                        </div>
                        {selectedSession.status === "analyzed" && (
                          <Button variant="success" size="sm">
                            <CheckCircle size={16} /> View Full Report
                          </Button>
                        )}
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        {selectedSession.questions.map((q, i) => {
                          const answer = selectedSession.answers.find(
                            (a) => a.questionId === q.id,
                          );
                          const isActiveQ = activeQuestionId === q.id;
                          return (
                            <div
                              key={q.id}
                              onClick={() => {
                                if (answer) {
                                  setActiveQuestionId(q.id);
                                }
                              }}
                              className={`p-4 rounded-xl border transition-all ${
                                answer
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed opacity-80"
                              } ${
                                isActiveQ
                                  ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    isActiveQ
                                      ? "bg-indigo-600 text-white"
                                      : answer
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {q.question}
                                    </p>
                                    {isActiveQ && (
                                      <Badge variant="purple">
                                        Active Playback
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="default">
                                      {q.category}
                                    </Badge>
                                    <Badge
                                      variant={
                                        q.difficulty === "hard"
                                          ? "danger"
                                          : q.difficulty === "medium"
                                            ? "warning"
                                            : "info"
                                      }
                                    >
                                      {q.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {answer?.transcript ? (
                                <div className="ml-10 pl-4 border-l-2 border-emerald-300">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Play
                                      size={14}
                                      className="text-indigo-600"
                                    />
                                    <span className="text-xs font-medium text-indigo-600">
                                      Candidate Response
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                    {answer.transcript}
                                  </p>
                                  {answer.analysis && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Badge variant="success">
                                        Comm:{" "}
                                        {answer.analysis.communicationScore}/100
                                      </Badge>
                                      <Badge variant="info">
                                        Confidence:{" "}
                                        {answer.analysis.confidenceScore}/100
                                      </Badge>
                                      <Badge variant="purple">
                                        Overall: {answer.analysis.overallRating}
                                        /100
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="ml-10 flex items-center gap-2 text-sm text-gray-400">
                                  <Clock size={14} />
                                  <span>Awaiting response</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* AI Analysis Report */}
                  {selectedSession.status === "analyzed" && (() => {
                    const sessionCommScore = selectedSession.answers && selectedSession.answers.length > 0
                      ? Math.round(selectedSession.answers.reduce((acc, a) => acc + (a.analysis?.communicationScore || 0), 0) / selectedSession.answers.length)
                      : 0;

                    const sessionConfScore = selectedSession.answers && selectedSession.answers.length > 0
                      ? Math.round(selectedSession.answers.reduce((acc, a) => acc + (a.analysis?.confidenceScore || 0), 0) / selectedSession.answers.length)
                      : 0;

                    const sessionTechScore = selectedSession.answers && selectedSession.answers.length > 0
                      ? Math.round(selectedSession.answers.reduce((acc, a) => acc + (a.analysis?.overallRating || 0), 0) / selectedSession.answers.length)
                      : 0;

                    const sessionOverallScore = Math.round((sessionCommScore + sessionConfScore + sessionTechScore) / 3);

                    const fullSpeechText = selectedSession.answers
                      ? selectedSession.answers.map(a => a.transcript || "").join(" ").toLowerCase()
                      : "";

                    const spokenKeywords = ["python", "react", "docker", "aws", "sql", "node", "typescript", "javascript", "machine learning", "pytorch", "tensorflow", "statistics"]
                      .filter(k => fullSpeechText.includes(k) && !fullSpeechText.includes("no response recorded"))
                      .map(k => k === "sql" || k === "aws" ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1));

                    const isUnanswered = sessionOverallScore === 0 || fullSpeechText.trim() === "" || selectedSession.answers.every(a => a.transcript === "No response recorded.");

                    return (
                      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white animate-fade-in shadow-xl border border-gray-700">
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Sparkles size={22} className="text-yellow-400 animate-pulse" />
                            <h3 className="font-bold text-lg">
                              AI Interview Analysis Report
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {[
                              {
                                label: "Communication",
                                score: sessionCommScore,
                                color: isUnanswered ? "from-red-500 to-red-400" : "from-emerald-500 to-emerald-400",
                              },
                              {
                                label: "Confidence",
                                score: sessionConfScore,
                                color: isUnanswered ? "from-red-500 to-red-400" : "from-blue-500 to-blue-400",
                              },
                              {
                                label: "Technical Depth",
                                score: sessionTechScore,
                                color: isUnanswered ? "from-red-500 to-red-400" : "from-purple-500 to-purple-400",
                              },
                              {
                                label: "Overall Rating",
                                score: sessionOverallScore,
                                color: isUnanswered ? "from-red-500 to-red-400" : "from-amber-500 to-amber-400",
                              },
                            ].map((metric) => (
                              <div key={metric.label} className="text-center">
                                <div
                                  className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${metric.color} flex items-center justify-center text-xl font-extrabold text-white mb-2 shadow-md`}
                                >
                                  {metric.score}
                                </div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                  {metric.label}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3">
                            {isUnanswered ? (
                              <>
                                <div className="flex items-start gap-2">
                                  <AlertCircle
                                    size={16}
                                    className="text-red-500 mt-0.5 flex-shrink-0"
                                  />
                                  <p className="text-sm text-red-400 font-semibold">
                                    No spoken responses or text inputs were recorded during this interview session.
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <AlertCircle
                                    size={16}
                                    className="text-red-500 mt-0.5 flex-shrink-0"
                                  />
                                  <p className="text-sm text-red-400 font-semibold">
                                    AI analysis aborted: Unable to grade communication fluency, technical depth, or keywords due to empty transcripts.
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-start gap-2">
                                  <CheckCircle
                                    size={16}
                                    className="text-emerald-400 mt-0.5 flex-shrink-0"
                                  />
                                  <p className="text-sm text-gray-300">
                                    {spokenKeywords.length > 0
                                      ? `Spoken technical references isolated: ${spokenKeywords.join(", ")}.`
                                      : "Successfully presented active foundational concepts and paradigms."}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CheckCircle
                                    size={16}
                                    className="text-emerald-400 mt-0.5 flex-shrink-0"
                                  />
                                  <p className="text-sm text-gray-300">
                                    {sessionCommScore >= 75
                                      ? "Clear structured communication — fluid presentation of complex solutions."
                                      : "Communicated core highlights cleanly with simple structural terms."}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  {sessionConfScore < 75 ? (
                                    <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                  )}
                                  <p className="text-sm text-gray-300">
                                    {sessionConfScore < 75
                                      ? "Candidate response was relatively brief. Recommend prompting for deeper operational context and trade-offs."
                                      : "Demonstrated strong operational confidence and solid concept presentation."}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-sm text-gray-300 leading-relaxed">
                              <span className="text-white font-bold">
                                AI Recommendation:
                              </span>{" "}
                              {isUnanswered
                                ? "DO NOT PROGRESS. Candidate did not participate or submit responses for any of the scheduled interview questions. AI overall rating remains at 0/100."
                                : sessionOverallScore >= 80
                                  ? `Strong candidate for immediate progression. Overall rating calculated at ${sessionOverallScore}/100. Technical depth and communication clarity exceed threshold targets.`
                                  : `Progress with reservations. Overall rating calculated at ${sessionOverallScore}/100. Response length was brief, but basic tech foundations are established.`}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </div>
              ) : (
                <Card className="p-16 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                    <Video size={36} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select an Interview Session
                  </h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Choose a session from the list to view questions, answers,
                    and AI analysis.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Create AI Interview
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    AI will generate interview questions based on the job
                    description.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Select Shortlisted Candidate
                      </label>
                      {shortlistedCandidates.length > 0 ? (
                        <select
                          value={selectedCandidateId}
                          onChange={(e) => {
                            setSelectedCandidateId(e.target.value);
                            if (e.target.value !== "manual" && e.target.value !== "") {
                              const cand = shortlistedCandidates.find((c) => c.id === e.target.value);
                              if (cand) {
                                setManualName(cand.name);
                                const job = jobs.find((j) => j.id === cand.jobId);
                                setManualTitle(job ? job.title : "Software Engineer");
                              }
                            } else {
                              setManualName("");
                              setManualTitle("");
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-medium"
                        >
                          <option value="">-- Choose Candidate --</option>
                          {shortlistedCandidates.map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              {cand.name} (Shortlisted for {jobs.find((j) => j.id === cand.jobId)?.title || "Software Engineer"})
                            </option>
                          ))}
                          <option value="manual">➕ Add Custom Candidate Manually</option>
                        </select>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-200">
                          No shortlisted candidates found. Please shortlist candidates from the Resume Screening page, or enter manually below.
                        </div>
                      )}
                    </div>

                    {/* Manual candidate details if selectedCandidateId === "manual" or no shortlisted candidates */}
                    {(selectedCandidateId === "manual" || shortlistedCandidates.length === 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Candidate Full Name
                          </label>
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="e.g. Liam Smith"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Target Job Title
                          </label>
                          <input
                            type="text"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            placeholder="e.g. React Developer"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Number of Questions
                        </label>
                        <select 
                          value={formNumQuestions}
                          onChange={(e) => setFormNumQuestions(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                        >
                          <option value={10}>10 Questions</option>
                          <option value={15}>15 Questions</option>
                          <option value={20}>20 Questions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Difficulty Level
                        </label>
                        <select 
                          value={formDifficulty}
                          onChange={(e) => setFormDifficulty(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                        >
                          <option value="Mixed">Mixed</option>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleGenerateQuestions}
                      disabled={generatingQuestions}
                    >
                      {generatingQuestions ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating with Gemini AI...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> Generate Questions
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── Reschedule Modal ────────────────────────────────────────────── */}
          {rescheduleTarget && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CalendarClock size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Reschedule Interview</h3>
                      <p className="text-xs text-gray-500">
                        {rescheduleTarget.candidateName} &mdash; {rescheduleTarget.jobTitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> Rescheduling will reset this session to <em>scheduled</em> status and clear all previous answers so the candidate can retake the interview fresh.
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        New Interview Date
                      </label>
                      <select
                        value={rescheduleDays}
                        onChange={(e) => setRescheduleDays(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white font-medium"
                      >
                        <option value={3}>In 3 days ({new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)})</option>
                        <option value={5}>In 5 days ({new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)})</option>
                        <option value={7}>In 7 days ({new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Reason for Rescheduling <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        placeholder="e.g. Candidate missed the original session due to technical issues..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setRescheduleTarget(null);
                        setRescheduleReason("");
                        setRescheduleDays(3);
                      }}
                      disabled={rescheduling}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                      onClick={handleReschedule}
                      disabled={rescheduling}
                    >
                      {rescheduling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Rescheduling...
                        </>
                      ) : (
                        <>
                          <CalendarClock size={16} /> Confirm Reschedule
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
