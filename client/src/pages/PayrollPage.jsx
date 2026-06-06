import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import {
  DollarSign,
  Users,
  Clock,
  Download,
  FileText,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  TrendingUp,
  Play,
  Filter,
} from "lucide-react";
// ─── Helper Functions ─────────────────────────────────────────────────────────
const totalCTC  = (emp) => (emp.base + emp.bonus) * 12;
const netPay    = (emp) => Math.round(emp.base + emp.bonus - pf(emp) - pt() - tds(emp));
const pf        = (emp) => Math.round(emp.base * 0.12);
const pt        = ()    => 200;
const tds       = (emp) => Math.round(emp.base * 0.05);
const hra       = (emp) => Math.round(emp.base * 0.40);
const da        = (emp) => Math.round(emp.base * 0.10);
const specialAllowance = (emp) => Math.round(emp.base * 0.15);
const grossSalary      = (emp) => emp.base + hra(emp) + da(emp) + specialAllowance(emp) + emp.bonus;
const totalDeductions  = (emp) => pf(emp) + pt() + tds(emp);

const fmt = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const STATUS_STYLES = {
  Paid:       { badge: "bg-emerald-100 text-emerald-700 ring-emerald-300",  dot: "bg-emerald-500" },
  Pending:    { badge: "bg-amber-100  text-amber-700  ring-amber-300",      dot: "bg-amber-500"   },
  Processing: { badge: "bg-blue-100   text-blue-700   ring-blue-300",       dot: "bg-blue-500"    },
};

