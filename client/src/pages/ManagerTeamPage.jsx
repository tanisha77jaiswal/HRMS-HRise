import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import {
  Users,
  Search,
  User,
  Activity,
  Award,
  Clock,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";

export default function ManagerTeamPage() {
  const [team, setTeam] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Details Modal State
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const staffList = await api.staff.getAll();
      setTeam(staffList);
      
      const reviewsList = await api.performance.getReviews();
      setReviews(reviewsList);
    } catch (e) {
      console.error("Error fetching team data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("storage", fetchData);
    return () => window.removeEventListener("storage", fetchData);
  }, []);

  const getMemberScore = (email) => {
    const latestRev = reviews.find(r => r.employeeEmail?.toLowerCase() === email?.toLowerCase());
    return latestRev ? latestRev.ratings.overall : "N/A";
  };

  const filteredTeam = team.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="My Team" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                  <Users size={18} />
                </span>
                Team Members
              </h1>
              <p className="text-gray-500 mt-1">
                View details, attendance levels, and performance scores of your department's staff.
              </p>
            </div>
          </div>

          {/* Cards Grid / Table */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTeam.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-505 font-bold text-sm">No team members found</p>
                <p className="text-gray-400 text-xs mt-1">Check search query or department settings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Employee ID</th>
                      <th className="px-6 py-4">Designation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Attendance Rate</th>
                      <th className="px-6 py-4">Performance Score</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredTeam.map((member) => {
                      const score = getMemberScore(member.email);
                      const isAbsent = member.status === "on_leave" || member.status === "inactive";
                      
                      return (
                        <tr key={member._id || member.email} className="hover:bg-indigo-50/20 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                {member.photoUrl ? (
                                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  member.name?.charAt(0)?.toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-tight">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-500 text-xs font-semibold">
                            {member.employeeId || "—"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-700">
                            {member.designation}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                member.status === "on_leave"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : member.status === "inactive"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAbsent ? (member.status === "on_leave" ? "bg-amber-500" : "bg-red-500") : "bg-emerald-500"}`} />
                              {member.status === "on_leave" ? "On Leave" : member.status === "inactive" ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${member.attendance || 0}%` }} />
                              </div>
                              <span className="font-bold text-gray-900 text-xs">{member.attendance || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score}%` }} />
                              </div>
                              <span className="font-bold text-gray-900 text-xs">{score}/100</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedMember(member)}
                              className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:border-indigo-300 text-xs font-bold text-gray-600 hover:text-indigo-600 transition bg-white shadow-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details Modal */}
          {selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fade-in">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={18} />
                </button>

                {/* Profile header */}
                <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-inner flex-shrink-0">
                    {selectedMember.photoUrl ? (
                      <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedMember.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedMember.name}</h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">{selectedMember.designation} • {selectedMember.department}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{selectedMember.employeeId}</p>
                  </div>
                </div>

                <div className="space-y-6 text-xs font-sans">
                  {/* General info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="block font-bold text-gray-400 uppercase tracking-widest">Reporting Manager</span>
                      <span className="text-sm font-bold text-gray-800">{selectedMember.manager || "—"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-gray-400 uppercase tracking-widest">Date Joined</span>
                      <span className="text-sm font-bold text-gray-800">{selectedMember.joinDate || selectedMember.dateJoined || "—"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-gray-400 uppercase tracking-widest">Salary Band</span>
                      <span className="text-sm font-bold text-gray-800">{selectedMember.salaryBand || "—"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-gray-400 uppercase tracking-widest">Phone Number</span>
                      <span className="text-sm font-bold text-gray-800">{selectedMember.phone || "Not provided"}</span>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <span className="block font-bold text-gray-400 uppercase tracking-widest">Office Location</span>
                      <span className="text-sm font-bold text-gray-800">{selectedMember.location || "Not provided"}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <span className="block font-bold text-gray-400 uppercase tracking-widest mb-2">Technical Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.skills && selectedMember.skills.length > 0 ? (
                        selectedMember.skills.map((skill, idx) => (
                          <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No skills listed.</span>
                      )}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 bg-gray-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendance Rate</p>
                        <p className="text-sm font-black text-gray-800">{selectedMember.attendance || 0}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Award size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Performance Score</p>
                        <p className="text-sm font-black text-gray-800">{getMemberScore(selectedMember.email)}/100</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="py-2 px-5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-md"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
