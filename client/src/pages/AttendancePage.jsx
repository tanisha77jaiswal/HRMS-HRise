import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Users,
  UserX,
  TrendingUp,
  Search,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const MONTHS = ["June 2026", "May 2026", "April 2026"];

// ─── Helper Components ─────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-md text-white ${gradient}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/70 mb-1">{label}</p>
          <p className="text-4xl font-extrabold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      {/* decorative circle */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
    </div>
  );
}

function AttendanceBadge({ pct }) {
  if (pct >= 90)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 size={11} /> Excellent
      </span>
    );
  if (pct >= 75)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
        <Clock size={11} /> Average
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
      <AlertCircle size={11} /> Poor
    </span>
  );
}

function PctPill({ pct }) {
  const color =
    pct >= 90
      ? "text-emerald-600 bg-emerald-50"
      : pct >= 75
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";
  return (
    <span className={`rounded-lg px-2 py-0.5 text-sm font-bold ${color}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

const avatarColors = [
  "bg-violet-500","bg-indigo-500","bg-sky-500","bg-emerald-500",
  "bg-amber-500","bg-rose-500","bg-pink-500","bg-teal-500",
];

// ─── Custom Tooltip for Chart ──────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Day {label}
        </p>
        <p className="text-lg font-extrabold text-indigo-600">
          {payload[0].value} <span className="text-sm font-medium text-gray-500">present</span>
        </p>
      </div>
    );
  }
  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [monthOpen, setMonthOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({
    records: [],
    absentToday: [],
    trend: [],
    activeEmployeeCount: 0,
    todayPresent: 0,
    todayAbsent: 0,
    attendanceRate: 0,
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.attendance.get({ month: selectedMonth });
      if (data) setAttendanceData(data);
    } catch (e) {
      console.error("Failed to fetch attendance data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const onRefresh = () => fetchAttendance();
    window.addEventListener("hrise_dashboard_refresh", onRefresh);
    return () => window.removeEventListener("hrise_dashboard_refresh", onRefresh);
  }, [selectedMonth]);

  const employees = attendanceData?.records || [];
  const absentToday = attendanceData?.absentToday || [];
  const trendData = attendanceData?.trend || [];

  // Dynamic employee count from API — never hardcoded
  const activeEmployeeCount = attendanceData?.activeEmployeeCount || employees.length || 0;
  const todayPresent = attendanceData?.todayPresent ?? Math.max(0, activeEmployeeCount - absentToday.length);
  const todayAbsent = attendanceData?.todayAbsent ?? absentToday.length;
  const attendanceRate = attendanceData?.attendanceRate ?? (
    activeEmployeeCount > 0 ? parseFloat(((todayPresent / activeEmployeeCount) * 100).toFixed(1)) : 0
  );

  // Dynamic chart Y-axis max — derived from real data, never a fixed constant
  const chartYMax = Math.max(
    activeEmployeeCount,
    ...trendData.map(d => d.present ?? 0),
    10
  );

  // Sync with URL query parameter search on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);

  const filtered = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.dept.toLowerCase().includes(search.toLowerCase())
      ),
    [employees, search]
  );

  const onLeaveCount = employees.filter(e => e.leaves > 0).length;
  const avgAttendancePct = employees.length > 0
    ? (employees.reduce((acc, e) => acc + e.pct, 0) / employees.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="management_admin" />

      <div className="lg:ml-64">
        <Header title="Attendance" searchQuery={search} onSearchChange={setSearch} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8">

          {/* ── Top Controls ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Attendance Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Monitor employee presence and trends</p>
            </div>

            {/* Month Selector */}
            <div className="relative">
              <button
                onClick={() => setMonthOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600"
              >
                <Calendar size={16} className="text-indigo-500" />
                {selectedMonth}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${monthOpen ? "rotate-180" : ""}`}
                />
              </button>
              {monthOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setSelectedMonth(m); setMonthOpen(false); }}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${
                        m === selectedMonth ? "font-semibold text-indigo-600 bg-indigo-50" : "text-gray-700"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              icon={Users}
              label="Present Today"
              value={todayPresent}
              sub={`Out of ${activeEmployeeCount} active employees`}
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
              iconBg="bg-white/20"
            />
            <StatCard
              icon={UserX}
              label="Absent Today"
              value={todayAbsent}
              sub={`${activeEmployeeCount > 0 ? ((todayAbsent / activeEmployeeCount) * 100).toFixed(1) : 0}% of workforce`}
              gradient="bg-gradient-to-br from-rose-500 to-rose-700"
              iconBg="bg-white/20"
            />
            <StatCard
              icon={Calendar}
              label="On Leave"
              value={onLeaveCount}
              sub="Approved leaves"
              gradient="bg-gradient-to-br from-amber-400 to-amber-600"
              iconBg="bg-white/20"
            />
            <StatCard
              icon={TrendingUp}
              label="Attendance Rate"
              value={`${attendanceRate}%`}
              sub={`${todayPresent}/${activeEmployeeCount} present — ${selectedMonth}`}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              iconBg="bg-white/20"
            />
          </div>

          {/* ── Absent Employees Today ── */}
          <div className="rounded-2xl border border-rose-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-rose-50 bg-gradient-to-r from-rose-50 to-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <AlertCircle size={16} className="text-rose-600" />
              </span>
              <div>
                <h3 className="font-bold text-gray-800">Absent Employees Today</h3>
                <p className="text-xs text-gray-500">
                  {absentToday.length} employees did not check in today
                </p>
              </div>
              <span className="ml-auto rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-700">
                {absentToday.length} absent
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
              {absentToday.map((emp, idx) => {
                const avatar = emp.name ? emp.name.split(" ").map(n => n[0]).join("").toUpperCase() : "A";
                return (
                  <div
                    key={emp._id || emp.id}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 transition hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        avatarColors[idx % avatarColors.length]
                      }`}
                    >
                      {avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{emp.name}</p>
                      <p className="truncate text-xs text-gray-500">{emp.dept}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 ring-1 ring-red-250">
                          Absent Today
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {absentToday.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-gray-400">
                  All employees are present today.
                </div>
              )}
            </div>
          </div>

          {/* ── Monthly Attendance Report Table ── */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">Monthly Attendance Report</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedMonth} — {filtered.length} employees</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    {["Employee", "Department", "Days Present", "Days Absent", "Leaves Taken", "Attendance %", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((emp, idx) => (
                    <tr
                      key={emp.id}
                      className="group transition hover:bg-indigo-50/30"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                              avatarColors[idx % avatarColors.length]
                            }`}
                          >
                            {emp.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="font-medium text-gray-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {emp.dept}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-700">{emp.present}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`font-semibold ${
                            emp.absent === 0
                              ? "text-gray-400"
                              : emp.absent >= 5
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {emp.absent}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{emp.leaves}</td>
                      <td className="px-6 py-3.5">
                        <PctPill pct={emp.pct} />
                      </td>
                      <td className="px-6 py-3.5">
                        <AttendanceBadge pct={emp.pct} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                        No employees match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-6 py-3.5 border-t border-gray-100 bg-gray-50/50">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> ≥ 90% Excellent
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 75–89% Average
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> &lt; 75% Poor
              </span>
            </div>
          </div>

          {/* ── Attendance Trend Chart ── */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">30-Day Attendance Trend</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Daily present count — {selectedMonth}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                  {activeEmployeeCount} active employees
                </span>
              </div>
            </div>

            <div className="p-6">
              {!(trendData.length > 0 && trendData.some(d => d.present > 0)) ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Calendar className="w-12 h-12 mb-3 opacity-30 text-indigo-500" />
                  <p className="text-sm font-semibold">No attendance data available for the selected period.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="indigo-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="#f0f0f4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Day of Month",
                        position: "insideBottom",
                        offset: -2,
                        style: { fontSize: 11, fill: "#9ca3af" },
                      }}
                      height={36}
                    />
                    <YAxis
                      domain={[0, chartYMax]}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#indigo-gradient)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: "#6366f1" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
