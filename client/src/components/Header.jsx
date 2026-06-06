import { 
  Bell, 
  Search, 
  UserCircle, 
  CheckCircle, 
  Info, 
  Sparkles, 
  UserPlus, 
  X, 
  Trash2,
  Briefcase,
  Users
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function formatTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(isoString).toLocaleDateString();
}



export function Header({ title, searchQuery = "", onSearchChange }) {
  const { user, updateUser } = useAuth();
  const [localSearch, setLocalSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const displaySearch = onSearchChange ? searchQuery : localSearch;

  const handleSearchChange = (val) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
  };

  const navigate = useNavigate();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const userRole = user?.role || "candidate";

  // Global search matcher for management admin
  const globalResults = useMemo(() => {
    if (!localSearch || onSearchChange || userRole !== "management_admin") {
      return { jobs: [], candidates: [], employees: [] };
    }
    const q = localSearch.toLowerCase();
    
    const localJobs = JSON.parse(localStorage.getItem("hrise_jobs") || "[]");
    const localCandidates = JSON.parse(localStorage.getItem("hrise_candidates") || "[]");
    const localStaff = JSON.parse(localStorage.getItem("hrise_staff_profiles") || "[]");

    const searchJobs = localJobs.map(j => ({ id: j._id || j.id, title: j.title || "Untitled Role", dept: j.department || "Engineering" }));
    const searchCandidates = localCandidates.map(c => ({ id: c._id || c.id, name: c.name || "Anonymous", job: c.jobTitle || "Job Position", status: c.status || "applied" }));
    const searchEmployees = localStaff.map(s => ({ id: s._id || s.id, name: s.name || "Anonymous", designation: s.designation || s.jobTitle || "Employee", dept: s.department || "Engineering" }));

    return {
      jobs: searchJobs.filter(j => j.title.toLowerCase().includes(q) || j.dept.toLowerCase().includes(q)).slice(0, 3),
      candidates: searchCandidates.filter(c => c.name.toLowerCase().includes(q) || c.job.toLowerCase().includes(q)).slice(0, 3),
      employees: searchEmployees.filter(e => e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)).slice(0, 3)
    };
  }, [localSearch, onSearchChange, userRole]);

  const hasGlobalResults = globalResults.jobs.length > 0 || globalResults.candidates.length > 0 || globalResults.employees.length > 0;

  const handleResultClick = (type, item) => {
    setIsFocused(false);
    setLocalSearch("");
    if (type === "job") {
      navigate(`/recruitment?tab=jobs&search=${encodeURIComponent(item.title)}`);
    } else if (type === "candidate") {
      navigate(`/recruitment?tab=candidates&search=${encodeURIComponent(item.name)}`);
    } else if (type === "employee") {
      navigate(`/employees?search=${encodeURIComponent(item.name)}`);
    }
  };
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.readStatus).length;

  const fetchNotifications = async () => {
    try {
      const { api } = await import("../utils/api");
      const list = await api.notifications.getAll();
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    window.addEventListener("hrise_notifications_update", fetchNotifications);
    window.addEventListener("storage", fetchNotifications);
    return () => {
      window.removeEventListener("hrise_notifications_update", fetchNotifications);
      window.removeEventListener("storage", fetchNotifications);
    };
  }, [userRole]);

  const markAllAsRead = async () => {
    try {
      const { api } = await import("../utils/api");
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { api } = await import("../utils/api");
      await api.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { api } = await import("../utils/api");
      await api.notifications.clearAll();
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "shortlist":
        return <CheckCircle size={14} className="text-emerald-600" />;
      case "upload":
        return <UserPlus size={14} className="text-blue-600" />;
      case "interview":
        return <Sparkles size={14} className="text-purple-600" />;
      case "onboarding":
        return <UserPlus size={14} className="text-pink-600" />;
      default:
        return <Info size={14} className="text-indigo-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "shortlist":
        return "bg-emerald-50";
      case "upload":
        return "bg-blue-50";
      case "interview":
        return "bg-purple-50";
      case "onboarding":
        return "bg-pink-50";
      default:
        return "bg-indigo-50";
    }
  };

  const getSearchPlaceholder = () => {
    switch (userRole) {
      case "management_admin":
        return "Search employees, recruiters, managers, jobs...";
      case "recruiter":
        return "Search candidates, resumes, interviews, jobs...";
      case "senior_manager":
        return "Search team members, attendance, reviews...";
      case "employee":
        return "Search attendance, leave, payroll, performance...";
      case "candidate":
      default:
        return "Search jobs, applications, interviews...";
    }
  };

  return (
    <header className="sticky top-0 z-35 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 hidden sm:block">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative hidden md:flex items-center bg-gray-100 rounded-xl px-3.5 py-2 w-64 md:w-80 lg:w-[420px] border border-transparent focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
            <Search size={16} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={displaySearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 font-medium text-gray-800"
            />

            {/* Global Search Results Overlay */}
            {isFocused && localSearch && userRole === "management_admin" && (
              <div 
                className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl z-50 p-4 max-h-[400px] overflow-y-auto w-[420px] divide-y divide-gray-100 cursor-default"
                onMouseDown={(e) => e.preventDefault()}
              >
                {!hasGlobalResults ? (
                  <div className="p-4 text-center text-sm text-gray-500 font-medium">
                    No workspace matches found.
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {globalResults.jobs.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Briefcase size={12} className="text-gray-400" /> Matching Positions ({globalResults.jobs.length})
                        </h4>
                        <div className="space-y-0.5">
                          {globalResults.jobs.map(j => (
                            <button
                              key={j.id}
                              onClick={() => handleResultClick("job", j)}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 text-xs font-semibold text-gray-800 transition-colors flex items-center justify-between cursor-pointer border-none"
                            >
                              <span>{j.title}</span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-150">
                                {j.dept}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {globalResults.employees.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Users size={12} className="text-gray-400" /> Employees ({globalResults.employees.length})
                        </h4>
                        <div className="space-y-0.5">
                          {globalResults.employees.map(e => (
                            <button
                              key={e.id}
                              onClick={() => handleResultClick("employee", e)}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 text-xs font-semibold text-gray-800 transition-colors flex items-center justify-between cursor-pointer border-none"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{e.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium">{e.designation}</p>
                              </div>
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-150">
                                {e.dept}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {globalResults.candidates.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <UserCircle size={12} className="text-gray-400" /> Candidates ({globalResults.candidates.length})
                        </h4>
                        <div className="space-y-0.5">
                          {globalResults.candidates.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleResultClick("candidate", c)}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 text-xs font-semibold text-gray-800 transition-colors flex items-center justify-between cursor-pointer border-none"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{c.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium">Applied for {c.job}</p>
                              </div>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-150 capitalize">
                                {c.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-950 text-sm">Notifications</h3>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                      {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 flex items-start gap-3 transition-all hover:bg-gray-50/50 ${!notif.readStatus ? "bg-indigo-50/20" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconBg(notif.type)}`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <p className={`text-xs font-bold ${!notif.readStatus ? "text-gray-950" : "text-gray-700"}`}>
                              {notif.title}
                            </p>
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                            {notif.message}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1 font-mono">
                            {formatTime(notif.createdAt || notif.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                        <Bell size={16} className="text-gray-400" />
                      </div>
                      <p className="text-xs font-bold text-gray-700">All caught up!</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">No new system alerts or candidate activities.</p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex items-center justify-center">
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User */}
          <button
            onClick={() => {
              if (userRole === "employee") {
                navigate("/employee-dashboard?tab=profile");
              } else {
                navigate("/profile");
              }
            }}
            className="flex items-center gap-2 pl-3 border-l border-gray-200 hover:opacity-85 transition-opacity text-left cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-100 flex items-center justify-center bg-gray-50 flex-shrink-0">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user?.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold animate-fade-in">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace("-", " ")}
              </p>
            </div>
            <UserCircle size={16} className="text-gray-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
