import React, { useEffect } from "react";
import { api } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, Icon } from "../components.jsx";
import { useStore } from "../store.jsx";
import { useAuth } from "../auth.jsx";

export default function Dashboard({ go }) {
  const { user } = useAuth();
  const { resumes, jobs, interviews, refreshJobs } = useStore();
  const health = useAsync();
  const status = useAsync();
  const seed = useAsync();

  const load = () => { health.run(api.health); status.run(api.aiStatus); };
  useEffect(load, []); // eslint-disable-line

  const online = !!health.data && !health.error;
  const gemini = status.data?.gemini_configured;

  const steps = [
    { done: resumes.length > 0, t: "Upload your resume", d: "PDF or DOCX", to: "resumes" },
    { done: jobs.length > 0, t: "Add jobs to compare against", d: "Seed demos, add your own, or search live", to: "jobs" },
    { done: false, t: "See your best-matching roles", d: "Semantic ranking with skill coverage", to: "match" },
    { done: interviews.length > 0, t: "Practise a mock interview", d: "Personalised questions and feedback", to: "interview" },
  ];

  return (
    <>
      <div className="welcome card">
        <div>
          <h2>Hi {user.name.split(" ")[0]} 👋</h2>
          <p className="muted">Here is a snapshot of your ResumeAI workspace.</p>
        </div>
        <div className="row">
          <span className={`pill ${health.loading ? "" : online ? "ok" : "bad"}`}>{health.loading ? "Checking backend…" : online ? "Backend online" : "Backend offline"}</span>
          {status.data && <span className={`pill ${gemini ? "ok" : "bad"}`}>{gemini ? "Gemini ready" : "Gemini not configured"}</span>}
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="stat-n">{resumes.length}</div><div className="muted">Your resumes</div></div>
        <div className="stat"><div className="stat-n">{jobs.length}</div><div className="muted">Jobs available</div></div>
        <div className="stat"><div className="stat-n">{interviews.length}</div><div className="muted">Mock interviews</div></div>
      </div>

      <Section title="Get started">
        <div className="steps">
          {steps.map((s, i) => (
            <button key={s.t} className={`step ${s.done ? "done" : ""}`} onClick={() => go(s.to)}>
              <span className="step-n">{s.done ? <Icon name="check" size={16} /> : i + 1}</span>
              <span><strong>{s.t}</strong><br /><span className="muted">{s.d}</span></span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Demo data">
        <p className="muted">Adds five sample jobs so you can try matching right away. Run once.</p>
        <button className="btn" disabled={seed.loading} onClick={async () => { await seed.run(api.seedJobs); refreshJobs(); }}>Seed demo jobs</button>
        <Loading on={seed.loading} /><ErrorBox error={seed.error} />
        {seed.data && <div style={{ marginTop: 10 }}><Result data={seed.data} /></div>}
      </Section>

      <Section title="System status" actions={<button className="btn small ghost" onClick={load}>Refresh</button>}>
        <ErrorBox error={health.error || status.error} />
        <div className="grid2"><div><h3>Health</h3><Result data={health.data} /></div><div><h3>AI provider</h3><Result data={status.data} /></div></div>
      </Section>
    </>
  );
}
