import { useState, useEffect, useMemo } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { syncFromBackend } from "../utils/sync";
import {
  Award,
  Plus,
  Search,
  Filter,
  Star,
  CheckCircle,
  AlertCircle,
  Inbox,
  User,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  FileText
} from "lucide-react";

export default function ManagerPerformancePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [quarterFilter, setQuarterFilter] = useState("all");

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [quarter, setQuarter] = useState("Q2 2026");
  const [technical, setTechnical] = useState(85);
  const [communication, setCommunication] = useState(85);
  const [teamwork, setTeamwork] = useState(85);
  const [productivity, setProductivity] = useState(85);
  const [feedback, setFeedback] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Accordion state for review feedback expansion
  const [expandedReviews, setExpandedReviews] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch department staff
      const staffList = await api.staff.getAll();
      setTeam(Array.isArray(staffList) ? staffList : []);

      // Fetch reviews
      const reviewsList = await api.performance.getReviews();
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
    } catch (e) {
      console.error("Error fetching performance page data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("storage", fetchData);
    return () => window.removeEventListener("storage", fetchData);
  }, []);

  const department = user?.department || team[0]?.department || "Engineering";

  // Filter team members of the manager's department
  const departmentTeam = useMemo(() => {
    return team.filter((member) => member.department?.toLowerCase() === department?.toLowerCase());
  }, [team, department]);

  // Set default selected employee when modal opens or team loads
  useEffect(() => {
    if (departmentTeam.length > 0 && !selectedEmail) {
      setSelectedEmail(departmentTeam[0].email);
    }
  }, [departmentTeam, selectedEmail]);

  // Automatically compute overall score as the average
  const overall = Math.round((Number(technical) + Number(communication) + Number(teamwork) + Number(productivity)) / 4);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!selectedEmail) {
      setErrorMsg("Please select an employee.");
      return;
    }
    if (!feedback.trim()) {
      setErrorMsg("Please provide qualitative feedback comments.");
      return;
    }

    const employee = departmentTeam.find(m => m.email === selectedEmail);
    if (!employee) {
      setErrorMsg("Selected employee not found in department team.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        employeeEmail: selectedEmail,
        employeeName: employee.name,
        managerName: user?.name || "Senior Manager",
        quarter,
        ratings: {
          technical: Number(technical),
          communication: Number(communication),
          teamwork: Number(teamwork),
          productivity: Number(productivity),
          overall
        },
        feedback
      };

      await api.performance.createReview(payload);
      setSuccessMsg(`Successfully submitted Q2 performance review for ${employee.name}!`);
      
      // Reset form
      setFeedback("");
      setTechnical(85);
      setCommunication(85);
      setTeamwork(85);
      setProductivity(85);
      
      // Delay modal close
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 2000);

      // Trigger cache sync
      await syncFromBackend();
    } catch (e) {
      console.error("Failed to create review:", e);
      setErrorMsg(e.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpandReview = (id) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch = 
      r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.feedback?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesQuarter = quarterFilter === "all" || r.quarter === quarterFilter;

    return matchesSearch && matchesQuarter;
  });

  // Unique quarters for filter select
  const uniqueQuarters = useMemo(() => {
    const quarters = reviews.map((r) => r.quarter);
    return ["all", ...new Set(quarters)];
  }, [reviews]);

  // Statistics
  const avgDeptScore = filteredReviews.length > 0
    ? Math.round(filteredReviews.reduce((sum, r) => sum + r.ratings.overall, 0) / filteredReviews.length)
    : "N/A";

  const topPerformersCount = filteredReviews.filter(r => r.ratings.overall >= 90).length;
  const needsAttentionCount = filteredReviews.filter(r => r.ratings.overall < 80).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="Performance Reviews" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                  <Award size={18} />
                </span>
                Performance Reviews
              </h1>
              <p className="text-gray-500 mt-1">
                Evaluate your team members, record quarterly progress, and browse evaluation histories.
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} /> New Review
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Evaluations Logged", value: filteredReviews.length, icon: <FileText size={18} />, color: "from-indigo-500 to-purple-600" },
                  { label: "Dept Avg Score", value: avgDeptScore === "N/A" ? "N/A" : `${avgDeptScore}/100`, icon: <Star size={18} />, color: "from-amber-500 to-yellow-500" },
                  { label: "Top Performers (≥90)", value: topPerformersCount, icon: <CheckCircle size={18} />, color: "from-emerald-500 to-teal-600" },
                  { label: "Needs Support (<80)", value: needsAttentionCount, icon: <AlertCircle size={18} />, color: "from-red-500 to-orange-500" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex-1 relative">
                  <select
                    value={quarterFilter}
                    onChange={(e) => setQuarterFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Quarters</option>
                    {uniqueQuarters.filter(q => q !== "all").map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reviews Feed */}
              <div className="grid grid-cols-1 gap-4">
                {filteredReviews.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
                    <Inbox className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                    <p className="text-gray-800 font-bold text-base">No performance evaluations found</p>
                    <p className="text-gray-400 text-xs mt-1">Submit a review or modify filters to get started.</p>
                  </div>
                ) : (
                  filteredReviews.map((rev) => {
                    const isExpanded = !!expandedReviews[rev._id];
                    let scoreBadge = "bg-green-50 text-green-700 border-green-200";
                    if (rev.ratings.overall < 90) scoreBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    if (rev.ratings.overall < 80) scoreBadge = "bg-amber-50 text-amber-700 border-amber-200";
                    if (rev.ratings.overall < 60) scoreBadge = "bg-red-50 text-red-700 border-red-200";

                    return (
                      <div
                        key={rev._id}
                        className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm hover:shadow-md transition space-y-4"
                      >
                        {/* Header Details */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center shadow-inner">
                              {rev.employeeName?.charAt(0) || "E"}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm leading-none">{rev.employeeName}</h3>
                              <p className="text-[10px] text-gray-400 font-semibold mt-1">Reviewer: {rev.managerName} • {rev.quarter}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${scoreBadge}`}>
                              Overall Score: {rev.ratings.overall}/100
                            </span>
                            <button
                              onClick={() => toggleExpandReview(rev._id)}
                              className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Slider Ratings Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-xs font-semibold text-gray-500">
                          {[
                            { name: "Technical", val: rev.ratings.technical },
                            { name: "Communication", val: rev.ratings.communication },
                            { name: "Teamwork", val: rev.ratings.teamwork },
                            { name: "Productivity", val: rev.ratings.productivity }
                          ].map((rating) => (
                            <div key={rating.name}>
                              <p className="text-gray-400 uppercase tracking-wider text-[9px]">{rating.name}</p>
                              <p className="text-gray-900 font-extrabold mt-1 text-sm">{rating.val}%</p>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${rating.val}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Feedback Content */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                            <h4 className="font-bold text-gray-900 uppercase tracking-widest text-[9px] text-indigo-600">Qualitative Feedback</h4>
                            <p className="text-gray-700 leading-relaxed font-medium bg-indigo-50/20 border border-indigo-50 p-4 rounded-xl italic">
                              "{rev.feedback}"
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold text-right">
                              Submitted: {new Date(rev.date).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* New Review Modal */}
              {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative z-10 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-in">
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Record Performance Evaluation</h2>
                        <p className="text-xs text-gray-400">Reviewing for {department} Department</p>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-1.5 hover:bg-gray-150 rounded-xl text-gray-400 hover:text-gray-600 transition"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errorMsg}
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle size={14} /> {successMsg}
                      </div>
                    )}

                    {/* Modal Form */}
                    <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-semibold text-gray-500">
                      
                      {/* Employee Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Employee to Review</label>
                        <select
                          value={selectedEmail}
                          onChange={(e) => setSelectedEmail(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                        >
                          {departmentTeam.length === 0 ? (
                            <option value="">No department members seeded</option>
                          ) : (
                            departmentTeam.map((member) => (
                              <option key={member.email} value={member.email}>
                                {member.name} ({member.designation})
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Quarter Select */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Evaluation Period</label>
                        <select
                          value={quarter}
                          onChange={(e) => setQuarter(e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="Q2 2026">Q2 2026 (Current)</option>
                          <option value="Q1 2026">Q1 2026</option>
                          <option value="Q4 2025">Q4 2025</option>
                          <option value="Q3 2025">Q3 2025</option>
                        </select>
                      </div>

                      {/* Sliders Grid */}
                      <div className="space-y-4 border-t border-gray-50 pt-4">
                        <h4 className="font-bold text-gray-900 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                          <Sliders size={12} className="text-indigo-500" />
                          Rating Scores (0 - 100)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { name: "Technical Competence", val: technical, setVal: setTechnical },
                            { name: "Communication & Collaboration", val: communication, setVal: setCommunication },
                            { name: "Teamwork & Support", val: teamwork, setVal: setTeamwork },
                            { name: "Productivity & Focus", val: productivity, setVal: setProductivity }
                          ].map((slider) => (
                            <div key={slider.name} className="space-y-1">
                              <div className="flex justify-between text-gray-700">
                                <span className="font-semibold text-[10px] text-gray-500">{slider.name}</span>
                                <span className="font-extrabold text-indigo-600 text-xs">{slider.val}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={slider.val}
                                onChange={(e) => slider.setVal(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Display Overall calculated Score */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-indigo-800">Calculated Overall Score:</span>
                        <span className="font-extrabold text-indigo-900 text-sm">{overall} / 100</span>
                      </div>

                      {/* Qualitative Comments */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 uppercase tracking-widest text-[9px]">Written Feedback Comments</label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Provide a detailed feedback summary including strengths, key achievements and areas for growth..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-xs text-gray-800 font-medium focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 bg-gray-50/50 resize-none h-24"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="py-2.5 px-4 bg-gray-100 hover:bg-gray-150 text-gray-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || departmentTeam.length === 0}
                          className="py-2.5 px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
                        >
                          {submitting ? "Submitting..." : "Submit Evaluation"}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
