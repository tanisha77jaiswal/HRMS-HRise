import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  Users,
  UserCheck,
  Briefcase,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Building2,
  PieChart as PieIcon,
  Activity,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminDashboard.get();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleRefresh = () => {
      fetchDashboardData();
    };

    window.addEventListener("hrise_dashboard_refresh", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      window.removeEventListener("hrise_dashboard_refresh", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  const cards = useMemo(() => {
    if (!data?.kpis) return [];
    return [
      { label: "Total Employees", value: data.kpis.employees, icon: <Users size={22} />, gradient: "from-indigo-500 to-indigo-600", border: "border-indigo-100", bg: "bg-indigo-50/40", text: "text-indigo-600" },
      { label: "Candidates Active", value: data.kpis.candidates, icon: <FileText size={22} />, gradient: "from-emerald-500 to-emerald-600", border: "border-emerald-100", bg: "bg-emerald-50/40", text: "text-emerald-600" },
      { label: "HR Recruiters", value: data.kpis.recruiters, icon: <Briefcase size={22} />, gradient: "from-purple-500 to-purple-600", border: "border-purple-100", bg: "bg-purple-50/40", text: "text-purple-600" },
      { label: "Senior Managers", value: data.kpis.managers, icon: <UserCheck size={22} />, gradient: "from-amber-500 to-amber-600", border: "border-amber-100", bg: "bg-amber-50/40", text: "text-amber-600" },
      { label: "Open Job Positions", value: data.kpis.openJobs, icon: <Activity size={22} />, gradient: "from-pink-500 to-pink-600", border: "border-pink-100", bg: "bg-pink-50/40", text: "text-pink-600" },
    ];
  }, [data]);

  const funnelData = data?.funnelData || [];
  const monthlyApps = data?.monthlyApps || [];
  const deptDistribution = data?.deptDistribution || [];
  const attendanceTrend = data?.attendance?.trend || [];

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Sidebar role="management_admin" />
        <div className="lg:ml-64">
          <Header title="Dashboard" />
          <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-500 mt-4">Loading fresh dashboard metrics...</p>
          </main>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Sidebar role="management_admin" />
        <div className="lg:ml-64">
          <Header title="Dashboard" />
          <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-red-650 mb-3">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Retry Fetching
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role="management_admin" />
      <div className="lg:ml-64">
        <Header title="Dashboard" />
        
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-150 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <p className="text-xs font-bold text-red-700">Warning: {error}. Using cached data representation.</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-750 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl p-7 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles size={160} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              <div>
                <h1 className="text-3xl font-extrabold mb-1">Welcome back, Admin 👋</h1>
                <p className="text-indigo-100 text-sm max-w-xl">
                  Here is your corporate workspace overview. Monitor recruitment velocity, employee attendance, and departmental headcount stats.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                  </svg>
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 transition-opacity duration-300 ${loading ? "opacity-70" : "opacity-100"}`}>
            {cards.map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-2xl border ${card.border} p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-sm`}>
                    {card.icon}
                  </div>
                  <span className="text-3xl font-black text-gray-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {card.label}
                </p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-300 ${loading ? "opacity-70" : "opacity-100"}`}>
            
            {/* Chart 1: Hiring Funnel */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Hiring Funnel</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Stage transition analysis of candidate counts</p>
                </div>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                  Real-time
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="stage" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", background: "#1f2937", color: "#fff", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {funnelData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Applications Per Month */}
            <div className="bg-white rounded-2xl border border-gray-155 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Applications Trend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Comparison of incoming vs shortlisted profiles</p>
                </div>
                <span className="text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100">
                  Last 6 Months
                </span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyApps} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", background: "#1f2937", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="apps" name="Total Applications" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="shortlists" name="Shortlists" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Department Distribution */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Department Distribution</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Corporate headcount share by business domain</p>
                </div>
                <span className="text-xs font-bold bg-pink-50 text-pink-700 px-3 py-1 rounded-full border border-pink-100">
                  {deptDistribution.reduce((a, b) => a + b.value, 0)} Total
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-1/2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={deptDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deptDistribution.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} Employees`, "Headcount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600 w-full sm:w-1/2">
                  {deptDistribution.map((dept) => (
                    <div key={dept.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                      <span className="truncate">{dept.name} ({dept.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: Attendance Trend */}
            <div className="bg-white rounded-2xl border border-gray-155 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Attendance Trend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Daily attendance percentage rate</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
                  Last 30 Days
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, "Attendance Rate"]} />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
