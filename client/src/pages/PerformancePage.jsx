import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  Award,
  TrendingUp,
  Star,
  Users,
  Crown,
  Medal,
  BarChart2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Loader2,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStars(score) {
  if (score >= 92) return 5;
  if (score >= 83) return 4;
  if (score >= 72) return 3;
  if (score >= 60) return 2;
  return 1;
}

function StarRating({ score }) {
  const stars = getStars(score);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= stars ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 flex-shrink-0">
        <Crown size={18} className="text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md flex-shrink-0">
        <Medal size={18} className="text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0">
        <Award size={18} className="text-white" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-extrabold text-gray-500">#{rank}</span>
    </div>
  );
}

function ScoreBadgeColor(score) {
  if (score >= 90) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (score >= 75) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-red-600 bg-red-50 border-red-100";
}

function ProgressBarColor(score) {
  if (score >= 90) return "bg-gradient-to-r from-emerald-400 to-emerald-500";
  if (score >= 75) return "bg-gradient-to-r from-indigo-400 to-indigo-600";
  if (score >= 60) return "bg-gradient-to-r from-amber-400 to-amber-500";
  return "bg-gradient-to-r from-red-400 to-red-500";
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Scheduled: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Overdue:   "bg-red-50 text-red-700 border border-red-200",
  };
  const dots = {
    Completed: "bg-emerald-500",
    Scheduled: "bg-indigo-500",
    Overdue:   "bg-red-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[status] || ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || "bg-gray-400"}`} />
      {status}
    </span>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white rounded-xl px-4 py-2.5 shadow-xl text-xs font-semibold">
        <p className="text-gray-300 mb-1">{label}</p>
        <p className="text-white text-base font-extrabold">{payload[0].value}<span className="text-gray-400 text-xs ml-1">/ 100</span></p>
      </div>
    );
  }
  return null;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q2 2026");
  const [quarterOpen, setQuarterOpen] = useState(false);
  const quarters = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2025"];

  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.performance.get();
        if (active && res) {
          setPerformanceData(res);
        }
      } catch (e) {
        console.error("Failed to load performance data:", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const data = performanceData?.[selectedQuarter] || {
    averageScore: 0,
    topPerformers: 0,
    employeesReviewed: 0,
    distribution: [],
    tableData: []
  };

  const totalEmployees = (data.distribution || []).reduce((sum, d) => sum + d.count, 0);

  const radialData = (data.distribution || []).map((d) => ({
    name: d.band,
    value: totalEmployees ? Math.round((d.count / totalEmployees) * 100) : 0,
    fill: d.color,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="management_admin" />
      <div className="lg:ml-64">
        <Header title="Performance" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-500 animate-pulse">Loading performance data...</p>
            </div>
          ) : (
            <>

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <BarChart2 size={17} className="text-white" />
                </span>
                Performance Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Track employee performance scores, rankings & review schedules.
              </p>
            </div>

            {/* Quarter Selector */}
            <div className="relative">
              <button
                onClick={() => setQuarterOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200"
              >
                <Target size={15} className="text-indigo-500" />
                {selectedQuarter}
                <ChevronDown
                  size={15}
                  className={`text-gray-400 transition-transform duration-200 ${quarterOpen ? "rotate-180" : ""}`}
                />
              </button>
              {quarterOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  {quarters.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setSelectedQuarter(q); setQuarterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-50 hover:text-indigo-700 ${
                        q === selectedQuarter ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Average Performance Score",
                value: `${data.averageScore !== undefined ? data.averageScore : 0}/100`,
                sub: "out of 100",
                icon: <TrendingUp size={22} />,
                gradient: "from-indigo-500 to-purple-600",
                shadow: "shadow-indigo-200",
                chip: "bg-indigo-50 text-indigo-700 border-indigo-100",
              },
              {
                label: "Top Performers",
                value: data.topPerformers !== undefined ? data.topPerformers : 0,
                sub: "score ≥ 90 this quarter",
                icon: <Zap size={22} />,
                gradient: "from-emerald-400 to-teal-500",
                shadow: "shadow-emerald-200",
                chip: "bg-emerald-50 text-emerald-700 border-emerald-100",
              },
              {
                label: "Employees Reviewed",
                value: data.employeesReviewed !== undefined ? data.employeesReviewed : 0,
                sub: "distinct employee count",
                icon: <Users size={22} />,
                gradient: "from-orange-400 to-red-500",
                shadow: "shadow-red-200",
                chip: "bg-red-50 text-red-700 border-red-100",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}
                >
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <p className="text-3xl font-extrabold text-gray-900 leading-none">{card.value}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${card.chip}`}>{card.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Content Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left: Distribution Chart ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col xl:col-span-1">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" />
                  Performance Distribution
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Employees per performance band</p>
              </div>

              {/* Radial Chart */}
              <div className="px-4 pt-2">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="25%"
                    outerRadius="90%"
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={5}
                      dataKey="value"
                      cornerRadius={6}
                      background={{ fill: "#f3f4f6" }}
                    />
                    <Legend
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "11px", fontWeight: "600" }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Share"]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        background: "#1f2937",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              {/* Band Bars */}
              <div className="p-6 pt-2 space-y-3 flex-1">
                {(data.distribution || []).map((d) => (
                  <div key={d.band}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-xs font-bold text-gray-700">{d.band}</span>
                        <span className="text-xs text-gray-400">({d.range})</span>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900">{d.count} <span className="font-normal text-gray-400">emp</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(d.count / (totalEmployees || 1)) * 100}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 font-medium pt-2 text-right">
                  Total: <span className="font-extrabold text-gray-600">{totalEmployees} employees</span>
                </p>
              </div>
            </div>

            {/* ── Right: Employee Performance Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow xl:col-span-2 flex flex-col">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Award size={16} className="text-indigo-600" />
                    Employee Performance Evaluations
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Primary evaluations for the selected quarter</p>
                </div>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full">
                  {selectedQuarter}
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-3.5">Employee Name</th>
                      <th className="px-6 py-3.5">Reporting Manager</th>
                      <th className="px-6 py-3.5">Review Score</th>
                      <th className="px-6 py-3.5">Quarter</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Review Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(!data.tableData || data.tableData.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-semibold">
                          No performance evaluations recorded for this quarter.
                        </td>
                      </tr>
                    ) : (
                      data.tableData.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{row.employeeName}</td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">{row.managerName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-xs font-extrabold ${ScoreBadgeColor(row.score)}`}>
                              {row.score}/100
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-semibold">{row.quarter}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                              row.status === "Excellent" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              row.status === "Good" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                              row.status === "Average" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                row.status === "Excellent" ? "bg-emerald-500" :
                                row.status === "Good" ? "bg-indigo-500" :
                                row.status === "Average" ? "bg-amber-500" :
                                "bg-red-500"
                              }`} />
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-semibold">{row.reviewDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

            </>
          )}
        </main>
      </div>
    </div>
  );
}
