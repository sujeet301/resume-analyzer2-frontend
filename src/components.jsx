import React, { useState } from "react";
import { idOf } from "./api.js";
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
        <option value="">— select a resume —</option>
        {resumes.map((r) => <option key={idOf(r)} value={idOf(r)}>{resumeLabel(r)}</option>)}
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