// ─── Payslip Modal ────────────────────────────────────────────────────────────
function PayslipModal({ emp, onClose }) {
  if (!emp) return null;
  const month = "May 2026";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-8 py-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="text-indigo-200" size={20} />
              <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">HRise Technologies Pvt. Ltd.</span>
            </div>
            <h2 className="text-white text-2xl font-bold">Salary Payslip</h2>
            <p className="text-indigo-200 text-sm mt-0.5">Pay Period: {month}</p>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {[
              ["Employee Name", emp.name],
              ["Designation",  emp.designation],
              ["Department",   emp.department],
              ["Employee ID",  `EMP${String(emp.id).padStart(4, "0")}`],
              ["PAN",          "ABCDE1234F"],
              ["Bank Account", "XXXX XXXX 8910"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" /> Earnings
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-emerald-50 text-emerald-700">
                    <th className="text-left py-2 px-3 rounded-l-lg font-medium">Component</th>
                    <th className="text-right py-2 px-3 rounded-r-lg font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Basic Salary",        fmt(emp.base)],
                    ["HRA",                 fmt(hra(emp))],
                    ["Dearness Allowance",  fmt(da(emp))],
                    ["Special Allowance",   fmt(specialAllowance(emp))],
                    ["Performance Bonus",   fmt(emp.bonus)],
                  ].map(([comp, amt]) => (
                    <tr key={comp} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">{comp}</td>
                      <td className="py-2 px-3 text-right text-gray-800 font-medium">{amt}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 font-semibold text-emerald-700">
                    <td className="py-2 px-3 rounded-l-lg">Gross Salary</td>
                    <td className="py-2 px-3 rounded-r-lg text-right">{fmt(grossSalary(emp))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-red-400" /> Deductions
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50 text-red-700">
                    <th className="text-left py-2 px-3 rounded-l-lg font-medium">Component</th>
                    <th className="text-right py-2 px-3 rounded-r-lg font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Provident Fund (12%)", fmt(pf(emp))],
                    ["Professional Tax",     fmt(pt())],
                    ["TDS (5%)",             fmt(tds(emp))],
                  ].map(([comp, amt]) => (
                    <tr key={comp} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">{comp}</td>
                      <td className="py-2 px-3 text-right text-gray-800 font-medium">{amt}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50 font-semibold text-red-600">
                    <td className="py-2 px-3 rounded-l-lg">Total Deductions</td>
                    <td className="py-2 px-3 rounded-r-lg text-right">{fmt(totalDeductions(emp))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Net Pay Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Net Pay (Take Home)</p>
              <p className="text-white text-3xl font-bold mt-0.5">{fmt(netPay(emp))}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <CreditCard className="text-white" size={28} />
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400">
            This is a system-generated payslip and does not require a signature. · HRise Technologies Pvt. Ltd.
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={() => alert("Downloading payslip PDF…")}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-slide-up">
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const [search,      setSearch]      = useState("");
  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem("hrise_payroll_data");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("hrise_payroll_data");
        if (saved) setEmployees(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener("storage", handleUpdate);
    return () => window.removeEventListener("storage", handleUpdate);
  }, []);

  const handleRunPayroll = async () => {
    try {
      const res = await api.payroll.run();
      if (res && res.records) {
        setEmployees(res.records);
        localStorage.setItem("hrise_payroll_data", JSON.stringify(res.records));
        showToast("Payroll processed successfully for all employees.");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to run payroll. Server error.");
    }
  };

  // Sync with URL query parameter search on mount
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "All" || e.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [employees, search, filterStatus]);

  const paidCount    = employees.filter((e) => e.status === "Paid").length;
  const pendingCount = employees.filter((e) => e.status === "Pending" || e.status === "Processing").length;
  
  const totalPayoutVal = employees
    .filter(e => e.status === "Paid")
    .reduce((sum, e) => sum + e.base + e.bonus, 0);

  const SUMMARY_CARDS = [
    {
      title: "Total Payout This Month",
      value: fmt(totalPayoutVal),
      sub: "For May 2026",
      icon: DollarSign,
      gradient: "from-indigo-500 to-violet-600",
      bg: "from-indigo-50 to-violet-50",
      border: "border-indigo-100",
      text: "text-indigo-700",
    },
    {
      title: "Employees Paid",
      value: `${paidCount} / ${employees.length}`,
      sub: `${employees.length > 0 ? Math.round((paidCount / employees.length) * 100) : 0}% processed`,
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-100",
      text: "text-emerald-700",
    },
    {
      title: "Pending Payroll",
      value: `${pendingCount} employees`,
      sub: "Awaiting processing",
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bg: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      text: "text-amber-700",
    },
  ];

  const STATUS_FILTERS = ["All", "Paid", "Pending", "Processing"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="management_admin" />

      <div className="lg:ml-64">
        <Header title="Payroll" searchQuery={search} onSearchChange={setSearch} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8">

          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200`}
                >
                  <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-xl shadow-md`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.text} mt-0.5`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Table Card ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Filter size={13} className="text-gray-400 ml-1" />
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        filterStatus === f
                          ? "bg-white text-indigo-700 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 shrink-0">
                <button
                  onClick={() => alert("Exporting payroll data…")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download size={15} /> Export
                </button>
                <button
                  onClick={handleRunPayroll}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Play size={15} /> Run Payroll
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Employee", "Designation", "Department", "Base Salary", "Bonus", "Total CTC (PA)", "Net Pay", "Status", "Action"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-gray-400 text-sm">
                        No employees match your filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp) => {
                      const style = STATUS_STYLES[emp.status];
                      return (
                        <tr
                          key={emp._id || emp.id}
                          className="hover:bg-indigo-50/40 transition-colors duration-100 group"
                        >
                          {/* Employee */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-medium text-gray-800 whitespace-nowrap">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{emp.designation}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium whitespace-nowrap">
                              {emp.department}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{fmt(emp.base)}</td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{fmt(emp.bonus)}</td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{fmt(totalCTC(emp))}</td>
                          <td className="px-5 py-3.5 font-semibold text-indigo-700 whitespace-nowrap">{fmt(netPay(emp))}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${style.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => setSelectedEmp(emp)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors group-hover:shadow-sm"
                            >
                              <FileText size={13} /> View Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filtered.length} of {employees.length} employees</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> {paidCount} paid ·{" "}
                <Clock size={12} className="text-amber-500 ml-1" /> {pendingCount} pending/processing
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* ── Payslip Modal ───────────────────────────────────────────────────── */}
      {selectedEmp && (
        <PayslipModal emp={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── Global animation styles ─────────────────────────────────────────── */}
      <style>{`
        @keyframes fade-in  { from { opacity: 0; }              to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in  { animation: fade-in  0.2s ease; }
        .animate-slide-up { animation: slide-up 0.3s ease; }
      `}</style>
    </div>
  );
}
