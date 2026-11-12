import React, { useState } from "react";
import { api, idOf } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, ResumePicker, JobPicker } from "../components.jsx";
import { useStore } from "../store.jsx";

const qText = (q) => (typeof q === "string" ? q : q?.question ?? q?.text ?? q?.prompt ?? JSON.stringify(q));

function Question({ interviewId, index, q, existing, onDone }) {
  const [answer, setAnswer] = useState(existing?.answer || "");
  const ev = useAsync();
  const feedback = ev.data ?? existing?.evaluation ?? existing?.feedback ?? null;
  const submit = async () => {
    const d = await ev.run(() => api.answerInterview(interviewId, index, answer));
    if (d) onDone?.();
  };
  return (
    <div className="card inner">
      <strong>Q{index + 1}. {qText(q)}</strong>
      {typeof q === "object" && q && (
        <div className="muted">{[q.category, q.type, q.difficulty].filter(Boolean).join(" · ")}</div>
      )}
      <textarea rows={4} placeholder="Type your answer with specific examples…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <div className="row">
        <button className="btn small" disabled={!answer.trim() || ev.loading} onClick={submit}>Submit answer</button>
      </div>
      <Loading on={ev.loading} text="Evaluating your answer…" /><ErrorBox error={ev.error} />
      {feedback && <div style={{ marginTop: 10 }}><h3>Feedback</h3><Result data={feedback} /></div>}
    </div>
  );
}

export default function Interview() {
  const { resumeId, jobId } = useStore();
  const [count, setCount] = useState(8);
  const [loadId, setLoadId] = useState("");
  const start = useAsync();
  const load = useAsync();

  const session = load.data ?? start.data;
  const interviewId = session ? idOf(session) ?? session.interview_id ?? session.interview?.id : null;
  const questions = session?.questions ?? session?.interview?.questions ?? [];
  const answers = session?.answers ?? session?.responses ?? [];
  const existingFor = (i) =>
    (Array.isArray(answers) ? answers.find((a) => a?.question_index === i) : null) ||
    (typeof questions[i] === "object" ? questions[i] : null);

  const startNew = async () => { load.setData(null); await start.run(() => api.startInterview(resumeId, jobId || null, Number(count))); };
  const refresh = () => load.run(() => api.getInterview(interviewId));

  return (
    <>
      <Section title="Start mock interview (Gemini)">
        <div className="grid2"><ResumePicker /><JobPicker optional /></div>
        <label className="field" style={{ maxWidth: 200 }}>
          <span>Number of questions</span>
          <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(e.target.value)} />
        </label>
        <button className="btn" disabled={!resumeId || start.loading} onClick={startNew}>Generate interview</button>
        <Loading on={start.loading} text="Generating personalized questions…" /><ErrorBox error={start.error} />
      </Section>

      <Section title="Resume an existing interview">
        <div className="row">
          <input placeholder="interview_id" value={loadId} onChange={(e) => setLoadId(e.target.value)} />
          <button className="btn small" disabled={!loadId || load.loading} onClick={() => load.run(() => api.getInterview(loadId))}>Load</button>
        </div>
        <ErrorBox error={load.error} />
      </Section>

      {session && (
        <Section title="Interview session" actions={interviewId && <button className="btn small ghost" onClick={refresh}>Reload from server</button>}>
          <p className="muted mono">interview_id: {interviewId}</p>
          <Loading on={load.loading} />
          <div className="stack">
            {Array.isArray(questions) && questions.length ? (
              questions.map((q, i) => (
                <Question key={`${interviewId}-${i}`} interviewId={interviewId} index={i} q={q} existing={existingFor(i)} />
              ))
            ) : (
              <Result data={session} />
            )}
          </div>
        </Section>
      )}
    </>
  );
}
