import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ResumeScreeningPage from "./pages/ResumeScreeningPage";
import CandidateEvaluationPage from "./pages/CandidateEvaluationPage";
import VideoInterviewsPage from "./pages/VideoInterviewsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import JobDescriptionsPage from "./pages/JobDescriptionsPage";
import OnboardingPage from "./pages/OnboardingPage";
import CandidateApplicationsPage from "./pages/CandidateApplicationsPage";
import CandidateInterviewPage from "./pages/CandidateInterviewPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import UserManagementPage from "./pages/UserManagementPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import RecruitmentPage from "./pages/RecruitmentPage";
import EmployeesPage from "./pages/EmployeesPage";
import AttendancePage from "./pages/AttendancePage";
import PayrollPage from "./pages/PayrollPage";
import PerformancePage from "./pages/PerformancePage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import ManagerTeamPage from "./pages/ManagerTeamPage";
import ManagerAttendancePage from "./pages/ManagerAttendancePage";
import ManagerLeavesPage from "./pages/ManagerLeavesPage";
import ManagerPerformancePage from "./pages/ManagerPerformancePage";
import ManagerAnalyticsPage from "./pages/ManagerAnalyticsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { syncFromBackend } from "./utils/sync";

// ─── Role definitions ─────────────────────────────────────────────────────────
const ROLES = {
  MANAGEMENT_ADMIN: "management_admin",
  RECRUITER: "recruiter",
  SENIOR_MANAGER: "senior_manager",
  CANDIDATE: "candidate",
  EMPLOYEE: "employee",
};

// Where to redirect each role when they hit a forbidden page
const ROLE_HOME = {
  [ROLES.MANAGEMENT_ADMIN]: "/admin-dashboard",
  [ROLES.RECRUITER]: "/dashboard",
  [ROLES.SENIOR_MANAGER]: "/manager-dashboard",
  [ROLES.CANDIDATE]: "/applications",
  [ROLES.EMPLOYEE]: "/employee-dashboard",
};

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Renders `element` only if `user.role` is in `allowedRoles`.
// Otherwise silently redirects to the role's home page.
function ProtectedRoute({ element, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">Verifying session security...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) {
    const fallback = ROLE_HOME[user.role] ?? "/";
    return <Navigate to={fallback} replace />;
  }
  return element;
}

