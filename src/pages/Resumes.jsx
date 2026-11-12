import React, { useState } from "react";
import { api, idOf } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync } from "../components.jsx";
import { useStore, resumeLabel } from "../store.jsx";

export default function Resumes() {
  const { resumes, resumeId, setResumeId, refreshResumes } = useStore();
  const [file, setFile] = useState(null);
  const up = useAsync();
  const detail = useAsync();
  const del = useAsync();

  const upload = async () => {
    if (!file) return;
    const d = await up.run(() => api.uploadResume(file));
    if (d) {
      const id = idOf(d) ?? idOf(d.resume);
      await refreshResumes();
      if (id) setResumeId(id);
      setFile(null);
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this resume and all related records?")) return;
    if (await del.run(() => api.deleteResume(id)) !== null || !del.error) {
      if (resumeId === id) setResumeId("");
      detail.setData(null);
      refreshResumes();
    }
  };

  return (
    <>
      <Section title="Upload resume">
        <div className="row">
          <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn" disabled={!file || up.loading} onClick={upload}>Upload</button>
        </div>
        <p className="muted">PDF or DOCX. Scanned/image-only PDFs are not supported (no OCR).</p>
        <Loading on={up.loading} text="Uploading and extracting text…" /><ErrorBox error={up.error} />
        {up.data && <Result data={up.data} />}
      </Section>

      <Section title={`Your resumes (${resumes.length})`} actions={<button className="btn small" onClick={refreshResumes}>Refresh</button>}>
        {!resumes.length && <p className="muted">No resumes yet.</p>}
        <ErrorBox error={del.error} />
        <div className="stack">
          {resumes.map((r) => {
            const id = idOf(r);
            return (
              <div className={`card inner ${id === resumeId ? "selected" : ""}`} key={id}>
                <div className="card-head">
                  <div><strong>{resumeLabel(r)}</strong><div className="muted mono">{id}</div></div>
                  <div className="row">
                    <button className="btn small" onClick={() => setResumeId(id)}>{id === resumeId ? "Selected ✓" : "Use"}</button>
                    <button className="btn small ghost" onClick={() => detail.run(() => api.getResume(id))}>View</button>
                    <button className="btn small danger" onClick={() => remove(id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {(detail.loading || detail.data || detail.error) && (
        <Section title="Resume details" actions={<button className="btn small ghost" onClick={() => detail.setData(null)}>Close</button>}>
          <Loading on={detail.loading} /><ErrorBox error={detail.error} />
          <Result data={detail.data} />
        </Section>
      )}
    </>
  );
}
