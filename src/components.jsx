import React, { useState } from "react";
import { idOf, resumeIdOf } from "./api.js";
import { useStore, resumeLabel, jobLabel } from "./store.jsx";

export const humanize = (k) => String(k).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const isUrl = (s) => typeof s === "string" && /^https?:\/\//i.test(s);
const isScoreKey = (k) => /score|similarity|coverage|match/i.test(k);

export function Bar({ value }) {
  let pct = Number(value);
  if (pct <= 1) pct *= 100;
  pct = Math.max(0, Math.min(100, pct));
  const tone = pct >= 70 ? "good" : pct >= 40 ? "mid" : "low";
  return (
    <div className="bar" title={`${pct.toFixed(1)}%`}>
      <div className={`bar-fill ${tone}`} style={{ width: `${pct}%` }} />
      <span>{pct.toFixed(1)}%</span>
    </div>
  );
}

/** Renders any JSON value readably — used for every API response. */
export function Result({ data, k = "" }) {
  if (data === null || data === undefined || data === "") return <span className="muted">—</span>;
  if (typeof data === "boolean") return <span className={`pill ${data ? "ok" : "bad"}`}>{data ? "yes" : "no"}</span>;
  if (typeof data === "number") return isScoreKey(k) && data <= 100 ? <Bar value={data} /> : <span>{data}</span>;
  if (typeof data === "string") {
    if (isUrl(data)) return <a href={data} target="_blank" rel="noreferrer">{data}</a>;
    return <span className="text">{data}</span>;
  }
  if (Array.isArray(data)) {
    if (!data.length) return <span className="muted">none</span>;
    if (data.every((x) => ["string", "number"].includes(typeof x)))
      return (
        <div className="chips">
          {data.map((x, i) => <span className="chip" key={i}>{String(x)}</span>)}
        </div>
      );
    return (
      <div className="stack">
        {data.map((x, i) => (
          <div className="card inner" key={i}><Result data={x} /></div>
        ))}
      </div>
    );
  }
  return (
    <dl className="kv">
      {Object.entries(data).map(([key, val]) => (
        <React.Fragment key={key}>
          <dt>{humanize(key)}</dt>
          <dd><Result data={val} k={key} /></dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function Section({ title, children, actions }) {
  return (
    <section className="card">
      <div className="card-head"><h2>{title}</h2><div className="row">{actions}</div></div>
      {children}
    </section>
  );
}

export const ErrorBox = ({ error }) => (error ? <div className="alert error">{error}</div> : null);
export const Loading = ({ on, text = "Working…" }) => (on ? <div className="alert info"><span className="spin" /> {text}</div> : null);

/** Small hook for async actions: run(fn) -> sets loading/error/data */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const run = async (fn) => {
    setLoading(true); setError("");
    try { const d = await fn(); setData(d); return d; }
    catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  };
  return { loading, error, data, setData, run };
}

export function ResumePicker({ label = "Resume" }) {
  const { resumes, resumeId, setResumeId } = useStore();
  return (
    <label className="field">
      <span>{label}</span>
      <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
        <option value="">{resumes.length ? "— select a resume —" : "— upload a resume first —"}</option>
        {resumes.map((r) => <option key={resumeIdOf(r)} value={resumeIdOf(r)}>{resumeLabel(r)}</option>)}
      </select>
    </label>
  );
}

export function JobPicker({ label = "Job", optional = false }) {
  const { jobs, jobId, setJobId } = useStore();
  return (
    <label className="field">
      <span>{label}{optional ? " (optional)" : ""}</span>
      <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
        <option value="">{optional ? "— no specific job —" : "— select a job —"}</option>
        {jobs.map((j) => <option key={idOf(j)} value={idOf(j)}>{jobLabel(j)}</option>)}
      </select>
    </label>
  );
}

export function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  const j = job.job && typeof job.job === "object" ? { ...job.job, ...job } : job;
  const url = j.url || j.redirect_url || j.apply_url || j.link;
  const score = j.match_score ?? j.score ?? j.similarity;
  const source = j.source || j.provider;
  return (
    <div className="card inner">
      <div className="card-head">
        <div>
          <strong>{j.title || "Untitled job"}</strong>
          <div className="muted">{[j.company, j.location].filter(Boolean).join(" · ")}</div>
        </div>
        {source && <span className="pill">{source === "adzuna" ? "Jobs by Adzuna" : source === "arbeitnow" ? "Arbeitnow" : source}</span>}
      </div>
      {score !== undefined && <Bar value={score} />}
      <div className="row" style={{ marginTop: 8 }}>
        {url && <a className="btn small" href={url} target="_blank" rel="noreferrer">Open / Apply ↗</a>}
        <button className="btn small ghost" onClick={() => setOpen(!open)}>{open ? "Hide details" : "Details"}</button>
      </div>
      {open && <div style={{ marginTop: 10 }}><Result data={j} /></div>}
    </div>
  );
}

const ICONS = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6",
  briefcase: "M3 8h18v12H3z M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3 M3 13h18",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  sparkles: "M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
  chat: "M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5A8 8 0 1 1 21 12z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  upload: "M12 16V4 M7 9l5-5 5 5 M4 20h16",
  check: "M5 12l5 5 9-10",
};
export const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

export const Logo = ({ size = 32, light = false }) => (
  <div className="logo">
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={light ? "#fff" : "url(#lg)"} />
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4f46e5" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
      <path d="M10 7h8l5 5v13H10z" fill={light ? "#4f46e5" : "#fff"} />
      <path d="M13 17h7M13 21h7" stroke={light ? "#fff" : "#4f46e5"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
    <span className={light ? "logo-text on-dark" : "logo-text"}>Resume<b>AI</b></span>
  </div>
);

export function Gauge({ value, label = "Match score" }) {
  let pct = Number(value);
  if (pct <= 1) pct *= 100;
  pct = Math.max(0, Math.min(100, pct));
  const r = 52, c = 2 * Math.PI * r;
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="gauge">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e8eaf3" strokeWidth="11" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 65 65)" />
        <text x="65" y="72" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">{Math.round(pct)}%</text>
      </svg>
      <div className="muted">{label}</div>
    </div>
  );
}

const SCORE_KEYS = ["match_score", "overall_score", "fit_score", "score", "overall_match", "semantic_similarity"];
export function findScore(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  for (const k of SCORE_KEYS) if (typeof d[k] === "number") return { key: k, value: d[k] };
  for (const v of Object.values(d)) { const r = findScore(v); if (r) return r; }
  return null;
}
export function ScoreHero({ data }) {
  const s = findScore(data);
  return s ? <Gauge value={s.value} label={humanize(s.key)} /> : null;
}
