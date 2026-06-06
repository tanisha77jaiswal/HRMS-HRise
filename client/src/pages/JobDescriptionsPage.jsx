import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Sparkles, MapPin, Clock, Users, Plus, Trash2 } from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { api } from "../utils/api";

export default function JobDescriptionsPage() {
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const role = user?.role || "recruiter";
  const isHRAdmin = role === "recruiter";

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDepartment, setFormDepartment] = useState("Engineering");
  const [formLocation, setFormLocation] = useState("");
  const [formExperience, setFormExperience] = useState(3);
  const [formType, setFormType] = useState("full-time");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch jobs and candidates from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, candidatesRes] = await Promise.allSettled([
        api.jobs.getAll(),
        api.candidates.getAll(),
      ]);
      if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value)) {
        setJobs(jobsRes.value);
      }
      if (candidatesRes.status === "fulfilled" && Array.isArray(candidatesRes.value)) {
        setCandidates(candidatesRes.value);
      }
    } catch (e) {
      console.error("JobDescriptionsPage fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const onRefresh = () => fetchData();
    window.addEventListener("hrise_dashboard_refresh", onRefresh);
    return () => window.removeEventListener("hrise_dashboard_refresh", onRefresh);
  }, []);

  const handleExtractSkills = async () => {
    if (!formTitle || !formDescription) return;
    setExtractingSkills(true);
    
    // Dynamic Skill Extractor
    const keywords = [
      "Python", "TensorFlow", "PyTorch", "React", "TypeScript", "JavaScript", 
      "Node.js", "SQL", "Docker", "Machine Learning", "Deep Learning", "MLOps", 
      "Kubernetes", "AWS", "CSS", "HTML", "Tailwind CSS", "REST APIs", 
      "Tableau", "Power BI", "Excel", "Statistics", "Vue.js", "GraphQL", 
      "Java", "Spring Boot", "Microservices", "Redis", "PostgreSQL", "NLP", 
      "Transformers", "FastAPI", "Git"
    ];
    
    const extractedSkills = keywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.replace('.', '\\.')}\\b`, 'i');
      return regex.test(formDescription) || regex.test(formTitle);
    });

    if (extractedSkills.length === 0) {
      if (formDepartment === "Engineering" || formTitle.toLowerCase().includes("engineer")) {
        extractedSkills.push("JavaScript", "React", "Node.js", "Git");
      } else if (formDepartment === "Data Science" || formTitle.toLowerCase().includes("data")) {
        extractedSkills.push("Python", "SQL", "Statistics", "Pandas");
      } else {
        extractedSkills.push("Management", "Communication", "Agile");
      }
    }

    const newJob = {
      id: `jd-${Date.now()}`,
      title: formTitle,
      department: formDepartment,
      description: formDescription,
      requiredSkills: extractedSkills,
      experienceRequired: formExperience,
      postedDate: new Date().toISOString().slice(0, 10),
      status: "open",
      applicantCount: 0,
      location: formLocation || "Remote",
      type: formType,
    };

    try {
      const created = await api.jobs.create(newJob);
      setJobs((prev) => [created || newJob, ...prev]);
    } catch (e) {
      console.error("Failed to create job:", e);
      setJobs((prev) => [newJob, ...prev]);
    }

    setExtractingSkills(false);
    setShowCreate(false);

    // Reset form
    setFormTitle("");
    setFormDescription("");
    setFormDepartment("Engineering");
    setFormLocation("");
    setFormExperience(3);
    setFormType("full-time");
  };

  const handleDeleteJob = async (e, jobId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      await api.jobs.delete(jobId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Job Descriptions" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8">
          {!isHRAdmin && (
            <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-800">HR Access — Post &amp; Edit</p>
                <p className="text-[11px] text-blue-600 mt-0.5">You can post new jobs and edit job descriptions. Closing or deleting job postings is restricted to HR Recruiteristrators.</p>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Job Descriptions & AI Matching
              </h1>
              <p className="text-gray-500 mt-1">
                Post jobs, let AI extract skills, and match incoming candidates
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Post New Job
            </Button>
          </div>

          {/* Feature Banner */}
          <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  AI JD Analysis & Smart Ranking
                </h3>
                <p className="text-emerald-100 text-sm mt-1">
                  AI automatically extracts required skills from job
                  descriptions. When resumes arrive, each is matched against
                  extracted skills with visual percentages and explainable AI
                  reasoning.
                </p>
              </div>
              <Badge variant="default" className="bg-white/20 text-white">
                AI Feature #4
              </Badge>
            </div>
          </Card>

          {/* Job Cards */}
          <div className="space-y-4">
            {(() => {
              const filteredJobs = jobs.filter(
                (job) =>
                  !searchQuery ||
                  job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (job.requiredSkills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              return filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                const jobCandidates = candidates
                  .filter((c) => c.jobId === job.id)
                  .sort((a, b) => (b.matchPercentage || b.aiScore || 0) - (a.matchPercentage || a.aiScore || 0))
                  .slice(0, 3);
                const avgMatch =
                  jobCandidates.length > 0
                    ? Math.round(
                        jobCandidates.reduce((a, c) => a + (c.matchPercentage || c.aiScore || 0), 0) /
                          jobCandidates.length,
                      )
                    : 0;

                return (
                  <Card
                    key={job.id}
                    className={
                      selectedJob?.id === job.id
                        ? "ring-2 ring-indigo-500 shadow-lg"
                        : ""
                    }
                  >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <MapPin size={14} /> {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} /> {job.type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={14} /> {job.applicantCount}{" "}
                                applicants
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={
                                job.status === "open" ? "success" : "default"
                              }
                            >
                              {job.status}
                            </Badge>
                            {isHRAdmin && (
                              <button
                                onClick={(e) => handleDeleteJob(e, job.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Job Posting"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                          {job.description}
                        </p>

                        {/* Extracted Skills */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                            AI-Extracted Required Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map((skill) => (
                              <Badge
                                key={skill}
                                variant="info"
                                className="bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Experience: {job.experienceRequired}+ years
                          </span>
                          <span>Dept: {job.department}</span>
                          <span>Posted: {job.postedDate}</span>
                        </div>
                      </div>

                      {/* Match Stats */}
                      <div className="lg:w-72 flex-shrink-0">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Candidate Match Summary
                          </h4>
                          <div className="flex items-center justify-center mb-3">
                            <div className="relative w-24 h-24">
                              <svg
                                className="w-24 h-24 -rotate-90"
                                viewBox="0 0 36 36"
                              >
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke={
                                    avgMatch >= 70 ? "#10b981" : "#f59e0b"
                                  }
                                  strokeWidth="3"
                                  strokeDasharray={`${avgMatch}, 100`}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-gray-900">
                                  {avgMatch}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-center text-xs text-gray-500 mb-3">
                            Average match across candidates
                          </p>

                          <div className="space-y-2">
                            {jobCandidates.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-700 truncate">
                                  {c.name}
                                </span>
                                <span
                                  className={`font-medium ${c.matchPercentage >= 70 ? "text-emerald-600" : "text-amber-600"}`}
                                >
                                  {c.matchPercentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded candidate matches */}
                    {selectedJob?.id === job.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">
                          Detailed Candidate Matches
                        </h4>
                        <div className="space-y-3">
                          {candidates
                            .filter((c) => c.jobId === job.id)
                            .sort((a, b) => (b.matchPercentage || b.aiScore || 0) - (a.matchPercentage || a.aiScore || 0))
                            .map((c) => {
                            const matchedSkills = c.skills.filter((s) =>
                              job.requiredSkills.includes(s),
                            );
                            const missingSkills = job.requiredSkills.filter(
                              (s) => !c.skills.includes(s),
                            );
                            return (
                              <div
                                key={c.id}
                                className="p-4 rounded-xl border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
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
                                        {c.experienceYears} years exp
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-lg font-bold ${c.matchPercentage >= 70 ? "text-emerald-600" : c.matchPercentage >= 50 ? "text-amber-600" : "text-red-600"}`}
                                    >
                                      {c.matchPercentage}%
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs font-medium text-emerald-700 mb-1">
                                      ✓ Matched Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {matchedSkills.map((s) => (
                                        <span
                                          key={s}
                                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-red-700 mb-1">
                                      ✗ Missing Skills
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {missingSkills.map((s) => (
                                        <span
                                          key={s}
                                          className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs font-medium text-indigo-700 mb-1">
                                    AI Explanation
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {c.matchExplanation}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() =>
                          setSelectedJob(
                            selectedJob?.id === job.id ? null : job,
                          )
                        }
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {selectedJob?.id === job.id ? "Hide" : "Show"} candidate
                        matches ↓
                      </button>
                    </div>
                  </div>
                </Card>
                );
              })
            ) : jobs.length > 0 ? (
              <Card className="p-16 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Matching Jobs</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-3 text-xs leading-relaxed">We couldn't find any job postings matching "{searchQuery}". Try adjusting your keywords!</p>
                <button onClick={() => setSearchQuery("")} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl transition-all hover:bg-indigo-100">
                  Clear Search Filter
                </button>
              </Card>
            ) : (
              <Card className="p-16 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <Sparkles size={36} className="text-emerald-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Job Postings Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first job description. AI will automatically extract candidate match benchmarks and skills in real-time!</p>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={16} /> Post Your First Job
                </Button>
              </Card>
            );
          })()}
        </div>

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Post New Job
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Paste a job description — AI will extract skills automatically.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g., Senior Machine Learning Engineer"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Job Description
                      </label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Paste the full job description here. AI will automatically extract required skills, experience level, and key requirements..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Department
                        </label>
                        <select
                          value={formDepartment}
                          onChange={(e) => setFormDepartment(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm"
                        >
                          <option>Engineering</option>
                          <option>Data Science</option>
                          <option>AI/ML</option>
                          <option>Cloud & Infrastructure</option>
                          <option>Cybersecurity</option>
                          <option>DevOps</option>
                          <option>Product</option>
                          <option>Design</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="Remote / Bengaluru, India"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Dynamic Experience and Job Type inputs */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Experience Required (Years)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formExperience}
                          onChange={(e) => setFormExperience(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Job Type
                        </label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 outline-none text-sm"
                        >
                          <option value="full-time">Full Time</option>
                          <option value="part-time">Part Time</option>
                          <option value="contract">Contract</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowCreate(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleExtractSkills}
                      disabled={extractingSkills || !formTitle || !formDescription}
                    >
                      {extractingSkills ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          AI Extracting Skills...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} /> Post & Extract Skills
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
