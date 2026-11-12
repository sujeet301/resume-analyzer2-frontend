import React, { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Resumes from "./pages/Resumes.jsx";
import Jobs from "./pages/Jobs.jsx";
import Match from "./pages/Match.jsx";
import Review from "./pages/Review.jsx";
import Interview from "./pages/Interview.jsx";
import Chat from "./pages/Chat.jsx";

const TABS = [
  ["dashboard", "Dashboard", Dashboard],
  ["resumes", "Resumes", Resumes],
  ["jobs", "Jobs", Jobs],
  ["match", "Matching", Match],
  ["review", "AI Review", Review],
  ["interview", "Interview", Interview],
  ["chat", "Chat", Chat],
];

export default function App() {
  const [tab, setTab] = useState(localStorage.getItem("tab") || "dashboard");
  const go = (t) => { setTab(t); localStorage.setItem("tab", t); };
  const Page = (TABS.find((t) => t[0] === tab) || TABS[0])[2];
  return (
    <div className="app">
      <header>
        <h1>📄 AI Resume Analyzer</h1>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
      </header>
      <main><Page /></main>
    </div>
  );
}
