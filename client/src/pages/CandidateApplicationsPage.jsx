import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { FileText, Clock, XCircle, Eye, Briefcase, Upload, CheckCircle, AlertCircle, RefreshCw, MapPin } from "lucide-react";
import { Card, Badge, Button } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";
import { api } from "../utils/api";

/**
 * Sanitizes the AI feedback text for candidate-facing display.
 * Removes internal debug prefixes and converts third-person to second-person language
 * for records that were saved before the backend fix was applied.
 */
function sanitizeFeedback(text) {
  if (!text) return text;
  // Remove the old fallback debug prefix if present
  let cleaned = text.replace(/\[FALLBACK MOCK EVALUATION[^\]]*\]\s*\n*/gi, "").trim();
  // Convert third-person phrasing to second-person (candidate-friendly)
  cleaned = cleaned
    .replace(/\bCandidate has matched\b/gi, "You have matched")
    .replace(/\bThe candidate shows\b/gi, "Your profile shows")
    .replace(/\bThe candidate has\b/gi, "You have")
    .replace(/\bthe candidate's\b/gi, "your")
    .replace(/\bCandidate's\b/gi, "Your")
    .replace(/\bThe candidate\b/gi, "You")
    .replace(/\bthe candidate\b/gi, "you")
    .replace(/\bFocus areas to improve:\b/gi, "To strengthen your application, consider developing expertise in:")
    .replace(/\bpromising background in\b/gi, "strong background in");
  return cleaned;
}

export default function CandidateApplicationsPage() {
  const { user } = useAuth();
  const [myApplications, setMyApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.requiredSkills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredApplications = myApplications.filter((app) => {
    const associatedJob = jobs.find((j) => j.id === app.jobId);
    const roleTitle = associatedJob ? associatedJob.title : (app.jobTitle || "Software Engineer");
    return (
      roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.matchExplanation && app.matchExplanation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- Load Jobs from backend only (no localStorage fallback, no mock data) ---
      const allJobs = await api.jobs.getAll();
      const activeJobs = Array.isArray(allJobs)
        ? allJobs.filter((j) => j.status !== "closed" && j.status !== "draft")
        : [];
      setJobs(activeJobs);
    } catch (e) {
      console.error("Failed to fetch jobs from backend:", e);
      setError("Unable to load job listings. Please try again later.");
      setJobs([]);
    }

    try {
      // --- Load Candidate Applications from backend ---
      const allFromBackend = await api.candidates.getAll();
      if (Array.isArray(allFromBackend)) {
        const myApps = allFromBackend
          .filter(
            (c) =>
              c.email?.toLowerCase() === user?.email?.toLowerCase() ||
              c.name?.toLowerCase() === user?.name?.toLowerCase()
          )
          .map((c) => ({ ...c, matchExplanation: sanitizeFeedback(c.matchExplanation) }));
        setMyApplications(myApps);
      }
    } catch (apiErr) {
      console.warn("Could not fetch candidates from backend:", apiErr);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
      const onRefresh = () => loadData();
      window.addEventListener("hrise_dashboard_refresh", onRefresh);
      return () => window.removeEventListener("hrise_dashboard_refresh", onRefresh);
    }
  }, [user]);


  const handleApply = async (files, jobId) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    setProgress(10);

    const targetJob = jobs.find((j) => j.id === jobId) || jobs[0];

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobId", jobId);

      let currentProgress = 10;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(90, currentProgress + 15);
        setProgress(currentProgress);
      }, 100);

      // Perform real-time backend AI screening call
      const newCandidate = await api.candidates.apply(formData);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setApplyingJobId(null);
        setProgress(0);

        // Update local candidate applications state
        setMyApplications((prev) => [newCandidate, ...prev]);

        // Mirror locally in localStorage to match the sync from backend cache
        const savedCandidates = localStorage.getItem("hrise_candidates");
        let candidatesList = [];
        if (savedCandidates) {
          try {
            candidatesList = JSON.parse(savedCandidates);
          } catch (e) {}
        }
        candidatesList = [newCandidate, ...candidatesList];
        localStorage.setItem("hrise_candidates", JSON.stringify(candidatesList));

        // Dispatch real-time system notification alert
        addHriseNotification(
          "Application Submitted",
          `Your application for "${targetJob.title}" has been submitted successfully. AI Score: ${newCandidate.aiScore}/100.`,
          "upload",
          "candidate"
        );

        // Also alert HR about the new application!
        addHriseNotification(
          "New Candidate Applied",
          `A new candidate (${newCandidate.name}) has applied for "${targetJob.title}" with an AI Score of ${newCandidate.aiScore}/100.`,
          "upload",
          "recruiter"
        );

        // Trigger a reactive dispatch to update other open panels
        window.dispatchEvent(new Event("storage"));
      }, 500);

    } catch (err) {
      console.error("Resume screening failed:", err);
      alert(`Resume screening failed: ${err.message || err}`);
      setUploading(false);
      setApplyingJobId(null);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="candidate" />
      <div className="lg:ml-64">
        <Header title="My Applications" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
                My Job Applications
              </h1>
              <p className="text-gray-500 mt-1">
                Track and submit job applications directly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Active Applications list */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle size={18} className="text-indigo-600 animate-pulse" />
                My Active Applications
              </h2>

              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => {
                  const associatedJob = jobs.find((j) => j.id === app.jobId);
                  const roleTitle = associatedJob ? associatedJob.title : (app.jobTitle || "Software Engineer");
                  return (
                    <Card key={app.id} className="p-6 border border-gray-200 shadow-sm rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {roleTitle}
                          </h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> Applied: {app.appliedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText size={14} /> Resume scored: {app.aiScore}/100
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              app.status === "shortlisted"
                                ? "success"
                                : app.status === "rejected"
                                  ? "danger"
                                  : app.status === "interviewed"
                                    ? "info"
                                    : app.status === "selected"
                                      ? "purple"
                                      : "default"
                            }
                          >
                            {app.status}
                          </Badge>
                          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>

                      {app.matchExplanation && app.status !== "rejected" && (
                        <div className="mt-4 pt-4 border-t border-gray-150">
                          <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
                            ✨ AI Match Feedback
                          </p>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                            <p className="text-sm text-indigo-900 leading-relaxed">
                              {sanitizeFeedback(app.matchExplanation)}
                            </p>
                          </div>
                        </div>
                      )}

                      {app.status === "rejected" && (
                        <div className="mt-4 pt-4 border-t border-gray-150">
                          <div className="flex items-start gap-2">
                            <XCircle
                              size={16}
                              className="text-red-500 mt-0.5 flex-shrink-0"
                            />
                            <p className="text-sm text-gray-600 leading-normal">
                              Rejection reason: {app.rejectionReason || "Position filled by alternate screening candidates."}
                            </p>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              ) : (
                <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 border-indigo-200 bg-white rounded-2xl shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <FileText size={28} className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-950 mb-2">No Active Applications</h3>
                  <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                    You haven't submitted any job applications under <strong>{user?.name}</strong> yet. Browse the openings in the right panel to apply directly!
                  </p>
                </Card>
              )}
            </div>

            {/* Available Jobs list */}
            <div className="xl:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  Browse Job Openings
                </h2>
                {!loading && jobs.length > 0 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    {jobs.length} open
                  </span>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-5 border border-gray-100 rounded-xl bg-white animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
                      <div className="flex gap-1.5 mb-4">
                        {[1, 2, 3].map((j) => <div key={j} className="h-5 w-14 bg-gray-100 rounded" />)}
                      </div>
                      <div className="h-8 bg-indigo-50 rounded-lg" />
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <Card className="p-8 text-center border border-red-100 bg-red-50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={22} className="text-red-500" />
                  </div>
                  <h3 className="font-bold text-red-800 text-sm mb-1">Failed to Load Jobs</h3>
                  <p className="text-xs text-red-600 mb-4 leading-relaxed">{error}</p>
                  <button
                    onClick={loadData}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </Card>
              )}

              {/* Empty State — No real jobs in database */}
              {!loading && !error && filteredJobs.length === 0 && (
                <Card className="p-10 text-center border border-dashed border-indigo-200 bg-white rounded-2xl shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <Briefcase size={28} className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {searchQuery ? "No Matching Jobs" : "No Open Positions Available"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-[220px] mx-auto leading-relaxed">
                    {searchQuery
                      ? `No open positions match "${searchQuery}". Try a different search term.`
                      : "There are currently no active job openings. Please check back later for new opportunities."
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all hover:bg-indigo-100"
                    >
                      Clear Search
                    </button>
                  )}
                </Card>
              )}

              {/* Jobs List */}
              {!loading && !error && filteredJobs.length > 0 && (
                <div className="space-y-4">
                  {filteredJobs.map((job) => {
                    const isApplying = applyingJobId === job.id;
                    const alreadyApplied = myApplications.some((app) => app.jobId === job.id);

                    return (
                      <Card key={job.id} className="p-5 border border-gray-200 shadow-sm rounded-xl bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-sm leading-snug">{job.title}</h3>
                          {job.status === "open" && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              Open
                            </span>
                          )}
                        </div>

                        {(job.department || job.location) && (
                          <div className="flex flex-wrap gap-2 mb-2 text-[10px] text-gray-400 font-medium">
                            {job.department && <span>{job.department}</span>}
                            {job.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin size={9} /> {job.location}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-3">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(job.requiredSkills || []).slice(0, 4).map((skill, idx) => (
                            <Badge key={idx} variant="default" className="text-[9px] px-1.5 py-0.5">
                              {skill}
                            </Badge>
                          ))}
                          {(job.requiredSkills || []).length > 4 && (
                            <span className="text-[9px] text-gray-400 font-medium self-center">
                              +{job.requiredSkills.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                          {alreadyApplied ? (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle size={14} /> Applied
                            </span>
                          ) : isApplying ? (
                            <div className="w-full">
                              {uploading ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
                                    <span>AI Screening Resume...</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-150"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => handleApply(e.target.files, job.id)}
                                    className="hidden"
                                  />
                                  <Button
                                    size="sm"
                                    className="w-full text-[10px] cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Upload size={12} /> Choose CV File
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-[10px] cursor-pointer"
                                    onClick={() => setApplyingJobId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              className="w-full text-xs cursor-pointer"
                              onClick={() => setApplyingJobId(job.id)}
                            >
                              Apply Now
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
