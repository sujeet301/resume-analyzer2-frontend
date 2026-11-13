const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// ---- bearer token handling ----
const TOKEN_KEY = "resumeai_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function req(path, { method = "GET", body, form, params, urlencoded, auth = true } = {}) {
  let url = `${BASE}${path}`;
  if (params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) q.set(k, v);
    });
    const s = q.toString();
    if (s) url += `?${s}`;
  }
  const opts = { method, headers: {} };
  const token = tokenStore.get();
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (urlencoded) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = new URLSearchParams(urlencoded).toString();
  } else if (form) opts.body = form;
  if (!urlencoded && !form && body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new Error("Cannot reach the backend. Is uvicorn running on port 8000?");
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    let msg = data?.detail ?? data?.message ?? text ?? res.statusText;
    if (Array.isArray(msg)) msg = msg.map((m) => `${(m.loc || []).join(".")}: ${m.msg}`).join("; ");
    if (typeof msg === "object") msg = JSON.stringify(msg);
    if (res.status === 401 && auth && token && onUnauthorized) onUnauthorized();
    const err = new Error(`${res.status} — ${msg}`);
    err.status = res.status;
    err.detail = String(msg);
    throw err;
  }
  return data;
}

export const api = {
  // --- auth ---
  register: ({ name, email, password }) =>
    // name is sent under both common field names; extra fields are ignored by the backend
    req("/api/auth/register", { method: "POST", auth: false, body: { name, full_name: name, email, password } }),
  login: async ({ email, password }) => {
    try {
      return await req("/api/auth/login", { method: "POST", auth: false, body: { email, password } });
    } catch (e) {
      // Fallback for OAuth2 password-form style login endpoints
      if (e.status === 422) return req("/api/auth/login", { method: "POST", auth: false, urlencoded: { username: email, password } });
      throw e;
    }
  },
  me: () => req("/api/auth/me"),

  health: () => req("/api/health"),
  aiStatus: () => req("/api/ai/status"),

  uploadResume: (file) => {
    const form = new FormData();
    form.append("file", file);
    return req("/api/resumes/upload", { method: "POST", form });
  },
  listResumes: () => req("/api/resumes"),
  getResume: (id) => req(`/api/resumes/${id}`),
  deleteResume: (id) => req(`/api/resumes/${id}`, { method: "DELETE" }),

  addJob: (job) => req("/api/jobs", { method: "POST", body: job }),
  listJobs: () => req("/api/jobs"),
  seedJobs: () => req("/api/jobs/seed", { method: "POST" }),
  searchLive: (resumeId, params) => req(`/api/jobs/search-live/${resumeId}`, { params }),
  linkedinSearch: (resumeId, params) => req(`/api/jobs/linkedin-search/${resumeId}`, { params }),

  analysis: (resume_id, job_id) => req("/api/analysis", { method: "POST", body: { resume_id, job_id } }),
  recommendations: (resumeId) => req(`/api/recommendations/${resumeId}`),

  aiResumeAnalysis: (resume_id, job_id) =>
    req("/api/ai/resume-analysis", { method: "POST", body: { resume_id, job_id } }),
  startInterview: (resume_id, job_id, count) =>
    req("/api/ai/interviews/start", { method: "POST", body: { resume_id, job_id, count } }),
  answerInterview: (interview_id, question_index, answer) =>
    req("/api/ai/interviews/answer", { method: "POST", body: { interview_id, question_index, answer } }),
  getInterview: (id) => req(`/api/ai/interviews/${id}`),
  resumeChat: (resume_id, job_id, question) =>
    req("/api/ai/resume-chat", { method: "POST", body: { resume_id, job_id, question } }),
};

// ---- helpers: the README doesn't document response shapes, so be tolerant ----
export const idOf = (o) => o?.id ?? o?._id ?? o?.resume_id ?? o?.job_id ?? o?.interview_id ?? null;

export function asList(data, preferred = []) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const k of preferred) if (Array.isArray(data[k])) return data[k];
    const first = Object.values(data).find(Array.isArray);
    if (first) return first;
  }
  return [];
}

// Precise id helpers (a response can contain several ids, e.g. interview + resume)
export const resumeIdOf = (o) => o?.resume_id ?? o?.id ?? o?._id ?? null;
export const interviewIdOf = (o) =>
  o?.interview_id ?? o?.interview?.interview_id ?? o?.interview?.id ?? o?.id ?? o?._id ?? null;