// ─── UnauthorizedPage — shown when directly navigating to forbidden URL ───────
function UnauthorizedPage() {
  const { user } = useAuth();
  const home = ROLE_HOME[user?.role] ?? "/";
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-10 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          You don't have permission to view this page. This area is restricted based on your account role.
        </p>
        <a
          href={home}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
        >
          ← Back to Dashboard
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Signed in as <span className="font-semibold">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-50/20 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-indigo-600 font-sans">Restoring active session...</p>
        </div>
      </div>
    );
  }

  // Handle public routes for unauthenticated sessions
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Redirect authenticated user if navigating to login page
  if (user && location.pathname === "/") {
    return <Navigate to={ROLE_HOME[user.role] ?? "/dashboard"} replace />;
  }

  const ADMIN = [ROLES.MANAGEMENT_ADMIN];
  const HR    = [ROLES.MANAGEMENT_ADMIN, ROLES.RECRUITER];
  const MGMT  = [ROLES.MANAGEMENT_ADMIN, ROLES.RECRUITER];
  const ALL   = [ROLES.MANAGEMENT_ADMIN, ROLES.RECRUITER, ROLES.SENIOR_MANAGER, ROLES.CANDIDATE, ROLES.EMPLOYEE];
  const PROFILE_ALLOWED = [ROLES.MANAGEMENT_ADMIN, ROLES.RECRUITER, ROLES.SENIOR_MANAGER, ROLES.CANDIDATE];
  const CAND  = [ROLES.CANDIDATE];

  return (
    <Routes>
      {/* ── Management Admin only ── */}
      <Route path="/admin-dashboard"  element={<ProtectedRoute element={<AdminDashboardPage />} allowedRoles={ADMIN} />} />
      <Route path="/user-management" element={<ProtectedRoute element={<UserManagementPage />} allowedRoles={ADMIN} />} />
      <Route path="/recruitment"     element={<ProtectedRoute element={<RecruitmentPage />}    allowedRoles={ADMIN} />} />
      <Route path="/employees"       element={<ProtectedRoute element={<EmployeesPage />}      allowedRoles={ADMIN} />} />
      <Route path="/attendance"      element={<ProtectedRoute element={<AttendancePage />}     allowedRoles={ADMIN} />} />
      <Route path="/payroll"         element={<ProtectedRoute element={<PayrollPage />}        allowedRoles={ADMIN} />} />
      <Route path="/performance"     element={<ProtectedRoute element={<PerformancePage />}    allowedRoles={ADMIN} />} />
      <Route path="/admin-analytics" element={<ProtectedRoute element={<AdminAnalyticsPage />} allowedRoles={ADMIN} />} />

      {/* ── HR + Admin ── */}
      <Route path="/dashboard"        element={<ProtectedRoute element={<DashboardPage />}       allowedRoles={MGMT} />} />
      <Route path="/resumes"          element={<ProtectedRoute element={<ResumeScreeningPage />} allowedRoles={HR} />} />
      <Route path="/evaluation/:candidateId" element={<ProtectedRoute element={<CandidateEvaluationPage />} allowedRoles={HR} />} />
      <Route path="/interviews"       element={<ProtectedRoute element={<VideoInterviewsPage />} allowedRoles={HR} />} />
      <Route path="/job-descriptions" element={<ProtectedRoute element={<JobDescriptionsPage />} allowedRoles={HR} />} />
      <Route path="/settings"         element={<ProtectedRoute element={<SettingsPage />}        allowedRoles={HR} />} />
      <Route path="/analytics"        element={<ProtectedRoute element={<AnalyticsPage />}       allowedRoles={MGMT} />} />

      {/* ── Senior Manager only ── */}
      <Route path="/manager-dashboard"  element={<ProtectedRoute element={<ManagerDashboardPage />} allowedRoles={[ROLES.SENIOR_MANAGER]} />} />
      <Route path="/manager-team"       element={<ProtectedRoute element={<ManagerTeamPage />}      allowedRoles={[ROLES.SENIOR_MANAGER]} />} />
      <Route path="/manager-attendance" element={<ProtectedRoute element={<ManagerAttendancePage />}  allowedRoles={[ROLES.SENIOR_MANAGER]} />} />
      <Route path="/manager-leaves"     element={<ProtectedRoute element={<ManagerLeavesPage />}      allowedRoles={[ROLES.SENIOR_MANAGER]} />} />
      <Route path="/manager-performance"element={<ProtectedRoute element={<ManagerPerformancePage />}  allowedRoles={[ROLES.SENIOR_MANAGER]} />} />
      <Route path="/manager-analytics"  element={<ProtectedRoute element={<ManagerAnalyticsPage />}  allowedRoles={[ROLES.SENIOR_MANAGER]} />} />

      {/* ── Employee only ── */}
      <Route path="/employee-dashboard" element={<ProtectedRoute element={<EmployeeDashboardPage />} allowedRoles={[ROLES.EMPLOYEE]} />} />

      {/* ── All logged-in users ── */}
      <Route path="/profile"    element={<ProtectedRoute element={<ProfilePage />}    allowedRoles={PROFILE_ALLOWED} />} />
      <Route path="/onboarding" element={<ProtectedRoute element={<OnboardingPage />} allowedRoles={[...HR, ROLES.CANDIDATE, ROLES.SENIOR_MANAGER]} />} />

      {/* ── Candidate only ── */}
      <Route path="/applications" element={<ProtectedRoute element={<CandidateApplicationsPage />} allowedRoles={CAND} />} />
      <Route path="/my-interview" element={<ProtectedRoute element={<CandidateInterviewPage />}    allowedRoles={CAND} />} />

      {/* ── Catch-all ── */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to={ROLE_HOME[user.role] ?? "/"} replace />} />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    // 1. Initial db reset migration if first time to clear old mock/dummy state
    const isWiped = localStorage.getItem("hrise_db_wiped_v10");
    if (!isWiped) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("hrise_")) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem("hrise_db_wiped_v10", "true");
      window.location.reload();
      return;
    }

    // 2. Fetch live data from MongoDB and populate frontend cache
    syncFromBackend();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
