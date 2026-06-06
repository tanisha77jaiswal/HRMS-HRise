import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  Briefcase,
  Users,
  Video,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("pipeline"); // pipeline, jobs, candidates, interviews
  const [searchQuery, setSearchQuery] = useState("");

  // Sync tab and search query parameters from URL on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearchQuery(q);
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecruitmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsRes, candidatesRes, interviewsRes] = await Promise.all([
        api.jobs.getAll(),
        api.candidates.getAll(),
        api.interviews.getAll()
      ]);

      if (Array.isArray(jobsRes)) {
        const formattedJobs = jobsRes.map(j => ({
          id: j._id || j.id,
          title: j.title || "Untitled Role",
          department: j.department || "Engineering",
          status: j.status || "open",
          datePosted: j.createdAt ? new Date(j.createdAt).toISOString().split("T")[0] : "2026-05-20",
          applicantsCount: j.applicantsCount || 0
        }));
        setJobs(formattedJobs);
      } else {
        setJobs([]);
      }

      if (Array.isArray(candidatesRes)) {
        const formattedCandidates = candidatesRes.map(c => ({
          id: c._id || c.id,
          name: c.name || "Anonymous",
          email: c.email || "—",
          jobTitle: c.jobTitle || "Job Position",
          status: c.status || "applied",
          aiScore: c.aiScore || 0,
          dateApplied: c.appliedDate ? new Date(c.appliedDate).toISOString().split("T")[0] : "2026-05-20"
        }));
        setCandidates(formattedCandidates);
      } else {
        setCandidates([]);
      }

      if (Array.isArray(interviewsRes)) {
        const formattedInterviews = interviewsRes.map(i => ({
          id: i._id || i.id,
          candidateName: i.candidateName || "Candidate",
          jobTitle: i.jobTitle || "Job Position",
          interviewerName: i.interviewerName || "Interviewer",
          date: i.scheduledDate ? new Date(i.scheduledDate).toLocaleDateString("en-IN") : "2026-06-04",
          time: i.scheduledTime || "12:00 PM",
          status: i.status || "scheduled"
        }));
        setInterviews(formattedInterviews);
      } else {
        setInterviews([]);
      }
    } catch (err) {
      console.error("Failed to load recruitment data:", err);
      setError(err.message || "Failed to load recruitment monitoring details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();

    window.addEventListener("storage", fetchRecruitmentData);
    window.addEventListener("hrise_dashboard_refresh", fetchRecruitmentData);
    return () => {
      window.removeEventListener("storage", fetchRecruitmentData);
      window.removeEventListener("hrise_dashboard_refresh", fetchRecruitmentData);
    };
  }, []);

  // Filter lists based on Search Query
  const filteredJobs = useMemo(() => {
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [candidates, searchQuery]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(
      (i) =>
        i.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [interviews, searchQuery]);

  const pipelineStages = useMemo(() => {
    const groups = {
      applied: { label: "Applied", color: "border-indigo-200 bg-indigo-50/20", text: "text-indigo-700", items: [] },
      shortlisted: { label: "Shortlisted", color: "border-purple-200 bg-purple-50/20", text: "text-purple-700", items: [] },
      interviewed: { label: "Interviewed", color: "border-amber-200 bg-amber-50/20", text: "text-amber-700", items: [] },
      selected: { label: "Selected / Hired", color: "border-emerald-200 bg-emerald-50/20", text: "text-emerald-700", items: [] },
    };

    const q = searchQuery.toLowerCase();
    const filtered = candidates.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q)
    );

    filtered.forEach((cand) => {
      let stageKey = cand.status?.toLowerCase();
      // Map other status variations (like hired) to Selected
      if (stageKey === "hired") stageKey = "selected";
      
      if (groups[stageKey]) {
        groups[stageKey].items.push(cand);
      } else if (stageKey === "screened") {
        // Fallback screened to applied
        groups.applied.items.push(cand);
      }
    });

    return Object.entries(groups);
  }, [candidates, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="management_admin" />
      <div className="lg:ml-64">
        <Header title="Recruitment" searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <p className="text-xs font-bold text-red-750">Warning: {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-750 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                Recruitment Monitoring
                {loading && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1">
                Read-only administrative monitoring of jobs, candidates, interviews, and funnel pipelines.
              </p>
            </div>
          </div>

          {/* Navigation Tabs and Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 rounded-2xl border border-gray-150 shadow-sm">
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
              {[
                { id: "pipeline", label: "Hiring Pipeline", icon: <Layers size={15} /> },
                { id: "jobs", label: "All Jobs", icon: <Briefcase size={15} /> },
                { id: "candidates", label: "All Candidates", icon: <Users size={15} /> },
                { id: "interviews", label: "All Interviews", icon: <Video size={15} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Tab Contents */}
          <div className={`animate-fade-in transition-opacity duration-300 ${loading ? "opacity-70" : "opacity-100"}`}>
            {loading && jobs.length === 0 && candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-500 mt-3 font-sans">Syncing recruitment pipeline...</p>
              </div>
            ) : (
              <>
                {activeTab === "pipeline" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {pipelineStages.map(([key, stage]) => (
                  <div
                    key={key}
                    className="flex flex-col bg-gray-100/50 rounded-2xl border border-gray-200/60 p-4 min-h-[500px]"
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200/80 pb-2">
                      <span className={`text-xs font-black uppercase tracking-wider ${stage.text}`}>
                        {stage.label}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-md text-[11px] font-bold text-gray-500 shadow-sm border border-gray-100">
                        {stage.items.length}
                      </span>
                    </div>

                    {/* Stage Cards */}
                    <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
                      {stage.items.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-xs font-semibold">
                          No candidates in stage
                        </div>
                      ) : (
                        stage.items.map((c) => (
                          <div
                            key={c.id}
                            className="bg-white rounded-xl border border-gray-150 p-3.5 shadow-sm space-y-3 hover:shadow-md hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-gray-950 text-xs leading-tight">{c.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-medium leading-none">{c.jobTitle}</p>
                              </div>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg shrink-0 border ${
                                c.aiScore >= 80
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : c.aiScore >= 60
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                              }`}>
                                {c.aiScore}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-[9px] text-gray-450 font-bold border-t border-gray-50 pt-2.5">
                              <span>Applied {c.dateApplied || "—"}</span>
                              <span className="truncate max-w-[100px]" title={c.email}>{c.email}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. All Jobs Table */}
            {activeTab === "jobs" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Job Designation</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Date Posted</th>
                        <th className="px-6 py-4">Total Applicants</th>
                        <th className="px-6 py-4 text-right">Job Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                      {filteredJobs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                            No jobs found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredJobs.map((j) => (
                          <tr key={j.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                              <Briefcase size={14} className="text-gray-400" />
                              {j.title}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{j.department}</td>
                            <td className="px-6 py-4 text-gray-500">{j.datePosted}</td>
                            <td className="px-6 py-4 text-gray-700">
                              <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                {j.applicantsCount} Applicants
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                j.status === "open"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${j.status === "open" ? "bg-emerald-500" : "bg-red-500"}`} />
                                {j.status === "open" ? "Open" : "Closed"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. All Candidates Table */}
            {activeTab === "candidates" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Candidate Profile</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Applied Position</th>
                        <th className="px-6 py-4">AI Profile Score</th>
                        <th className="px-6 py-4">Date Applied</th>
                        <th className="px-6 py-4 text-right">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                            No candidates found matching search.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              {c.name}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{c.email}</td>
                            <td className="px-6 py-4 text-gray-700">{c.jobTitle}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 font-bold ${
                                c.aiScore >= 80
                                  ? "text-emerald-600"
                                  : c.aiScore >= 60
                                  ? "text-amber-600"
                                  : "text-red-500"
                              }`}>
                                <TrendingUp size={13} />
                                {c.aiScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{c.dateApplied}</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                c.status === "selected" || c.status === "hired"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : c.status === "rejected"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : c.status === "shortlisted"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  c.status === "selected" || c.status === "hired"
                                    ? "bg-emerald-500"
                                    : c.status === "rejected"
                                    ? "bg-red-500"
                                    : c.status === "shortlisted"
                                    ? "bg-purple-500"
                                    : "bg-indigo-500"
                                }`} />
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. All Interviews Table */}
            {activeTab === "interviews" && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Candidate</th>
                        <th className="px-6 py-4">Applied Role</th>
                        <th className="px-6 py-4">Interviewer</th>
                        <th className="px-6 py-4">Schedule Date & Time</th>
                        <th className="px-6 py-4 text-right">Interview Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                      {filteredInterviews.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                            No upcoming or scheduled interviews.
                          </td>
                        </tr>
                      ) : (
                        filteredInterviews.map((i) => (
                          <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2.5">
                              <User size={14} className="text-gray-400" />
                              {i.candidateName}
                            </td>
                            <td className="px-6 py-4 text-gray-700">{i.jobTitle}</td>
                            <td className="px-6 py-4 text-gray-600">{i.interviewerName}</td>
                            <td className="px-6 py-4 text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-indigo-500" />
                                {i.date} &bull; {i.time}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                i.status === "completed" || i.status === "analyzed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${i.status === "completed" || i.status === "analyzed" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                                {i.status === "completed" || i.status === "analyzed" ? "Completed" : "Scheduled"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
