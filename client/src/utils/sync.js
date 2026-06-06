import { api } from "./api";

// ─── Initial Synchronization on Boot ──────────────────────────────────────────
export async function syncFromBackend() {
  try {
    console.log("🔄 MERN Sync: Fetching data from MongoDB...");

    // 1. Jobs
    try {
      const jobs = await api.jobs.getAll();
      if (Array.isArray(jobs)) {
        localStorage.setItem("hrise_jobs", JSON.stringify(jobs));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync jobs", e);
    }

    // 2. Candidates
    try {
      const candidates = await api.candidates.getAll();
      if (Array.isArray(candidates)) {
        localStorage.setItem("hrise_candidates", JSON.stringify(candidates));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync candidates", e);
    }

    // 3. Interview Sessions
    try {
      const interviews = await api.interviews.getAll();
      if (Array.isArray(interviews)) {
        localStorage.setItem("hrise_interview_sessions", JSON.stringify(interviews));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync interviews", e);
    }

    // 4. Onboarding Records
    try {
      const onboarding = await api.onboarding.getAll();
      if (Array.isArray(onboarding)) {
        localStorage.setItem("hrise_onboarding_records", JSON.stringify(onboarding));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync onboarding records", e);
    }

    // 5. Staff Profiles
    try {
      const staff = await api.staff.getAll();
      if (Array.isArray(staff)) {
        localStorage.setItem("hrise_staff_profiles", JSON.stringify(staff));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync staff profiles", e);
    }

    // 6. Candidate Profiles
    try {
      const candidateProfiles = await api.candidateProfiles.getAll();
      if (Array.isArray(candidateProfiles)) {
        localStorage.setItem("hrise_candidate_profiles", JSON.stringify(candidateProfiles));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync candidate profiles", e);
    }

    // 7. Workspace Settings
    try {
      const settings = await api.settings.get();
      if (settings) {
        localStorage.setItem("hrise_workspace_settings", JSON.stringify(settings));
      }
    } catch (e) {
      console.warn("MERN Sync: Failed to sync workspace settings", e);
    }

    // 8. Attendance
    try {
      const attendance = await api.attendance.get();
      if (attendance) {
        localStorage.setItem("hrise_attendance_data", JSON.stringify(attendance));
      }
    } catch (e) { console.error("Sync attendance failed", e); }

    // 9. Payroll
    try {
      const payroll = await api.payroll.get();
      if (payroll) {
        localStorage.setItem("hrise_payroll_data", JSON.stringify(payroll));
      }
    } catch (e) { console.error("Sync payroll failed", e); }

    // 10. Performance
    try {
      const performance = await api.performance.get();
      if (performance) {
        localStorage.setItem("hrise_performance_data", JSON.stringify(performance));
      }
    } catch (e) { console.error("Sync performance failed", e); }

    // 11. Leaves
    try {
      const leaves = await api.leaves.getAll();
      if (Array.isArray(leaves)) {
        localStorage.setItem("hrise_leaves_data", JSON.stringify(leaves));
      }
    } catch (e) { console.error("Sync leaves failed", e); }

    // 12. Performance Reviews
    try {
      const reviews = await api.performance.getReviews();
      if (Array.isArray(reviews)) {
        localStorage.setItem("hrise_performance_reviews", JSON.stringify(reviews));
      }
    } catch (e) { console.error("Sync performance reviews failed", e); }

    console.log("✅ MERN Sync: Local cache matches MongoDB.");
    
    // Dispatch standard storage event so all mounted pages update their state
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("❌ MERN Sync failed:", e);
  }
}

// ─── Reactive Mutation Sync Push Methods ──────────────────────────────────────
export const syncPush = {
  jobs: {
    create: async (job) => {
      try { await api.jobs.create(job); } catch (e) { console.error(e); }
    },
    update: async (id, job) => {
      try { await api.jobs.update(id, job); } catch (e) { console.error(e); }
    },
    delete: async (id) => {
      try { await api.jobs.delete(id); } catch (e) { console.error(e); }
    }
  },
  candidates: {
    create: async (cand) => {
      try { await api.candidates.create(cand); } catch (e) { console.error(e); }
    },
    bulkCreate: async (cands) => {
      try { await api.candidates.bulkCreate(cands); } catch (e) { console.error(e); }
    },
    update: async (id, cand) => {
      try { await api.candidates.update(id, cand); } catch (e) { console.error(e); }
    },
    delete: async (id) => {
      try { await api.candidates.delete(id); } catch (e) { console.error(e); }
    }
  },
  candidateProfiles: {
    save: async (profile) => {
      try { await api.candidateProfiles.save(profile); } catch (e) { console.error(e); }
    }
  },
  interviews: {
    create: async (session) => {
      try { await api.interviews.create(session); } catch (e) { console.error(e); }
    },
    update: async (id, session) => {
      try { await api.interviews.update(id, session); } catch (e) { console.error(e); }
    }
  },
  onboarding: {
    create: async (record) => {
      try { await api.onboarding.create(record); } catch (e) { console.error(e); }
    },
    update: async (id, record) => {
      try { await api.onboarding.update(id, record); } catch (e) { console.error(e); }
    }
  },
  staff: {
    save: async (profile) => {
      try { await api.staff.save(profile); } catch (e) { console.error(e); }
    }
  },
  settings: {
    update: async (data) => {
      try { await api.settings.update(data); } catch (e) { console.error(e); }
    }
  }
};
