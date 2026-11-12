import React, { useRef, useEffect, useState } from "react";
import { api } from "../api.js";
import { Section, Result, ErrorBox, ResumePicker, JobPicker } from "../components.jsx";
import { useStore } from "../store.jsx";

const replyOf = (d) => (typeof d === "string" ? d : d?.answer ?? d?.response ?? d?.reply ?? d?.message ?? null);

export default function Chat() {
  const { resumeId, jobId } = useStore();
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const send = async () => {
    const question = q.trim();
    if (!question || !resumeId) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setQ(""); setBusy(true); setError("");
    try {
      const d = await api.resumeChat(resumeId, jobId || null, question);
      setMsgs((m) => [...m, { role: "ai", text: replyOf(d), raw: d }]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Section title="Resume chat (Gemini)" actions={<button className="btn small ghost" onClick={() => setMsgs([])}>Clear</button>}>
      <div className="grid2"><ResumePicker /><JobPicker optional /></div>
      <div className="chat">
        {!msgs.length && <p className="muted">Ask anything, e.g. “What are the three biggest improvements I should make?”</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text ? <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span> : <Result data={m.raw} />}
          </div>
        ))}
        {busy && <div className="bubble ai"><span className="spin" /> Thinking…</div>}
        <div ref={end} />
      </div>
      <ErrorBox error={error} />
      <div className="row">
        <input style={{ flex: 1 }} value={q} placeholder={resumeId ? "Ask about your resume…" : "Select a resume first"} disabled={!resumeId}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn" disabled={!resumeId || !q.trim() || busy} onClick={send}>Send</button>
      </div>
    </Section>
  );
}
