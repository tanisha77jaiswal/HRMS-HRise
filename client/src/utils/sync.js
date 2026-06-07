import { api } from "./api";

// ─── Initial Synchronization on Boot ──────────────────────────────────────────
export async function syncFromBackend() {
  try {
    console.log("🔄 MERN Sync: Fetching data from MongoDB in parallel...");

    const syncTasks = [
      { key: "hrise_jobs", fetch: () => api.jobs.getAll() },
      { key: "hrise_candidates", fetch: () => api.candidates.getAll() },
      { key: "hrise_interview_sessions", fetch: () => api.interviews.getAll() },
      { key: "hrise_onboarding_records", fetch: () => api.onboarding.getAll() },
      { key: "hrise_staff_profiles", fetch: () => api.staff.getAll() },
      { key: "hrise_candidate_profiles", fetch: () => api.candidateProfiles.getAll() },
      { key: "hrise_workspace_settings", fetch: () => api.settings.get() },
      { key: "hrise_attendance_data", fetch: () => api.attendance.get() },
      { key: "hrise_payroll_data", fetch: () => api.payroll.get() },
      { key: "hrise_performance_data", fetch: () => api.performance.get() },
      { key: "hrise_leaves_data", fetch: () => api.leaves.getAll() },
      { key: "hrise_performance_reviews", fetch: () => api.performance.getReviews() }
    ];

    const results = await Promise.allSettled(syncTasks.map(t => t.fetch()));

    results.forEach((res, idx) => {
      const task = syncTasks[idx];
      if (res.status === "fulfilled" && res.value) {
        const data = res.value;
        if (Array.isArray(data) || (data && typeof data === "object")) {
          localStorage.setItem(task.key, JSON.stringify(data));
        }
      } else if (res.status === "rejected") {
        console.warn(`MERN Sync: Failed to sync ${task.key}:`, res.reason);
      }
    });

    console.log("✅ MERN Sync: Local cache matches MongoDB.");
    
    // Dispatch a custom event instead of the generic 'storage' event.
    // Dispatching 'storage' causes pages listening to it to call loadData() -> API POST ->
    // hrise_dashboard_refresh -> loadData() again, creating an infinite loop.
    window.dispatchEvent(new Event("hrise_sync_complete"));
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
