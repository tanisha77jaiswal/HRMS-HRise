import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Brain,
  Users,
  FileText,
  Video,
  BarChart3,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Lock,
  Mail,
  Building2,
  User,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  Globe,
  Star,
  Crown,
  Briefcase,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isCandidate, setIsCandidate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePassword, setCandidatePassword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpCompany, setSignUpCompany] = useState("");
  const [signUpIndustry, setSignUpIndustry] = useState("");
  const [signUpCompanySize, setSignUpCompanySize] = useState("");

  const features = [
    {
      icon: <Brain size={20} />,
      title: "AI Resume Screening & Parsing",
      desc: "Gemini-powered semantic parsing and matching with automatic skill gap identification.",
      color: "#6366f1"
    },
    {
      icon: <Video size={20} />,
      title: "AI-Evaluated Video Interviews",
      desc: "Asynchronous voice and sentiment analysis with automated scoring and transcriptions.",
      color: "#8b5cf6"
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Predictive Analytics & Metrics",
      desc: "Real-time candidate pipelines, workforce alignment metrics, and predictive performance data.",
      color: "#06b6d4"
    },
    {
      icon: <Users size={20} />,
      title: "Automated Offers & Onboarding",
      desc: "Structured compliance tracking, document verification, and automated offer generator.",
      color: "#10b981"
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDemoLogin = async (role) => {
    setLoading(true);
    setLoginError("");
    try {
      let email = "admin@hrise.com";
      if (role === "candidate") email = "candidate@hrise.com";
      else if (role === "employee") email = "employee@hrise.com";
      else if (role === "recruiter") email = "recruiter@hrise.com";
      else if (role === "senior_manager") email = "manager@hrise.com";
      else if (role === "govind") email = "govind@example.com";
      else if (role === "tanisha") email = "tanisha.jaiswal@screened.com";
      const password = role === "tanisha" ? "password123" : "password";
      const loggedUser = await login(email, password);
      if (loggedUser.role === "candidate") navigate("/applications");
      else if (loggedUser.role === "employee") navigate("/employee-dashboard");
      else if (loggedUser.role === "management_admin") navigate("/admin-dashboard");
      else if (loggedUser.role === "senior_manager") navigate("/manager-dashboard");
      else if (loggedUser.role === "recruiter") navigate("/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setLoginError(err.message || "Failed to log in as demo account.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setLoading(true);
    setLoginError("");
    try {
      const loggedUser = await login(loginEmail, loginPassword);
      if (loggedUser.role === "candidate") navigate("/applications");
      else if (loggedUser.role === "employee") navigate("/employee-dashboard");
      else if (loggedUser.role === "management_admin") navigate("/admin-dashboard");
      else if (loggedUser.role === "senior_manager") navigate("/manager-dashboard");
      else if (loggedUser.role === "recruiter") navigate("/dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setLoginError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSignUp = async (e) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpCompany || !signUpIndustry || !signUpCompanySize) return;
    setLoading(true);
    setLoginError("");
    try {
      const newUser = await signup({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        company: signUpCompany,
        industry: signUpIndustry,
        companySize: signUpCompanySize,
        role: "management_admin",
      });
      if (newUser?.role === "management_admin") navigate("/admin-dashboard");
      else navigate("/dashboard");
    } catch (err) {
      setLoginError(err.message || "Failed to sign up. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSignIn = async (e) => {
    e.preventDefault();
    if (!candidateEmail || !candidatePassword) return;
    setLoading(true);
    setLoginError("");
    try {
      await login(candidateEmail, candidatePassword);
      navigate("/applications");
    } catch (err) {
      setLoginError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSignUp = async (e) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail || !candidatePassword) return;
    setLoading(true);
    setLoginError("");
    try {
      await signup({ name: candidateName, email: candidateEmail, password: candidatePassword, role: "candidate" });
      navigate("/applications");
    } catch (err) {
      setLoginError(err.message || "Failed to sign up. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #080c18;
        }

        /* ═══ LEFT HERO PANEL ═══ */
        .lp-hero {
          display: none;
          flex: 0 0 52%;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0d1224 0%, #0a0f1e 50%, #0d1633 100%);
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
        }
        @media (min-width: 1024px) { .lp-hero { display: flex; } }

        /* Animated mesh gradient */
        .lp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 60% 30%, rgba(6,182,212,0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Dot grid */
        .lp-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .hero-content { position: relative; z-index: 10; }

        /* Brand */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 3.5rem;
        }
        .lp-brand-icon {
          width: 42px; height: 42px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(79,70,229,0.35);
        }
        .lp-brand-name { font-size: 1.35rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .lp-brand-tag {
          font-size: 0.65rem; font-weight: 600;
          background: rgba(99,102,241,0.2);
          color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 20px;
          padding: 3px 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Hero headline */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 30px;
          padding: 6px 14px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 1.5rem;
          letter-spacing: 0.04em;
        }
        .hero-badge-dot {
          width: 6px; height: 6px;
          background: #6366f1;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .hero-h1 {
          font-size: 3rem; font-weight: 900;
          color: #fff; line-height: 1.1;
          letter-spacing: -1.5px;
          margin-bottom: 1.25rem;
        }
        .hero-h1 span {
          background: linear-gradient(135deg, #818cf8, #c084fc, #67e8f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 1rem; color: rgba(148,163,184,0.9);
          line-height: 1.7; margin-bottom: 2.5rem;
          max-width: 420px;
        }

        /* Feature cards */
        .feature-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 2.5rem; }
        .feature-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          transition: all 0.4s ease;
          cursor: default;
        }
        .feature-card.active {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.25);
          transform: translateX(6px);
        }
        .feature-card-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .feature-card-body {}
        .feature-card-title { font-size: 0.85rem; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
        .feature-card-desc { font-size: 0.72rem; color: rgba(148,163,184,0.7); font-weight: 400; }

        /* Stats row */
        .stat-row {
          display: flex; gap: 12px;
          position: relative; z-index: 10;
        }
        .stat-card {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px 14px;
          text-align: center;
          transition: all 0.3s;
        }
        .stat-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }
        .stat-num {
          font-size: 1.4rem; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; line-height: 1;
        }
        .stat-lbl {
          font-size: 0.65rem; font-weight: 600; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-top: 5px;
        }

        /* Reviews */
        .hero-social {
          position: relative; z-index: 10;
          display: flex; align-items: center; gap: 12px;
          margin-top: 1.5rem;
        }
        .avatar-stack { display: flex; }
        .avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid #0d1224;
          margin-left: -8px;
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: #fff;
        }
        .avatar:first-child { margin-left: 0; }
        .social-text { font-size: 0.75rem; color: rgba(148,163,184,0.8); }
        .social-text strong { color: #e2e8f0; }
        .stars { display: flex; gap: 2px; margin-bottom: 2px; }

        /* ═══ RIGHT FORM PANEL ═══ */
        .lp-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          background: #f8fafc;
          overflow-y: auto;
          position: relative;
        }
        .lp-form-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          opacity: 0.5;
        }
        /* Soft glow at top */
        .lp-form-panel::after {
          content: '';
          position: absolute;
          top: -120px; left: 50%;
          transform: translateX(-50%);
          width: 500px; height: 300px;
          background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .form-container {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 10;
          animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile brand */
        .mobile-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 2rem;
        }
        .mobile-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(79,70,229,0.3);
        }
        @media (min-width: 1024px) { .mobile-brand { display: none; } }

        /* Form Card */
        .form-card {
          background: #fff;
          border: 1px solid #e8ecf0;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04), 0 20px 40px -10px rgba(0,0,0,0.07);
          margin-bottom: 1rem;
        }

         /* Portal Toggle */
        .portal-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 1.75rem;
          border: 1px solid #e2e8f0;
          gap: 4px;
        }
        .portal-btn {
          flex: 1; padding: 10px 12px;
          font-size: 0.82rem; font-weight: 600;
          border-radius: 9px; border: none; cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; justify-content: center; gap: 7px;
          font-family: inherit;
        }
        .portal-btn.active-staff {
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          color: #fff;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }
        .portal-btn.active-candidate {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        .portal-btn.inactive {
          background: transparent; color: #64748b;
        }
        .portal-btn.inactive:hover { color: #0f172a; background: rgba(0,0,0,0.04); }

        /* Panel Themes */
        .lp-form-panel.staff-theme {
          background: #f8fafc;
          transition: background-color 0.4s ease;
        }
        .lp-form-panel.candidate-theme {
          background: #f0fdf4;
          transition: background-color 0.4s ease;
        }
        .lp-form-panel.staff-theme::before {
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
        }
        .lp-form-panel.candidate-theme::before {
          background-image: radial-gradient(#a7f3d0 1px, transparent 1px);
        }
        .lp-form-panel.staff-theme::after {
          background: radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%);
        }
        .lp-form-panel.candidate-theme::after {
          background: radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%);
        }

        /* Form heading */
        .form-heading { margin-bottom: 1.5rem; }
        .form-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 4px 12px; border-radius: 20px;
          margin-bottom: 0.75rem;
        }
        .form-eyebrow.staff {
          background: #f5f3ff; color: #6d28d9;
          border: 1px solid #ede9fe;
        }
        .form-eyebrow.candidate {
          background: #ecfdf5; color: #065f46;
          border: 1px solid #d1fae5;
        }
        .form-title {
          font-size: 1.55rem; font-weight: 800;
          color: #0f172a; letter-spacing: -0.5px;
          line-height: 1.2; margin-bottom: 0.4rem;
        }
        .form-subtitle { font-size: 0.82rem; color: #64748b; line-height: 1.5; }

        /* Field */
        .field { margin-bottom: 0.875rem; }
        .field-label {
          display: block;
          font-size: 0.72rem; font-weight: 700;
          color: #374151; margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 12px;
          top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none;
          display: flex;
        }
        .field-input {
          width: 100%;
          padding: 11px 12px 11px 38px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0f172a;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
        }
        .field-input::placeholder { color: #94a3b8; }
        .field-input:focus {
          background: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .field-input.error { border-color: #f87171; }
        .field-input.error:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.15); }

        .field-select {
          width: 100%;
          padding: 11px 36px 11px 38px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0f172a;
          font-family: inherit;
          transition: all 0.2s;
          outline: none;
          appearance: none;
          cursor: pointer;
        }
        .field-select:focus {
          background: #fff;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .field-select-arrow {
          position: absolute; right: 12px;
          top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none;
          display: flex;
        }
        .eye-toggle {
          position: absolute; right: 12px;
          top: 50%; transform: translateY(-50%);
          color: #9ca3af; cursor: pointer;
          background: none; border: none; padding: 2px;
          display: flex; transition: color 0.2s;
        }
        .eye-toggle:hover { color: #6366f1; }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } }

        /* Error box */
        .error-box {
          display: flex; gap: 10px;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 1rem;
          animation: slideUp 0.3s ease;
        }
        .error-title { font-size: 0.8rem; font-weight: 700; color: #991b1b; }
        .error-msg { font-size: 0.72rem; color: #b91c1c; margin-top: 2px; line-height: 1.5; }

        /* Primary button */
        .btn-primary {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #4f46e5, #6d28d9);
          color: #fff; border: none;
          border-radius: 11px;
          font-size: 0.9rem; font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 14px rgba(79,70,229,0.3);
          margin-top: 0.25rem;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .btn-primary:hover:not(:disabled)::before { opacity: 1; }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(79,70,229,0.4);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .btn-primary.candidate-btn {
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          box-shadow: 0 4px 14px rgba(14,165,233,0.3);
        }
        .btn-primary.candidate-btn:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(14,165,233,0.4);
        }

        /* Loading spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Section divider */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 1.25rem 0 1rem;
        }
        .divider-line { flex: 1; height: 1px; background: #e8ecf0; }
        .divider-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }

        /* Demo panel */
        .demo-section { margin-top: 1rem; }
        .demo-heading {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.7rem; font-weight: 800;
          color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .demo-heading-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f59e0b;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .demo-cards { display: flex; flex-direction: column; gap: 7px; }
        .demo-card {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e8ecf0;
          border-radius: 10px;
          cursor: pointer; width: 100%; text-align: left;
          font-family: inherit;
          transition: all 0.2s;
        }
        .demo-card:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #c7d2fe;
          box-shadow: 0 2px 8px rgba(99,102,241,0.08);
          transform: translateX(2px);
        }
        .demo-card:disabled { opacity: 0.5; cursor: not-allowed; }
        .demo-card-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .demo-card-label { font-size: 0.8rem; font-weight: 700; color: #0f172a; }
        .demo-card-sub { font-size: 0.68rem; color: #64748b; margin-top: 1px; }
        .demo-card-arrow { margin-left: auto; color: #c7d2fe; flex-shrink: 0; }

        /* Info note */
        .info-note {
          display: flex; gap: 10px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 11px 12px;
          margin-top: 0.75rem;
        }
        .info-note-title { font-size: 0.78rem; font-weight: 700; color: #0369a1; }
        .info-note-body { font-size: 0.7rem; color: #0284c7; line-height: 1.6; margin-top: 2px; }

        /* Admin badge */
        .admin-badge {
          display: flex; align-items: center; gap: 12px;
          background: linear-gradient(135deg, #faf5ff, #f5f3ff);
          border: 1px solid #e9d5ff;
          border-radius: 11px;
          padding: 11px 13px;
          margin-top: 0.5rem;
        }
        .admin-badge-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(124,58,237,0.25);
        }
        .admin-badge-label { font-size: 0.8rem; font-weight: 800; color: #5b21b6; }
        .admin-badge-sub { font-size: 0.68rem; color: #8b5cf6; margin-top: 2px; }

        /* Scroll container for signup */
        .signup-scroll { max-height: 70vh; overflow-y: auto; padding-right: 4px; }
        .signup-scroll::-webkit-scrollbar { width: 4px; }
        .signup-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .signup-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; }

        /* Toggle link */
        .toggle-row {
          text-align: center;
          margin-top: 1.25rem;
        }
        .toggle-link {
          font-size: 0.82rem; color: #64748b;
        }
        .toggle-btn {
          background: none; border: none; cursor: pointer;
          font-size: 0.82rem; font-weight: 700; color: #4f46e5;
          font-family: inherit; padding: 0; margin-left: 4px;
          transition: color 0.2s;
        }
        .toggle-btn:hover { color: #3730a3; text-decoration: underline; }

        /* Footer */
        .form-footer {
          text-align: center;
          padding: 1.25rem 0 0;
        }
        .footer-powered { font-size: 0.68rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .footer-badges { display: flex; align-items: center; justify-content: center; gap: 18px; }
        .footer-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.7rem; font-weight: 500; color: #94a3b8;
        }

        /* Crown pulse */
        @keyframes crown-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.08) rotate(-5deg); }
        }
        .crown-anim { animation: crown-pulse 3s ease-in-out infinite; display: inline-block; }

        /* AI + ML badges */
        .hero-capabilities {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 2rem;
        }
        .cap-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #cbd5e1;
          transition: all 0.3s ease;
        }
        .cap-badge:hover {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.35);
          color: #a5b4fc;
        }

        /* Workflow diagram */
        .workflow-section {
          margin: 2.25rem 0;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.25rem;
        }
        .workflow-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .workflow-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .workflow-steps::before {
          content: '';
          position: absolute;
          left: 20px;
          right: 20px;
          top: 18px;
          height: 2px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.12) 40%, transparent 40%);
          background-size: 6px 2px;
          z-index: 1;
        }
        .workflow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }
        .workflow-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0f172a;
          border: 2px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.3s ease;
        }
        .workflow-step.completed .workflow-icon {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        .workflow-step.active .workflow-icon {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
        }
        .workflow-label {
          font-size: 0.65rem;
          font-weight: 600;
          color: #64748b;
          margin-top: 8px;
          text-align: center;
        }
        .workflow-step.completed .workflow-label {
          color: #34d399;
        }
        .workflow-step.active .workflow-label {
          color: #a5b4fc;
        }

        /* Unified demo Quick Role Access */
        .demo-section-global {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        .demo-title-global {
          font-size: 0.72rem;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .demo-grid-global {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .demo-role-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }
        .demo-role-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        }
        .demo-role-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .demo-role-card.role-admin:hover { border-color: #818cf8; background: #faf5ff; }
        .demo-role-card.role-recruiter:hover { border-color: #3b82f6; background: #eff6ff; }
        .demo-role-card.role-manager:hover { border-color: #8b5cf6; background: #f5f3ff; }
        .demo-role-card.role-employee:hover { border-color: #0d9488; background: #f0fdfa; }
        .demo-role-card.role-candidate:hover { border-color: #10b981; background: #f0fdf4; }

        .demo-role-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .demo-role-info {
          flex: 1;
        }
        .demo-role-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .demo-role-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: #1e293b;
        }
        .demo-role-user {
          font-size: 0.62rem;
          font-weight: 700;
          color: #475569;
          background: #e2e8f0;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .demo-role-desc {
          font-size: 0.66rem;
          color: #64748b;
          margin-top: 1px;
          line-height: 1.3;
        }
      `}</style>

      <div className="lp-root">

        {/* ══════════════ HERO LEFT PANEL ══════════════ */}
        <div className="lp-hero">
          <div className="hero-content">
            {/* Brand */}
            <div className="lp-brand">
              <div className="lp-brand-icon">
                <Brain size={22} color="#fff" />
              </div>
              <div>
                <div className="lp-brand-name">HRise</div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="hero-h1">
              Hire Smarter.<br />
              <span>Grow Faster.</span>
            </h1>
            <p className="hero-desc">
              The complete AI-driven HR platform — from intelligent resume screening to automated video interviews and real-time workforce analytics.
            </p>

            {/* AI + ML Capability Badges */}
            <div className="hero-capabilities">
              <span className="cap-badge">
                <Sparkles size={11} /> NLP Resume Parsing
              </span>
              <span className="cap-badge">
                <Brain size={11} /> Gemini Evaluation
              </span>
              <span className="cap-badge">
                <Video size={11} /> Voice &amp; Speech Sentiment
              </span>
              <span className="cap-badge">
                <BarChart3 size={11} /> Fit Analytics
              </span>
            </div>

            {/* Hiring Workflow Diagram */}
            <div className="workflow-section">
              <div className="workflow-title">
                <Zap size={11} color="#f59e0b" /> Automated AI Hiring Workflow
              </div>
              <div className="workflow-steps">
                {[
                  { label: "Apply", state: "completed", icon: <User size={13} /> },
                  { label: "AI Screen", state: "active", icon: <Brain size={13} /> },
                  { label: "AI Video", state: "pending", icon: <Video size={13} /> },
                  { label: "Review", state: "pending", icon: <Users size={13} /> },
                  { label: "Onboard", state: "pending", icon: <CheckCircle2 size={13} /> },
                ].map((step, idx) => (
                  <div key={idx} className={`workflow-step ${step.state}`}>
                    <div className="workflow-icon">{step.icon}</div>
                    <div className="workflow-label">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature cards */}
            <div className="feature-stack">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`feature-card${activeFeature === i ? " active" : ""}`}
                >
                  <div
                    className="feature-card-icon"
                    style={{ background: `${f.color}18`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <div className="feature-card-body">
                    <div className="feature-card-title">{f.title}</div>
                    <div className="feature-card-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="stat-row">
              {[
                { num: "500+", lbl: "Companies" },
                { num: "4 AI", lbl: "Modules" },
                { num: "99.9%", lbl: "Uptime" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-num">{s.num}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>



            <p style={{ color: "rgba(100,116,139,0.6)", fontSize: "0.65rem", marginTop: "1.25rem", letterSpacing: "0.03em" }}>
              © 2026 HRise AI. All rights reserved.
            </p>
          </div>
        </div>

        {/* ══════════════ FORM RIGHT PANEL ══════════════ */}
        <div className={`lp-form-panel ${isCandidate ? "candidate-theme" : "staff-theme"}`}>
          <div className="form-container">

            {/* Mobile brand */}
            <div className="mobile-brand">
              <div className="mobile-brand-icon">
                <Brain size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>HRise</div>
                <div style={{ fontSize: "0.65rem", color: "#64748b" }}>HRMS Portal</div>
              </div>
            </div>

            <div className="form-card">
              {/* Portal toggle */}
              <div className="portal-toggle">
                <button
                  className={`portal-btn ${!isCandidate ? "active-staff" : "inactive"}`}
                  onClick={() => { setIsCandidate(false); setLoginError(""); setIsSignUp(false); }}
                  id="tab-staff"
                >
                  <Building2 size={14} />
                  Staff Portal
                </button>
                <button
                  className={`portal-btn ${isCandidate ? "active-candidate" : "inactive"}`}
                  onClick={() => { setIsCandidate(true); setLoginError(""); setIsSignUp(false); }}
                  id="tab-candidate"
                >
                  <Briefcase size={14} />
                  Candidate Portal
                </button>
              </div>

              {/* ─── STAFF PORTAL ─── */}
              {!isCandidate && (
                <>
                  {isSignUp ? (
                    /* COMPANY WORKSPACE REGISTRATION */
                    <>
                      <div className="form-heading">
                        <div className="form-eyebrow staff">
                          <span className="crown-anim"><Crown size={10} /></span>
                          Enterprise Setup
                        </div>
                        <div className="form-title">Create Your Workspace</div>
                        <div className="form-subtitle">
                          Register your company and instantly become the <strong style={{ color: "#6d28d9" }}>Management Admin</strong>.
                        </div>
                      </div>

                      <div className="signup-scroll">
                        <form onSubmit={handleCustomSignUp}>
                          {loginError && (
                            <div className="error-box">
                              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                              <div>
                                <div className="error-title">Registration Failed</div>
                                <div className="error-msg">{loginError}</div>
                              </div>
                            </div>
                          )}

                          <div className="divider">
                            <div className="divider-line" />
                            <span className="divider-label">Company Details</span>
                            <div className="divider-line" />
                          </div>

                          <div className="field">
                            <label className="field-label" htmlFor="company-name">Company Name</label>
                            <div className="field-wrap">
                              <span className="field-icon"><Building2 size={15} /></span>
                              <input
                                id="company-name" type="text" required
                                className="field-input"
                                value={signUpCompany}
                                onChange={(e) => setSignUpCompany(e.target.value)}
                                placeholder="e.g. Acme Corporation"
                              />
                            </div>
                          </div>

                          <div className="grid-2">
                            <div className="field">
                              <label className="field-label" htmlFor="industry">Industry</label>
                              <div className="field-wrap">
                                <span className="field-icon"><Globe size={15} /></span>
                                <select
                                  id="industry" required
                                  className="field-select"
                                  value={signUpIndustry}
                                  onChange={(e) => setSignUpIndustry(e.target.value)}
                                >
                                  <option value="">Select…</option>
                                  <option value="Technology">Technology</option>
                                  <option value="Finance">Finance</option>
                                  <option value="Healthcare">Healthcare</option>
                                  <option value="Education">Education</option>
                                  <option value="Retail">Retail</option>
                                  <option value="Manufacturing">Manufacturing</option>
                                  <option value="Consulting">Consulting</option>
                                  <option value="Media">Media & Entertainment</option>
                                  <option value="Other">Other</option>
                                </select>
                                <span className="field-select-arrow"><ChevronDown size={14} /></span>
                              </div>
                            </div>

                            <div className="field">
                              <label className="field-label" htmlFor="company-size">Company Size</label>
                              <div className="field-wrap">
                                <span className="field-icon"><Users size={15} /></span>
                                <select
                                  id="company-size" required
                                  className="field-select"
                                  value={signUpCompanySize}
                                  onChange={(e) => setSignUpCompanySize(e.target.value)}
                                >
                                  <option value="">Select…</option>
                                  <option value="1-10">1–10</option>
                                  <option value="11-50">11–50</option>
                                  <option value="51-200">51–200</option>
                                  <option value="201-500">201–500</option>
                                  <option value="500+">500+</option>
                                </select>
                                <span className="field-select-arrow"><ChevronDown size={14} /></span>
                              </div>
                            </div>
                          </div>

                          <div className="divider" style={{ marginTop: "1rem" }}>
                            <div className="divider-line" />
                            <span className="divider-label">Admin Account</span>
                            <div className="divider-line" />
                          </div>

                          <div className="field">
                            <label className="field-label" htmlFor="admin-name">Full Name</label>
                            <div className="field-wrap">
                              <span className="field-icon"><User size={15} /></span>
                              <input
                                id="admin-name" type="text" required
                                className="field-input"
                                value={signUpName}
                                onChange={(e) => setSignUpName(e.target.value)}
                                placeholder="Your full name"
                              />
                            </div>
                          </div>

                          <div className="field">
                            <label className="field-label" htmlFor="admin-email">Work Email</label>
                            <div className="field-wrap">
                              <span className="field-icon"><Mail size={15} /></span>
                              <input
                                id="admin-email" type="email" required
                                className="field-input"
                                value={signUpEmail}
                                onChange={(e) => setSignUpEmail(e.target.value)}
                                placeholder="admin@yourcompany.com"
                              />
                            </div>
                          </div>

                          <div className="field">
                            <label className="field-label" htmlFor="admin-password">Password</label>
                            <div className="field-wrap">
                              <span className="field-icon"><Lock size={15} /></span>
                              <input
                                id="admin-password"
                                type={showSignupPassword ? "text" : "password"}
                                required
                                className="field-input"
                                style={{ paddingRight: "38px" }}
                                value={signUpPassword}
                                onChange={(e) => setSignUpPassword(e.target.value)}
                                placeholder="Create a strong password"
                              />
                              <button
                                type="button"
                                className="eye-toggle"
                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                              >
                                {showSignupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            id="create-workspace-btn"
                            className="btn-primary"
                            style={{ marginTop: "1rem" }}
                            disabled={loading || !signUpName || !signUpEmail || !signUpPassword || !signUpCompany || !signUpIndustry || !signUpCompanySize}
                          >
                            {loading ? (
                              <><div className="spinner" /> Setting up workspace…</>
                            ) : (
                              <>Create Workspace &amp; Launch <ArrowRight size={16} /></>
                            )}
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    /* STAFF SIGN IN */
                    <>
                      <div className="form-heading">
                        <div className="form-eyebrow staff">
                          <Shield size={10} /> Staff Portal
                        </div>
                        <div className="form-title">Welcome back</div>
                        <div className="form-subtitle">Sign in to access your HR dashboard</div>
                      </div>

                      <form onSubmit={handleCustomLogin}>
                        {loginError && (
                          <div className="error-box">
                            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <div className="error-title">Sign In Failed</div>
                              <div className="error-msg">{loginError}</div>
                            </div>
                          </div>
                        )}

                        <div className="field">
                          <label className="field-label" htmlFor="staff-email">Email Address</label>
                          <div className="field-wrap">
                            <span className="field-icon"><Mail size={15} /></span>
                            <input
                              id="staff-email" type="email" required
                              className={`field-input${loginError ? " error" : ""}`}
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="Enter your email address"
                            />
                          </div>
                        </div>

                        <div className="field">
                          <label className="field-label" htmlFor="staff-password">Password</label>
                          <div className="field-wrap">
                            <span className="field-icon"><Lock size={15} /></span>
                            <input
                              id="staff-password"
                              type={showPassword ? "text" : "password"}
                              required
                              className={`field-input${loginError ? " error" : ""}`}
                              style={{ paddingRight: "38px" }}
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Enter your password"
                            />
                            <button
                              type="button"
                              className="eye-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "5px" }}>
                            <Link
                              to="/forgot-password"
                              style={{
                                fontSize: "0.7rem",
                                color: isCandidate ? "#10b981" : "#6366f1",
                                textDecoration: "none",
                                fontWeight: "600",
                                transition: "all 0.2s"
                              }}
                            >
                              Forgot Password?
                            </Link>
                          </div>
                        </div>

                        <button
                          type="submit"
                          id="staff-login-btn"
                          className="btn-primary"
                          disabled={loading || !loginEmail || !loginPassword}
                        >
                          {loading ? (
                            <><div className="spinner" /> Signing in…</>
                          ) : (
                            <>Sign In to Dashboard <ArrowRight size={16} /></>
                          )}
                        </button>
                      </form>
                    </>
                  )}

                  {/* Toggle sign-up / sign-in */}
                  <div className="toggle-row">
                    <span className="toggle-link">
                      {isSignUp ? "Already have an account?" : "New to HRise?"}
                    </span>
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => { setIsSignUp(!isSignUp); setLoginError(""); }}
                      id="staff-toggle-btn"
                    >
                      {isSignUp ? "Sign In" : "Create Workspace →"}
                    </button>
                  </div>
                </>
              )}

              {/* ─── CANDIDATE ACCESS ─── */}
              {isCandidate && (
                <>
                  <div className="form-heading">
                    <div className="form-eyebrow candidate">
                      <Briefcase size={10} />
                      {isSignUp ? "Candidate Registration" : "Candidate Portal"}
                    </div>
                    <div className="form-title">
                      {isSignUp ? "Create Account" : "Welcome back"}
                    </div>
                    <div className="form-subtitle">
                      {isSignUp
                        ? "Register to track your applications and interviews"
                        : "Sign in to your candidate portal"}
                    </div>
                  </div>

                  {isSignUp ? (
                    <form onSubmit={handleCandidateSignUp}>
                      {loginError && (
                        <div className="error-box">
                          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div className="error-title">Registration Failed</div>
                            <div className="error-msg">{loginError}</div>
                          </div>
                        </div>
                      )}

                      <div className="field">
                        <label className="field-label" htmlFor="cand-name">Full Name</label>
                        <div className="field-wrap">
                          <span className="field-icon"><User size={15} /></span>
                          <input
                            id="cand-name" type="text" required
                            className="field-input"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label className="field-label" htmlFor="cand-email">Email Address</label>
                        <div className="field-wrap">
                          <span className="field-icon"><Mail size={15} /></span>
                          <input
                            id="cand-email" type="email" required
                            className="field-input"
                            value={candidateEmail}
                            onChange={(e) => setCandidateEmail(e.target.value)}
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label className="field-label" htmlFor="cand-password">Set Password</label>
                        <div className="field-wrap">
                          <span className="field-icon"><Lock size={15} /></span>
                          <input
                            id="cand-password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="field-input"
                            style={{ paddingRight: "38px" }}
                            value={candidatePassword}
                            onChange={(e) => setCandidatePassword(e.target.value)}
                            placeholder="Create a password"
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="candidate-signup-btn"
                        className="btn-primary candidate-btn"
                        disabled={loading || !candidateName || !candidateEmail || !candidatePassword}
                      >
                        {loading ? (
                          <><div className="spinner" /> Creating account…</>
                        ) : (
                          <>Create Candidate Account <ArrowRight size={15} /></>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleCandidateSignIn}>
                      {loginError && (
                        <div className="error-box">
                          <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div className="error-title">Sign In Failed</div>
                            <div className="error-msg">{loginError}</div>
                          </div>
                        </div>
                      )}

                      <div className="field">
                        <label className="field-label" htmlFor="cand-login-email">Email Address</label>
                        <div className="field-wrap">
                          <span className="field-icon"><Mail size={15} /></span>
                          <input
                            id="cand-login-email" type="email" required
                            className={`field-input${loginError ? " error" : ""}`}
                            value={candidateEmail}
                            onChange={(e) => setCandidateEmail(e.target.value)}
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label className="field-label" htmlFor="cand-login-password">Password</label>
                        <div className="field-wrap">
                          <span className="field-icon"><Lock size={15} /></span>
                          <input
                            id="cand-login-password"
                            type={showPassword ? "text" : "password"}
                            required
                            className={`field-input${loginError ? " error" : ""}`}
                            style={{ paddingRight: "38px" }}
                            value={candidatePassword}
                            onChange={(e) => setCandidatePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "5px" }}>
                          <Link
                            to="/forgot-password"
                            style={{
                              fontSize: "0.7rem",
                              color: "#10b981",
                              textDecoration: "none",
                              fontWeight: "600",
                              transition: "all 0.2s"
                            }}
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="candidate-login-btn"
                        className="btn-primary candidate-btn"
                        disabled={loading || !candidateEmail || !candidatePassword}
                      >
                        {loading ? (
                          <><div className="spinner" /> Signing in…</>
                        ) : (
                          <>Sign In to Portal <ArrowRight size={15} /></>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="toggle-row">
                    <span className="toggle-link">
                      {isSignUp ? "Already have an account?" : "New candidate?"}
                    </span>
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => { setIsSignUp(!isSignUp); setLoginError(""); }}
                      id="candidate-toggle-btn"
                    >
                      {isSignUp ? "Sign In" : "Create Account →"}
                    </button>
                  </div>
                </>
              )}

              {/* Unified Global Quick Role Switcher */}
              <div className="demo-section-global">
                <div className="demo-title-global">
                  <Sparkles size={11} color="#6366f1" /> Quick Explore Demo Roles
                </div>
                <div className="demo-grid-global">
                  {[
                    {
                      role: "management_admin",
                      name: "Management Admin",
                      user: "Alex Morgan",
                      desc: "Full company configurations, analytics, staff setups, payroll & permissions.",
                      icon: <Crown size={14} />,
                      color: "#ca8a04",
                      bg: "#fef9c3",
                      class: "role-admin"
                    },
                    {
                      role: "recruiter",
                      name: "HR Recruiter",
                      user: "Kavya Reddy",
                      desc: "Manage candidate pipelines, publish jobs, and trigger Gemini AI resume scoring.",
                      icon: <Briefcase size={14} />,
                      color: "#2563eb",
                      bg: "#dbeafe",
                      class: "role-recruiter"
                    },
                    {
                      role: "senior_manager",
                      name: "Senior Manager",
                      user: "Priya Sharma",
                      desc: "Review department analytics, evaluate team performance, and approve leave requests.",
                      icon: <Users size={14} />,
                      color: "#7c3aed",
                      bg: "#f3e8ff",
                      class: "role-manager"
                    },
                    {
                      role: "employee",
                      name: "Employee",
                      user: "Arjun Mehta",
                      desc: "Self-service portal for clocking in/out, requesting leaves, and downloading payslips.",
                      icon: <User size={14} />,
                      color: "#0d9488",
                      bg: "#ccfbf1",
                      class: "role-employee"
                    },
                    {
                      role: "candidate",
                      name: "Candidate",
                      user: "Sarah Johnson",
                      desc: "Applicant view for tracking applied jobs and submitting AI video interviews.",
                      icon: <Sparkles size={14} />,
                      color: "#16a34a",
                      bg: "#dcfce7",
                      class: "role-candidate"
                    }
                  ].map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`demo-role-card ${r.class}`}
                      onClick={() => handleDemoLogin(r.role)}
                      disabled={loading}
                    >
                      <div className="demo-role-icon" style={{ background: r.bg, color: r.color }}>
                        {r.icon}
                      </div>
                      <div className="demo-role-info">
                        <div className="demo-role-header">
                          <span className="demo-role-name">{r.name}</span>
                          <span className="demo-role-user">{r.user}</span>
                        </div>
                        <div className="demo-role-desc">{r.desc}</div>
                      </div>
                      <ChevronRight size={14} style={{ color: "#cbd5e1", marginLeft: "auto", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer">
              <div className="footer-powered">Secured & Powered by HRise AI</div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
