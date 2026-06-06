import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
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
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  BarChart3,
  Download,
  Sparkles,
  Filter,
  Calendar,
  FileDown,
  TrendingUp,
  Users,
  UserCheck,
  Percent,
  Layers,
  ArrowUpRight,
  Briefcase
} from "lucide-react";
import { Card, Badge, Button } from "../components/ui";
import { MLAnalyticsPanel } from "../components/HiringPrediction";
import { api } from "../utils/api";

// Helper to robustly parse candidate application date formats
function getDayAndMonth(dateInput) {
  if (!dateInput) return { day: 0, monthIndex: -1, monthName: "" };
  try {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const monthIndex = d.getMonth(); // 0-11
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return { day, monthIndex, monthName: monthNames[monthIndex] };
    }
  } catch (e) {
    console.error("Date parse error", e);
  }
  return { day: 0, monthIndex: -1, monthName: "" };
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("all");
  const [department, setDepartment] = useState("all");

  const role = user?.role || "recruiter";

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [sessions, setSessions] = useState([]);

  const fetchData = async () => {
    try {
      const [candidatesRes, jobsRes, sessionsRes] = await Promise.allSettled([
        api.candidates.getAll(),
        api.jobs.getAll(),
        api.interviews.getAll(),
      ]);
      if (candidatesRes.status === "fulfilled" && Array.isArray(candidatesRes.value)) setCandidates(candidatesRes.value);
      if (jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value)) setJobs(jobsRes.value);
      if (sessionsRes.status === "fulfilled" && Array.isArray(sessionsRes.value)) setSessions(sessionsRes.value);
    } catch (e) {
      console.error("AnalyticsPage fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const onRefresh = () => fetchData();
    window.addEventListener("hrise_dashboard_refresh", onRefresh);
    return () => window.removeEventListener("hrise_dashboard_refresh", onRefresh);
  }, []);

  // 4. Live Filtering Logic
  const today = new Date("2026-06-02"); // Consistent base date matching database records

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // A. Department Filter
      if (department !== "all") {
        const job = jobs.find((j) => j.id === c.jobId);
        if (!job || !job.department || job.department.toLowerCase() !== department.toLowerCase()) {
          return false;
        }
      }

      // B. Date Range Filter
      if (dateRange !== "all" && c.appliedDate) {
        const appDate = new Date(c.appliedDate);
        if (!isNaN(appDate.getTime())) {
          const diffTime = today.getTime() - appDate.getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          if (dateRange === "last-7-days" && diffDays > 7) return false;
          if (dateRange === "last-30-days" && diffDays > 30) return false;
          if (dateRange === "last-90-days" && diffDays > 90) return false;
        }
      }
      return true;
    });
  }, [candidates, jobs, dateRange, department]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // A. Check if associated candidate belongs to our filtered candidates list
      const candidateMatch = filteredCandidates.some((c) => c.id === s.candidateId || c.name === s.candidateName);
      if (!candidateMatch) return false;

      // B. Secondary department check
      if (department !== "all") {
        const job = jobs.find((j) => j.id === s.jobId || j.title.toLowerCase() === s.jobTitle.toLowerCase());
        if (!job || !job.department || job.department.toLowerCase() !== department.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, filteredCandidates, jobs, department]);

  // 5. Reactive KPI Computations
  const totalApplicants = filteredCandidates.length;
  const shortlisted = filteredCandidates.filter((c) => c.status === "shortlisted").length;
  const rejected = filteredCandidates.filter((c) => c.status === "rejected").length;
  const hired = filteredCandidates.filter((c) => c.status === "selected" || c.status === "hired").length;
  const interviewed = filteredSessions.length;

  const total = totalApplicants || 1;
  const shortlistRate = ((shortlisted / total) * 100).toFixed(1);
  const rejectionRate = ((rejected / total) * 100).toFixed(1);
  const hireRate = ((hired / total) * 100).toFixed(1);

  const averageAiScore = filteredCandidates.length > 0 
    ? Math.round(filteredCandidates.reduce((sum, c) => sum + (typeof c.aiScore === 'number' ? c.aiScore : 0), 0) / filteredCandidates.length)
    : 0;

  // 6. Dynamic generative AI summary
  const aiSummary = useMemo(() => {
    if (totalApplicants === 0) {
      return "The active database is currently empty under the selected filters. Change date ranges or clear filters to let the AI dynamically audit and summarize your recruitment metrics.";
    }

    const deptContext = department !== "all" ? `within the **${department.toUpperCase()}** department` : "across all workspace domains";
    const dateContext = dateRange === "last-7-days" ? "over the past week" : dateRange === "last-30-days" ? "over the last 30 days" : "historically";
    
    return `Based on active recruitment parsing, we audited **${totalApplicants} candidates** ${deptContext} ${dateContext}. Our applicants maintain a strong talent metric with an average AI rating of **${averageAiScore}/100**. The pipeline conversion yields a **${shortlistRate}% shortlist conversion efficiency**, with **${hired} final candidates** successfully moved into onboarding. The AI recommends proceeding immediately with the high-scoring (${averageAiScore}+) ML and engineering talent currently in queue.`;
  }, [totalApplicants, averageAiScore, shortlistRate, hired, department, dateRange]);

  // 7. Pipeline Overview Pie Chart
  const pieData = useMemo(() => {
    const data = [
      { name: "Scanned / Screened", value: filteredCandidates.filter((c) => c.status === "screened" || c.status === "applied").length, color: "#6366f1" },
      { name: "Shortlisted", value: shortlisted, color: "#10b981" },
      { name: "Interviewed", value: interviewed, color: "#8b5cf6" },
      { name: "Selected / Hired", value: hired, color: "#06b6d4" },
      { name: "Rejected", value: rejected, color: "#ef4444" },
    ].filter((item) => item.value > 0);

    return data.length > 0 ? data : [{ name: "No Data", value: 1, color: "#e5e7eb" }];
  }, [filteredCandidates, shortlisted, interviewed, hired, rejected]);

  // 8. AI Score Distribution Chart
  const scoreDistribution = useMemo(() => {
    const distribution = [
      { range: "90-100", count: 0, color: "#10b981" },
      { range: "80-89", count: 0, color: "#34d399" },
      { range: "70-79", count: 0, color: "#fbbf24" },
      { range: "60-69", count: 0, color: "#f59e0b" },
      { range: "Under 60", count: 0, color: "#ef4444" },
    ];

    filteredCandidates.forEach((c) => {
      const score = typeof c.aiScore === 'number' ? c.aiScore : 0;
      if (score >= 90) distribution[0].count++;
      else if (score >= 80) distribution[1].count++;
      else if (score >= 70) distribution[2].count++;
      else if (score >= 60) distribution[3].count++;
      else distribution[4].count++;
    });
    return distribution;
  }, [filteredCandidates]);

  // 9. Department Breakdown Table
  const depts = ["Engineering", "Data Science", "AI/ML", "Cloud & Infrastructure", "Cybersecurity", "DevOps", "Product", "Design"];
  const departmentStats = useMemo(() => {
    return depts.map((dept) => {
      const deptJobs = jobs.filter((j) => j && j.department && typeof j.department === 'string' && j.department.toLowerCase() === dept.toLowerCase());
      const openCount = deptJobs.filter((j) => j.status === "open").length;
      
      const deptJobIds = deptJobs.map((j) => j.id);
      const deptCandidates = filteredCandidates.filter((c) => c && c.jobId && deptJobIds.includes(c.jobId));
      const hiredCount = deptCandidates.filter((c) => c.status === "selected" || c.status === "hired").length;
      
      return {
        department: dept,
        open: openCount,
        applied: deptCandidates.length,
        hired: hiredCount
      };
    });
  }, [jobs, filteredCandidates]);

  // 10. Hiring Trends Monthly (Safe & Robust)
  const hiringTrends = useMemo(() => {
    const monthsData = {
      Jan: { month: "Jan", applied: 0, shortlisted: 0, hired: 0 },
      Feb: { month: "Feb", applied: 0, shortlisted: 0, hired: 0 },
      Mar: { month: "Mar", applied: 0, shortlisted: 0, hired: 0 },
      Apr: { month: "Apr", applied: 0, shortlisted: 0, hired: 0 },
      May: { month: "May", applied: 0, shortlisted: 0, hired: 0 },
      Jun: { month: "Jun", applied: 0, shortlisted: 0, hired: 0 },
      Jul: { month: "Jul", applied: 0, shortlisted: 0, hired: 0 },
      Aug: { month: "Aug", applied: 0, shortlisted: 0, hired: 0 },
      Sep: { month: "Sep", applied: 0, shortlisted: 0, hired: 0 },
      Oct: { month: "Oct", applied: 0, shortlisted: 0, hired: 0 },
      Nov: { month: "Nov", applied: 0, shortlisted: 0, hired: 0 },
      Dec: { month: "Dec", applied: 0, shortlisted: 0, hired: 0 },
    };

    filteredCandidates.forEach((c) => {
      const { monthName } = getDayAndMonth(c.appliedDate);
      if (monthName && monthsData[monthName]) {
        monthsData[monthName].applied++;
        if (c.status === "shortlisted") {
          monthsData[monthName].shortlisted++;
        }
        if (c.status === "selected" || c.status === "hired") {
          monthsData[monthName].hired++;
        }
      }
    });

    return Object.values(monthsData);
  }, [filteredCandidates]);

  // 11. Weekly Applications (Safe & Dynamic)
  const weeklyApplications = useMemo(() => {
    const weeks = [
      { week: "Week 1", applications: 0, interviews: 0, offers: 0 },
      { week: "Week 2", applications: 0, interviews: 0, offers: 0 },
      { week: "Week 3", applications: 0, interviews: 0, offers: 0 },
      { week: "Week 4+", applications: 0, interviews: 0, offers: 0 },
    ];

    filteredCandidates.forEach((c) => {
      const { day } = getDayAndMonth(c.appliedDate);
      let weekIdx = 0;
      if (day >= 1 && day <= 7) weekIdx = 0;
      else if (day >= 8 && day <= 14) weekIdx = 1;
      else if (day >= 15 && day <= 21) weekIdx = 2;
      else if (day >= 22 && day <= 31) weekIdx = 3;

      weeks[weekIdx].applications++;
      if (c.status === "selected" || c.status === "hired") {
        weeks[weekIdx].offers++;
      }
    });

    filteredSessions.forEach((s) => {
      const { day } = getDayAndMonth(s.createdAt || s.scheduledDate);
      let weekIdx = 0;
      if (day >= 1 && day <= 7) weekIdx = 0;
      else if (day >= 8 && day <= 14) weekIdx = 1;
      else if (day >= 15 && day <= 21) weekIdx = 2;
      else if (day >= 22 && day <= 31) weekIdx = 3;

      weeks[weekIdx].interviews++;
    });

    return weeks;
  }, [filteredCandidates, filteredSessions]);

  // CSV Report Generator (Based on Live Filters)
  const handleExportCSV = () => {
    const headers = ["Stage", "Total Candidates", "Percentage (%)"];
    const rows = [
      ["Screened / Screened", filteredCandidates.filter((c) => c.status === "screened" || c.status === "applied").length, `${totalApplicants ? Math.round((filteredCandidates.filter((c) => c.status === "screened" || c.status === "applied").length / total) * 100) : 0}%`],
      ["Shortlisted", shortlisted, `${totalApplicants ? Math.round((shortlisted / total) * 100) : 0}%`],
      ["Interviewed", interviewed, `${totalApplicants ? Math.round((interviewed / total) * 100) : 0}%`],
      ["Offers / Selected", hired, `${totalApplicants ? Math.round((hired / total) * 100) : 0}%`],
      ["Rejected", rejected, `${totalApplicants ? Math.round((rejected / total) * 100) : 0}%`]
    ];
    
    const csvRows = [headers.join(",")];
    rows.forEach(r => csvRows.push(r.join(",")));
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hrise_analytics_stages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />
      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        <Header title="Hiring Analytics" />
        <main className="p-4 sm:p-6 lg:p-8 flex-1 animate-fade-in space-y-6">
          
          {/* Dashboard Title & Premium Action Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Talent Pipeline Analytics
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Real-time AI-audited performance dashboard and hiring trends.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportCSV} className="rounded-xl border-gray-200 hover:shadow-sm">
                <FileDown size={15} /> Export Dataset
              </Button>
              <Button variant="primary" size="sm" onClick={handleExportPDF} className="rounded-xl shadow-md hover:shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Download size={15} /> Save Report
              </Button>
            </div>
          </div>

          {/* Interactive Filters Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Calendar size={15} className="text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 font-semibold outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Filter size={15} className="text-gray-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 font-semibold outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="data-science">Data Science</option>
                  <option value="ai-ml">AI/ML</option>
                  <option value="cloud-infrastructure">Cloud & Infrastructure</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="devops">DevOps</option>
                  <option value="product">Product</option>
                  <option value="design">Design</option>
                </select>
              </div>
            </div>
            
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Database Connected
            </div>
          </div>

          {/* Premium Glowing KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Audited Applicants",
                value: totalApplicants,
                icon: <Users size={22} />,
                gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                subText: `${dateRange === "all" ? "Historical totals" : "Selected window"}`
              },
              {
                label: "Shortlist Rate",
                value: `${shortlistRate}%`,
                icon: <Percent size={22} />,
                gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                subText: `${shortlisted} shortlisted`
              },
              {
                label: "Average AI Score",
                value: `${averageAiScore}/100`,
                icon: <UserCheck size={22} />,
                gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                subText: "Overall profile grading"
              },
              {
                label: "Conversion Success",
                value: `${hireRate}%`,
                icon: <Layers size={22} />,
                gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                subText: `${hired} hired selections`
              }
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
                  style={{ background: card.gradient }}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1 leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-500 mt-2 font-medium">{card.subText}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Generative AI Smart Summary */}
          <Card className="bg-gradient-to-tr from-indigo-50/40 via-purple-50/30 to-violet-50/40 border border-indigo-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <Sparkles size={120} className="text-indigo-600" />
            </div>
            <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-start gap-4 z-10 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-100">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    AI Hiring Pipeline Assessment
                  </h3>
                  <Badge variant="purple" className="font-bold uppercase tracking-wider text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    Engine V3 Active
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {aiSummary}
                </p>
              </div>
            </div>
          </Card>

          {/* ML Hiring Prediction Analytics */}
          <MLAnalyticsPanel candidates={filteredCandidates} />

          {/* Core Graphical Charts Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Chart A: Hiring Trends */}
            <Card className="p-6 rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Hiring Volume Trends</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Audit of applications, shortlists, and offers.</p>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">Monthly View</Badge>
              </div>
              
                {(!hiringTrends || hiringTrends.length === 0 || hiringTrends.every(m => !m.applied && !m.shortlisted && !m.hired)) ? (
                  <div className="flex flex-col items-center justify-center h-[290px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <BarChart3 size={32} className="opacity-20" />
                    <span className="text-sm font-bold">No Data Available</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={290}>
                    <BarChart data={hiringTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "12px",
                          background: "#1f2937",
                          color: "#fff"
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Bar dataKey="applied" name="Applications" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={35} />
                      <Bar dataKey="shortlisted" name="Shortlists" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={35} />
                      <Bar dataKey="hired" name="Offers Hired" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </Card>

            {/* Chart B: AI Score Distribution */}
            <Card className="p-6 rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">AI Candidate Score Distribution</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Cognitive grading metrics count per score bracket.</p>
                </div>
                <Badge className="bg-purple-50 text-purple-700 font-bold border border-purple-100">AI Grading</Badge>
              </div>

              <ResponsiveContainer width="100%" height={290}>
                {(!scoreDistribution || scoreDistribution.every(s => s.count === 0)) ? (
                  <div className="flex flex-col items-center justify-center h-[290px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Sparkles size={32} className="opacity-20" />
                    <span className="text-sm font-bold">No Data Available</span>
                  </div>
                ) : (
                  <BarChart data={scoreDistribution} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="range" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={70} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                        background: "#1f2937",
                        color: "#fff"
                      }}
                    />
                    <Bar dataKey="count" name="Candidates Count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* Chart C: Pipeline Overview Donut */}
            <Card className="p-6 rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Pipeline Stage Funnel</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Recruit stage segmentation audits.</p>
                </div>
                <Badge className="bg-cyan-50 text-cyan-700 font-bold border border-cyan-100">Audited Stages</Badge>
              </div>

              <ResponsiveContainer width="100%" height={290}>
                {(!pieData || pieData.length === 0 || pieData.every(p => p.value === 0 || p.name === "No Data")) ? (
                  <div className="flex flex-col items-center justify-center h-[290px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Layers size={32} className="opacity-20" />
                    <span className="text-sm font-bold">No Data Available</span>
                  </div>
                ) : (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#e5e7eb"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                        background: "#1f2937",
                        color: "#fff"
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#4b5563" }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* Chart D: Weekly Activity Area */}
            <Card className="p-6 rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Weekly Activity & Velocity</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Funnel velocity (apps vs interviews vs offers).</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">Live Cycle</Badge>
              </div>

              <ResponsiveContainer width="100%" height={290}>
                {(!weeklyApplications || weeklyApplications.length === 0 || weeklyApplications.every(w => w.applications === 0 && w.interviews === 0 && w.offers === 0)) ? (
                  <div className="flex flex-col items-center justify-center h-[290px] text-gray-400 gap-2 w-full bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <TrendingUp size={32} className="opacity-20" />
                    <span className="text-sm font-bold">No Data Available</span>
                  </div>
                ) : (
                  <AreaChart data={weeklyApplications} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOffers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="week" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                        background: "#1f2937",
                        color: "#fff"
                      }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
                    <Area type="monotone" dataKey="interviews" name="Interviews Scheduled" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInts)" />
                    <Area type="monotone" dataKey="offers" name="Offers Extended" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOffers)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </Card>

          </div>

          {/* Department Breakdown Matrix */}
          <Card className="rounded-2xl border-gray-100 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Department Recruitment Matrices</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Core operations, applications volume, and placement conversion rates.</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-xl text-xs font-bold text-gray-500 border border-gray-200">
                  <Briefcase size={13} />
                  {jobs.length} Active Profiles
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-4 py-3 pb-4">Corporate Department</th>
                      <th className="px-4 py-3 pb-4">Open Roles</th>
                      <th className="px-4 py-3 pb-4">Audited Applicants</th>
                      <th className="px-4 py-3 pb-4">hired placement</th>
                      <th className="px-4 py-3 pb-4">conversion success</th>
                      <th className="px-4 py-3 pb-4 text-right">placement trends</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {departmentStats.map((dept) => {
                      const conversion = dept.applied > 0 ? ((dept.hired / dept.applied) * 100).toFixed(1) : "0.0";
                      
                      return (
                        <tr
                          key={dept.department}
                          className="hover:bg-gray-50/80 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-bold text-gray-900">
                            {dept.department}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 rounded-lg px-2 py-0.5">
                              {dept.open} Open
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 font-semibold">
                            {dept.applied} profiles
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 font-semibold">
                            {dept.hired} hires
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 font-bold ${dept.hired > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                              {conversion}%
                              {dept.hired > 0 && <ArrowUpRight size={14} />}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right flex justify-end">
                            <div className="w-20 h-8 opacity-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={hiringTrends.slice(-4)}>
                                  <Line
                                    type="monotone"
                                    dataKey="applied"
                                    stroke={dept.hired > 0 ? "#10b981" : "#8b5cf6"}
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
