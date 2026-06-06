import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { 
  Sliders, 
  Users, 
  Globe, 
  Lock, 
  CheckCircle, 
  Save, 
  Sparkles, 
  Mail, 
  Bell, 
  Shield,
  Clock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Building2
} from "lucide-react";
import { Card, Button, Badge } from "../components/ui";
import { addHriseNotification } from "../utils/notifications";
import { api } from "../utils/api";
import { syncPush } from "../utils/sync";

const DEFAULT_STAFF_MEMBERS = [
  { name: "Alex Morgan", email: "recruiter@hrise.com", role: "HR Recruiteristrator", status: "Active", permissions: "Full Write Authority", avatar: "A" },
  { name: "Jamie Chen", email: "recruiter@hrise.com", role: "Talent Recruiter", status: "Active", permissions: "Pipeline Sourcing", avatar: "J" },
  { name: "Rohan Malhotra", email: "rohan@hrise.com", role: "Executive Partner", status: "Active", permissions: "Read-Only Sourcing", avatar: "R" },
  { name: "Tanisha Patel", email: "tanisha@hrise.com", role: "Recruiter Assistant", status: "Active", permissions: "Read-Only Sourcing", avatar: "T" }
];

export default function SettingsPage() {
  const { user } = useAuth();
  const role = user?.role || "recruiter";

  // System Config States (System Sourcing & AI controls)
  const [aiScoreThreshold, setAiScoreThreshold] = useState(75);
  const [evaluationStrictness, setEvaluationStrictness] = useState("Balanced Evaluation");
  const [autoShortlist, setAutoShortlist] = useState(true);
  const [sendShortlistEmails, setSendShortlistEmails] = useState(true);
  const [sendInterviewEmails, setSendInterviewEmails] = useState(true);
  const [workspaceTimezone, setWorkspaceTimezone] = useState("Asia/Kolkata (IST)");
  const [staffMembers, setStaffMembers] = useState([]);

  // Leave allocations configurations
  const [medicalLeaveAllocated, setMedicalLeaveAllocated] = useState(12);
  const [casualLeaveAllocated, setCasualLeaveAllocated] = useState(10);
  const [earnedLeaveAllocated, setEarnedLeaveAllocated] = useState(15);

  // Management Admin Specific Settings
  const [companyName, setCompanyName] = useState(user?.company || "HRise Technologies");
  const [companyAddress, setCompanyAddress] = useState("123 Innovation Hub, Block C, Bengaluru, KA - 560001");
  const [companyWebsite, setCompanyWebsite] = useState("https://hrise.ai");
  const [companyLogo, setCompanyLogo] = useState(null);
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [payrollAlerts, setPayrollAlerts] = useState(true);

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load configuration and staff directory from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.settings.get();
        if (res) {
          if (res.aiScoreThreshold !== undefined) setAiScoreThreshold(Number(res.aiScoreThreshold));
          if (res.evaluationStrictness !== undefined) setEvaluationStrictness(res.evaluationStrictness);
          if (res.autoShortlist !== undefined) setAutoShortlist(res.autoShortlist);
          if (res.sendShortlistEmails !== undefined) setSendShortlistEmails(res.sendShortlistEmails);
          if (res.sendInterviewEmails !== undefined) setSendInterviewEmails(res.sendInterviewEmails);
          if (res.workspaceTimezone !== undefined) setWorkspaceTimezone(res.workspaceTimezone);
          if (res.medicalLeaveAllocated !== undefined) setMedicalLeaveAllocated(Number(res.medicalLeaveAllocated));
          if (res.casualLeaveAllocated !== undefined) setCasualLeaveAllocated(Number(res.casualLeaveAllocated));
          if (res.earnedLeaveAllocated !== undefined) setEarnedLeaveAllocated(Number(res.earnedLeaveAllocated));
        }
      } catch (e) {
        console.error("Failed to load settings from DB:", e);
      }
    };
    fetchSettings();

    const savedSettings = localStorage.getItem("hrise_workspace_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed) {
          if (parsed.aiScoreThreshold !== undefined) setAiScoreThreshold(Number(parsed.aiScoreThreshold));
          if (parsed.evaluationStrictness !== undefined) setEvaluationStrictness(parsed.evaluationStrictness);
          if (parsed.autoShortlist !== undefined) setAutoShortlist(parsed.autoShortlist);
          if (parsed.sendShortlistEmails !== undefined) setSendShortlistEmails(parsed.sendShortlistEmails);
          if (parsed.sendInterviewEmails !== undefined) setSendInterviewEmails(parsed.sendInterviewEmails);
          if (parsed.workspaceTimezone !== undefined) setWorkspaceTimezone(parsed.workspaceTimezone);
        }
      } catch (e) {
        console.error("Error reading workspace settings:", e);
      }
    }

    const savedAdminSettings = localStorage.getItem("hrise_admin_settings");
    if (savedAdminSettings) {
      try {
        const parsed = JSON.parse(savedAdminSettings);
        if (parsed) {
          if (parsed.companyName !== undefined) setCompanyName(parsed.companyName);
          if (parsed.companyAddress !== undefined) setCompanyAddress(parsed.companyAddress);
          if (parsed.companyWebsite !== undefined) setCompanyWebsite(parsed.companyWebsite);
          if (parsed.emailNotifications !== undefined) setEmailNotifications(parsed.emailNotifications);
          if (parsed.interviewReminders !== undefined) setInterviewReminders(parsed.interviewReminders);
          if (parsed.payrollAlerts !== undefined) setPayrollAlerts(parsed.payrollAlerts);
        }
      } catch (e) {}
    }

    const savedStaffList = localStorage.getItem("hrise_staff_profiles");
    if (savedStaffList) {
      try {
        setStaffMembers(JSON.parse(savedStaffList));
      } catch (e) {}
    }
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();

    if (role === "management_admin") {
      const adminConfig = {
        companyName,
        companyAddress,
        companyWebsite,
        emailNotifications,
        interviewReminders,
        payrollAlerts,
        medicalLeaveAllocated,
        casualLeaveAllocated,
        earnedLeaveAllocated,
      };
      localStorage.setItem("hrise_admin_settings", JSON.stringify(adminConfig));

      // Synchronize settings update to the backend database
      syncPush.settings.update(adminConfig);

      addHriseNotification(
        "Company Settings Saved",
        "Company details and administrative configurations have been updated.",
        "info",
        role
      );
    } else {
      const config = {
        aiScoreThreshold,
        evaluationStrictness,
        autoShortlist,
        sendShortlistEmails,
        sendInterviewEmails,
        workspaceTimezone,
        medicalLeaveAllocated,
        casualLeaveAllocated,
        earnedLeaveAllocated,
      };

      localStorage.setItem("hrise_workspace_settings", JSON.stringify(config));
      syncPush.settings.update(config);
      
      addHriseNotification(
        "Workspace Config Saved",
        "System-wide AI Screening thresholds and automation rules have been saved successfully.",
        "shortlist",
        role
      );
    }

    // Dispatch storage sync events
    window.dispatchEvent(new Event("storage"));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current security password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      await api.auth.updatePassword(currentPassword, newPassword);
      
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      addHriseNotification(
        "Password Reset Success",
        "Your corporate security credentials have been updated securely.",
        "info",
        role
      );

      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (e) {
      setPasswordError(e.error || "Failed to update password. Please check your current password.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar role={role} />
      <div className="lg:ml-64">
        <Header title="Settings" />
        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              Settings
            </h1>
            <p className="text-gray-500 mt-1">
              Configure system-wide AI matching thresholds, pipeline auto-triggers, and security permissions.
            </p>
          </div>

          {/* Floating Save Toast */}
          {saveSuccess && (
            <div
              style={{
                position: "fixed",
                bottom: "28px",
                right: "28px",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "16px",
                boxShadow: "0 8px 30px rgba(79,70,229,0.35)",
                fontFamily: "inherit",
                minWidth: "280px",
                animation: "slideInToast 0.35s cubic-bezier(.21,1.02,.73,1) both"
              }}
            >
              <CheckCircle size={22} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: "14px", margin: 0 }}>Settings saved successfully</p>
                <p style={{ fontSize: "12px", opacity: 0.85, margin: 0, marginTop: "2px" }}>Platform configs updated.</p>
              </div>
              <style>{`
                @keyframes slideInToast {
                  from { opacity: 0; transform: translateY(24px) scale(0.97); }
                  to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
              `}</style>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {role === "management_admin" ? (
                  <>
                    {/* Company Information Card */}
                    <Card className="p-8 border border-gray-200/85 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Building2 size={16} />
                          </div>
                          Company Information
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Configure company details, logo, and public presence information</p>
                      </div>

                      <div className="space-y-4">
                        {/* Company Name */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Company Name</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                            placeholder="Enter company name"
                          />
                        </div>

                        {/* Logo Upload */}
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Company Logo</label>
                          <div className="flex items-center gap-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                              {(companyName || "").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setCompanyLogo(URL.createObjectURL(e.target.files[0]));
                                  }
                                }}
                                className="hidden"
                                id="logo-upload"
                              />
                              <label
                                htmlFor="logo-upload"
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                              >
                                Upload New Logo
                              </label>
                              <p className="text-[10px] text-slate-450 mt-1">Recommended size: 256x256 px. PNG or SVG.</p>
                            </div>
                          </div>
                        </div>

                        {/* Website & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Website</label>
                            <input
                              type="url"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                              placeholder="https://example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Physical Address</label>
                            <input
                              type="text"
                              value={companyAddress}
                              onChange={(e) => setCompanyAddress(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                              placeholder="City, Country"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Administrative Notifications Card */}
                    <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Bell size={16} />
                          </div>
                          Administrative Alerts
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Configure your email notifications and platform reminders</p>
                      </div>

                      <div className="divide-y divide-slate-100 space-y-4">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between py-2 pt-0">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Email Notifications</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Receive summarized daily digests of workspace activity in your corporate email.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {emailNotifications ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>

                        {/* Toggle 2 */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Interview Reminders</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Receive immediate push alerts and email pings for upcoming candidate video sessions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInterviewReminders(!interviewReminders)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {interviewReminders ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>

                        {/* Toggle 3 */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Payroll Alerts</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Receive reminder notifications for monthly payroll run schedules and payout completions.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPayrollAlerts(!payrollAlerts)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {payrollAlerts ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* Card 1: AI Screening Thresholds & Sourcing Rules */}
                    <Card className="p-8 border border-gray-200/85 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Sliders size={16} />
                          </div>
                          AI Screening & Sourcing Rules
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Configure candidate qualification filters and resume matching strictly level parameters</p>
                      </div>

                      <div className="space-y-5">
                        {/* Passing Score Slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Auto-Shortlist Passing Score</label>
                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">{aiScoreThreshold}% or Higher</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400">50%</span>
                            <input
                              type="range"
                              min="50"
                              max="95"
                              value={aiScoreThreshold}
                              onChange={(e) => setAiScoreThreshold(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">95%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                            Candidates scoring above this threshold inside the **AI Screen Engine** will be tagged as *Auto-Shortlisted*.
                          </p>
                        </div>

                        {/* Sourcing strictness */}
                        <div className="space-y-1.5 pt-2">
                          <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">AI strictness Level</label>
                          <div className="relative">
                            <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                              value={evaluationStrictness}
                              onChange={(e) => setEvaluationStrictness(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all duration-200"
                            >
                              <option value="Strict Match">Strict Credentials Match (Prioritize exact academic and tech skills)</option>
                              <option value="Balanced Evaluation">Balanced Sourcing (Weighted evaluation of skills and bio context)</option>
                              <option value="Lenient Sourcing">Lenient Sourcing (High weight on project background and domain years)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
                              ▼
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Card 2: Hiring Pipeline Automation Toggles */}
                    <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Bell size={16} />
                          </div>
                          Hiring Pipeline Automation
                        </h3>
                        <p className="text-xs text-slate-450 mt-1">Automate communications and stage promotions across the talent network</p>
                      </div>

                      <div className="divide-y divide-slate-100 space-y-4">
                        {/* Toggle 1 */}
                        <div className="flex items-center justify-between py-2 pt-0">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Auto-Shortlist Trigger</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Enable direct stage promotion for applicants with high AI evaluation match scores.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAutoShortlist(!autoShortlist)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {autoShortlist ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>

                        {/* Toggle 2 */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Candidate Sourcing Emails</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Deliver automated notifications to candidates upon shortlisting or progression.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSendShortlistEmails(!sendShortlistEmails)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {sendShortlistEmails ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>

                        {/* Toggle 3 */}
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Interview Confirmation Invites</p>
                            <p className="text-[11px] text-slate-450 mt-0.5 leading-normal">
                              Auto-generate calendar invites and video instructions when booking interview slots.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSendInterviewEmails(!sendInterviewEmails)}
                            className="text-indigo-600 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-95"
                          >
                            {sendInterviewEmails ? <ToggleRight size={42} className="stroke-[1.5]" /> : <ToggleLeft size={42} className="stroke-[1.5] text-slate-300" />}
                          </button>
                        </div>
                      </div>
                    </Card>

                    {role === "recruiter" && (
                      /* Card 3: Active Workspace Access Directory (HR Recruiter Only) */
                      <Card className="p-8 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                              <Users size={16} />
                            </div>
                            Workspace access directory
                          </h3>
                          <p className="text-xs text-slate-450 mt-1">Review active talent acquisition staff and administrative access permissions</p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-widest text-[9px] bg-slate-50/50">
                                <th className="py-3 px-3 rounded-l-lg">Staff Member</th>
                                <th className="py-3 px-3">Corporate Title</th>
                                <th className="py-3 px-3">Authority Level</th>
                                <th className="py-3 px-3 rounded-r-lg text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {staffMembers.map((staff) => {
                                const avatarLetter = staff.name?.charAt(0) || "U";
                                const permissions = staff.email === "recruiter@hrise.com" 
                                  ? "Full Write Authority" 
                                  : staff.email === "recruiter@hrise.com" 
                                    ? "Pipeline Sourcing" 
                                    : "Read-Only Sourcing";
                                return (
                                  <tr key={staff.email} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-100 flex items-center justify-center flex-shrink-0 bg-indigo-50 shadow-inner">
                                        {staff.photoUrl ? (
                                          <img src={staff.photoUrl} className="w-full h-full object-cover" alt={staff.name} />
                                        ) : (
                                          <span className="text-indigo-700 font-extrabold text-[10px] uppercase">{avatarLetter}</span>
                                        )}
                                      </div>
                                      <div>
                                        <p>{staff.name}</p>
                                        <p className="text-[10px] text-slate-450 font-medium font-mono">{staff.email}</p>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 font-semibold text-slate-650">{staff.jobTitle}</td>
                                    <td className="py-3 px-3">
                                      <Badge variant={permissions === "Full Write Authority" ? "purple" : permissions === "Pipeline Sourcing" ? "info" : "default"} className="font-extrabold text-[9px]">
                                        {permissions}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Active
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </>
                )}

                {/* Theme Settings Card */}
                <Card className="p-8 border border-gray-200/85 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Sparkles size={16} />
                      </div>
                      Theme Preferences
                    </h3>
                    <p className="text-xs text-slate-450 mt-1">Configure workspace color mode theme</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2.5">Select Color Theme</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "light", label: "Light Mode", desc: "Clean and bright UI", color: "from-amber-400 to-orange-500" },
                        { value: "dark", label: "Dark Mode", desc: "Premium energy-saving dark UI", color: "from-slate-700 to-slate-900" },
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTheme(t.value)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all duration-250 cursor-pointer ${
                            theme === t.value
                              ? "border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-500/10 shadow-md"
                              : "border-slate-100 bg-white hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${t.color}`} />
                            <p className="text-sm font-extrabold text-slate-800">{t.label}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Leave Policy Configuration */}
                <Card className="p-8 border border-gray-200/85 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-6 animate-fade-in">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Sliders size={16} />
                      </div>
                      Leave Policy Configuration
                    </h3>
                    <p className="text-xs text-slate-450 mt-1">Configure annual allocated leave days per employee (configured limits are stored globally)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Medical Leave Limit</label>
                      <input
                        type="number"
                        value={medicalLeaveAllocated}
                        onChange={(e) => setMedicalLeaveAllocated(Number(e.target.value))}
                        required
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Casual Leave Limit</label>
                      <input
                        type="number"
                        value={casualLeaveAllocated}
                        onChange={(e) => setCasualLeaveAllocated(Number(e.target.value))}
                        required
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Earned Leave Limit</label>
                      <input
                        type="number"
                        value={earnedLeaveAllocated}
                        onChange={(e) => setEarnedLeaveAllocated(Number(e.target.value))}
                        required
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/20 text-slate-700 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                </Card>

                {/* Submit Actions */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="px-7 py-3.5 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center gap-2 cursor-pointer border border-transparent"
                  >
                    <Save size={16} />
                    {role === "management_admin" ? "Save Settings" : "Save Workspace Configurations"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Column: Timezones & Passwords */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Card 4: Workspace Security (Change Password) */}
              <Card className="p-7 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Lock size={14} />
                    </div>
                    Corporate Credentials
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Change password or update safety certificates</p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[11px] font-bold leading-normal animate-fade-in">
                      ⚠️ {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-bold leading-normal animate-fade-in flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" /> Passwords updated successfully.
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="Min 6 characters"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full py-3 font-bold hover:bg-slate-50 text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-sm border border-slate-200 cursor-pointer"
                  >
                    Update Passcode
                  </Button>
                </form>
              </Card>

              {/* Card 5: Core Localized Timezones */}
              <Card className="p-7 border border-gray-200/80 shadow-lg shadow-gray-100/30 rounded-2xl bg-white space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Globe size={14} />
                    </div>
                    Platform Timezone
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-1">Configure workspace localization settings</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Default Timezone</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={workspaceTimezone}
                      onChange={(e) => setWorkspaceTimezone(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/20 text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all"
                    >
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST • UTC+5:30)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT • UTC+0:00)</option>
                      <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT • UTC+8:00)</option>
                      <option value="US Eastern Time (EST)">US Eastern Time (EST • UTC-5:00)</option>
                      <option value="US Pacific Time (PST)">US Pacific Time (PST • UTC-8:00)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-[10px]">
                      ▼
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                    Schedules and interview session times will be anchored to this default hub timezone.
                  </p>
                </div>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
