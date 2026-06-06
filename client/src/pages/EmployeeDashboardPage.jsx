import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { api } from "../utils/api";
import { employeeService } from "../utils/employeeService";
import {
  Calendar,
  DollarSign,
  Award,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Activity,
  FileText,
  Download,
  TrendingUp,
  Plus,
  X,
  Briefcase,
  Camera,
  Save,
  Edit2
} from "lucide-react";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  // Cache/State layers
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState(null);
  const [payroll, setPayroll] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [activities, setActivities] = useState([]);
  const [lastLoginTime, setLastLoginTime] = useState(null);
  
  // Local states for inputs/forms
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Leave applying
  const [leaveType, setLeaveType] = useState("Medical Leave");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState("");
  const [leaveErrorMsg, setLeaveErrorMsg] = useState("");

  // Global search inside Employee (search within history/goals/activities)
  const [searchQuery, setSearchQuery] = useState("");

  // Digital clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data on mount & when storage updates
  const loadData = async () => {
    if (!user?.email) return;
    try {
      const data = await api.employeeDashboard.get();
      if (data) {
        setProfile(data.profile);
        setAttendance(data.attendance);
        setLeaves(data.leaves);
        setPayroll(data.payroll);
        setPerformance(data.performance);
        setActivities(data.activities);
        setLastLoginTime(data.lastLoginTime);
      }
    } catch (e) {
      console.error("Error loading employee data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [user?.email]);

  // Load profile editing values when profile loads
  useEffect(() => {
    if (profile) {
      setEditPhone(profile.phone || "");
      setEditLocation(profile.location || "");
      setEditPhotoUrl(profile.photoUrl || "");
    }
  }, [profile]);

  // Actions
  const handleCheckIn = async () => {
    if (!user?.email) return;
    const res = await employeeService.checkIn(user.email);
    if (res) {
      setAttendance(res);
      loadData();
    }
  };

  const handleCheckOut = async () => {
    if (!user?.email) return;
    const res = await employeeService.checkOut(user.email);
    if (res) {
      setAttendance(res);
      loadData();
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.email) return;
    const updated = await employeeService.updateProfile(user.email, {
      phone: editPhone,
      location: editLocation,
      photoUrl: editPhotoUrl
    });
    if (updated) {
      setProfile(updated);
      setIsEditingProfile(false);
      setProfileSuccessMsg("Profile details updated successfully!");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
      loadData();
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!user?.email) return;
    if (!leaveStart || !leaveEnd || !leaveReason) {
      setLeaveErrorMsg("All fields are required.");
      return;
    }

    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    if (end < start) {
      setLeaveErrorMsg("End Date cannot be before Start Date.");
      return;
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const balance = leaves?.balances?.find((b) => b.type === leaveType);
    if (balance && balance.remaining < diffDays) {
      setLeaveErrorMsg(`Insufficient balance. You have ${balance.remaining} days remaining for ${leaveType}.`);
      return;
    }

    const res = await employeeService.applyLeave(user.email, {
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason
    });

    if (res) {
      setLeaves(res);
      setLeaveSuccessMsg("Leave request submitted successfully and sent for manager approval.");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
      setLeaveErrorMsg("");
      setTimeout(() => setLeaveSuccessMsg(""), 4000);
      loadData();
    }
  };

  const handleDownloadPayslip = async (record) => {
    // Generates a mock text payslip file for download
    const payslipContent = `
============================================================
                     HRise HRMS PAYSLIP                     
============================================================
Employee Name   : ${profile?.name || "Arjun Mehta"}
Employee ID     : ${profile?.employeeId || "EMP001"}
Department      : ${profile?.department || "Engineering"}
Designation     : ${profile?.designation || "Senior Software Engineer"}
Month/Year      : ${record.month}
Payslip ID      : ${record.id}
Status          : ${record.status} (Paid on ${record.datePaid})
============================================================
SALARY BREAKDOWN
------------------------------------------------------------
Basic Salary                 : INR ${(record.base * 0.50).toLocaleString("en-IN")}
House Rent Allowance (HRA)   : INR ${(record.base * 0.20).toLocaleString("en-IN")}
Dearness Allowance (DA)      : INR ${(record.base * 0.10).toLocaleString("en-IN")}
Special Allowance            : INR ${(record.base * 0.20).toLocaleString("en-IN")}
Performance Bonus            : INR ${record.bonus.toLocaleString("en-IN")}
------------------------------------------------------------
GROSS PAY                    : INR ${record.gross.toLocaleString("en-IN")}
============================================================
DEDUCTIONS
------------------------------------------------------------
Provident Fund (PF)          : INR ${(record.base * 0.06).toLocaleString("en-IN")}
Professional Tax (PT)        : INR 200
Tax Deducted at Source (TDS) : INR ${(record.base * 0.10).toLocaleString("en-IN")}
------------------------------------------------------------
TOTAL DEDUCTIONS             : INR ${record.deductions.toLocaleString("en-IN")}
============================================================
NET TAKE-HOME PAY            : INR ${record.netPay.toLocaleString("en-IN")}
============================================================
Generated via HRise AI-Powered HRMS on ${new Date().toLocaleString()}
This is a computer generated document and does not require signatures.
============================================================
`;
    const blob = new Blob([payslipContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payslip_${profile?.name.replace(/ /g, "_")}_${record.month.replace(/ /g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      await api.employeeDashboard.logPayslipDownload(record.month);
      loadData();
    } catch (e) {
      console.error("Failed to log payslip download:", e);
    }
    URL.revokeObjectURL(url);
  };

  // Search logic for employee tabs
  const filteredLeaveHistory = useMemo(() => {
    if (!leaves?.requests) return [];
    if (!searchQuery) return leaves.requests;
    return leaves.requests.filter(
      (r) =>
        r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaves?.requests, searchQuery]);

  const filteredAttendanceHistory = useMemo(() => {
    if (!attendance?.history) return [];
    if (!searchQuery) return attendance.history;
    return attendance.history.filter(
      (h) =>
        h.date.includes(searchQuery) ||
        h.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [attendance?.history, searchQuery]);

  const filteredPayrollHistory = useMemo(() => {
    if (!payroll?.history) return [];
    if (!searchQuery) return payroll.history;
    return payroll.history.filter(
      (p) =>
        p.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payroll?.history, searchQuery]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">Loading your profile portal...</p>
        </div>
      </div>
    );
  }

  // Dashboard Stats
  const dashboardStats = [
    {
      label: "Attendance Rate",
      value: typeof attendance?.summary?.percentage === "number" ? `${attendance.summary.percentage}%` : "No Attendance Data",
      sub: typeof attendance?.summary?.percentage === "number" ? "Month-to-date ratio" : "No clock-in records found",
      color: "from-blue-500 to-indigo-600",
      icon: Clock
    },
    {
      label: "Leave Balance",
      value: `${leaves?.balances?.reduce((acc, b) => acc + b.remaining, 0) !== undefined ? leaves.balances.reduce((acc, b) => acc + b.remaining, 0) : 33} Days`,
      sub: "Across all categories",
      color: "from-emerald-500 to-teal-600",
      icon: Calendar
    },
    {
      label: "Performance Rating",
      value: typeof performance?.score === "number" ? `${performance.score}/100` : (performance?.score || "No Performance Review Available"),
      sub: typeof performance?.score === "number" ? `Cycle Grade: ${performance.grade}` : "No review cycle graded yet",
      color: "from-purple-500 to-pink-600",
      icon: Award
    },
    {
      label: "Base Net Salary",
      value: typeof payroll?.summary?.salary === "number" ? `₹${payroll.summary.salary.toLocaleString("en-IN")}` : "Payroll Not Generated",
      sub: typeof payroll?.summary?.salary === "number" ? `Status: ${payroll.summary.status || "Pending"}` : "No active payroll cycle",
      color: "from-orange-500 to-amber-600",
      icon: DollarSign
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="employee" />

      <div className="lg:ml-64">
        <Header title="Employee Portal" searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* Welcome row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome, {profile.name}</h2>
              <p className="text-sm text-gray-500">
                Portal / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                {lastLoginTime && ` • Last Login: ${new Date(lastLoginTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl font-bold">
                {profile.designation} ({profile.department})
              </span>
            </div>
          </div>

          {/* Tab Renderers */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 hrise-tab-content">
              {/* Corporate Identity Card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl overflow-hidden shadow-md flex-shrink-0">
                    {profile.photoUrl ? (
                      <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{profile.name}</h3>
                    <p className="text-sm text-indigo-600 font-semibold mt-0.5">{profile.designation}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-xs border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 min-w-[120px]">
                    <span className="block text-[10px] font-extrabold text-gray-450 uppercase tracking-widest">Employee ID</span>
                    <span className="block text-sm font-extrabold text-gray-800 mt-1">{profile.employeeId}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 min-w-[120px]">
                    <span className="block text-[10px] font-extrabold text-gray-450 uppercase tracking-widest">Department</span>
                    <span className="block text-sm font-extrabold text-gray-800 mt-1">{profile.department}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 min-w-[120px]">
                    <span className="block text-[10px] font-extrabold text-gray-450 uppercase tracking-widest">Designation</span>
                    <span className="block text-sm font-extrabold text-gray-800 mt-1">{profile.designation}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 min-w-[120px]">
                    <span className="block text-[10px] font-extrabold text-gray-450 uppercase tracking-widest">Reporting Manager</span>
                    <span className="block text-sm font-extrabold text-indigo-600 mt-1">{profile.manager || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-150 flex flex-col justify-between h-36">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                          <p className={`font-extrabold text-gray-900 mt-1.5 tracking-tight ${
                            String(stat.value).length > 20 ? "text-base leading-snug" : 
                            String(stat.value).length > 12 ? "text-xl leading-tight" : 
                            "text-3xl"
                          }`}>{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                          <Icon size={18} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{stat.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Main row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Actions / Check In */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Attendance Card */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col items-center text-center">
                    <h3 className="font-bold text-gray-900 text-base mb-2">Shift Clocking</h3>
                    
                    <div className="text-3xl font-mono font-bold text-indigo-600 bg-indigo-50/50 px-5 py-2.5 rounded-2xl border border-indigo-100 my-4 shadow-inner">
                      {attendance?.currentCheckIn?.checkOut 
                        ? attendance.currentCheckIn.checkOut 
                        : currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>

                    <div className="text-xs font-semibold text-gray-400 mb-6 flex items-center gap-1.5">
                      <Activity size={14} className="text-indigo-500" />
                      Status: {attendance?.currentCheckIn ? (
                        attendance.currentCheckIn.checkOut ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">Shift Completed</span>
                        ) : (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Checked In ({attendance.currentCheckIn.checkIn})
                          </span>
                        )
                      ) : (
                        <span className="text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">Not Clocked In</span>
                      )}
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={handleCheckIn}
                        disabled={!!attendance?.currentCheckIn}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                          attendance?.currentCheckIn
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white cursor-pointer"
                        }`}
                      >
                        <Clock size={16} /> Check In
                      </button>
                      <button
                        onClick={handleCheckOut}
                        disabled={!attendance?.currentCheckIn || !!attendance.currentCheckIn.checkOut}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                          !attendance?.currentCheckIn || attendance.currentCheckIn.checkOut
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white cursor-pointer"
                        }`}
                      >
                        <Clock size={16} /> Check Out
                      </button>
                    </div>
                  </div>

                  {/* Profile Teaser */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                      <User size={18} className="text-indigo-500" />
                      Employee Card
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-inner flex-shrink-0">
                        {profile.photoUrl ? (
                          <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          profile.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{profile.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{profile.designation}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase mt-1 tracking-wider">{profile.employeeId}</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-2 border-t border-gray-50 pt-4 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Department:</span>
                        <span className="font-bold text-gray-700">{profile.department}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Reporting Manager:</span>
                        <span className="font-bold text-gray-700">{profile.manager}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Date Joined:</span>
                        <span className="font-bold text-gray-700">{profile.joinDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Recent Activity feed & Leave stats */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-base mb-6 flex items-center gap-2">
                      <Activity size={18} className="text-indigo-500" />
                      Recent Workspace Activity
                    </h3>

                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400">No recent activity logged.</div>
                    ) : (
                      <div className="relative border-l border-gray-100 pl-4 space-y-6 ml-2 text-xs">
                        {activities.map((act, idx) => (
                          <div key={idx} className="relative">
                            {/* Dot indicator */}
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white ring-4 ring-indigo-50" />
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-gray-800 leading-normal">{act.action}</p>
                              <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-4">{act.date}</span>
                            </div>
                            {act.details && <p className="text-gray-500 font-medium mt-0.5">{act.details}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feedback teaser */}
                  <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/5 rounded-full" />
                    <h3 className="font-bold text-sm text-indigo-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Award size={16} /> Latest Manager Feedback
                    </h3>
                    <p className="text-xs text-white/90 leading-relaxed italic mb-4 font-serif">
                      "{performance?.feedback?.substring(0, 160)}..."
                    </p>
                    <p className="text-[10px] text-indigo-300 font-bold">
                      — {performance?.feedbackManager}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden hrise-tab-content">
              <div className="bg-gradient-to-r from-indigo-800 to-purple-800 h-32 relative" />
              
              <div className="px-6 pb-8 relative">
                {/* Profile Header Avatar */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-6 gap-4">
                  <div className="flex items-end gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-extrabold text-3xl relative group"
                         onClick={() => isEditingProfile && document.getElementById('avatar-upload').click()}
                         title={isEditingProfile ? "Change Photo" : ""}
                         style={{ cursor: isEditingProfile ? "pointer" : "default" }}
                    >
                      { (isEditingProfile && editPhotoUrl) || (!isEditingProfile && profile.photoUrl) ? (
                        <img src={(isEditingProfile && editPhotoUrl) ? editPhotoUrl : profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
                          {profile.name.charAt(0)}
                        </div>
                      )}
                      {isEditingProfile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={24} className="text-white" />
                        </div>
                      )}
                    </div>
                    {isEditingProfile && (
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onloadend = () => setEditPhotoUrl(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    )}
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <p className="text-xs text-gray-500">{profile.designation} • {profile.department}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      setProfileSuccessMsg("");
                    }}
                    className="py-2 px-4 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer text-gray-700 bg-white"
                  >
                    {isEditingProfile ? (
                      <><X size={14} /> Cancel</>
                    ) : (
                      <><Edit2 size={14} /> Edit Profile</>
                    )}
                  </button>
                </div>

                {profileSuccessMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {profileSuccessMsg}
                  </div>
                )}

                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5 text-xs">
                        <label className="block font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 text-gray-700 font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="block font-bold text-gray-500 uppercase tracking-widest">Address / Location</label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="e.g. Bangalore, India"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 text-gray-700 font-medium"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="py-2.5 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-md flex items-center gap-1.5 cursor-pointer text-sm"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                    {/* General details */}
                    <div className="space-y-4 border-r border-gray-50 pr-4">
                      <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">Employment Information</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                        <span className="text-gray-400 font-semibold">Employee ID:</span>
                        <span className="font-bold text-gray-700">{profile.employeeId}</span>
                        
                        <span className="text-gray-400 font-semibold">Joined Date:</span>
                        <span className="font-bold text-gray-700">{profile.joinDate}</span>
                        
                        <span className="text-gray-400 font-semibold">Reporting Manager:</span>
                        <span className="font-bold text-gray-700">{profile.manager}</span>
                        
                        <span className="text-gray-400 font-semibold">Employment Status:</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-max shrink-0 capitalize">
                          {profile.status}
                        </span>

                        <span className="text-gray-400 font-semibold">Salary Band:</span>
                        <span className="font-bold text-gray-700">{profile.salaryBand}</span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2">Contact Details</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                        <span className="text-gray-400 font-semibold">Email Address:</span>
                        <span className="font-bold text-gray-700">{profile.email}</span>
                        
                        <span className="text-gray-400 font-semibold">Phone Number:</span>
                        <span className="font-bold text-gray-700">{profile.phone || "Not provided"}</span>
                        
                        <span className="text-gray-400 font-semibold">Office Location:</span>
                        <span className="font-bold text-gray-700">{profile.location || "Not provided"}</span>
                      </div>
                      
                      <div className="pt-2">
                        <span className="block text-gray-400 font-semibold mb-2">Technical Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills?.map((skill, sIdx) => (
                            <span key={sIdx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 hrise-tab-content">
              {/* Left clocking dashboard */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col items-center text-center">
                  <Clock className="text-indigo-500 w-10 h-10 mb-2" />
                  <h3 className="font-bold text-gray-900 text-base mb-1">Shift Timer</h3>
                  
                  <div className="text-3xl font-mono font-bold text-indigo-600 bg-indigo-50/50 px-5 py-2.5 rounded-2xl border border-indigo-100 my-4 shadow-inner">
                    {attendance?.currentCheckIn?.checkOut 
                      ? attendance.currentCheckIn.checkOut 
                      : currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>

                  <p className="text-xs text-gray-400 mb-6 font-medium">
                    {currentTime.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>

                  <div className="text-xs font-semibold text-gray-400 mb-6 flex items-center gap-1.5 justify-center">
                    {attendance?.currentCheckIn ? (
                      attendance.currentCheckIn.checkOut ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          Shift Completed
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Shift active since {attendance.currentCheckIn.checkIn}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-500 font-bold bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">No active shifts</span>
                    )}
                  </div>

                  <div className="flex gap-4 w-full">
                    <button
                      onClick={handleCheckIn}
                      disabled={!!attendance?.currentCheckIn}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                        attendance?.currentCheckIn
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white cursor-pointer"
                      }`}
                    >
                      <Clock size={16} /> Check In
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={!attendance?.currentCheckIn || !!attendance.currentCheckIn.checkOut}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 ${
                        !attendance?.currentCheckIn || attendance.currentCheckIn.checkOut
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white cursor-pointer"
                      }`}
                    >
                      <Clock size={16} /> Check Out
                    </button>
                  </div>
                </div>

                {/* Summary card */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm text-xs">
                  <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2 mb-4">Monthly Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between font-medium text-gray-500">
                      <span>Present Days:</span>
                      <span className="font-bold text-gray-800">{attendance?.summary?.present || 0}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-500">
                      <span>Absent Days:</span>
                      <span className="font-bold text-red-600">{attendance?.summary?.absent || 0}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-500">
                      <span>Approved Leaves:</span>
                      <span className="font-bold text-amber-600">{attendance?.summary?.leaves || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-50 pt-2 font-medium text-gray-500">
                      <span>Attendance Rate:</span>
                      <span className="font-bold text-indigo-600 text-sm">{attendance?.summary?.percentage || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right history table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-base">Clock-In History</h3>
                    {searchQuery && (
                      <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Filtered matches ({filteredAttendanceHistory.length})
                      </span>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest font-extrabold border-b border-gray-100">
                          <th className="p-4">Date</th>
                          <th className="p-4">Check In</th>
                          <th className="p-4">Check Out</th>
                          <th className="p-4">Hours</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                        {filteredAttendanceHistory.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400">No logs found. Try another search.</td>
                          </tr>
                        ) : (
                          filteredAttendanceHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/40">
                              <td className="p-4">{item.date}</td>
                              <td className="p-4 text-gray-500">{item.checkIn}</td>
                              <td className="p-4 text-gray-500">{item.checkOut}</td>
                              <td className="p-4 font-mono">{item.hours ? `${item.hours}h` : "-"}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  item.status === "Present"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : item.status === "Absent"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 hrise-tab-content">
              {/* Left Apply form */}
              <div className="lg:col-span-1 space-y-6">
                {/* Leave balances */}
                <div className="grid grid-cols-3 gap-4">
                  {leaves?.balances?.map((bal, idx) => (
                    <div key={idx} className="bg-white border border-gray-150 rounded-2xl p-4 text-center shadow-sm">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">{bal.type.replace(" Leave", "")}</p>
                      <p className="text-2xl font-extrabold text-gray-900 mt-2">{bal.remaining}</p>
                      <p className="text-[9px] text-gray-400 font-medium mt-1">out of {bal.total}</p>
                    </div>
                  ))}
                </div>

                {/* Form card */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-indigo-500" />
                    Apply for Leave
                  </h3>

                  {leaveSuccessMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> {leaveSuccessMsg}
                    </div>
                  )}

                  {leaveErrorMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle size={14} /> {leaveErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-semibold">
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 uppercase tracking-widest">Leave Type</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none cursor-pointer text-gray-700"
                      >
                        <option>Medical Leave</option>
                        <option>Casual Leave</option>
                        <option>Earned Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-gray-500 uppercase tracking-widest">Start Date</label>
                        <input
                          type="date"
                          value={leaveStart}
                          onChange={(e) => setLeaveStart(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-gray-500 uppercase tracking-widest">End Date</label>
                        <input
                          type="date"
                          value={leaveEnd}
                          onChange={(e) => setLeaveEnd(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-500 uppercase tracking-widest">Reason</label>
                      <textarea
                        rows={3}
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="State the reason for leave request"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-gray-700 resize-none font-medium placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition cursor-pointer text-sm"
                    >
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>

              {/* Right History table */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Summary Banner */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 text-center shadow-sm">
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Pending Requests</p>
                    <p className="text-2xl font-extrabold text-amber-800 mt-1">{leaves?.requests?.filter(r => r.status === "Pending").length || 0}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 text-center shadow-sm">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Approved Requests</p>
                    <p className="text-2xl font-extrabold text-emerald-800 mt-1">{leaves?.requests?.filter(r => r.status === "Approved").length || 0}</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 text-center shadow-sm">
                    <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Rejected Requests</p>
                    <p className="text-2xl font-extrabold text-rose-800 mt-1">{leaves?.requests?.filter(r => r.status === "Rejected").length || 0}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-base">Leave Applications History</h3>
                    {searchQuery && (
                      <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Matches ({filteredLeaveHistory.length})
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest font-extrabold border-b border-gray-100">
                          <th className="p-4">Request</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Dates</th>
                          <th className="p-4">Days</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                        {filteredLeaveHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center">
                              <p className="text-gray-900 font-bold text-base mb-1">No Leave Requests Yet</p>
                              <p className="text-gray-400 font-medium">You have not submitted any leave applications. Use the form below to create your first request.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredLeaveHistory.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/40">
                              <td className="p-4 font-mono font-bold text-gray-900">Request #{filteredLeaveHistory.length - idx}</td>
                              <td className="p-4">{item.type}</td>
                              <td className="p-4 text-gray-500">
                                {item.startDate} to {item.endDate}
                              </td>
                              <td className="p-4 font-bold">{item.days} d</td>
                              <td className="p-4 text-gray-500 whitespace-normal break-words max-w-xs">
                                {item.reason}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                  item.status === "Approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : item.status === "Rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payroll" && (
            <div className="space-y-8 hrise-tab-content">
              {/* Paycards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Basic CTC</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">₹{payroll?.history?.[0]?.base?.toLocaleString("en-IN") || payroll?.summary?.salary?.toLocaleString("en-IN") || "N/A"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <DollarSign size={18} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance Bonus</p>
                    <p className={`font-extrabold mt-1 ${typeof payroll?.history?.[0]?.bonus === 'number' ? 'text-2xl text-gray-900' : 'text-base text-gray-500'}`}>
                      {typeof payroll?.history?.[0]?.bonus === 'number' 
                        ? `₹${payroll.history[0].bonus.toLocaleString("en-IN")}` 
                        : "Bonus Not Available"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Award size={18} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Net Take Home Pay</p>
                    <p className="text-2xl font-extrabold mt-1">₹{payroll?.history?.[0]?.netPay?.toLocaleString("en-IN") || "N/A"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <TrendingUp size={18} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Salary details breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-semibold">
                {/* Earnings */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                  <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2.5 mb-4">Earnings Breakdown</h4>
                  <div className="space-y-3">
                    {(() => {
                      const rec = payroll?.history?.[0];
                      if (!rec) return <p className="text-gray-400 text-xs">No data available</p>;
                      const base = rec.base || 0;
                      return [
                        { name: "Basic Salary", amount: Math.round(base * 0.50) },
                        { name: "House Rent Allowance (HRA)", amount: Math.round(base * 0.20) },
                        { name: "Dearness Allowance (DA)", amount: Math.round(base * 0.10) },
                        { name: "Special Allowance", amount: Math.round(base * 0.20) },
                        { name: "Performance Bonus", amount: rec.bonus || 0 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-gray-500">
                          <span>{item.name}:</span>
                          <span className="font-bold text-gray-800">₹{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ));
                    })()}
                    <div className="flex justify-between border-t border-gray-50 pt-2.5 font-medium text-indigo-600 text-sm">
                      <span>Total Earnings:</span>
                      <span>
                        {typeof payroll?.history?.[0]?.gross === 'number'
                          ? `₹${payroll.history[0].gross.toLocaleString("en-IN")}`
                          : "Payroll Not Generated"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                  <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2.5 mb-4">Deductions</h4>
                  <div className="space-y-3">
                    {(() => {
                      const rec = payroll?.history?.[0];
                      if (!rec) return <p className="text-gray-400 text-xs">No data available</p>;
                      const base = rec.base || 0;
                      return [
                        { name: "Provident Fund (PF)", amount: Math.round(base * 0.06) },
                        { name: "Professional Tax (PT)", amount: 200 },
                        { name: "Tax Deducted at Source (TDS)", amount: Math.round(base * 0.10) },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-gray-500">
                          <span>{item.name}:</span>
                          <span className="font-bold text-red-600">₹{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ));
                    })()}
                    <div className="flex justify-between border-t border-gray-50 pt-2.5 font-medium text-red-600 text-sm">
                      <span>Total Deductions:</span>
                      <span>
                        {typeof payroll?.history?.[0]?.deductions === 'number'
                          ? `₹${payroll.history[0].deductions.toLocaleString("en-IN")}`
                          : "Payroll Not Generated"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-base">Payment Logs</h3>
                  {searchQuery && (
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Matches ({filteredPayrollHistory.length})
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-widest font-extrabold border-b border-gray-100">
                        <th className="p-4">Month</th>
                        <th className="p-4">Gross Earnings</th>
                        <th className="p-4">Deductions</th>
                        <th className="p-4">Net Payout</th>
                        <th className="p-4">Paid On</th>
                        <th className="p-4 text-center">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                      {filteredPayrollHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">No payment logs found.</td>
                        </tr>
                      ) : (
                        filteredPayrollHistory.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/40">
                            <td className="p-4 font-bold text-gray-800">{item.month}</td>
                            <td className="p-4">₹{item.gross.toLocaleString("en-IN")}</td>
                            <td className="p-4 text-red-600">₹{item.deductions.toLocaleString("en-IN")}</td>
                            <td className="p-4 text-indigo-600 font-bold">₹{item.netPay.toLocaleString("en-IN")}</td>
                            <td className="p-4 text-gray-500">{item.datePaid}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDownloadPayslip(item)}
                                className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 py-1.5 px-3 rounded-xl hover:bg-indigo-100 transition text-[10px] font-bold cursor-pointer"
                              >
                                <Download size={12} /> Download Payslip
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 hrise-tab-content">
              {/* Left Score circular/grade progress */}
              <div className="lg:col-span-1 space-y-6">
                {/* Score Card */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm flex flex-col items-center text-center">
                  <Award size={36} className="text-purple-500 mb-2 animate-bounce" />
                  <h3 className="font-bold text-gray-900 text-base mb-1">Performance Rating</h3>
                  <p className="text-xs text-gray-400 font-semibold mb-6">{performance?.cycle}</p>

                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    {/* Ring progress border */}
                    <div className="absolute inset-0 rounded-full border-[10px] border-purple-50 shadow-inner" />
                    <div className="absolute inset-0 rounded-full border-[10px] border-purple-500 border-t-transparent border-r-transparent animate-spin-slow" style={{ transform: "rotate(45deg)" }} />
                    <div className="text-center z-10">
                      <p className="text-3xl font-extrabold text-gray-900 leading-tight">{performance?.score !== undefined ? performance.score : 97}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">Score</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-200">
                    Grade: {performance?.grade}
                  </span>
                </div>

                {/* Performance reviews history */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm text-xs font-semibold">
                  <h4 className="font-extrabold text-sm text-gray-900 border-b border-gray-50 pb-2.5 mb-4">Review History</h4>
                  <div className="space-y-4">
                    {performance?.reviews?.map((rev, idx) => (
                      <div key={idx} className="flex justify-between items-center font-medium">
                        <div>
                          <p className="font-bold text-gray-800">{rev.quarter}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Reviewed on {rev.date}</p>
                        </div>
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-lg">
                          {rev.score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Appraisal summary & feedback */}
              <div className="lg:col-span-2 space-y-6">
                {/* Manager Feedback */}
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-1.5">
                    <Mail size={18} className="text-purple-500" />
                    Manager Appraisal Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 italic text-xs leading-relaxed font-serif text-gray-700">
                    "{performance?.feedback}"
                  </div>
                  <p className="text-[10px] text-purple-600 font-extrabold mt-3 uppercase tracking-widest text-right">
                    — Approved by: {performance?.feedbackManager}
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
