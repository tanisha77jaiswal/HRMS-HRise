import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import {
  Video,
  Mic,
  Square,
  CheckCircle,
  Sparkles,
  Play,
  ArrowLeft,
  Clock,
  Calendar,
  Briefcase,
  Lock,
  ChevronRight,
  AlertCircle,
  Maximize,
  ShieldAlert,
  FileText,
  EyeOff,
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";
import { syncPush } from "../utils/sync";
import { getTailoredQuestions } from "../utils/questions";
import { api } from "../utils/api";

// ─── Helper ─────────────────────────────────────────────────────────────────
function formatScheduledDate(dateStr) {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function StatusPill({ status }) {
  const map = {
    scheduled: {
      label: "Pending",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    analyzed: {
      label: "Completed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    completed: {
      label: "Completed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
  };
  const s = map[status] || map["scheduled"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Interview Dashboard (list view) ────────────────────────────────────────
function InterviewDashboard({ sessions, onStart }) {
  const pending = sessions.filter((s) => s.status === "scheduled");
  const done = sessions.filter((s) => s.status !== "scheduled");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
          My Interviews
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View your scheduled interviews and complete them before the deadline.
        </p>
      </div>

      {/* Pending */}
      <section>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertCircle size={13} className="text-amber-500" />
          Pending &mdash; {pending.length} interview{pending.length !== 1 ? "s" : ""}
        </p>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              No pending interviews. You&rsquo;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusPill status={s.status} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug truncate">
                    {s.jobTitle || "Interview"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatScheduledDate(s.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.questions?.length || 5} questions
                    </span>
                    {s.candidateName && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} />
                        {s.candidateName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onStart(s)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm shadow-indigo-200 whitespace-nowrap cursor-pointer"
                >
                  Start Interview
                  <ChevronRight size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {done.length > 0 && (
        <section>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle size={13} className="text-emerald-500" />
            Completed &mdash; {done.length} interview{done.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {done.map((s) => (
              <div
                key={s.id}
                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 opacity-80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusPill status={s.status} />
                  </div>
                  <h3 className="font-bold text-gray-700 text-base leading-snug truncate">
                    {s.jobTitle || "Interview"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatScheduledDate(s.scheduledDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.questions?.length || s.answers?.length || 5} questions answered
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl whitespace-nowrap">
                  <Lock size={14} />
                  Submitted
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CandidateInterviewPage() {
  const { user } = useAuth();

  // ── view state: "dashboard" | "preflight" | "interview" | "analyzing" | "done"
  const [view, setView] = useState("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // interview room state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [answersText, setAnswersText] = useState({});
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeSpeechText, setActiveSpeechText] = useState("");
  const [questions, setQuestions] = useState([]);
  const currentQ = questions[currentQIndex] || null;

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const isPendingSubmitRef = useRef(false);

  // ── Load sessions from backend ───────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const allSessions = await api.interviews.getAll();
      if (Array.isArray(allSessions)) {
        const mySessions = allSessions.filter(
          (s) => s.candidateEmail?.toLowerCase() === user.email?.toLowerCase()
        );
        setSessions(mySessions);
        localStorage.setItem("hrise_interview_sessions", JSON.stringify(allSessions));
      }
    } catch (err) {
      console.warn("Failed to fetch sessions from backend, loading from localStorage:", err);
      const savedSessions = localStorage.getItem("hrise_interview_sessions");
      let allSessions = [];
      if (savedSessions) {
        try {
          allSessions = JSON.parse(savedSessions);
        } catch (e) {}
      }
      const mySessions = allSessions.filter(
        (s) => s.candidateEmail?.toLowerCase() === user.email?.toLowerCase()
      );
      setSessions(mySessions);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── Fullscreen tracking ───────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.warn("Fullscreen request failed:", e);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── Start a specific interview session (go to preflight first) ────────────
  const handleStart = useCallback(
    (session) => {
      setActiveSession(session);
      setCurrentQIndex(0);
      setRecordings([]);
      setAnswersText({});
      setIsReviewMode(false);

      // Use questions from session, else generate from job title
      if (session.questions && session.questions.length > 0) {
        setQuestions(session.questions);
      } else {
        setQuestions(getTailoredQuestions(session.jobTitle || "general", 5));
      }

      // Show pre-flight briefing — fullscreen must be enabled before interview
      setView("preflight");
    },
    []
  );

  // ── Enter interview room (called after fullscreen confirmed) ──────────────
  const beginInterview = useCallback(async () => {
    await enterFullscreen();
    // Small delay to let the fullscreen event fire
    setTimeout(() => {
      setView("interview");
    }, 300);
  }, []);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 }
        },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.log("Camera access denied or not available");
    }
  }, []);

  useEffect(() => {
    if (view === "interview") {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [view, startCamera]);

  useEffect(() => {
    if (!currentQ || view !== "interview") return;
    const active = recordings.find((r) => r.questionId === currentQ.id);
    if (active) {
      setIsReviewMode(true);
    } else {
      setIsReviewMode(false);
      if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [currentQIndex, recordings, currentQ?.id, view]);

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = () => {
    setIsReviewMode(false);
    setAnswersText((prev) => ({ ...prev, [currentQ.id]: "" }));
    if (!streamRef.current) {
      startCamera().then(() => proceedWithRecording());
    } else {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      proceedWithRecording();
    }
  };

  const proceedWithRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setRecordingTime(0);
    setActiveSpeechText("");

    const targetQuestionId = currentQ.id;
    const chunks = [];

    const options = {
      mimeType: "video/webm;codecs=vp8,opus",
      videoBitsPerSecond: 150000,
      audioBitsPerSecond: 32000,
    };
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch (e) {
      console.warn("Failed to create MediaRecorder with options, using default:", e);
      recorder = new MediaRecorder(streamRef.current);
    }
    mediaRecorderRef.current = recorder;

    let localRecordingTime = 0;
    let localSpeechText = "";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          const current = final || interim;
          localSpeechText = current;
          setActiveSpeechText(current);
          setAnswersText((prev) => ({ ...prev, [targetQuestionId]: current }));
        };

        recognition.onerror = (e) => console.error("Speech Recognition error:", e);
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.error("Failed to start Speech Recognition:", e);
      }
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      const blob = new Blob(chunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);
      const cacheKey = `${targetQuestionId}_candidate`;
      if (!window.__hrise_video_blobs) window.__hrise_video_blobs = {};
      window.__hrise_video_blobs[cacheKey] = ""; // placeholder

      try {
        const base64 = await blobToBase64(blob);
        window.__hrise_video_blobs[cacheKey] = base64;
      } catch (err) {
        console.error("Failed to convert blob to base64, falling back to local URL:", err);
        window.__hrise_video_blobs[cacheKey] = videoUrl;
      }

      // Only use what was actually spoken — never inject fake text
      const finalSpeechText = localSpeechText.trim();

      setRecordings((prev) => {
        const filtered = prev.filter((r) => r.questionId !== targetQuestionId);
        return [
          ...filtered,
          { questionId: targetQuestionId, duration: `${localRecordingTime}s`, videoUrl, transcript: finalSpeechText },
        ];
      });

      setAnswersText((prev) => {
        const updated = { ...prev, [targetQuestionId]: finalSpeechText };
        if (isPendingSubmitRef.current) {
          isPendingSubmitRef.current = false;
          handleSubmit(updated);
        }
        return updated;
      });

      // Only set review mode if we are still on the same question
      setCurrentQIndex((currentIdx) => {
        if (questions[currentIdx]?.id === targetQuestionId) {
          setIsReviewMode(true);
        }
        return currentIdx;
      });
    };

    recorder.start();
    timerRef.current = window.setInterval(() => {
      localRecordingTime++;
      setRecordingTime(localRecordingTime);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    }
  };

  const handleNext = () => {
    if (isRecording) {
      stopRecording();
      if (currentQIndex === questions.length - 1) {
        isPendingSubmitRef.current = true;
        return;
      }
    }

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setRecordingTime(0);
    } else {
      handleSubmit();
    }
  };

  // ── Submit interview ───────────────────────────────────────────────────────
  const handleSubmit = (finalAnswersText = answersText) => {
    setView("analyzing");

    const candidateAnswers = questions.map((q) => {
      const actualSpeech = (finalAnswersText[q.id] || "").trim();
      const wordCount = actualSpeech ? actualSpeech.split(/\s+/).length : 0;
      const hasAnswer = wordCount > 0;

      // Score proportionally to how much was actually said (max ~95 for 100+ words)
      const baseScore = hasAnswer ? Math.min(95, 40 + Math.floor(wordCount * 0.55)) : 0;
      const commScore = hasAnswer ? Math.min(95, baseScore + Math.floor(Math.random() * 8)) : 0;
      const confidence = hasAnswer ? Math.min(95, baseScore + Math.floor(Math.random() * 6)) : 0;

      const keywordMatches = ["Python", "React", "Docker", "Machine Learning", "PyTorch", "AWS", "SQL"].filter(
        (k) => actualSpeech.toLowerCase().includes(k.toLowerCase())
      );

      return {
        questionId: q.id,
        question: q.question,
        videoUrl: window.__hrise_video_blobs?.[`${q.id}_candidate`] || "",
        transcript: actualSpeech || "",   // never inject fake text
        analysis: {
          communicationScore: commScore,
          confidenceScore: confidence,
          keywordMatches: keywordMatches,
          overallRating: Math.round((commScore + confidence) / 2),
          summary: !hasAnswer
            ? "No verbal response was recorded for this question."
            : wordCount < 10
            ? "Brief response recorded. Consider elaborating more in future answers."
            : "Response recorded and analysed successfully.",
        },
      };
    });

    setTimeout(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // ── Update session status to "analyzed" in localStorage ──
      const saved = localStorage.getItem("hrise_interview_sessions");
      let sessionsList = [];
      if (saved) {
        try { sessionsList = JSON.parse(saved); } catch (e) {}
      }

      const sessionId = activeSession?.id;
      const idx = sessionsList.findIndex((s) => s.id === sessionId);

      const updatedSession = {
        ...(idx !== -1 ? sessionsList[idx] : {}),
        id: sessionId || `i-candidate-${Date.now()}`,
        candidateName: user?.name || "",
        candidateEmail: user?.email || "",
        jobId: activeSession?.jobId || "",
        jobTitle: activeSession?.jobTitle || "Interview",
        questions: questions,
        answers: candidateAnswers,
        status: "analyzed",          // ← marks as completed
        completedAt: new Date().toISOString(),
        scheduledDate: activeSession?.scheduledDate || new Date().toISOString().slice(0, 10),
      };

      if (idx !== -1) {
        sessionsList[idx] = updatedSession;
      } else {
        sessionsList = [updatedSession, ...sessionsList];
      }
      localStorage.setItem("hrise_interview_sessions", JSON.stringify(sessionsList));
      syncPush.interviews.create(updatedSession);

      // ── Update candidate record status ──
      const candidatesSaved = localStorage.getItem("hrise_candidates");
      if (candidatesSaved) {
        try {
          const candidatesList = JSON.parse(candidatesSaved);
          const candIdx = candidatesList.findIndex(
            (c) =>
              c.email?.toLowerCase() === user?.email?.toLowerCase()
          );
          if (candIdx !== -1) {
            candidatesList[candIdx].status = "interviewed";
            candidatesList[candIdx].interviewCompleted = true;
            candidatesList[candIdx].interviewScore =
              candidateAnswers.reduce((acc, a) => acc + a.analysis.overallRating, 0) /
              candidateAnswers.length;
            localStorage.setItem("hrise_candidates", JSON.stringify(candidatesList));
            syncPush.candidates.create(candidatesList[candIdx]);
          }
        } catch (e) { console.error(e); }
      }

      addHriseNotification(
        "Interview Submitted",
        "Your video interview has been submitted successfully. Our AI is now analysing your responses — results will be available shortly.",
        "interview",
        "candidate"
      );

      // Alert HR Recruiter that an interview was submitted and analysis is ready
      addHriseNotification(
        "Interview Completed",
        `${user?.name || "A candidate"} has completed the video interview for "${activeSession?.jobTitle || "Interview"}". AI analysis is ready.`,
        "interview",
        "recruiter"
      );

      // Reload sessions and show done screen
      loadSessions();
      setView("done");
    }, 3500);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  // Pre-flight briefing screen
  if (view === "preflight") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="candidate" />
        <div className="lg:ml-64">
          <Header title="Video Interview" />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setView("dashboard")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
              >
                <ArrowLeft size={15} /> Back to interviews
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                  <Maximize size={30} className="text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-950 mb-2">Ready to Begin?</h1>
                <p className="text-gray-500 text-sm">
                  <span className="font-semibold text-indigo-600">{activeSession?.jobTitle}</span> &mdash; {questions.length} questions
                </p>
              </div>

              {/* Rules card */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6 space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={13} /> Interview Guidelines
                </p>
                {[
                  { icon: <Maximize size={16} className="text-indigo-500" />, title: "Full-screen required", desc: "The interview must be taken in full-screen mode. Exiting full-screen will pause the session." },
                  { icon: <EyeOff size={16} className="text-amber-500" />, title: "No tab switching", desc: "Do not switch tabs or minimise the window during the interview." },
                  { icon: <Video size={16} className="text-purple-500" />, title: "Camera & microphone", desc: "Ensure your camera and microphone are working before you begin." },
                  { icon: <Clock size={16} className="text-emerald-500" />, title: "Time per question", desc: "Aim for 1–3 minutes per answer. You can re-record before moving to the next question." },
                  { icon: <ShieldAlert size={16} className="text-rose-500" />, title: "One attempt only", desc: "Once submitted, the interview is locked and cannot be retaken." },
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {rule.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{rule.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full-screen prompt */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <span className="font-bold">Full-screen mode is mandatory.</span> Clicking the button below will
                  switch your browser to full-screen and start the interview.
                </p>
              </div>

              <button
                onClick={beginInterview}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
              >
                <Maximize size={20} />
                Enable Full Screen &amp; Begin Interview
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Analyzing overlay
  if (view === "analyzing") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="candidate" />
        <div className="lg:ml-64">
          <Header title="Video Interview" />
          <main className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles size={40} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Analysing Your Responses</h2>
              <p className="text-gray-500 mb-6">
                Our AI is transcribing and scoring your answers for communication, confidence, and technical depth.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs mx-auto">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full animate-pulse"
                  style={{ width: "70%" }}
                />
              </div>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Done / success screen → return to dashboard
  if (view === "done") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="candidate" />
        <div className="lg:ml-64">
          <Header title="Video Interview" />
          <main className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Interview Submitted!</h2>
              <p className="text-gray-500 mb-8">
                Thank you! Your responses have been recorded and AI analysis is complete. The hiring team will review your submission shortly.
              </p>
              <button
                onClick={() => setView("dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
              >
                Back to My Interviews
              </button>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Interview room
  if (view === "interview") {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-700">Preparing interview questions…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar role="candidate" />
        <div className="lg:ml-64">
          <Header title="Video Interview" />
          <main className="p-4 sm:p-6 lg:p-8">
            {/* Back + progress */}
            <div className="max-w-4xl mx-auto mb-5">
              <button
                onClick={() => {
                  if (isRecording) stopRecording();
                  if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                  exitFullscreen();
                  setView("dashboard");
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4 cursor-pointer"
              >
                <ArrowLeft size={15} /> Back to interviews
              </button>
              <div className="flex items-center gap-1 mb-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < currentQIndex
                        ? "bg-indigo-500"
                        : i === currentQIndex
                        ? "bg-indigo-300"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Question {currentQIndex + 1} of {questions.length} &mdash;{" "}
                <span className="text-indigo-600 font-semibold">{activeSession?.jobTitle}</span>
              </p>
            </div>

            {/* Fullscreen-lost blocking overlay */}
            {!isFullscreen && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(15,10,40,0.92)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div style={{ textAlign: "center", maxWidth: 380 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: "linear-gradient(135deg,#ef4444,#b91c1c)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <ShieldAlert size={32} color="#fff" />
                  </div>
                  <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 10px" }}>
                    Full-Screen Required
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.6, margin: "0 0 28px" }}>
                    You exited full-screen mode. Please re-enable full-screen to
                    continue your interview. Your progress is saved.
                  </p>
                  <button
                    onClick={enterFullscreen}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "13px 28px",
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 14,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                    }}
                  >
                    <Maximize size={18} />
                    Return to Full Screen
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Camera */}
              <Card>
                <div className="p-4">
                  {recordings.find((r) => r.questionId === currentQ.id) && (
                    <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3 w-fit">
                      <button
                        onClick={() => setIsReviewMode(false)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          !isReviewMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        📹 Camera View
                      </button>
                      <button
                        onClick={() => setIsReviewMode(true)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          isReviewMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ▶️ Review Recording
                      </button>
                    </div>
                  )}

                  <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                    {isReviewMode && recordings.find((r) => r.questionId === currentQ.id) ? (
                      <video
                        src={recordings.find((r) => r.questionId === currentQ.id)?.videoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        {!streamRef.current && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <Video size={48} className="text-gray-600 mb-3" />
                            <p className="text-gray-400 text-sm">Click &ldquo;Start Recording&rdquo; to enable camera</p>
                          </div>
                        )}
                        {isRecording && (
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                              {recordingTime}s
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {recordings.find((r) => r.questionId === currentQ.id) && !isReviewMode && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="success">
                          <Play size={12} /> Recorded
                        </Badge>
                      </div>
                    )}
                  </div>

                  {isRecording && activeSpeechText && (
                    <div className="mt-3 p-3.5 bg-indigo-50 border border-indigo-150 rounded-xl animate-pulse">
                      <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                        Live AI Subtitles
                      </p>
                      <p className="text-xs text-indigo-950 font-medium italic leading-relaxed">
                        &ldquo;{activeSpeechText}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        📝 Answer Transcript
                      </label>
                      {isRecording && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Transcribing live…
                        </span>
                      )}
                    </div>
                    <textarea
                      value={answersText[currentQ.id] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnswersText((prev) => ({ ...prev, [currentQ.id]: val }));
                      }}
                      placeholder="Your spoken transcript will appear here automatically. You can also type or edit your response…"
                      className="w-full h-28 px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white text-gray-800 resize-none font-medium leading-relaxed focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Press &ldquo;Start Recording&rdquo; to speak, or type your response directly.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-4">
                    {isRecording ? (
                      <Button variant="danger" onClick={stopRecording}>
                        <Square size={16} /> Stop Recording
                      </Button>
                    ) : (
                      <Button onClick={startRecording}>
                        <Mic size={16} />{" "}
                        {recordings.find((r) => r.questionId === currentQ.id) ? "Re-record" : "Start Recording"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Question */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="info">{currentQ.category}</Badge>
                    <Badge
                      variant={
                        currentQ.difficulty === "hard" ? "danger" : currentQ.difficulty === "medium" ? "warning" : "success"
                      }
                    >
                      {currentQ.difficulty}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{currentQ.question}</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Record your video answer. You can re-record if needed. Aim for 1–3 minutes.
                  </p>

                  {recordings.find((r) => r.questionId === currentQ.id) && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-4">
                      <div className="flex items-center gap-2 text-sm text-emerald-700">
                        <CheckCircle size={16} />
                        <span>
                          Answer recorded ({recordings.find((r) => r.questionId === currentQ.id)?.duration})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (isRecording) stopRecording();
                        if (currentQIndex > 0) setCurrentQIndex((prev) => prev - 1);
                      }}
                      disabled={currentQIndex === 0}
                    >
                      <ArrowLeft size={16} /> Previous
                    </Button>
                    <Button onClick={handleNext}>
                      {currentQIndex === questions.length - 1 ? "Submit Interview" : "Next Question"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Dashboard (default view) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="candidate" />
      <div className="lg:ml-64">
        <Header title="Video Interview" />
        <main className="p-4 sm:p-6 lg:p-8">
          <InterviewDashboard sessions={sessions} onStart={handleStart} />
        </main>
      </div>
    </div>
  );
}
