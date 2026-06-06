import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Brain } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setMessage(data.message || "Password updated successfully. Please login with your new password.");
    } catch (err) {
      setError(err.message === "Reset Link Expired" ? "Reset Link Expired" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .rpp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 24px;
        }
        .rpp-container {
          max-width: 440px;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
          padding: 40px;
        }
        .rpp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-bottom: 32px;
        }
        .rpp-brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .rpp-brand-name {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .rpp-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .rpp-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 8px;
        }
        .rpp-desc {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.5;
        }
        .rpp-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .rpp-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rpp-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rpp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rpp-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rpp-input {
          width: 100%;
          padding: 11px 40px 11px 36px;
          font-size: 0.82rem;
          font-family: inherit;
          color: #1e293b;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s ease;
        }
        .rpp-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .eye-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .eye-toggle:hover {
          color: #475569;
        }
        .rpp-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
        }
        .rpp-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .rpp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .rpp-login-link {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          padding: 12px;
          text-decoration: none;
          border-radius: 12px;
          text-align: center;
          transition: opacity 0.2s ease;
          margin-top: 10px;
        }
        .rpp-login-link:hover {
          opacity: 0.95;
        }
        .rpp-back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          margin-top: 10px;
          transition: color 0.2s ease;
        }
        .rpp-back-link:hover {
          color: #1e293b;
        }
        .rpp-alert-success {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          color: #166534;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .rpp-alert-error {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 16px;
          color: #991b1b;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="rpp-root">
        <div className="rpp-container">
          <div className="rpp-brand">
            <div className="rpp-brand-icon">
              <Brain size={20} color="#fff" />
            </div>
            <span className="rpp-brand-name">HRise</span>
          </div>

          <div className="rpp-header">
            <h2 className="rpp-title">Reset Password</h2>
            <p className="rpp-desc">
              Please enter and confirm your new secure password below to update your account.
            </p>
          </div>

          {message ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="rpp-alert-success">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Success</div>
                  <div style={{ marginTop: 2 }}>{message}</div>
                </div>
              </div>
              <Link to="/" className="rpp-login-link">
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rpp-form">
              {error && (
                <div className="rpp-alert-error">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {error === "Reset Link Expired" ? "Link Expired" : "Reset Failed"}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      {error === "Reset Link Expired"
                        ? "This password recovery link is expired or has already been used. Please request a new one."
                        : error}
                    </div>
                  </div>
                </div>
              )}

              {error === "Reset Link Expired" ? (
                <Link to="/forgot-password" className="rpp-login-link">
                  Request New Reset Link
                </Link>
              ) : (
                <>
                  <div className="rpp-field">
                    <label className="rpp-label" htmlFor="new-pass">New Password</label>
                    <div className="rpp-input-wrap">
                      <span className="rpp-icon"><Lock size={14} /></span>
                      <input
                        id="new-pass"
                        type={showPass ? "text" : "password"}
                        required
                        className="rpp-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="rpp-field">
                    <label className="rpp-label" htmlFor="conf-pass">Confirm Password</label>
                    <div className="rpp-input-wrap">
                      <span className="rpp-icon"><Lock size={14} /></span>
                      <input
                        id="conf-pass"
                        type={showConf ? "text" : "password"}
                        required
                        className="rpp-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowConf(!showConf)}
                      >
                        {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rpp-btn"
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? (
                      <><div className="spinner" /> Resetting Password…</>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </>
              )}

              <Link to="/" className="rpp-back-link">
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
