import React from "react";
import { api } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, ResumePicker, JobPicker } from "../components.jsx";
import { useStore } from "../store.jsx";

export default function Review() {
  const { resumeId, jobId } = useStore();
  const rv = useAsync();
  return (
    <Section title="AI resume review (Gemini)">
      <div className="grid2"><ResumePicker /><JobPicker optional /></div>
      <button className="btn" disabled={!resumeId || rv.loading} onClick={() => rv.run(() => api.aiResumeAnalysis(resumeId, jobId || null))}>
        Review my resume
      </button>
      <Loading on={rv.loading} text="Gemini is reviewing your resume…" /><ErrorBox error={rv.error} />
      {rv.data && <div style={{ marginTop: 12 }}><Result data={rv.data} /></div>}
      <p className="muted">AI output can be wrong. Never add unverified claims to your resume.</p>
    </Section>
  );
}
