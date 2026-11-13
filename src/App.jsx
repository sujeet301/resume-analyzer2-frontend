import React, { useState } from "react";
import { useAuth } from "./auth.jsx";
import { Icon, Logo } from "./components.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Resumes from "./pages/Resumes.jsx";
import Jobs from "./pages/Jobs.jsx";
import Match from "./pages/Match.jsx";
import Review from "./pages/Review.jsx";
import Interview from "./pages/Interview.jsx";
import Chat from "./pages/Chat.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "home", sub: "Your workspace at a glance.", Page: Dashboard },
  { id: "resumes", label: "My Resumes", icon: "file", sub: "Upload and manage your resumes.", Page: Resumes },
  { id: "jobs", label: "Jobs", icon: "briefcase", sub: "Stored jobs, live listings and LinkedIn search links.", Page: Jobs },
  { id: "match", label: "Job Matching", icon: "target", sub: "See which roles fit your resume best.", Page: Match },
  { id: "review", label: "AI Review", icon: "sparkles", sub: "Get an evidence-based review of your resume.", Page: Review },
  { id: "interview", label: "Mock Interview", icon: "mic", sub: "Practise with personalised questions and feedback.", Page: Interview },
  { id: "chat", label: "Resume Chat", icon: "chat", sub: "Ask questions about your resume.", Page: Chat },
];

export default function App() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState(localStorage.getItem("resumeai_tab") || "dashboard");
  if (!user) return <Login />;

  const go = (id) => { setTab(id); localStorage.setItem("resumeai_tab", id); window.scrollTo(0, 0); };
  const current = TABS.find((t) => t.id === tab) || TABS[0];
  const { Page } = current;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Logo />
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={t.id === current.id ? "active" : ""} onClick={() => go(t.id)}>
              <Icon name={t.icon} /><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="usercard">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="who"><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="icon-btn" title="Sign out" onClick={logout}><Icon name="logout" /></button>
        </div>
      </aside>
      <div className="content">
        <header className="page-head">
          <h1>{current.label}</h1>
          <p>{current.sub}</p>
        </header>
        <main key={user.email + current.id}><Page go={go} /></main>
      </div>
    </div>
  );
}
