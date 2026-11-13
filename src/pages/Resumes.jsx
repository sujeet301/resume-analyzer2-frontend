import React, { useRef, useState } from "react";
import { api, resumeIdOf } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, Icon } from "../components.jsx";
import { useStore, resumeLabel } from "../store.jsx";

export default function Resumes() {
  const { resumes, resumeId, setResumeId, refreshResumes } = useStore();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);
  const up = useAsync();
  const detail = useAsync();
  const del = useAsync();

  const upload = async () => {
    if (!file) return;
    const res = await up.run(() => api.uploadResume(file));
    if (res) {
      const id = resumeIdOf(res) ?? resumeIdOf(res.resume);
      await refreshResumes();
      if (id) setResumeId(id);
      setFile(null);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this resume and all related records?")) return;
    const ok = await del.run(() => api.deleteResume(id));
    if (ok !== null) { if (resumeId === id) setResumeId(""); detail.setData(null); refreshResumes(); }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files?.[0] || null); };

  return (
    <>
      <Section title="Upload resume">
        <div className={`dropzone ${drag ? "drag" : ""}`} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
          <Icon name="upload" size={28} />
          <strong>{file ? file.name : "Drop your resume here, or click to browse"}</strong>
          <span className="muted">PDF or DOCX · scanned/image-only PDFs aren't supported (no OCR)</span>
          <input ref={input} type="file" hidden accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ marginTop: 12 }}><button className="btn" disabled={!file || up.loading} onClick={upload}>Upload & analyse</button></div>
        <Loading on={up.loading} text="Uploading and extracting text…" /><ErrorBox error={up.error} />
        {up.data && <div className="alert ok">Resume uploaded and selected.</div>}
      </Section>

      <Section title={`Your resumes (${resumes.length})`} actions={<button className="btn small ghost" onClick={refreshResumes}>Refresh</button>}>
        {!resumes.length && <p className="muted">No resumes yet — upload one above.</p>}
        <ErrorBox error={del.error} />
        <div className="stack">
          {resumes.map((r) => {
            const id = resumeIdOf(r);
            return (
              <div className={`card inner ${id === resumeId ? "selected" : ""}`} key={id}>
                <div className="card-head" style={{ marginBottom: 0 }}>
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
