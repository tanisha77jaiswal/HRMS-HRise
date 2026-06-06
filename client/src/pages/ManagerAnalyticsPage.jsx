import { useState, useEffect, useMemo } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart3,
  Users,
  Calendar,
  Award,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  Briefcase
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

export default function ManagerAnalyticsPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState({ records: [], absentToday: [] });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const staffList = await api.staff.getAll();
      setTeam(Array.isArray(staffList) ? staffList : []);

      const leavesList = await api.leaves.getAll();
      setLeaves(Array.isArray(leavesList) ? leavesList : []);

      const attData = await api.attendance.get();
      setAttendance(attData || { records: [], absentToday: [] });

      const reviewsList = await api.performance.getReviews();
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
    } catch (e) {
      console.error("Error fetching analytics data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("storage", fetchData);
    return () => window.removeEventListener("storage", fetchData);
  }, []);

  const department = user?.department || team[0]?.department || null;

  // Filter department team members
  const deptTeam = useMemo(() => {
    return team.filter((member) => member.department?.toLowerCase() === department?.toLowerCase());
  }, [team, department]);

  // Filter leaves for this department
  const deptLeaves = useMemo(() => {
    return leaves.filter((leave) => leave.department?.toLowerCase() === department?.toLowerCase());
  }, [leaves, department]);

  // Filter attendance records by department
  const deptAttendanceRecords = useMemo(() => {
    return (attendance.records || []).filter((r) => r.dept?.toLowerCase() === department?.toLowerCase());
  }, [attendance.records, department]);

  // Key Analytics Calculations
  const avgAttendance = useMemo(() => {
    if (deptAttendanceRecords.length === 0) return "N/A";
    return Math.round(deptAttendanceRecords.reduce((sum, r) => sum + r.pct, 0) / deptAttendanceRecords.length);
  }, [deptAttendanceRecords]);

  const avgPerformance = useMemo(() => {
    const reviewedTeam = deptTeam.filter(member => reviews.some(r => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase()));
    if (reviewedTeam.length === 0) return "N/A";
    const totalScore = reviewedTeam.reduce((sum, member) => {
      const latestRev = reviews.find(
        (r) => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase()
      );
      return sum + latestRev.ratings.overall;
    }, 0);
    return Math.round(totalScore / reviewedTeam.length);
  }, [deptTeam, reviews]);

  const totalLeaveDays = useMemo(() => {
    return deptLeaves
      .filter((l) => l.status === "Approved")
      .reduce((sum, l) => sum + l.days, 0);
  }, [deptLeaves]);

  // Chart Data: Performance Scores per employee
  const performanceChartData = useMemo(() => {
    return deptTeam.map((member) => {
      const latestRev = reviews.find(
        (r) => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase()
      );
      return {
        name: member.name.split(" ")[0],
        Score: latestRev ? latestRev.ratings.overall : 0
      };
    });
  }, [deptTeam, reviews]);

  // Chart Data: Attendance Rate per employee
  const attendanceChartData = useMemo(() => {
    if (deptAttendanceRecords.length > 0) {
      return deptAttendanceRecords.map((r) => ({
        name: r.name.split(" ")[0],
        Attendance: r.pct
      }));
    }
    // Fallback based on team members
    return deptTeam.map((member) => ({
      name: member.name.split(" ")[0],
      Attendance: member.attendance || 0
    }));
  }, [deptAttendanceRecords, deptTeam]);

  // Chart Data: Leave Types Distribution
  const leaveTypeData = useMemo(() => {
    const counts = { "Medical Leave": 0, "Casual Leave": 0, "Earned Leave": 0 };
    deptLeaves
      .filter((l) => l.status === "Approved")
      .forEach((l) => {
        if (counts[l.type] !== undefined) counts[l.type] += l.days;
      });

    return [
      { name: "Medical Leave", value: counts["Medical Leave"], color: "#f43f5e" },
      { name: "Casual Leave", value: counts["Casual Leave"], color: "#fbbf24" },
      { name: "Earned Leave", value: counts["Earned Leave"], color: "#3b82f6" }
    ].filter((item) => item.value > 0);
  }, [deptLeaves]);

  // Chart Data: Performance Bands Distribution
  const performanceBandData = useMemo(() => {
    const scores = deptTeam.map((member) => {
      const latestRev = reviews.find(
        (r) => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase()
      );
      return latestRev ? latestRev.ratings.overall : null;
    }).filter(s => s !== null);

    const bands = { Excellent: 0, Good: 0, Average: 0, "Below Avg": 0 };
    scores.forEach((s) => {
      if (s >= 90) bands.Excellent += 1;
      else if (s >= 75) bands.Good += 1;
      else if (s >= 60) bands.Average += 1;
      else bands["Below Avg"] += 1;
    });

    return [
      { name: "Excellent (90-100)", value: bands.Excellent, color: "#10b981" },
      { name: "Good (75-89)", value: bands.Good, color: "#6366f1" },
      { name: "Average (60-74)", value: bands.Average, color: "#f59e0b" },
      { name: "Below Avg (<60)", value: bands["Below Avg"], color: "#ef4444" }
    ].filter((item) => item.value > 0);
  }, [deptTeam, reviews]);

  // All department unique skills
  const skillMatrix = useMemo(() => {
    const allSkills = {};
    deptTeam.forEach((member) => {
      if (Array.isArray(member.skills)) {
        member.skills.forEach((s) => {
          allSkills[s] = (allSkills[s] || 0) + 1;
        });
      }
    });
    return Object.entries(allSkills)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [deptTeam]);

  // Dynamic AI Department Synthesis
  const aiSummaryText = useMemo(() => {
    if (deptTeam.length === 0) return "No team members are currently assigned. Analytics will become available once employees are assigned to your team.";
    
    let comments = `Your department (${department || "Not Assigned"}) is staffed with ${deptTeam.length} active professionals. `;
    if (avgPerformance === "N/A") {
      comments += `Overall attendance is solid at ${avgAttendance === "N/A" ? "N/A" : `${avgAttendance}%`}, while performance indices are not yet available. `;
    } else {
      comments += `Overall attendance is solid at ${avgAttendance === "N/A" ? "N/A" : `${avgAttendance}%`}, while performance indices average at ${avgPerformance}/100. `;
    }
    
    if (totalLeaveDays > 10) {
      comments += `Approved leaves amount to ${totalLeaveDays} total days this quarter, which is slightly elevated. Monitor project timelines accordingly. `;
    } else {
      comments += `Leaves are well-controlled with only ${totalLeaveDays} approved leave days. `;
    }

    const lowPerformers = deptTeam.filter((member) => {
      const latestRev = reviews.find(
        (r) => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase()
      );
      if (!latestRev) return false;
      return latestRev.ratings.overall < 80;
    });

    if (lowPerformers.length > 0) {
      comments += `Action Item: There are ${lowPerformers.length} team members with scores below 80%. Scheduling check-ins or skill mentoring sessions is recommended.`;
    } else {
      comments += `Excellent: All team members are performing consistently with no scores below the 80% benchmark threshold.`;
    }

    return comments;
  }, [department, deptTeam, avgAttendance, avgPerformance, totalLeaveDays, reviews]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="Department Analytics" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
          
          {/* Title Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                  <BarChart3 size={18} />
                </span>
                Department Analytics
              </h1>
              <p className="text-gray-500 mt-1">
                Visual evaluations, performance bandings, attendance trends, and skill arrays.
              </p>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-yellow-400 animate-pulse" size={18} />
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-indigo-200">AI Department Insights</h3>
            </div>
            <p className="text-xs leading-relaxed text-indigo-50 font-medium">
              {aiSummaryText}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Department Size", value: deptTeam.length, icon: <Users size={18} />, color: "from-indigo-500 to-purple-600" },
                  { label: "Avg Attendance", value: avgAttendance === "N/A" ? "N/A" : `${avgAttendance}%`, icon: <Clock size={18} />, color: "from-emerald-500 to-teal-600" },
                  { label: "Avg Performance", value: avgPerformance === "N/A" ? "N/A" : `${avgPerformance}/100`, icon: <Award size={18} />, color: "from-purple-500 to-pink-600" },
                  { label: "Leave Days Taken", value: `${totalLeaveDays} Days`, icon: <Calendar size={18} />, color: "from-amber-500 to-yellow-500" }
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

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Performance Chart */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 hover:shadow-md transition">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Performance Index</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Evaluation score comparison by team member</p>
                  </div>
                  <div className="h-64">
                    {performanceChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[50, 100]} />
                          <Tooltip contentStyle={{ borderRadius: "12px", background: "#1f2937", border: "none", color: "#fff", fontSize: "11px" }} />
                          <Bar dataKey="Score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Attendance Chart */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 hover:shadow-md transition">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Attendance Consistency</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Monthly attendance percentage comparisons</p>
                  </div>
                  <div className="h-64">
                    {attendanceChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={attendanceChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={[50, 100]} />
                          <Tooltip contentStyle={{ borderRadius: "12px", background: "#1f2937", border: "none", color: "#fff", fontSize: "11px" }} />
                          <Line type="monotone" dataKey="Attendance" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Performance Distribution Bands */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Score Bands Breakdown</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Team performance distribution by grade</p>
                  </div>
                  <div className="flex items-center justify-center h-40">
                    {performanceBandData.length === 0 ? (
                      <div className="text-xs text-gray-400">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={performanceBandData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {performanceBandData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    {performanceBandData.map((band, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 justify-between bg-gray-50 border border-gray-100 p-2 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: band.color }} />
                          <span className="text-gray-500">{band.name.split(" ")[0]}</span>
                        </div>
                        <span className="text-gray-900">{band.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Types Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Leave Distribution</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Leave days consumption by categories</p>
                  </div>
                  <div className="flex items-center justify-center h-40">
                    {leaveTypeData.length === 0 ? (
                      <div className="text-xs text-gray-400">No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={leaveTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={65}
                            paddingAngle={0}
                            dataKey="value"
                          >
                            {leaveTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
                    {[
                      { name: "Medical", color: "#f43f5e" },
                      { name: "Casual", color: "#fbbf24" },
                      { name: "Earned", color: "#3b82f6" }
                    ].map((item, idx) => {
                      const count = leaveTypeData.find(l => l.name.startsWith(item.name))?.value || 0;
                      return (
                        <div key={idx} className="flex flex-col items-center justify-center bg-gray-50 border border-gray-100 p-2 rounded-xl">
                          <span className="text-gray-400 uppercase tracking-widest text-[8px]">{item.name}</span>
                          <span className="text-gray-950 font-black text-sm mt-1">{count}d</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Skill Matrix Tag Grid */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4 hover:shadow-md transition md:col-span-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Department Skill matrix</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">Occurrence density of skills across active team members</p>
                  </div>
                  {skillMatrix.length === 0 ? (
                    <p className="text-xs text-gray-400">No data available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {skillMatrix.map((item) => (
                        <span
                          key={item.skill}
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          {item.skill}
                          <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">
                            {item.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
