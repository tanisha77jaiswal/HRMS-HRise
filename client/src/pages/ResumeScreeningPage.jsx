import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import {
  Upload,
  FileText,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Brain,
  Download,
  Search,
  ArrowRightLeft,
  Trash2,
  Video,
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";

export default function ResumeScreeningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  const [candidates, setCandidates] = useState([]);

  const [jobs, setJobs] = useState([]);

  const [selectedJobId, setSelectedJobId] = useState("custom");

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetail, setShowDetail] = useState(null);
  const [jdText, setJdText] = useState("");
  const fileInputRef = useRef(null);

  // Load candidates and jobs from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { api } = await import("../utils/api");
        const [candList, jobList] = await Promise.all([
          api.candidates.getAll(),
          api.jobs.getAll()
        ]);
        if (Array.isArray(candList)) {
          setCandidates(candList);
        }
        if (Array.isArray(jobList)) {
          setJobs(jobList);
          if (jobList.length > 0) {
            setSelectedJobId(jobList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load screening data on mount:", err);
      }
    };
    loadData();

    // Listen for refresh events to re-fetch (only explicit dashboard refresh, NOT storage events which loop)
    const handleRefresh = () => loadData();
    window.addEventListener("hrise_dashboard_refresh", handleRefresh);
    return () => {
      window.removeEventListener("hrise_dashboard_refresh", handleRefresh);
    };
  }, []);

  // NOTE: Candidate sync to backend is handled by the screenBulkResumes API call directly.
  // We do NOT push all candidates on every state change — that would cause an infinite loop
  // (POST -> hrise_dashboard_refresh event -> loadData -> setCandidates -> POST -> ...).

  // Sync JD text when selected job changes
  useEffect(() => {
    if (selectedJobId !== "custom" && jobs.length > 0) {
      const activeJob = jobs.find(j => j.id === selectedJobId);
      if (activeJob) {
        setJdText(activeJob.description);
      }
    }
  }, [selectedJobId, jobs]);

  const handleUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    if (selectedJobId === "custom" && !jdText.trim()) {
      alert("Please select a job or enter a job description before uploading resumes.");
      return;
    }
    if (selectedJobId === "custom") {
      alert("Please select a specific job position from the dropdown to screen resumes against.");
      return;
    }

    setUploading(false);
    setAnalyzing(true);
    setAnalysisProgress(5);

    try {
      // Build FormData — send real PDF files to the backend
      const formData = new FormData();
      formData.append("jobId", selectedJobId);
      Array.from(files).forEach((file) => {
        formData.append("resumes", file);
      });

      // Simulate a progress bar while Gemini processes (network call can take a few seconds per file)
      let fakeProgress = 5;
      const progressTimer = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + 8, 90);
        setAnalysisProgress(fakeProgress);
      }, 400);

      // ── REAL backend call: pdf-parse → Gemini AI → MongoDB ──
      const { api } = await import("../utils/api");
      const response = await api.candidates.screenBulk(formData);

      clearInterval(progressTimer);
      setAnalysisProgress(100);

      const newCandidates = response.candidates || [];

      // Reset file input so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setTimeout(() => {
        setAnalyzing(false);
        setAnalysisProgress(0);

        // Append real AI-screened candidates to the list
        setCandidates((prev) => [...newCandidates, ...prev]);

        newCandidates.forEach((cand) => {
          if (!cand.error) {
            addHriseNotification(
              "Resume Screened",
              `AI screening complete — ${cand.name} scored ${cand.aiScore}/100. Review in Resume Screening.`,
              "upload",
              "recruiter"
            );
          }
        });
      }, 300);

    } catch (err) {
      console.error("Bulk screening failed:", err);
      setAnalyzing(false);
      setAnalysisProgress(0);
      alert(`Resume screening failed: ${err.message}\n\nMake sure the backend is running and a valid job is selected.`);
    }
  }, [selectedJobId, jdText]);

  const toggleSelect = (id) => {

    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkAction = (status) => {
    setCandidates((prev) => {
      const updated = prev.map((c) => (selectedCandidates.has(c.id) ? { ...c, status } : c));
      
      // Onboarding cleanup for deselected candidates is handled by the backend onboarding API

      selectedCandidates.forEach((id) => {
        const c = prev.find((x) => x.id === id);
          if (c) {
            let notifType = "info";
            if (status === "shortlisted") notifType = "shortlist";
            if (status === "rejected") notifType = "info";
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
            const msgMap = {
              shortlisted: `${c.name}'s application has been moved to the shortlist. Next step: schedule an interview.`,
              rejected: `${c.name}'s application has been reviewed and is not moving forward at this time.`,
            };
            addHriseNotification(
              `Bulk Update — ${statusLabel}`,
              msgMap[status] || `${c.name}'s status has been updated to ${statusLabel}.`,
              notifType,
              "recruiter"
            );
          }
      });
      return updated;
    });
    setSelectedCandidates(new Set());
  };

  const updateCandidateStatus = (id, status) => {
    setCandidates((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, status } : c));
      
      const candidateObj = prev.find(c => c.id === id);
      if (candidateObj) {
        let notifType = "info";
        if (status === "shortlisted") notifType = "shortlist";
        if (status === "selected") notifType = "onboarding";
        const statusMessages = {
          shortlisted: `${candidateObj.name} has been shortlisted and is progressing to the next stage.`,
          rejected: `${candidateObj.name}'s application has been reviewed and will not proceed further.`,
          selected: `${candidateObj.name} has been selected! An onboarding checklist has been generated.`,
          reviewed: `${candidateObj.name}'s profile has been reviewed by the hiring team.`,
        };
        // Notify HR
        addHriseNotification(
          status === "selected" ? "Candidate Hired 🎉" : `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          statusMessages[status] || `${candidateObj.name}'s application status has been updated to ${status}.`,
          notifType,
          "recruiter"
        );

        // Also notify the Candidate!
        const candidateMsgMap = {
          shortlisted: `Great news! Your application has been shortlisted. Next step: prepare for your video interview.`,
          rejected: `Thank you for your interest. We have reviewed your application and decided not to proceed at this time.`,
          selected: `Congratulations! 🎉 You have been selected for the position. Please visit your dashboard to complete your onboarding!`,
        };
        if (candidateMsgMap[status]) {
          addHriseNotification(
            status === "selected" ? "Congratulations! 🎉" : `Application Updated`,
            candidateMsgMap[status],
            notifType,
            "candidate"
          );
        }
      }
      
      // Create onboarding record via backend API when candidate is selected
      if (status === "selected") {
        const candidateObj = prev.find(c => c.id === id);
        if (candidateObj) {
          const activeJob = jobs.find(j => j.id === candidateObj.jobId);
          const jobTitle = activeJob ? activeJob.title : "Software Engineer";
          
          const newOnboarding = {
            id: `onb-${Date.now()}`,
            candidateId: id,
            candidateName: candidateObj.name,
            candidateEmail: candidateObj.email,
            jobTitle: jobTitle,
            status: "Pending",
            welcomeLetter: `Dear ${candidateObj.name},\n\nWelcome to the team! We are absolutely thrilled to offer you the position of ${jobTitle}.\n\nYour background and expertise stood out during our rigorous AI-screening and video interview evaluations, and we are confident that your skillsets will be a tremendous asset to our growth.\n\nYour first day is scheduled for Monday, June 15, 2026. Please complete the tasks in the smart checklist below to get set up with our systems before your first day.\n\nBest regards,\nHR Operations Team`,
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
          // Fire-and-forget: create onboarding record via backend API
          import("../utils/api").then(({ api }) => {
            api.onboarding.create(newOnboarding).catch(e => console.error("Failed to create onboarding:", e));
          });
        }
      }
      // Onboarding cleanup for deselected candidates is handled by the backend
      return updated;
    });
  };

  // Filter and sort
  const filtered = candidates
    .filter((c) => filter === "all" || c.status === filter)
    .filter(
      (c) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    )
    .sort((a, b) => {
      if (sortBy === "score") return b.aiScore - a.aiScore;
      if (sortBy === "date") {
        // createdAt is set by Mongoose timestamps (most precise) → appliedDate fallback → _id tiebreaker
        const aTime = new Date(a.createdAt || a.appliedDate || 0).getTime();
        const bTime = new Date(b.createdAt || b.appliedDate || 0).getTime();
        if (bTime !== aTime) return bTime - aTime;
        // MongoDB ObjectId encodes insertion millisecond — lexicographic comparison works correctly
        return (b._id || "") > (a._id || "") ? -1 : 1;
      }
      return b.matchPercentage - a.matchPercentage;
    });

  const handleExportCSV = () => {
    if (candidates.length === 0) {
      alert("No candidates available to export!");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Experience Years",
      "Skills",
      "AI Match Score",
      "Status",
      "Resume File",
      "Match Assessment"
    ];

    const csvRows = [headers.join(",")];

    candidates.forEach((c) => {
      const row = [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        c.experienceYears,
        `"${c.skills.join(', ').replace(/"/g, '""')}"`,
        c.aiScore,
        `"${c.status.replace(/"/g, '""')}"`,
        `"${c.resumeFile.replace(/"/g, '""')}"`,
        `"${c.matchExplanation.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hrise_screened_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const { api } = await import("../utils/api");
      await api.candidates.clearAll();
      
      setCandidates([]);
      localStorage.removeItem("hrise_candidates");
      localStorage.removeItem("hrise_interview_sessions");
      localStorage.removeItem("hrise_onboarding_records");
      
      addHriseNotification(
        "Data Cleared",
        "All resume screening records, profiles, and scheduled interviews have been cleared.",
        "info",
        "recruiter"
      );
      
      setShowClearConfirm(false);
      alert("All screening data cleared successfully.");
    } catch (err) {
      console.error("Failed to clear candidates:", err);
      alert(`Failed to clear data: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleMoveToInterview = async (cand) => {
    try {
      if (cand.status !== "shortlisted") {
        updateCandidateStatus(cand.id, "shortlisted");
      }
      navigate("/interviews");
    } catch (e) {
      console.error(e);
    }
  };

  const role = user?.role || "recruiter";
  const isHRAdmin = role === "recruiter";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Resume Screening" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8">
          {!isHRAdmin && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">HR Access — Screen, Shortlist &amp; Reject</p>
                <p className="text-[11px] text-amber-600 mt-0.5">You can upload resumes, run AI screening, shortlist and reject candidates. Final hire &amp; onboarding decisions are restricted to HR Recruiteristrators.</p>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Resume Screening
              </h1>
              <p className="text-gray-500 mt-1">
                Upload resumes and let AI score & rank candidates
              </p>
            </div>
            <div className="flex gap-2">
              {selectedCandidates.size > 0 && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => bulkAction("shortlisted")}
                  >
                    <Check size={16} /> Shortlist ({selectedCandidates.size})
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => bulkAction("rejected")}
                  >
                    <X size={16} /> Reject ({selectedCandidates.size})
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleExportCSV}>
                <Download size={16} /> Export
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={16} /> Clear All Data
              </Button>
            </div>
          </div>

          {/* Upload Area */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  Upload Resumes & Job Description
                </h3>
              </div>

              {/* Job Selection & JD Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Target Job Role
                  </label>
                  <div className="relative">
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm appearance-none bg-white font-medium"
                    >
                      <option value="custom">Custom Job Description</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({job.department})
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Description (matching parameters)
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => {
                      if (selectedJobId === "custom") {
                        setJdText(e.target.value);
                      }
                    }}
                    readOnly={selectedJobId !== "custom"}
                    placeholder="Paste a custom job description here, or select an existing job from the list..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm resize-none transition-all ${
                      selectedJobId !== "custom"
                        ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                  />
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    handleUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  uploading
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleUpload(e.target.files);
                    }
                  }}
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
                    <p className="text-indigo-600 font-medium">
                      Uploading resumes...
                    </p>
                  </div>
                ) : analyzing ? (
                  <div className="flex flex-col items-center">
                    <Brain
                      size={32}
                      className="text-indigo-600 mb-3 animate-pulse"
                    />
                    <p className="text-indigo-600 font-medium mb-2">
                      AI is analyzing resumes...
                    </p>
                    <div className="w-64 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {Math.round(analysisProgress)}% complete
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={32} className="text-gray-400 mb-3" />
                    <p className="text-gray-700 font-medium">
                      Drop PDF/DOCX resumes here or click to upload
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Supports bulk upload — upload multiple resumes at once
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Filters & Search */}
          {candidates.length > 0 && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidates by name or skill..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex bg-white rounded-lg border border-gray-300 p-0.5">
                    {["all", "shortlisted", "rejected"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600">
                      <ArrowRightLeft size={14} /> Sort: {sortBy}
                      <ChevronDown size={14} />
                    </button>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    >
                      <option value="score">AI Score</option>
                      <option value="date">Date</option>
                      <option value="match">Match %</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Candidate Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3 hidden lg:table-cell">
                          Skills
                        </th>
                        <th className="px-4 py-3">Experience</th>
                        <th className="px-4 py-3">AI Resume Score</th>
                        <th className="px-4 py-3">Skills Match %</th>
                        <th className="px-4 py-3">AI Assessment Summary</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((c) => (
                        <tr
                          key={c.id}
                          className={`hover:bg-gray-50 transition-colors ${showDetail === c.id ? "bg-indigo-50/50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCandidates.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {c.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {c.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {c.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {c.skills.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
                                >
                                  {s}
                                </span>
                              ))}
                              {c.skills.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{c.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {c.experienceYears === 0 ? "Fresher" : (c.experienceYears === 1 ? "0-1 Years Experience" : `${c.experienceYears} yrs`)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${c.aiScore >= 80 ? "bg-emerald-500" : c.aiScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${c.aiScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {c.aiScore}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-bold ${c.matchPercentage >= 80 ? "text-emerald-600" : c.matchPercentage >= 60 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {c.matchPercentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <button
                              onClick={() =>
                                setShowDetail(showDetail === c.id ? null : c.id)
                              }
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              AI Assessment Summary
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                c.status === "shortlisted"
                                  ? "success"
                                  : c.status === "rejected"
                                    ? "danger"
                                    : c.status === "selected"
                                      ? "purple"
                                      : c.status === "interviewed"
                                        ? "info"
                                        : "default"
                              }
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* 1. Evaluate Candidate — always visible so recruiter can see resume analysis + interview status */}
                              <Link
                                to={`/evaluation/${c.id}`}
                                className={`p-1.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1 shadow-sm ${
                                  c.status === "interviewed" || c.status === "selected"
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                                }`}
                                title={c.status === "interviewed" ? "Evaluate Candidate & Run ML Prediction" : "View Candidate Profile"}
                              >
                                <Brain size={14} /> {c.status === "interviewed" ? "Evaluate" : "Profile"}
                              </Link>
                              {/* 2. Shortlist / Reject — hide if already in a terminal state */}
                              {c.status !== "selected" && c.status !== "rejected" && (
                                <>
                                  <button
                                    onClick={() => updateCandidateStatus(c.id, "shortlisted")}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors border border-gray-200"
                                    title="Shortlist Candidate"
                                  >
                                    <Check size={15} />
                                  </button>
                                  <button
                                    onClick={() => updateCandidateStatus(c.id, "rejected")}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors border border-gray-200"
                                    title="Reject Candidate"
                                  >
                                    <X size={15} />
                                  </button>
                                </>
                              )}
                              {c.status === "selected" && (
                                <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                  <Check size={12} /> Hired
                                </span>
                              )}
                              {c.status === "rejected" && (
                                <button
                                  onClick={() => updateCandidateStatus(c.id, "shortlisted")}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors border border-gray-200"
                                  title="Move back to Shortlisted"
                                >
                                  <Check size={15} />
                                </button>
                              )}
                              {/* 3. Move to Interview — only for active candidates not yet interviewed */}
                              {c.status !== "selected" && c.status !== "rejected" && c.status !== "interviewed" && (
                                <button
                                  onClick={() => handleMoveToInterview(c)}
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors border border-gray-200 flex items-center justify-center"
                                  title="Schedule Interview"
                                >
                                  <Video size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                      ))}
                      {/* Detail row */}
                      {showDetail &&
                        filtered.find((c) => c.id === showDetail) && (
                          <tr className="bg-indigo-50/30">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm max-w-4xl">
                                <div className="flex gap-4">
                                  <Brain
                                    size={22}
                                    className="text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse"
                                  />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider mb-2">
                                      AI Assessment Summary
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                      {
                                        filtered.find((c) => c.id === showDetail)
                                          ?.matchExplanation
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {candidates.length === 0 && !uploading && !analyzing && (
            <Card className="p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                  <FileText size={36} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No resumes uploaded yet
                </h3>
                <p className="text-gray-500 text-center max-w-md">
                  Upload PDF or DOCX resumes above. AI will parse, score, and
                  rank each candidate against the job description.
                </p>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              }}
            >
              <Trash2 size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">
              Clear All Candidate Data
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to delete all candidates, screening reports, profiles, and scheduled interviews? This action will reset all job applicant counts to 0 and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                disabled={clearing}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                }}
              >
                {clearing ? "Clearing..." : "Yes, Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
