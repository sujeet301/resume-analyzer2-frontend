import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, asList, idOf, resumeIdOf } from "./api.js";
import { useAuth } from "./auth.jsx";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const K = {
  resume: (e) => `resumeai_resume_${e}`,
  job: (e) => `resumeai_job_${e}`,
  interviews: (e) => `resumeai_interviews_${e}`,
};

// The backend now scopes resumes/interviews to the signed-in account.
// Only UI conveniences (selected resume/job, interview shortcuts) are remembered locally per user.
export function StoreProvider({ children }) {
  const { user } = useAuth();
  const key = user?.email || user?.id;

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [resumeId, setResumeIdRaw] = useState("");
  const [jobId, setJobIdRaw] = useState("");

  const refreshResumes = useCallback(async () => {
    try { setResumes(asList(await api.listResumes(), ["resumes", "items", "data"])); } catch { /* pages show errors */ }
  }, []);
  const refreshJobs = useCallback(async () => {
    try { setJobs(asList(await api.listJobs(), ["jobs", "items", "data"])); } catch { /* pages show errors */ }
  }, []);

  useEffect(() => {
    setResumes([]); setJobs([]);
    if (!key) { setInterviews([]); setResumeIdRaw(""); setJobIdRaw(""); return; }
    setInterviews(read(K.interviews(key), []));
    setResumeIdRaw(localStorage.getItem(K.resume(key)) || "");
    setJobIdRaw(localStorage.getItem(K.job(key)) || "");
    refreshResumes(); refreshJobs();
  }, [key, refreshResumes, refreshJobs]);

  const setResumeId = (id) => { setResumeIdRaw(id); localStorage.setItem(K.resume(key), id || ""); };
  const setJobId = (id) => { setJobIdRaw(id); localStorage.setItem(K.job(key), id || ""); };
  const addInterview = (item) => {
    const next = [item, ...interviews.filter((i) => i.id !== item.id)];
    setInterviews(next); write(K.interviews(key), next);
  };

  const valid = resumes.some((r) => resumeIdOf(r) === resumeId);
  return (
    <Ctx.Provider value={{
      resumes, jobs, interviews,
      resumeId: valid ? resumeId : "", jobId, setResumeId, setJobId,
      refreshResumes, refreshJobs, addInterview,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const resumeLabel = (r) => r.filename || r.file_name || r.name || r.candidate_name || resumeIdOf(r);
export const jobLabel = (j) => [j.title, j.company].filter(Boolean).join(" @ ") || idOf(j);
