import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, asList, idOf, resumeIdOf } from "./api.js";
import { useAuth } from "./auth.jsx";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const K = {
  owned: (e) => `resumeai_owned_${e}`,
  resume: (e) => `resumeai_resume_${e}`,
  job: (e) => `resumeai_job_${e}`,
  interviews: (e) => `resumeai_interviews_${e}`,
};

function allOwnedIds() {
  const s = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("resumeai_owned_")) read(k, []).forEach((x) => s.add(x));
  }
  return s;
}

export function StoreProvider({ children }) {
  const { user } = useAuth();
  const email = user?.email;

  const [serverResumes, setServerResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [owned, setOwned] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [resumeId, setResumeIdRaw] = useState("");
  const [jobId, setJobIdRaw] = useState("");

  // Load this user's private state whenever the signed-in user changes
  useEffect(() => {
    if (!email) { setOwned([]); setInterviews([]); setResumeIdRaw(""); setJobIdRaw(""); return; }
    setOwned(read(K.owned(email), []));
    setInterviews(read(K.interviews(email), []));
    setResumeIdRaw(localStorage.getItem(K.resume(email)) || "");
    setJobIdRaw(localStorage.getItem(K.job(email)) || "");
  }, [email]);

  const refreshResumes = useCallback(async () => {
    try { setServerResumes(asList(await api.listResumes(), ["resumes", "items", "data"])); } catch { /* pages show errors */ }
  }, []);
  const refreshJobs = useCallback(async () => {
    try { setJobs(asList(await api.listJobs(), ["jobs", "items", "data"])); } catch { /* pages show errors */ }
  }, []);
  useEffect(() => { if (email) { refreshResumes(); refreshJobs(); } }, [email, refreshResumes, refreshJobs]);

  const saveOwned = (ids) => { setOwned(ids); write(K.owned(email), ids); };
  const addOwned = (ids) => saveOwned([...new Set([...owned, ...ids])]);
  const removeOwned = (id) => saveOwned(owned.filter((x) => x !== id));
  const setResumeId = (id) => { setResumeIdRaw(id); localStorage.setItem(K.resume(email), id || ""); };
  const setJobId = (id) => { setJobIdRaw(id); localStorage.setItem(K.job(email), id || ""); };
  const addInterview = (item) => {
    const next = [item, ...interviews.filter((i) => i.id !== item.id)];
    setInterviews(next); write(K.interviews(email), next);
  };

  const resumes = serverResumes.filter((r) => owned.includes(resumeIdOf(r)));
  const claimable = serverResumes.filter((r) => !allOwnedIds().has(resumeIdOf(r)));

  return (
    <Ctx.Provider value={{
      resumes, claimable, jobs, interviews,
      resumeId: owned.includes(resumeId) ? resumeId : "",
      jobId, setResumeId, setJobId,
      refreshResumes, refreshJobs, addOwned, removeOwned, addInterview,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const resumeLabel = (r) => r.filename || r.file_name || r.name || r.candidate_name || resumeIdOf(r);
export const jobLabel = (j) => [j.title, j.company].filter(Boolean).join(" @ ") || idOf(j);
