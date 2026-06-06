import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import { syncFromBackend } from "../utils/sync";
import {
  Briefcase,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox,
  Calendar
} from "lucide-react";

export default function ManagerLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Track comments for each leave item locally by leave ID
  const [comments, setComments] = useState({});

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const data = await api.leaves.getAll();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching leaves:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    window.addEventListener("storage", fetchLeaves);
    return () => window.removeEventListener("storage", fetchLeaves);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      const managerComment = comments[id] || "";
      await api.leaves.update(id, { status, managerComment });
      
      // Clear comment for this leave ID
      setComments(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      // Synchronize database to client local cache and trigger UI update
      await syncFromBackend();
    } catch (e) {
      console.error("Failed to update leave status:", e);
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.managerComment && l.managerComment.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesType = typeFilter === "all" || l.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate quick stats
  const totalRequests = filteredLeaves.length;
  const pendingCount = filteredLeaves.filter(l => l.status === "Pending").length;
  const approvedCount = filteredLeaves.filter(l => l.status === "Approved").length;
  const rejectedCount = filteredLeaves.filter(l => l.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="Leave Approvals" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
          
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <Briefcase size={18} />
              </span>
              Leave Approvals
            </h1>
            <p className="text-gray-500 mt-1">
              Review, approve, or reject employee leave requests within your department.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Requests", value: totalRequests, icon: <Inbox size={18} />, color: "from-indigo-500 to-purple-600" },
                  { label: "Pending Review", value: pendingCount, icon: <Clock size={18} />, color: "from-amber-500 to-yellow-500" },
                  { label: "Approved Leaves", value: approvedCount, icon: <CheckCircle size={18} />, color: "from-emerald-500 to-teal-600" },
                  { label: "Rejected Leaves", value: rejectedCount, icon: <AlertCircle size={18} />, color: "from-red-500 to-orange-500" }
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

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex-1 relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Leave Types</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                  </select>
                </div>
              </div>

              {/* Leave Requests Feed/List */}
              <div className="space-y-4">
                {filteredLeaves.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
                    <Briefcase className="mx-auto text-gray-300 w-12 h-12 mb-3" />
                    <p className="text-gray-800 font-bold text-base">No leave applications found</p>
                    <p className="text-gray-400 text-xs mt-1">Try modifying your search queries or filters.</p>
                  </div>
                ) : (
                  filteredLeaves.map((leave) => {
                    // Badge styles for leave type
                    let typeBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    if (leave.type === "Medical Leave") typeBadge = "bg-rose-50 text-rose-700 border-rose-200";
                    if (leave.type === "Casual Leave") typeBadge = "bg-amber-50 text-amber-700 border-amber-200";

                    // Badge styles for status
                    let statusBadge = "bg-amber-50 text-amber-800 border-amber-200";
                    if (leave.status === "Approved") statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                    if (leave.status === "Rejected") statusBadge = "bg-rose-50 text-rose-800 border-rose-200";

                    return (
                      <div
                        key={leave._id}
                        className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-start justify-between gap-6"
                      >
                        <div className="space-y-4 flex-1">
                          {/* Top row: Employee Name & Type badge */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center shadow-inner">
                              {leave.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm leading-none">{leave.name}</h3>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{leave.department} Department</p>
                            </div>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${typeBadge} ml-auto md:ml-0`}>
                              {leave.type}
                            </span>
                          </div>

                          {/* Reason */}
                          <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-xs">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mb-1">Reason for leave</p>
                            <p className="text-gray-700 font-medium leading-relaxed italic">"{leave.reason}"</p>
                          </div>

                          {/* Date Range Info */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-gray-400" />
                              Duration: <span className="text-gray-800 font-bold">{leave.startDate} to {leave.endDate}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-gray-400" />
                              Total Days: <span className="text-gray-800 font-bold">{leave.days} day(s)</span>
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Applied on: {leave.appliedOn}
                            </span>
                          </div>

                          {/* Manager Comment display (if already evaluated) */}
                          {leave.status !== "Pending" && leave.managerComment && (
                            <div className="border-t border-gray-100 pt-3 flex items-start gap-2 text-xs text-gray-500">
                              <MessageSquare size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-gray-700">Manager comment:</span>{" "}
                                <span className="italic">{leave.managerComment}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions / Status Section */}
                        <div className="flex flex-col items-stretch md:items-end justify-between gap-4 md:w-64 shrink-0 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                          <span className={`inline-flex px-3 py-1 rounded-xl border text-xs font-bold w-max self-start md:self-auto ${statusBadge}`}>
                            {leave.status}
                          </span>

                          {leave.status === "Pending" && (
                            <div className="space-y-3 w-full">
                              {/* Inline manager comment input */}
                              <div className="relative">
                                <textarea
                                  value={comments[leave._id] || ""}
                                  onChange={(e) => setComments({ ...comments, [leave._id]: e.target.value })}
                                  placeholder="Add manager comment (optional)..."
                                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none text-xs text-gray-750 font-medium focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 bg-gray-50/50 resize-none h-16"
                                />
                              </div>
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => handleStatusUpdate(leave._id, "Approved")}
                                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(leave._id, "Rejected")}
                                  className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                                >
                                  <X size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
