import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import {
  Users,
  Calendar,
  Clock,
  Award,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertCircle
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
  Cell
} from "recharts";
import { Link } from "react-router-dom";

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState({ records: [], absentToday: [] });
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch staff profiles (filtered by department on the backend)
      const staffList = await api.staff.getAll();
      setTeam(staffList);

      // Fetch leaves
      const leavesList = await api.leaves.getAll();
      setLeaves(leavesList);

      // Fetch attendance
      const attData = await api.attendance.get();
      setAttendance(attData || { records: [], absentToday: [] });

      // Fetch performance reviews
      const reviewsList = await api.performance.getReviews();
      setReviews(reviewsList);
    } catch (e) {
      console.error("Error fetching manager dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    window.addEventListener("storage", fetchDashboardData);
    return () => window.removeEventListener("storage", fetchDashboardData);
  }, []);

  const department = user?.department || team[0]?.department || "Engineering";

  // KPIs
  const totalTeamMembers = team.length;

  const teamAttendanceRate = totalTeamMembers > 0
    ? Math.round(team.reduce((sum, member) => sum + (member.attendance || 0), 0) / totalTeamMembers)
    : 0;

  const pendingLeavesCount = leaves.filter(l => l.status === "Pending").length;

  // Average Performance Score
  const membersWithReviews = team.filter(m => reviews.some(r => r.employeeEmail?.toLowerCase() === m.email?.toLowerCase()));
  const averagePerformanceScore = membersWithReviews.length > 0
    ? Math.round(
        membersWithReviews.reduce((sum, member) => {
          const latestRev = reviews.find(r => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase());
          return sum + latestRev.ratings.overall;
        }, 0) / membersWithReviews.length
      )
    : "N/A";

  // Chart data: Team Performance comparison
  const barChartData = team.map(member => {
    const latestRev = reviews.find(r => r.employeeEmail?.toLowerCase() === member.email?.toLowerCase());
    return {
      name: member.name.split(" ")[0],
      score: latestRev ? latestRev.ratings.overall : 0,
    };
  });

  // Chart data: Attendance distribution
  const attendanceBins = [
    { name: "Excellent (≥95%)", value: team.filter(m => (m.attendance || 0) >= 95).length, color: "#10b981" },
    { name: "Good (90-94%)", value: team.filter(m => (m.attendance || 0) >= 90 && (m.attendance || 0) < 95).length, color: "#6366f1" },
    { name: "Average (80-89%)", value: team.filter(m => (m.attendance || 0) >= 80 && (m.attendance || 0) < 90).length, color: "#f59e0b" },
    { name: "Below Avg (<80%)", value: team.filter(m => (m.attendance || 0) < 80).length, color: "#ef4444" }
  ].filter(b => b.value > 0);

  // Recent Team Activities
  const recentActivities = [
    ...leaves.slice(0, 3).map(l => ({
      text: `${l.name} applied for ${l.days} day(s) of ${l.type} (${l.status})`,
      date: l.appliedOn,
      type: l.status === "Pending" ? "leave_pending" : "leave_action"
    })),
    ...reviews.slice(0, 2).map(r => ({
      text: `Performance review for ${r.employeeName} submitted by ${r.managerName}`,
      date: new Date(r.date).toISOString().split("T")[0],
      type: "review"
    }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const aiSummary = totalTeamMembers > 0
    ? `Your department (${department}) has ${totalTeamMembers} active team members. The average attendance rate is ${teamAttendanceRate}%, and the average performance score is ${averagePerformanceScore === "N/A" ? "N/A" : `${averagePerformanceScore}/100`}. There are currently ${pendingLeavesCount} pending leave request(s) awaiting your action.`
    : "No team members seeded yet in this department.";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="Manager Portal" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Welcome Banner */}
          <div
            className="relative rounded-3xl overflow-hidden p-7 shadow-xl"
            style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#9333ea 100%)" }}
          >
            <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white/90 mb-3">
                  <Sparkles size={11} className="text-yellow-300 animate-pulse" /> {department} Department
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">
                  Good {timeOfDay()}, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-indigo-200 text-sm max-w-lg leading-relaxed">{aiSummary}</p>
              </div>
              <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                {[
                  { label: "Team Members", value: totalTeamMembers },
                  { label: "Pending Leaves", value: pendingLeavesCount },
                  { label: "Dept Avg Score", value: averagePerformanceScore }
                ].map((s) => (
                  <div key={s.label} className="text-center bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 min-w-[80px]">
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-white/60 text-[11px] font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: "Total Team Members",
                    value: totalTeamMembers,
                    sub: "Active in department",
                    icon: <Users size={22} />,
                    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  },
                  {
                    label: "Team Attendance Rate",
                    value: `${teamAttendanceRate}%`,
                    sub: "Month-to-date ratio",
                    icon: <Clock size={22} />,
                    gradient: "linear-gradient(135deg,#10b981,#059669)"
                  },
                  {
                    label: "Pending Leaves",
                    value: pendingLeavesCount,
                    sub: "Awaiting approval",
                    icon: <Calendar size={22} />,
                    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)"
                  },
                  {
                    label: "Avg Performance Score",
                    value: averagePerformanceScore === "N/A" ? "N/A" : `${averagePerformanceScore}/100`,
                    sub: "Based on Q2 reviews",
                    icon: <Award size={22} />,
                    gradient: "linear-gradient(135deg,#8b5cf6,#a855f7)"
                  }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md"
                      style={{ background: kpi.gradient }}
                    >
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                      <p className="text-3xl font-extrabold text-gray-900 mt-1">{kpi.value}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{kpi.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Visual Performance Chart */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-150 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Team Performance Scores</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Overall ratings for active team members</p>
                    </div>
                    <Link
                      to="/manager-performance"
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 bg-indigo-50 rounded-xl hover:bg-indigo-100"
                    >
                      Reviews Portal <ArrowUpRight size={13} />
                    </Link>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", background: "#1f2937", border: "none", color: "#fff", fontSize: "11px" }}
                      />
                      <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance Distribution Chart */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">Attendance Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-4">Team distribution by attendance rate</p>
                  </div>
                  <div className="flex justify-center mb-4">
                    {attendanceBins.length === 0 ? (
                      <p className="text-xs text-gray-400">No data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={attendanceBins}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {attendanceBins.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    {attendanceBins.map((bin, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bin.color }} />
                          <span className="font-semibold text-gray-600">{bin.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{bin.value} {bin.value === 1 ? 'member' : 'members'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second row: Leaves approval teaser & Activities feed */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Activities Feed */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-base mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" />
                    Team Activity Feed
                  </h3>
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">No recent team activity logged.</div>
                  ) : (
                    <div className="relative border-l border-gray-100 pl-4 space-y-6 ml-2 text-xs">
                      {recentActivities.map((act, idx) => {
                        let dotColor = "bg-indigo-500 ring-indigo-50";
                        if (act.type === "leave_pending") dotColor = "bg-amber-500 ring-amber-50";
                        if (act.type === "leave_action") dotColor = "bg-emerald-500 ring-emerald-50";

                        return (
                          <div key={idx} className="relative">
                            <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-white ring-4 ${dotColor}`} />
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-gray-800 leading-normal">{act.text}</p>
                              <span className="text-[10px] text-gray-400 font-semibold shrink-0 ml-4">{act.date}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Leaves quick check card */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-2">Pending Leaves</h3>
                    <p className="text-xs text-gray-400 mb-4">Urgent requests waiting review</p>
                  </div>
                  {pendingLeavesCount === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center">
                      <CheckCircle className="text-emerald-500 w-10 h-10 mb-2" />
                      <p className="font-bold text-gray-800 text-sm">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">No pending leave requests.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leaves.filter(l => l.status === "Pending").slice(0, 2).map((l, i) => (
                        <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-900">{l.name}</p>
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase">{l.type}</span>
                          </div>
                          <p className="text-gray-500 line-clamp-1 italic">"{l.reason}"</p>
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                            <span>Duration: {l.days} day(s)</span>
                            <span>Starts: {l.startDate}</span>
                          </div>
                        </div>
                      ))}
                      <Link
                        to="/manager-leaves"
                        className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Manage Leaves ({pendingLeavesCount})
                      </Link>
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
