import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Video,
  BarChart3,
  Briefcase,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Users,
  Calendar,
  DollarSign,
  Award,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { cn } from "../utils/cn";

const managementAdminNav = [
  { label: "Dashboard", path: "/admin-dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "User Management", path: "/user-management", icon: <Users size={20} /> },
  { label: "Recruitment", path: "/recruitment", icon: <Briefcase size={20} /> },
  { label: "Employees", path: "/employees", icon: <User size={20} /> },
  { label: "Attendance", path: "/attendance", icon: <Calendar size={20} /> },
  { label: "Payroll", path: "/payroll", icon: <DollarSign size={20} /> },
  { label: "Performance", path: "/performance", icon: <Award size={20} /> },
  { label: "Analytics", path: "/admin-analytics", icon: <BarChart3 size={20} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
];

const recruiterNav = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Resume Screening", path: "/resumes", icon: <FileText size={20} /> },
  { label: "Video Interviews", path: "/interviews", icon: <Video size={20} /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 size={20} /> },
  { label: "Job Descriptions", path: "/job-descriptions", icon: <Briefcase size={20} /> },
  { label: "Onboarding", path: "/onboarding", icon: <UserPlus size={20} /> },
  { label: "My Profile", path: "/profile", icon: <User size={20} /> },
  { label: "Settings", path: "/settings", icon: <Settings size={20} /> },
];

const seniorManagerNav = [
  { label: "Dashboard", path: "/manager-dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Team Members", path: "/manager-team", icon: <Users size={20} /> },
  { label: "Attendance Review", path: "/manager-attendance", icon: <Calendar size={20} /> },
  { label: "Leave Approvals", path: "/manager-leaves", icon: <Briefcase size={20} /> },
  { label: "Performance Reviews", path: "/manager-performance", icon: <Award size={20} /> },
  { label: "Department Analytics", path: "/manager-analytics", icon: <BarChart3 size={20} /> },
  { label: "My Profile", path: "/profile", icon: <User size={20} /> },
];

const candidateNav = [
  { label: "My Applications", path: "/applications", icon: <Briefcase size={20} /> },
  { label: "Video Interviews", path: "/my-interview", icon: <Video size={20} /> },
  { label: "Onboarding", path: "/onboarding", icon: <UserPlus size={20} /> },
  { label: "My Profile", path: "/profile", icon: <User size={20} /> },
];

const employeeNav = [
  { label: "Dashboard", path: "/employee-dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Attendance", path: "/employee-dashboard?tab=attendance", icon: <Calendar size={20} /> },
  { label: "Leave Management", path: "/employee-dashboard?tab=leaves", icon: <Briefcase size={20} /> },
  { label: "Payroll", path: "/employee-dashboard?tab=payroll", icon: <DollarSign size={20} /> },
  { label: "Performance", path: "/employee-dashboard?tab=performance", icon: <Award size={20} /> },
  { label: "My Profile", path: "/employee-dashboard?tab=profile", icon: <User size={20} /> },
];

const NAV_MAP = {
  management_admin: managementAdminNav,
  recruiter: recruiterNav,
  senior_manager: seniorManagerNav,
  candidate: candidateNav,
  employee: employeeNav,
};

export function Sidebar({ role }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = NAV_MAP[role] || candidateNav;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-gray-900 w-64 flex flex-col z-50 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">
              HRise
            </h1>
            <p className="text-gray-500 text-xs">AI HR Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path.includes("?")
              ? (location.pathname + location.search) === item.path
              : location.pathname === item.path && (!location.search || !location.search.includes("tab="));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
