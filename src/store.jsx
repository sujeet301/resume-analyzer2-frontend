import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, asList, idOf } from "./api.js";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumeId, setResumeId] = useState(localStorage.getItem("resumeId") || "");
  const [jobId, setJobId] = useState(localStorage.getItem("jobId") || "");

  const refreshResumes = useCallback(async () => {
    try { setResumes(asList(await api.listResumes(), ["resumes", "items", "data"])); } catch { /* shown on pages */ }
  }, []);
  const refreshJobs = useCallback(async () => {
    try { setJobs(asList(await api.listJobs(), ["jobs", "items", "data"])); } catch { /* shown on pages */ }
  }, []);

  useEffect(() => { refreshResumes(); refreshJobs(); }, [refreshResumes, refreshJobs]);
  useEffect(() => { localStorage.setItem("resumeId", resumeId || ""); }, [resumeId]);
  useEffect(() => { localStorage.setItem("jobId", jobId || ""); }, [jobId]);

  return (
    <Ctx.Provider value={{ resumes, jobs, resumeId, setResumeId, jobId, setJobId, refreshResumes, refreshJobs }}>
      {children}
    </Ctx.Provider>
  );
}

export const resumeLabel = (r) => r.filename || r.file_name || r.name || r.candidate_name || idOf(r);
export const jobLabel = (j) => [j.title, j.company].filter(Boolean).join(" @ ") || idOf(j);
