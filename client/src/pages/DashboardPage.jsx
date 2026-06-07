import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Video,
  TrendingUp,
  CheckCircle,
  ArrowUpRight,
  Sparkles,
  Briefcase,
  UserCheck,
  Clock,
  BarChart3,
  ChevronRight,
  Inbox,
  Star,
  Target,
  RefreshCw,
} from "lucide-react";
import { MLAnalyticsPanel } from "../components/HiringPrediction";
import { api } from "../utils/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function pct(num, denom) {
  if (!denom) return 0;
  return Math.round((num / denom) * 100);
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, gradient, delta }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient }}
      >
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
      {delta !== undefined && delta !== null && (
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
            delta >= 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      )}
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────────────────
function FunnelBar({ label, count, total, color }) {
  const w = total > 0 ? pct(count, total) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{count}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    shortlisted:  { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    interviewed:  { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
    selected:     { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  dot: "bg-purple-500"  },
    rejected:     { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500"     },
    applied:      { bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-400"    },
    hired:        { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    dot: "bg-teal-500"    },
  };
  const s = map[status] || map.applied;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-sm font-bold text-gray-900 tabular-nums">{score}</span>
    </div>
  );
}

// ─── Read localStorage (instant fallback while API loads) ──────────────────────
function readLocalStorage() {
  let candidates = [], sessions = [], jobs = [], onboardings = [], notifications = [];
  try { candidates    = JSON.parse(localStorage.getItem("hrise_candidates")              || "[]"); } catch {}
  try { sessions      = JSON.parse(localStorage.getItem("hrise_interview_sessions")      || "[]"); } catch {}
  try { jobs          = JSON.parse(localStorage.getItem("hrise_jobs")                    || "[]"); } catch {}
  try { onboardings   = JSON.parse(localStorage.getItem("hrise_onboarding_records")      || "[]"); } catch {}
  return { candidates, sessions, jobs, onboardings, notifications };
}

// ─── CANDIDATE DASHBOARD ──────────────────────────────────────────────────────
function CandidateDashboard({ user }) {
  const navigate = useNavigate();
  const [myApps, setMyApps]       = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [candidatesRes, sessionsRes, onboardingRes] = await Promise.allSettled([
        api.candidates.getAll(),
        api.interviews.getAll(),
        api.onboarding.getAll(),
      ]);

      if (candidatesRes.status === "fulfilled") {
        const all  = Array.isArray(candidatesRes.value) ? candidatesRes.value : [];
        const mine = all.filter(c =>
          c.email?.toLowerCase() === user?.email?.toLowerCase() ||
          c.name?.toLowerCase()  === user?.name?.toLowerCase()
        );
        setMyApps(mine);
        localStorage.setItem("hrise_candidates", JSON.stringify(all));
      } else {
        const saved = JSON.parse(localStorage.getItem("hrise_candidates") || "[]");
        setMyApps(saved.filter(c =>
          c.email?.toLowerCase() === user?.email?.toLowerCase() ||
          c.name?.toLowerCase()  === user?.name?.toLowerCase()
        ));
      }

      if (sessionsRes.status === "fulfilled") {
        const all  = Array.isArray(sessionsRes.value) ? sessionsRes.value : [];
        const mine = all.filter(s =>
          s.candidateName?.toLowerCase()  === user?.name?.toLowerCase()  ||
          s.candidateEmail?.toLowerCase() === user?.email?.toLowerCase()
        );
        setMySessions(mine);
      }

      if (onboardingRes.status === "fulfilled") {
        const all  = Array.isArray(onboardingRes.value) ? onboardingRes.value : [];
        const mine = all.find(r =>
          r.candidateName?.toLowerCase()  === user?.name?.toLowerCase()  ||
          r.candidateEmail?.toLowerCase() === user?.email?.toLowerCase()
        ) || null;
        setOnboarding(mine);
      }

      setLoading(false);
    };
    fetchData();
  }, [user?.email, user?.name]);

  const latestApp           = myApps[0];
  const completedInterviews = mySessions.filter(s => s.status === "analyzed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="candidate" />
      <div className="lg:ml-64">
        <Header title="Dashboard" />
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl p-7" style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a855f7 100%)" }}>
            <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
            <h1 className="text-2xl font-extrabold text-white mb-1">Good {timeOfDay()}, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-indigo-200 text-sm">
              {loading ? "Loading your status..." : latestApp
                ? `Your application for ${latestApp.jobTitle || "the position"} is currently ${latestApp.status}.`
                : "Welcome! Apply for a job to start your journey."}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button onClick={() => navigate("/applications")} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-bold rounded-xl transition-all cursor-pointer border border-white/20">
                <Briefcase size={14} /> My Applications
              </button>
              <button onClick={() => navigate("/interview")} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all cursor-pointer shadow-sm">
                <Video size={14} /> Go to Interview
              </button>
            </div>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <KpiCard label="Applications" value={myApps.length} sub="total submitted" icon={<FileText size={22} />} gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" />
            <KpiCard label="Interviews" value={completedInterviews} sub={`${mySessions.length - completedInterviews} pending`} icon={<Video size={22} />} gradient="linear-gradient(135deg,#8b5cf6,#a855f7)" />
            <KpiCard label="Onboarding" value={onboarding ? `${onboarding.tasks?.filter(t => t.completed).length || 0}/${onboarding.tasks?.length || 0}` : "N/A"} sub={onboarding ? "tasks done" : "not started"} icon={<UserCheck size={22} />} gradient="linear-gradient(135deg,#10b981,#059669)" />
          </div>
          {myApps.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div><h3 className="font-bold text-gray-900">My Applications</h3><p className="text-xs text-gray-400 mt-0.5">All jobs you have applied to</p></div>
                <Link to="/applications" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">View all <ChevronRight size={13} /></Link>
              </div>
              <div className="divide-y divide-gray-50">
                {myApps.slice(0, 5).map((app, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0"><Briefcase size={15} className="text-indigo-600" /></div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{app.jobTitle || "Position"}</p>
                        <p className="text-xs text-gray-400">{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString("en-IN") : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3"><ScoreBar score={app.aiScore || 0} /><StatusBadge status={app.status} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── HR Recruiter DASHBOARD ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || "recruiter";
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Instant render from localStorage so the page never flashes blank
  const [data, setData] = useState(readLocalStorage);

  // ── Fetch ALL data from MongoDB via backend API ──────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [candidatesRes, jobsRes, sessionsRes, onboardingRes, notificationsRes] = await Promise.allSettled([
        api.candidates.getAll(),
        api.jobs.getAll(),
        api.interviews.getAll(),
        api.onboarding.getAll(),
        api.notifications.getAll(),
      ]);

      const prev = readLocalStorage();

      const candidates    = candidatesRes.status    === "fulfilled" && Array.isArray(candidatesRes.value)    ? candidatesRes.value    : prev.candidates;
      const jobs          = jobsRes.status          === "fulfilled" && Array.isArray(jobsRes.value)          ? jobsRes.value          : prev.jobs;
      const sessions      = sessionsRes.status      === "fulfilled" && Array.isArray(sessionsRes.value)      ? sessionsRes.value      : prev.sessions;
      const onboardings   = onboardingRes.status    === "fulfilled" && Array.isArray(onboardingRes.value)    ? onboardingRes.value    : prev.onboardings;
      const notifications = notificationsRes.status === "fulfilled" && Array.isArray(notificationsRes.value) ? notificationsRes.value : prev.notifications;

      // Sync fresh data back to localStorage so all other pages benefit
      if (candidatesRes.status  === "fulfilled") localStorage.setItem("hrise_candidates",         JSON.stringify(candidates));
      if (jobsRes.status        === "fulfilled") localStorage.setItem("hrise_jobs",               JSON.stringify(jobs));
      if (sessionsRes.status    === "fulfilled") localStorage.setItem("hrise_interview_sessions", JSON.stringify(sessions));
      if (onboardingRes.status  === "fulfilled") localStorage.setItem("hrise_onboarding_records", JSON.stringify(onboardings));

      if (candidatesRes.status  === "rejected") console.warn("Candidates fetch failed:", candidatesRes.reason?.message);
      if (jobsRes.status        === "rejected") console.warn("Jobs fetch failed:",       jobsRes.reason?.message);
      if (sessionsRes.status    === "rejected") console.warn("Sessions fetch failed:",   sessionsRes.reason?.message);
      if (onboardingRes.status  === "rejected") console.warn("Onboarding fetch failed:", onboardingRes.reason?.message);
      if (notificationsRes.status === "rejected") console.warn("Notifications fetch failed:", notificationsRes.reason?.message);

      setData({ candidates, jobs, sessions, onboardings, notifications });
    } catch (e) {
      console.error("Dashboard fetchAll error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const onRefresh = () => fetchAll();
    window.addEventListener("hrise_dashboard_refresh", onRefresh);
    window.addEventListener("hrise_notifications_update", onRefresh);
    return () => {
      window.removeEventListener("hrise_dashboard_refresh", onRefresh);
      window.removeEventListener("hrise_notifications_update", onRefresh);
    };
  }, []);

  if (role === "candidate") return <CandidateDashboard user={user} />;

  const { candidates, sessions, jobs, onboardings, notifications } = data;

  // ── Derived metrics (all from real data) ────────────────────────────────
  const total        = candidates.length;
  const applied      = candidates.filter((c) => c.status === "applied").length;
  const shortlisted  = candidates.filter((c) => c.status === "shortlisted").length;
  const interviewed  = candidates.filter((c) => c.status === "interviewed").length;
  const selected     = candidates.filter((c) => c.status === "selected" || c.status === "hired").length;
  const rejected     = candidates.filter((c) => c.status === "rejected").length;
  const onboardCount = onboardings.filter((o) => {
    const cand = candidates.find((c) => c.id === o.candidateId);
    return cand && (cand.status === "selected" || cand.status === "hired");
  }).length;

  const avgScore = total > 0
    ? Math.round(candidates.reduce((s, c) => s + (c.aiScore || 0), 0) / total)
    : 0;

  const scheduledSessions  = sessions.filter((s) => s.status === "scheduled").length;
  const completedSessions  = sessions.filter((s) => s.status === "analyzed").length;
  const pendingInterviews  = shortlisted;
  const totalInterviews    = completedSessions + pendingInterviews;

  const activeJobs = jobs.filter((j) => j.status !== "closed").length;

  // Recent candidates — filtered by search query and sorted by appliedDate desc
  const filteredCandidates = candidates.filter(
    (c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentCandidates = [...filteredCandidates]
    .sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0))
    .slice(0, 6);

  // Real notifications from localStorage
  const recentAlerts = notifications.slice(0, 5);

  const aiSummary = total > 0
    ? `HRise AI has evaluated ${total} candidate${total !== 1 ? "s" : ""}. Average match score is ${avgScore}/100. ${shortlisted} shortlisted, ${interviewed} interviewed, and ${selected} selected. ${onboardCount} candidate${onboardCount !== 1 ? "s" : ""} currently in onboarding.`
    : "No candidates yet. Post a job and upload resumes to activate the hiring funnel.";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Dashboard" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">

          {/* ── HERO GREETING ──────────────────────────────────────────── */}
          <div
            className="relative rounded-3xl overflow-hidden p-7 shadow-xl"
            style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)" }}
          >
            <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
            <div style={{ position:"absolute", bottom:-40, left:40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white/90">
                    <Sparkles size={11} className="text-yellow-300" /> HRise AI Platform
                  </div>
                  {/* Manual refresh button */}
                  <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-xs font-bold text-white/80 hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
                  Good {timeOfDay()}, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">
                  {loading ? "Fetching live data from database..." : aiSummary}
                </p>
              </div>
              {/* Quick numbers in hero */}
              <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                {[
                  { label: "Total", value: loading ? "—" : total },
                  { label: "Shortlisted", value: loading ? "—" : shortlisted },
                  { label: "Interviews", value: loading ? "—" : totalInterviews },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 min-w-[72px]">
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-white/60 text-[11px] font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI CARDS ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Applicants"
              value={total}
              sub={total > 0 ? `${activeJobs} active job${activeJobs !== 1 ? "s" : ""}` : "No candidates yet"}
              icon={<Users size={22} />}
              gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
            />
            <KpiCard
              label="Shortlisted"
              value={shortlisted}
              sub={total > 0 ? `${pct(shortlisted, total)}% of applicants` : "—"}
              icon={<Star size={22} />}
              gradient="linear-gradient(135deg,#10b981,#059669)"
              delta={total > 0 ? pct(shortlisted, total) : null}
            />
            <KpiCard
              label="Interviews"
              value={totalInterviews}
              sub={`${completedSessions} done · ${pendingInterviews} pending`}
              icon={<Video size={22} />}
              gradient="linear-gradient(135deg,#8b5cf6,#a855f7)"
            />
            <KpiCard
              label="Onboarding"
              value={onboardCount}
              sub={selected > 0 ? `${selected} candidate${selected !== 1 ? "s" : ""} selected` : "No hires yet"}
              icon={<UserCheck size={22} />}
              gradient="linear-gradient(135deg,#f59e0b,#ef4444)"
            />
          </div>

          {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Recent Candidates Table */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Recent Candidates</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Showing {recentCandidates.length} most recent applicant{recentCandidates.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  to="/resumes"
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 bg-indigo-50 rounded-xl hover:bg-indigo-100"
                >
                  View All <ArrowUpRight size={13} />
                </Link>
              </div>

              {recentCandidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                    <Inbox size={28} className="text-indigo-400" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">No candidates yet</p>
                  <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
                    Upload resumes on the <strong>Resume Screening</strong> page to populate the hiring pipeline.
                  </p>
                  <Link to="/resumes" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    <FileText size={12} /> Go to Resume Screening
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-50">
                        {["Candidate", "Skills", "AI Score", "Match", "Status"].map((h) => (
                          <th key={h} className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentCandidates.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-extrabold flex-shrink-0 shadow-sm">
                                {c.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                                <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {(c.skills || []).slice(0, 2).map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-100 whitespace-nowrap">
                                  {s}
                                </span>
                              ))}
                              {(c.skills?.length || 0) > 2 && (
                                <span className="text-[11px] text-gray-400 font-semibold">
                                  +{c.skills.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <ScoreBar score={c.aiScore || 0} />
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="text-sm font-bold text-gray-900">{c.matchPercentage || 0}%</span>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={c.status || "applied"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Hiring Funnel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={16} className="text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Hiring Funnel</h3>
                  <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wide">Live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-3.5">
                  <FunnelBar label="Applied"     count={total}       total={total} color="#6366f1" />
                  <FunnelBar label="Shortlisted" count={shortlisted} total={total} color="#10b981" />
                  <FunnelBar label="Interviewed" count={interviewed} total={total} color="#8b5cf6" />
                  <FunnelBar label="Selected"    count={selected}    total={total} color="#f59e0b" />
                  <FunnelBar label="Rejected"    count={rejected}    total={total} color="#ef4444" />
                </div>
                {total === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-4">No data yet</p>
                )}
              </div>

              {/* ML Hiring Analytics */}
              <MLAnalyticsPanel candidates={candidates} />

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { to: "/resumes",          icon: FileText,  label: "Screen Resumes",    sub: "AI-powered bulk screening",   gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
                    { to: "/interviews",        icon: Video,     label: "Video Interviews",  sub: "Manage AI video interviews",  gradient: "linear-gradient(135deg,#8b5cf6,#a855f7)" },
                    { to: "/job-descriptions",  icon: Briefcase, label: "Post a Job",        sub: "Create new job description",  gradient: "linear-gradient(135deg,#10b981,#059669)" },
                    { to: "/analytics",         icon: BarChart3, label: "Analytics",         sub: "View hiring insights",        gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
                  ].map(({ to, icon: Icon, label, sub, gradient }) => (
                    <Link to={to} key={to}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: gradient }}
                        >
                          <Icon size={15} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          <p className="text-[11px] text-gray-400">{sub}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Live Notification Feed */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">Activity Feed</h3>
                  {recentAlerts.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      {recentAlerts.length} recent
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {recentAlerts.length === 0 ? (
                    <>
                      {/* Fallback: derive real alerts from data */}
                      {shortlisted > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle size={13} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{shortlisted} candidate{shortlisted !== 1 ? "s" : ""} shortlisted</p>
                            <p className="text-[11px] text-gray-400">From AI resume screening</p>
                          </div>
                        </div>
                      )}
                      {scheduledSessions > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock size={13} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{scheduledSessions} interview{scheduledSessions !== 1 ? "s" : ""} pending</p>
                            <p className="text-[11px] text-gray-400">Awaiting candidate completion</p>
                          </div>
                        </div>
                      )}
                      {onboardCount > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <UserCheck size={13} className="text-teal-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{onboardCount} onboarding active</p>
                            <p className="text-[11px] text-gray-400">Candidates in onboarding flow</p>
                          </div>
                        </div>
                      )}
                      {total === 0 && (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-400">No activity yet. Start by posting a job!</p>
                        </div>
                      )}
                    </>
                  ) : (
                    recentAlerts.map((n, i) => {
                      const iconMap = {
                        shortlist: { icon: CheckCircle, bg: "bg-emerald-100", color: "text-emerald-600" },
                        interview: { icon: Video,         bg: "bg-purple-100",  color: "text-purple-600" },
                        hire:      { icon: UserCheck,     bg: "bg-teal-100",    color: "text-teal-600" },
                        default:   { icon: TrendingUp,    bg: "bg-indigo-100",  color: "text-indigo-600" },
                      };
                      const m = iconMap[n.type] || iconMap.default;
                      const Icon = m.icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Icon size={13} className={m.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{n.title}</p>
                            <p className="text-[11px] text-gray-400 truncate">{n.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AI Insight card */}
              <div
                className="rounded-2xl p-5 shadow-sm relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}
              >
                <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }} />
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">AI Insight</h3>
                </div>
                <p className="text-indigo-100 text-xs leading-relaxed">{aiSummary}</p>
                <Link to="/analytics" className="mt-4 inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-bold transition-colors">
                  Full Analytics <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
