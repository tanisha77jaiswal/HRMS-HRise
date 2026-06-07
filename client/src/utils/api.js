let API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
// Ensure API_BASE ends with /api
if (API_BASE && !API_BASE.endsWith("/api") && !API_BASE.endsWith("/api/")) {
  API_BASE = API_BASE.replace(/\/$/, "") + "/api";
}

const request = async (url, options = {}) => {
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1" &&
    API_BASE.includes("localhost")
  ) {
    throw new Error(
      "Configuration Error: The frontend is deployed, but is trying to connect to a local backend (http://localhost:5000). Please set VITE_API_BASE in your Vercel environment variables to your Render backend API URL (e.g. https://your-backend.onrender.com/api) and re-deploy."
    );
  }

  try {
    const token = localStorage.getItem("hrise_jwt_token");
    const headers = {
      ...options.headers,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errMsg = `HTTP error! Status: ${response.status}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await response.json();
          errMsg = err.error || errMsg;
        } else {
          const text = await response.text();
          errMsg = text || errMsg;
        }
      } catch (_) {}
      if ((response.status === 401 || response.status === 403) && !url.includes("/auth/refresh")) {
        const refreshToken = localStorage.getItem("hrise_refresh_token");
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem("hrise_jwt_token", refreshData.token);
              
              // Retry original request
              const newHeaders = { ...options.headers, Authorization: `Bearer ${refreshData.token}` };
              const retryRes = await fetch(url, { ...options, headers: newHeaders });
              
              if (!retryRes.ok) {
                throw new Error("Retry failed after token refresh");
              }
              
              const retryContentType = retryRes.headers.get("content-type");
              if (retryContentType && retryContentType.includes("application/json")) {
                return await retryRes.json();
              }
              return {};
            } else {
              // Refresh failed, tokens are invalid/expired
              localStorage.removeItem("hrise_jwt_token");
              localStorage.removeItem("hrise_refresh_token");
              window.location.href = "/";
            }
          } catch (refreshErr) {
            console.error("Refresh token error:", refreshErr);
          }
        }
      }

      throw new Error(errMsg);
    }

    // Auto-trigger dashboard refresh event on successful mutations
    const method = (options.method || "GET").toUpperCase();
    if (["POST", "PUT", "DELETE"].includes(method)) {
      setTimeout(() => {
        window.dispatchEvent(new Event("hrise_dashboard_refresh"));
        localStorage.setItem("hrise_dashboard_refresh_ts", Date.now().toString());
      }, 100);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return {};
  } catch (e) {
    console.error(`API request error on ${url}:`, e);
    throw e;
  }
};

export const api = {
  jobs: {
    getAll: () => request(`${API_BASE}/jobs`),
    create: (data) => request(`${API_BASE}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`${API_BASE}/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`${API_BASE}/jobs/${id}`, {
      method: "DELETE"
    })
  },
  candidates: {
    getAll: () => request(`${API_BASE}/candidates`),
    create: (data) => request(`${API_BASE}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    apply: (formData) => request(`${API_BASE}/candidates/apply`, {
      method: "POST",
      body: formData
    }),
    bulkCreate: (data) => request(`${API_BASE}/candidates/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    // HR bulk resume screening — sends real PDFs to backend → Gemini AI parses each
    screenBulk: (formData) => request(`${API_BASE}/candidates/screen-bulk`, {
      method: "POST",
      body: formData   // FormData with 'resumes' (files[]) + 'jobId'
    }),
    update: (id, data) => request(`${API_BASE}/candidates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`${API_BASE}/candidates/${id}`, {
      method: "DELETE"
    }),
    clearAll: () => request(`${API_BASE}/candidates`, {
      method: "DELETE"
    }),
    getEvaluation: (id) => request(`${API_BASE}/candidates/${id}/evaluation`)
  },
  candidateProfiles: {
    getAll: () => request(`${API_BASE}/candidate-profiles`),
    save: (data) => request(`${API_BASE}/candidate-profiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  interviews: {
    getAll: () => request(`${API_BASE}/interviews`),
    generateQuestions: (data) => request(`${API_BASE}/interviews/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    create: (data) => request(`${API_BASE}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`${API_BASE}/interviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    reschedule: (id, data) => request(`${API_BASE}/interviews/${id}/reschedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`${API_BASE}/interviews/${id}`, {
      method: "DELETE"
    })
  },
  onboarding: {
    getAll: () => request(`${API_BASE}/onboarding`),
    create: (data) => request(`${API_BASE}/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`${API_BASE}/onboarding/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    convert: (id, data) => request(`${API_BASE}/onboarding/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    generateOffer: (data) => request(`${API_BASE}/onboarding/generate-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  staff: {
    getAll: () => request(`${API_BASE}/staff`),
    getMyProfile: () => request(`${API_BASE}/staff/me`),
    getSeniorManagers: () => request(`${API_BASE}/staff/senior-managers`),
    getWorkforceOverview: () => request(`${API_BASE}/staff/workforce-overview`),
    save: (data) => request(`${API_BASE}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  settings: {
    get: () => request(`${API_BASE}/settings`),
    update: (data) => request(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  attendance: {
    get: (params) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request(`${API_BASE}/attendance${qs}`);
    }
  },
  payroll: {
    get: () => request(`${API_BASE}/payroll`),
    update: (id, status) => request(`${API_BASE}/payroll/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    }),
    run: () => request(`${API_BASE}/payroll/run`, {
      method: "POST"
    })
  },
  performance: {
    get: () => request(`${API_BASE}/performance`),
    getReviews: () => request(`${API_BASE}/performance/reviews`),
    createReview: (data) => request(`${API_BASE}/performance/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  leaves: {
    getAll: () => request(`${API_BASE}/leaves`),
    create: (data) => request(`${API_BASE}/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`${API_BASE}/leaves/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
  },
  auth: {
    signup: (data) => request(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    login: (email, password) => request(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }),
    getMe: () => request(`${API_BASE}/auth/me`),
    updatePassword: (currentPassword, newPassword) => request(`${API_BASE}/auth/update-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    })
  },
  userManagement: {
    getAll: () => request(`${API_BASE}/user-management`),
    create: (data) => request(`${API_BASE}/user-management`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    update: (id, data) => request(`${API_BASE}/user-management/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    delete: (id) => request(`${API_BASE}/user-management/${id}`, {
      method: "DELETE"
    })
  },
  ml: {
    predict: (data) => request(`${API_BASE}/ml/hiring-prediction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    batchPredict: (candidates) => request(`${API_BASE}/ml/batch-predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates })
    }),
    health: () => request(`${API_BASE}/ml/health`)
  },
  employeeDashboard: {
    get: () => request(`${API_BASE}/employee-dashboard`),
    updateProfile: (data) => request(`${API_BASE}/employee-dashboard/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    checkIn: (data) => request(`${API_BASE}/employee-dashboard/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    checkOut: (data) => request(`${API_BASE}/employee-dashboard/check-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    logPayslipDownload: (month) => request(`${API_BASE}/employee-dashboard/log-payslip-download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month })
    })
  },
  adminDashboard: {
    get: () => request(`${API_BASE}/admin-dashboard`)
  },
  notifications: {
    getAll: () => request(`${API_BASE}/notifications`),
    create: (data) => request(`${API_BASE}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
    markAsRead: (id) => request(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH"
    }),
    markAllAsRead: () => request(`${API_BASE}/notifications/read-all`, {
      method: "PATCH"
    }),
    delete: (id) => request(`${API_BASE}/notifications/${id}`, {
      method: "DELETE"
    }),
    clearAll: () => request(`${API_BASE}/notifications`, {
      method: "DELETE"
    })
  }
};
