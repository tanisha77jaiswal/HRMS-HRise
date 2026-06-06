import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  TrendingUp,
  Award,
  Users,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Star,
  Activity,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [selectedSection, setSelectedSection] = useState("all"); // all, recruitment, ai, employee
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminDashboard.get();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();

    const handleRefresh = () => {
      fetchAnalyticsData();
    };

    window.addEventListener("hrise_dashboard_refresh", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      window.removeEventListener("hrise_dashboard_refresh", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  // Compute Recruitment Pipeline Stats
  const recruitmentStats = useMemo(() => {
    if (!data?.recruitmentStats) return [];
    const { total, shortlisted, interviewed, hired } = data.recruitmentStats;
    return [
      { label: "Total Applications", value: total.toString(), icon: <Users size={20} />, color: "text-indigo-650 bg-indigo-50" },
      { label: "Shortlisted", value: shortlisted.toString(), icon: <Layers size={20} />, color: "text-purple-650 bg-purple-50" },
      { label: "Interviewed", value: interviewed.toString(), icon: <Activity size={20} />, color: "text-amber-650 bg-amber-50" },
      { label: "Selected / Hired", value: hired.toString(), icon: <CheckCircle2 size={20} />, color: "text-emerald-650 bg-emerald-50" },
    ];
  }, [data]);

  // Compute Pie Chart data
  const pieRecruitment = data?.pieRecruitment || [];

  // Compute AI Skills in candidate pool
  const aiSkills = data?.aiSkills || [];

  // Compute average scores
  const avgScores = useMemo(() => {
    return {
      avgResume: data?.performance?.avgResumeScore || 0,
      avgInterview: data?.performance?.avgInterviewScore || 0
    };
  }, [data]);

  // Compute average attendance
  const overallAttendance = data?.attendance?.overallRate || "0.0%";

  // Compute overall company performance
  const overallPerformance = data?.performance?.overallScore || "0.0 / 100";

  // Compute Headcount Growth over months (Jan - Jun)
  const growthData = data?.growthData || [];

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Sidebar role="management_admin" />
        <div className="lg:ml-64">
          <Header title="Analytics" />
          <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-500 mt-4">Loading fresh analytics diagnostics...</p>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Sidebar role="management_admin" />
        <div className="lg:ml-64">
          <Header title="Analytics" />
          <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-red-650 mb-3">{error}</p>
              <button
                onClick={fetchAnalyticsData}
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
        <Header title="Analytics" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <TrendingUp size={18} className="text-white" />
                </span>
                Corporate Analytics Hub
              </h1>
              <p className="text-gray-500 mt-1">
                Workspace diagnostics: recruitment conversion rates, AI assessment metrics, and departmental growth trends.
              </p>
            </div>

            {/* Quick Toggle Sections */}
            <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-gray-150 shadow-sm shrink-0">
              {[
                { id: "all", label: "All Diagnostics" },
                { id: "recruitment", label: "Recruitment" },
                { id: "ai", label: "AI Screening" },
                { id: "employee", label: "Employees" },
              ].map((sect) => (
                <button
                  key={sect.id}
                  onClick={() => setSelectedSection(sect.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedSection === sect.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {sect.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: RECRUITMENT ANALYTICS */}
          {(selectedSection === "all" || selectedSection === "recruitment") && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Layers className="text-indigo-600" size={18} />
                  1. Recruitment & Pipeline Analytics
                </h2>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {recruitmentStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${stat.color} shrink-0`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900 mt-0.5 leading-none">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Funnel Donut Chart */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 flex justify-center">
                  {pieRecruitment.reduce((sum, item) => sum + (item.value || 0), 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[240px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <PieChartIcon size={32} className="opacity-20" />
                      <span className="text-sm font-bold">No Data Available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={pieRecruitment}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieRecruitment.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} Applicants`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Conversion Stage Breakdown</h3>
                    <p className="text-xs text-gray-400">Proportional representation of candidate outcomes</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {pieRecruitment.map((item) => (
                      <div key={item.name} className="flex items-start gap-2.5 p-2 bg-gray-50 rounded-xl">
                        <span className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className="text-xs font-bold text-gray-700">{item.name}</p>
                          <p className="text-sm font-extrabold text-gray-900">{item.value} Candidates</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: AI ANALYTICS */}
          {(selectedSection === "all" || selectedSection === "ai") && (
            <div className="space-y-6 pt-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={18} />
                  2. AI Assessment & Resume Screening Analytics
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Gauges Card */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">
                  <h3 className="font-extrabold text-gray-900 text-sm mb-4">Average Screening Ratings</h3>
                  
                  {/* Gauge 1: Resume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-650">
                      <span>AVERAGE RESUME SCORE</span>
                      <span className="text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">{avgScores.avgResume} / 100</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" style={{ width: `${avgScores.avgResume}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400">Based on parsed skills, credentials, and work history matches.</p>
                  </div>

                  {/* Gauge 2: Interview */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-650">
                      <span>AVERAGE INTERVIEW SCORE</span>
                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{avgScores.avgInterview} / 100</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${avgScores.avgInterview}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400">Derived from AI sentiment audits, response analysis, and speaking metrics.</p>
                  </div>
                </div>

                {/* Top Skills Pool Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm">Top Skills in Candidate Pool</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Frequency count of requested technologies on resumes</p>
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                      Top 6 Skills
                    </span>
                  </div>

                  {aiSkills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <Sparkles size={32} className="opacity-20" />
                      <span className="text-sm font-bold">No Data Available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={aiSkills} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                        <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="skill" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={80} />
                        <Tooltip formatter={(v) => [`${v} Resumes`]} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: EMPLOYEE ANALYTICS */}
          {(selectedSection === "all" || selectedSection === "employee") && (
            <div className="space-y-6 pt-4">
              <div className="border-b border-gray-200 pb-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Award className="text-emerald-600" size={18} />
                  3. Corporate Employee & Growth Analytics
                </h2>
              </div>

              {/* Top Overview Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Attendance */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Company Attendance</p>
                    <p className="text-3xl font-black text-emerald-600 leading-none">{overallAttendance}</p>
                    <p className="text-xs text-gray-500 font-medium">Avg presence rate for current period</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 font-bold text-sm">{overallAttendance}</span>
                  </div>
                </div>

                {/* Overall Performance */}
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Company Performance</p>
                    <p className="text-3xl font-black text-indigo-600 leading-none">{overallPerformance}</p>
                    <p className="text-xs text-gray-500 font-medium">Average performance evaluation score</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-indigo-600 font-bold text-sm">{data?.performance?.avgInterviewScore || 0}</span>
                  </div>
                </div>
              </div>

              {/* Headcount Line Chart */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Department Headcount Growth</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Timeline track of department headcount size over months</p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                    H1 Growth
                  </span>
                </div>

                {(!growthData || growthData.length === 0 || growthData.every(m => !m.Engineering && !m.Product && !m.Design && !m.Sales && !m.HR)) ? (
                  <div className="flex flex-col items-center justify-center h-[280px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <TrendingUp size={32} className="opacity-20" />
                    <span className="text-sm font-bold">No Data Available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={growthData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", background: "#1f2937", color: "#fff", fontSize: "12px" }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                      <Line type="monotone" dataKey="Engineering" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Product" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Design" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="HR" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
