import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import {
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ManagerAttendancePage() {
  const [team, setTeam] = useState([]);
  const [attendance, setAttendance] = useState({ records: [], absentToday: [], trend: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const staffList = await api.staff.getAll();
      setTeam(Array.isArray(staffList) ? staffList : []);

      const attData = await api.attendance.get();
      setAttendance(attData || { records: [], absentToday: [], trend: [], activeEmployeeCount: 0, todayPresent: 0, todayAbsent: 0, attendanceRate: 0 });
    } catch (e) {
      console.error("Error fetching attendance data:", e);
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

  // Filter logs
  const filteredRecords = (attendance.records || []).filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          record.dept.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmployee = employeeFilter === "all" || record.name === employeeFilter;
    
    let matchesStatus = true;
    if (statusFilter === "excellent") matchesStatus = record.pct >= 95;
    if (statusFilter === "good") matchesStatus = record.pct >= 90 && record.pct < 95;
    if (statusFilter === "average") matchesStatus = record.pct >= 80 && record.pct < 90;
    if (statusFilter === "below_average") matchesStatus = record.pct < 80;

    return matchesSearch && matchesEmployee && matchesStatus;
  });

  // Calculate statistics using real API-provided counts
  const totalRecords = filteredRecords.length;

  // Use activeEmployeeCount from API (real DB denominator) — never use team.length as denominator
  const activeEmployeeCount = attendance.activeEmployeeCount || team.length || 0;
  const todayPresent = attendance.todayPresent ?? 0;
  const todayAbsent = attendance.todayAbsent ?? 0;
  const overallAttendanceRate = attendance.attendanceRate ?? 0;

  const avgAttendancePct = totalRecords > 0
    ? Math.round(filteredRecords.reduce((sum, r) => sum + r.pct, 0) / totalRecords)
    : 0;

  const totalAbsents = filteredRecords.reduce((sum, r) => sum + r.absent, 0);
  const totalLeaves = filteredRecords.reduce((sum, r) => sum + r.leaves, 0);

  // Chart data: attendance trend (custom mapping of trend model to Recharts format)
  const trendChartData = (attendance.trend || []).map((t) => ({
    day: `Day ${t.day}`,
    Present: t.present,
  }));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="senior_manager" />
      <div className="lg:ml-64">
        <Header title="Attendance Review" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
              <span className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md text-white">
                <Calendar size={18} />
              </span>
              Attendance Review
            </h1>
            <p className="text-gray-500 mt-1">
              Monitor team attendance logs, evaluate monthly trends, and review absentee sheets.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: "Today's Attendance Rate", value: `${overallAttendanceRate}%`, icon: <TrendingUp size={18} />, color: "from-indigo-500 to-purple-600" },
                  { label: "Active Employees", value: activeEmployeeCount, icon: <Inbox size={18} />, color: "from-emerald-500 to-teal-600" },
                  { label: "Absent Today", value: todayAbsent, icon: <AlertCircle size={18} />, color: "from-red-500 to-orange-500" },
                  { label: "Present Today", value: todayPresent, icon: <CheckCircle size={18} />, color: "from-amber-500 to-yellow-500" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm flex items-center gap-4">
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

              {/* Attendance Trend Chart */}
              {trendChartData.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-indigo-600" />
                    Attendance Trend (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "12px", background: "#1f2937", border: "none", color: "#fff" }} />
                      <Area type="monotone" dataKey="Present" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
                <div className="flex-1 relative">
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Employees</option>
                    {team.map((member) => (
                      <option key={member.email} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 outline-none text-xs bg-white font-semibold focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Attendance Rates</option>
                    <option value="excellent">Excellent (≥95%)</option>
                    <option value="good">Good (90-94%)</option>
                    <option value="average">Average (80-89%)</option>
                    <option value="below_average">Below Average (&lt;80%)</option>
                  </select>
                </div>
              </div>

              {/* Table of Records */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Monthly Attendance Summary</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered: {totalRecords} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-3.5">Employee</th>
                        <th className="px-6 py-3.5">Department</th>
                        <th className="px-6 py-3.5">Present Days</th>
                        <th className="px-6 py-3.5">Absent Days</th>
                        <th className="px-6 py-3.5">Leaves Taken</th>
                        <th className="px-6 py-3.5">Attendance Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">No logs matched your criteria.</td>
                        </tr>
                      ) : (
                        filteredRecords.map((record) => {
                          let badgeStyle = "bg-green-50 text-green-700 border-green-200";
                          if (record.pct < 95) badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          if (record.pct < 90) badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                          if (record.pct < 80) badgeStyle = "bg-red-50 text-red-700 border-red-200";

                          return (
                            <tr key={record._id || record.name} className="hover:bg-gray-50/50 transition">
                              <td className="px-6 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shadow-inner">
                                  {record.name.charAt(0)}
                                </div>
                                {record.name}
                              </td>
                              <td className="px-6 py-3.5 text-gray-500 font-medium">{record.dept}</td>
                              <td className="px-6 py-3.5 font-mono">{record.present}</td>
                              <td className="px-6 py-3.5 font-mono text-red-500">{record.absent}</td>
                              <td className="px-6 py-3.5 font-mono text-amber-500">{record.leaves}</td>
                              <td className="px-6 py-3.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badgeStyle}`}>
                                  {record.pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
