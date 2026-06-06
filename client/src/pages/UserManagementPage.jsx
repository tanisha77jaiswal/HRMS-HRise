import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { api } from "../utils/api";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  BarChart3,
  Trash2,
  Edit3,
  X,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

const ROLE_CONFIG = {
  management_admin: {
    label: "Management Admin",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-600",
    icon: <Shield size={14} />,
  },
  recruiter: {
    label: "HR Recruiter",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    dot: "bg-indigo-600",
    icon: <Briefcase size={14} />,
  },
  senior_manager: {
    label: "Senior Manager",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-600",
    icon: <BarChart3 size={14} />,
  },
  employee: {
    label: "Employee",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-600",
    icon: <User size={14} />,
  },
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const role = user?.role || "management_admin";

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [modalRole, setModalRole] = useState("recruiter");
  const [modalDepartment, setModalDepartment] = useState("");
  const [modalDesignation, setModalDesignation] = useState("");
  const [modalStatus, setModalStatus] = useState("active");
  const [modalReportingManagerId, setModalReportingManagerId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch staff on mount and sync URL search param
  useEffect(() => {
    fetchStaff();
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearchQuery(q);
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.userManagement.getAll();
      setStaff(data);
    } catch (e) {
      console.error("Failed to load staff:", e);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (targetUser) => {
    try {
      const newStatus = targetUser.status === "inactive" ? "active" : "inactive";
      await api.userManagement.update(targetUser._id, {
        status: newStatus,
      });
      showToast(`${targetUser.name}'s account has been ${newStatus === "active" ? "enabled" : "disabled"}`);
      fetchStaff();
    } catch (err) {
      showToast(err.message || "Failed to update account status", "error");
    }
  };

  // Filter logic
  const filtered = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const totalStaff = staff.length;
  const recruiterCount = staff.filter((s) => s.role === "recruiter").length;
  const managerCount = staff.filter((s) => s.role === "senior_manager").length;
  const employeeCount = staff.filter((s) => s.role === "employee").length;
  const adminCount = staff.filter((s) => s.role === "management_admin").length;

  // Open modal for create
  const openCreateModal = () => {
    setEditingUser(null);
    setModalName("");
    setModalEmail("");
    setModalPassword("");
    setModalRole("employee");
    setModalDepartment("");
    setModalDesignation("");
    setModalStatus("active");
    setModalReportingManagerId("");
    setModalError("");
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (u) => {
    setEditingUser(u);
    setModalName(u.name);
    setModalEmail(u.email);
    setModalPassword("");
    setModalRole(u.role);
    setModalDepartment(u.department || "");
    setModalDesignation(u.designation || "");
    setModalStatus(u.status || "active");
    setModalReportingManagerId(u.reportingManager?._id || u.reportingManager || "");
    setModalError("");
    setShowModal(true);
  };

  // Submit modal
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError("");

    try {
      if (editingUser) {
        await api.userManagement.update(editingUser._id, {
          name: modalName,
          email: modalEmail,
          role: modalRole,
          department: modalDepartment,
          designation: modalDesignation,
          status: modalStatus,
          reportingManagerId: modalReportingManagerId || null,
        });
        showToast(`${modalName}'s account updated successfully`);
      } else {
        if (!modalPassword) {
          setModalError("Password is required for new accounts.");
          setModalLoading(false);
          return;
        }
        await api.userManagement.create({
          name: modalName,
          email: modalEmail,
          password: modalPassword,
          role: modalRole,
          department: modalDepartment,
          designation: modalDesignation,
          status: modalStatus,
          reportingManagerId: modalReportingManagerId || null,
        });
        showToast(`${modalName} has been invited as ${ROLE_CONFIG[modalRole]?.label || modalRole}`);
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      setModalError(err.message || "Operation failed.");
    } finally {
      setModalLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.userManagement.delete(deleteTarget._id);
      showToast(`${deleteTarget.name}'s account has been removed`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      showToast(err.message || "Failed to delete account", "error");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="User Management" searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
                User Management
              </h1>
              <p className="text-gray-500 mt-1">
                Create and manage staff accounts for your organization.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <UserPlus size={18} />
              Invite Staff Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Staff", value: totalStaff, color: "from-indigo-500 to-purple-500", icon: <Users size={20} /> },
              { label: "Employees", value: employeeCount, color: "from-emerald-500 to-teal-600", icon: <User size={20} /> },
              { label: "Management Admins", value: adminCount, color: "from-violet-500 to-purple-600", icon: <Shield size={20} /> },
              { label: "HR Recruiters", value: recruiterCount, color: "from-blue-500 to-indigo-600", icon: <Briefcase size={20} /> },
              { label: "Senior Managers", value: managerCount, color: "from-amber-500 to-orange-600", icon: <BarChart3 size={20} /> },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}
                  >
                    {stat.icon}
                  </div>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="management_admin">Management Admin</option>
                <option value="recruiter">HR Recruiter</option>
                <option value="senior_manager">Senior Manager</option>
                <option value="employee">Employee</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-bold text-sm">No staff accounts found</p>
                <p className="text-gray-400 text-xs mt-1">
                  Click "Invite Staff Member" to create accounts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Member
                      </th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Role
                      </th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Dept & Title
                      </th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="text-left px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest hidden md:table-cell">
                        Date Added
                      </th>
                      <th className="text-right px-6 py-3.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((s) => {
                      const rc = ROLE_CONFIG[s.role] || ROLE_CONFIG.recruiter;
                      return (
                        <tr
                          key={s._id}
                          className="hover:bg-indigo-50/30 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                                {s.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {s.name}
                                </p>
                                <p className="text-xs text-gray-400">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${rc.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}
                              />
                              {rc.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {s.role === "management_admin" ? "Management Admin" : (s.designation || (s.role === "recruiter" ? "HR Recruiter" : s.role === "senior_manager" ? "Senior Manager" : s.role === "employee" ? "Employee" : "—"))}
                              </p>
                              <p className="text-xs text-gray-400">
                                {s.role === "management_admin" ? "Administration" : (s.department || (s.role === "recruiter" ? "HR" : s.role === "senior_manager" || s.role === "employee" ? "Engineering" : "—"))}
                              </p>
                              {s.role === "employee" && (
                                <p className="text-[10px] text-gray-450 mt-1">
                                  Reports to: <span className="font-bold text-indigo-600">{s.reportingManager?.name || s.reportingManager || "—"}</span>
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                s.status === "inactive"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status === "inactive" ? "bg-red-500" : "bg-emerald-500"}`} />
                              {s.status === "inactive" ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="text-xs text-gray-500 font-medium">
                              {s.createdAt
                                ? new Date(s.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {s.role !== "management_admin" && (
                                <>
                                  <button
                                    onClick={() => handleToggleStatus(s)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                      s.status === "inactive"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    }`}
                                    title={s.status === "inactive" ? "Activate Account" : "Deactivate Account"}
                                  >
                                    {s.status === "inactive" ? "Activate" : "Deactivate"}
                                  </button>
                                  <button
                                    onClick={() => openEditModal(s)}
                                    className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all"
                                    title="Edit"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(s)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                              {s.role === "management_admin" && (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Protected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── Create/Edit Modal ─── */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={18} />
                </button>

                <div className="mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    }}
                  >
                    {editingUser ? (
                      <Edit3 size={22} className="text-white" />
                    ) : (
                      <UserPlus size={22} className="text-white" />
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {editingUser ? "Edit Staff Account" : "Invite Staff Member"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingUser
                      ? "Update this staff member's details."
                      : "Create a new account for your team."}
                  </p>
                </div>

                {modalError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 mb-4 flex items-start gap-2">
                    <AlertCircle
                      size={14}
                      className="text-red-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="font-medium">{modalError}</span>
                  </div>
                )}

                <form onSubmit={handleModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        required
                        value={modalName}
                        onChange={(e) => setModalName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        required
                        value={modalEmail}
                        onChange={(e) => setModalEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Temporary Password
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="password"
                          required
                          value={modalPassword}
                          onChange={(e) => setModalPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Department
                      </label>
                      <input
                        type="text"
                        value={modalDepartment}
                        onChange={(e) => setModalDepartment(e.target.value)}
                        placeholder="e.g. Engineering"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={modalDesignation}
                        onChange={(e) => setModalDesignation(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Assigned Role
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          value: "employee",
                          label: "Employee",
                          desc: "Standard staff access",
                        },
                        {
                          value: "recruiter",
                          label: "HR Recruiter",
                          desc: "Hiring pipeline access",
                        },
                        {
                          value: "senior_manager",
                          label: "Senior Manager",
                          desc: "Dashboard & analytics",
                        },
                      ].map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setModalRole(r.value)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                            modalRole === r.value
                              ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <p
                            className={`text-xs font-extrabold ${
                              modalRole === r.value
                                ? "text-indigo-700"
                                : "text-gray-700"
                            }`}
                          >
                            {r.label}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                            {r.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {modalRole === "employee" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Reporting Manager
                      </label>
                      <select
                        value={modalReportingManagerId}
                        onChange={(e) => setModalReportingManagerId(e.target.value)}
                        required={modalRole === "employee"}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      >
                        <option value="">-- Select Senior Manager --</option>
                        {staff
                          .filter((s) => s.role === "senior_manager")
                          .map((mgr) => (
                            <option key={mgr._id} value={mgr._id}>
                              {mgr.name} ({mgr.department || "No Dept"})
                            </option>
                          ))}
                      </select>
                      {staff.filter((s) => s.role === "senior_manager").length === 0 && (
                        <p className="text-[10px] text-red-500 mt-1 font-semibold">
                          Warning: No Senior Managers registered. Please invite a Senior Manager first.
                        </p>
                      )}
                    </div>
                  )}

                  {editingUser && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Account Status
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setModalStatus("active")}
                          className={`flex-1 py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                            modalStatus === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalStatus("inactive")}
                          className={`flex-1 py-2 px-3 text-xs font-bold border rounded-xl transition-all ${
                            modalStatus === "inactive"
                              ? "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100"
                              : "bg-white text-gray-600 border-gray-200"
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 shadow-md"
                      style={{
                        background:
                          "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      }}
                    >
                      {modalLoading
                        ? "Processing..."
                        : editingUser
                        ? "Save Changes"
                        : "Create Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── Delete Confirmation Modal ─── */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setDeleteTarget(null)}
              />
              <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  }}
                >
                  <Trash2 size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                  Delete Staff Account
                </h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-bold text-gray-800">
                    {deleteTarget.name}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md"
                    style={{
                      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Toast ─── */}
          {toast && (
            <div
              style={{
                position: "fixed",
                bottom: "28px",
                right: "28px",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background:
                  toast.type === "error"
                    ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                    : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "16px",
                boxShadow:
                  toast.type === "error"
                    ? "0 8px 30px rgba(239,68,68,0.35)"
                    : "0 8px 30px rgba(5,150,105,0.35)",
                fontFamily: "inherit",
                minWidth: "260px",
                animation:
                  "slideInToast 0.35s cubic-bezier(.21,1.02,.73,1) both",
              }}
            >
              {toast.type === "error" ? (
                <AlertCircle size={22} style={{ flexShrink: 0 }} />
              ) : (
                <CheckCircle size={22} style={{ flexShrink: 0 }} />
              )}
              <div>
                <p
                  style={{ fontWeight: 700, fontSize: "14px", margin: 0 }}
                >
                  {toast.type === "error" ? "Error" : "Success"}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    opacity: 0.85,
                    margin: 0,
                    marginTop: "2px",
                  }}
                >
                  {toast.message}
                </p>
              </div>
              <style>{`
                @keyframes slideInToast {
                  from { opacity: 0; transform: translateY(24px) scale(0.97); }
                  to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
              `}</style>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
