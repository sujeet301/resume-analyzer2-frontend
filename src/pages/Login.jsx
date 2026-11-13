import React, { useState } from "react";
import { useAuth } from "../auth.jsx";
import { Logo, Icon, ErrorBox } from "../components.jsx";

const FEATURES = [
  ["target", "Semantic job matching", "Rank jobs against your resume using embeddings and skill coverage."],
  ["sparkles", "AI resume review", "Evidence-based strengths, gaps and rewritten bullet suggestions."],
  ["mic", "Mock interviews", "Role-specific questions with scored feedback on every answer."],
];

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await (mode === "login" ? login(f) : signup(f)); }
    catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth">
      <aside className="auth-hero">
        <Logo size={38} light />
        <h1>Land more interviews with AI-powered resume insights.</h1>
        <p>Upload your resume, see how well it fits real roles, and practise for the interview — all in one place.</p>
        <ul>
          {FEATURES.map(([ic, t, d]) => (
            <li key={t}><span className="feat-ic"><Icon name={ic} /></span><div><strong>{t}</strong><div>{d}</div></div></li>
          ))}
        </ul>
      </aside>
      <main className="auth-form-wrap">
        <form className="auth-card" onSubmit={submit}>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted">{mode === "login" ? "Sign in to continue to ResumeAI." : "Start analysing your resume in minutes."}</p>
          {mode === "signup" && (
            <label className="field"><span>Full name</span><input value={f.name} onChange={set("name")} autoComplete="name" required /></label>
          )}
          <label className="field"><span>Email</span><input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
          <label className="field"><span>Password</span>
            <input type="password" value={f.password} onChange={set("password")} minLength={6} required
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </label>
          <ErrorBox error={err} />
          <button className="btn block" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
          <p className="switch">
            {mode === "login" ? "New to ResumeAI? " : "Already have an account? "}
            <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="fineprint">Accounts are stored in this browser only. Do not reuse an important password.</p>
        </form>
      </main>
    </div>
  );
}
