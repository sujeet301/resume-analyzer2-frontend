import React from "react";
import { api, asList, idOf } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, ResumePicker, JobPicker, JobCard } from "../components.jsx";
import { useStore } from "../store.jsx";

export default function Match() {
  const { resumeId, jobId } = useStore();
  const rec = useAsync();
  const ana = useAsync();
  const recs = asList(rec.data, ["recommendations", "results", "jobs", "items"]);
  return (
    <>
      <Section title="Job recommendations (semantic ranking)">
        <ResumePicker />
        <button className="btn" disabled={!resumeId || rec.loading} onClick={() => rec.run(() => api.recommendations(resumeId))}>
          Get recommendations
        </button>
        <Loading on={rec.loading} text="Ranking jobs… the first run downloads the embedding model, so it can be slow." />
        <ErrorBox error={rec.error} />
        <div className="stack" style={{ marginTop: 12 }}>
          {recs.map((j, i) => <JobCard key={idOf(j) ?? i} job={j} />)}
        </div>
        {rec.data && !recs.length && <Result data={rec.data} />}
        <p className="muted">Score = 65% semantic similarity + 35% skill coverage. It ranks relevance; it is not a hiring probability.</p>
      </Section>

      <Section title="Resume ↔ job match analysis">
        <div className="grid2"><ResumePicker /><JobPicker /></div>
        <button className="btn" disabled={!resumeId || !jobId || ana.loading} onClick={() => ana.run(() => api.analysis(resumeId, jobId))}>
          Analyze match
        </button>
        <Loading on={ana.loading} /><ErrorBox error={ana.error} />
        {ana.data && <div style={{ marginTop: 12 }}><Result data={ana.data} /></div>}
      </Section>
    </>
  );
}
