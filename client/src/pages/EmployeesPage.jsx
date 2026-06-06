import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  User,
  Mail,
  Building2,
  Calendar,
  Search,
  X,
  ChevronRight,
  Users,
  Briefcase,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Shield,
  Eye,
  MoreHorizontal,
} from "lucide-react";
const DEPARTMENTS = [
  "All",
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "HR",
  "Finance",
  "Operations",
];

const DEPT_CONFIG = {
  Engineering: {
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-500",
    ring: "ring-indigo-200",
  },
  Product: {
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
    badge: "bg-purple-100 text-purple-700",
    bar: "bg-purple-500",
    ring: "ring-purple-200",
  },
  Design: {
    color: "pink",
    gradient: "from-pink-500 to-pink-600",
    badge: "bg-pink-100 text-pink-700",
    bar: "bg-pink-500",
    ring: "ring-pink-200",
  },
  Sales: {
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  HR: {
    color: "orange",
    gradient: "from-orange-500 to-orange-600",
    badge: "bg-orange-100 text-orange-700",
    bar: "bg-orange-500",
    ring: "ring-orange-200",
  },
  Finance: {
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
    ring: "ring-blue-200",
  },
  Operations: {
    color: "teal",
    gradient: "from-teal-500 to-teal-600",
    badge: "bg-teal-100 text-teal-700",
    bar: "bg-teal-500",
    ring: "ring-teal-200",
  },
};

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Employee Card ────────────────────────────────────────────────────────────
function EmployeeCard({ employee, onClick }) {
  const cfg = DEPT_CONFIG[employee.department] || DEPT_CONFIG.Engineering;

  return (
    <div
      onClick={() => onClick(employee)}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 cursor-pointer
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center
              text-white font-bold text-sm shadow-md ring-4 ${cfg.ring} flex-shrink-0`}
          >
            {getInitials(employee.name)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-indigo-600 transition-colors">
              {employee.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">
              {employee.designation}
            </p>
          </div>
        </div>
        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
            employee.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              employee.status === "active" ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          {employee.status === "active" ? "Active" : "On Leave"}
        </span>
      </div>

      {/* Dept badge */}
      <span
        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.badge} mb-3`}
      >
        {employee.department}
      </span>

      {/* Info rows */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Joined {formatDate(employee.joinDate)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            Attendance:{" "}
            <span
              className={`font-semibold ${
                employee.attendance >= 95
                  ? "text-green-600"
                  : employee.attendance >= 85
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {employee.attendance}%
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(employee);
            }}
            className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Employee Detail Modal ────────────────────────────────────────────────────
function EmployeeModal({ employee, onClose }) {
  if (!employee) return null;
  const cfg = DEPT_CONFIG[employee.department] || DEPT_CONFIG.Engineering;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient banner */}
        <div className={`h-28 bg-gradient-to-r ${cfg.gradient} rounded-t-3xl relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar overlapping banner */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center
                text-white font-bold text-2xl shadow-xl ring-4 ring-white flex-shrink-0`}
            >
              {getInitials(employee.name)}
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-sm text-gray-500">{employee.designation}</p>
            </div>
          </div>

          {/* Status + dept */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
              {employee.department}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                employee.status === "active"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  employee.status === "active" ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              {employee.status === "active" ? "Active" : "On Leave"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                employee.attendance >= 95
                  ? "bg-green-50 text-green-700"
                  : employee.attendance >= 85
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              {employee.attendance}% Attendance
            </span>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: Shield, label: "Employee ID", value: employee.employeeId },
              { icon: Star, label: "Salary Band", value: employee.salaryBand },
              { icon: Users, label: "Manager", value: employee.manager },
              { icon: Calendar, label: "Joined", value: formatDate(employee.joinDate) },
              { icon: Mail, label: "Email", value: employee.email, full: true },
              { icon: Phone, label: "Phone", value: employee.phone },
              { icon: MapPin, label: "Location", value: employee.location },
            ].map(({ icon: Icon, label, value, full }) => (
              <div
                key={label}
                className={`bg-gray-50 rounded-xl p-3 ${full ? "col-span-2" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill) => (
                <span
                  key={skill}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg ${cfg.badge} border border-current border-opacity-20`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Department Breakdown ─────────────────────────────────────────────────────
function DeptBreakdown({ employees }) {
  const deptCounts = useMemo(() => {
    const counts = {};
    employees.forEach((e) => {
      counts[e.department] = (counts[e.department] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  const max = Math.max(...deptCounts.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Department Breakdown</h2>
          <p className="text-xs text-gray-500">Headcount per department</p>
        </div>
      </div>

      <div className="space-y-4">
        {deptCounts.map(({ dept, count }) => {
          const cfg = DEPT_CONFIG[dept] || DEPT_CONFIG.Engineering;
          const pct = Math.round((count / max) * 100);
          return (
            <div key={dept}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${cfg.gradient}`} />
                  <span className="text-sm font-medium text-gray-700">{dept}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {count}{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    ({Math.round((count / employees.length) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cfg.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Employees",
            value: employees.length,
            icon: Users,
            color: "text-indigo-600",
          },
          {
            label: "Active",
            value: employees.filter((e) => e.status === "active").length,
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "On Leave",
            value: employees.filter((e) => e.status === "on_leave").length,
            icon: Calendar,
            color: "text-amber-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [activeDept, setActiveDept] = useState("All");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workforceOverview, setWorkforceOverview] = useState({
    averageAttendance: 100,
    departmentCount: 0,
    employeesOnLeaveToday: 0,
    newEmployeesThisYear: 0,
    salaryBandDistribution: {}
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.staff.getAll();
      if (Array.isArray(data)) {
        const formatted = data.map((e, idx) => ({
          id: e._id || e.id || idx,
          name: e.name || "Anonymous",
          email: e.email || "—",
          designation: e.designation || (e.role === "management_admin" ? "Management Admin" : e.role === "recruiter" ? "HR Recruiter" : "Software Engineer"),
          department: e.department || "Engineering",
          joinDate: e.joinDate || e.dateJoined || (e.createdAt ? e.createdAt.split("T")[0] : "2026-05-20"),
          employeeId: e.employeeId || e.id || `EMP-${100 + idx}`,
          salaryBand: e.salaryBand || "N/A",
          manager: e.manager || "—",
          skills: e.skills || [],
          attendance: e.attendance || 100,
          status: e.status || "active",
          phone: e.phone || "—",
          location: e.location || "—"
        }));
        setEmployees(formatted);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Failed to load staff profiles:", err);
      setError(err.message || "Failed to load employee database records.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkforceOverview = async () => {
    try {
      const data = await api.staff.getWorkforceOverview();
      if (data) {
        setWorkforceOverview({
          averageAttendance: data.averageAttendance ?? 100,
          departmentCount: data.departmentCount ?? 0,
          employeesOnLeaveToday: data.employeesOnLeaveToday ?? 0,
          newEmployeesThisYear: data.newEmployeesThisYear ?? 0,
          salaryBandDistribution: data.salaryBandDistribution ?? {}
        });
      }
    } catch (err) {
      console.error("Failed to load workforce overview metrics:", err);
    }
  };

  const loadData = () => {
    loadEmployees();
    loadWorkforceOverview();
  };

  // Load staff profiles and overview from backend
  useEffect(() => {
    loadData();

    window.addEventListener("storage", loadData);
    window.addEventListener("hrise_dashboard_refresh", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("hrise_dashboard_refresh", loadData);
    };
  }, []);

  // Sync with URL query parameter search on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchesDept = activeDept === "All" || e.department === activeDept;
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [activeDept, search, employees]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="management_admin" />
      <div className="lg:ml-64">
        <Header title="Employees" searchQuery={search} onSearchChange={setSearch} />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
              <p className="text-xs font-bold text-red-750">Warning: {error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-750 text-xs font-bold uppercase tracking-wider cursor-pointer font-sans"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Top bar: stats ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Employee Directory
                {loading && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading && employees.length === 0 ? "Loading employee list..." : `${filtered.length} of ${employees.length} employees`}
              </p>
            </div>
          </div>

          {/* ── Department filter tabs ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {DEPARTMENTS.map((dept) => {
              const isActive = activeDept === dept;
              const cfg = dept !== "All" ? DEPT_CONFIG[dept] : null;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? cfg
                        ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                        : "bg-gray-900 text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {dept}
                  {dept !== "All" && (
                    <span
                      className={`ml-2 text-xs font-bold ${
                        isActive ? "text-white/80" : "text-gray-400"
                      }`}
                    >
                      {employees.filter((e) => e.department === dept).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Employee Grid ── */}
          {loading && employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-gray-500 mt-3 font-sans">Fetching fresh staff profiles...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <User className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 transition-opacity duration-300 ${loading ? "opacity-70" : "opacity-100"}`}>
              {filtered.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} onClick={setSelectedEmployee} />
              ))}
            </div>
          )}

          {/* ── Department Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeptBreakdown employees={employees} />

            {/* Quick stats card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Workforce Overview</h2>
                  <p className="text-xs text-gray-500">Key metrics at a glance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Avg. Attendance",
                    value: (workforceOverview.averageAttendance ?? 100) + "%",
                    icon: TrendingUp,
                    gradient: "from-green-400 to-emerald-500",
                    sub: "Across all depts",
                  },
                  {
                    label: "Departments",
                    value: workforceOverview.departmentCount ?? 0,
                    icon: Building2,
                    gradient: "from-indigo-400 to-indigo-600",
                    sub: "Active units",
                  },
                  {
                    label: "On Leave Today",
                    value: workforceOverview.employeesOnLeaveToday ?? 0,
                    icon: Calendar,
                    gradient: "from-amber-400 to-orange-500",
                    sub: "Employees absent",
                  },
                  {
                    label: "New This Year",
                    value: workforceOverview.newEmployeesThisYear ?? 0,
                    icon: Users,
                    gradient: "from-pink-400 to-rose-500",
                    sub: "Joined in " + new Date().getFullYear(),
                  },
                ].map(({ label, value, icon: Icon, gradient, sub }) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-gray-50 p-4 flex flex-col gap-3"
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Salary band legend */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Salary Band Distribution
                </p>
                <div className="flex flex-wrap gap-2">
                  {["L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"].map((band) => {
                    const cnt = workforceOverview.salaryBandDistribution?.[band] || 0;
                    if (!cnt) return null;
                    return (
                      <div
                        key={band}
                        className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5"
                      >
                        <span className="text-xs font-bold text-gray-700">{band}</span>
                        <span className="text-xs text-gray-400">×{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Employee Detail Modal ── */}
      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
