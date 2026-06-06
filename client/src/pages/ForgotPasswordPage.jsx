import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Brain, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email.");
      }

      setMessage(data.message || "Password reset link has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .fpp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 24px;
        }
        .fpp-container {
          max-width: 440px;
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
          padding: 40px;
        }
        .fpp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-bottom: 32px;
        }
        .fpp-brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .fpp-brand-name {
          font-size: 1.35rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .fpp-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .fpp-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin-bottom: 8px;
        }
        .fpp-desc {
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.5;
        }
        .fpp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .fpp-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fpp-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fpp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fpp-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fpp-input {
          width: 100%;
          padding: 11px 16px 11px 36px;
          font-size: 0.82rem;
          font-family: inherit;
          color: #1e293b;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s ease;
        }
        .fpp-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .fpp-btn {
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
        }
        .fpp-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .fpp-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .fpp-back-link {
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
        .fpp-back-link:hover {
          color: #1e293b;
        }
        .fpp-alert-success {
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
        .fpp-alert-error {
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

      <div className="fpp-root">
        <div className="fpp-container">
          <div className="fpp-brand">
            <div className="fpp-brand-icon">
              <Brain size={20} color="#fff" />
            </div>
            <span className="fpp-brand-name">HRise</span>
          </div>

          <div className="fpp-header">
            <h2 className="fpp-title">Forgot Password?</h2>
            <p className="fpp-desc">
              Enter your corporate or candidate email address and we will generate a secure recovery link.
            </p>
          </div>

          {message ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="fpp-alert-success">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Link Sent Successfully</div>
                  <div style={{ marginTop: 2 }}>{message}</div>
                </div>
              </div>

              <p style={{ fontSize: "0.78rem", color: "#64748b", textAlign: "center", lineHeight: 1.5 }}>
                💡 <strong>Dev Tip:</strong> Check your Node.js backend server logs terminal to view the generated email content and retrieve the link!
              </p>

              <Link to="/" className="fpp-back-link">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fpp-form">
              {error && (
                <div className="fpp-alert-error">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>Request Failed</div>
                    <div style={{ marginTop: 2 }}>{error}</div>
                  </div>
                </div>
              )}

              <div className="fpp-field">
                <label className="fpp-label" htmlFor="recovery-email">Email Address</label>
                <div className="fpp-input-wrap">
                  <span className="fpp-icon"><Mail size={14} /></span>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    className="fpp-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className="fpp-btn" disabled={loading || !email}>
                {loading ? (
                  <><div className="spinner" /> Sending Recovery Link…</>
                ) : (
                  <>Send Recovery Link <Sparkles size={14} /></>
                )}
              </button>

              <Link to="/" className="fpp-back-link">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
