import React, { useState } from "react";
import { api, asList, idOf } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync, ResumePicker, JobCard } from "../components.jsx";
import { useStore } from "../store.jsx";

function AddJob() {
  const { refreshJobs } = useStore();
  const [f, setF] = useState({ title: "", company: "", location: "", description: "", required_skills: "" });
  const add = useAsync();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const body = { ...f, required_skills: f.required_skills.split(",").map((s) => s.trim()).filter(Boolean) };
    if (await add.run(() => api.addJob(body))) {
      refreshJobs();
      setF({ title: "", company: "", location: "", description: "", required_skills: "" });
    }
  };
  return (
    <Section title="Add a job">
      <form onSubmit={submit} className="grid2">
        <label className="field"><span>Title *</span><input required value={f.title} onChange={set("title")} /></label>
        <label className="field"><span>Company</span><input value={f.company} onChange={set("company")} /></label>
        <label className="field"><span>Location</span><input value={f.location} onChange={set("location")} /></label>
        <label className="field"><span>Required skills (comma separated)</span><input value={f.required_skills} onChange={set("required_skills")} placeholder="python, fastapi, mongodb" /></label>
        <label className="field full"><span>Description *</span><textarea required rows={4} value={f.description} onChange={set("description")} /></label>
        <div className="full"><button className="btn" disabled={add.loading}>Add job</button></div>
      </form>
      <ErrorBox error={add.error} />
      {add.data && <div className="alert ok">Job added.</div>}
    </Section>
  );
}

function LiveSearch() {
  const { resumeId } = useStore();
  const [p, setP] = useState({ query: "", location: "", limit: 20, remote: false });
  const live = useAsync();
  const li = useAsync();
  const set = (k) => (e) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const search = () =>
    live.run(() => api.searchLive(resumeId, {
      query: p.query, location: p.location, limit: p.limit,
      providers: "arbeitnow", remote: p.remote ? "true" : "",
    }));
  const linkedin = () =>
    li.run(() => api.linkedinSearch(resumeId, { location: p.location, remote: p.remote ? "true" : "" }));

  const results = asList(live.data, ["results", "jobs", "items"]);
  return (
    <Section title="Live job search & LinkedIn links">
      <ResumePicker />
      <div className="grid2">
        <label className="field"><span>Query (optional)</span><input value={p.query} onChange={set("query")} placeholder="python developer" /></label>
        <label className="field"><span>Location</span><input value={p.location} onChange={set("location")} placeholder="Delhi NCR" /></label>
        <label className="field"><span>Limit</span><input type="number" min={1} max={50} value={p.limit} onChange={set("limit")} /></label>
      </div>
      <div className="row" style={{ margin: "8px 0" }}>
        <label className="check"><input type="checkbox" checked={p.remote} onChange={set("remote")} /> Remote only</label>
      </div>
      <div className="row">
        <button className="btn" disabled={!resumeId || live.loading} onClick={search}>Search live jobs</button>
        <button className="btn ghost" disabled={!resumeId || li.loading} onClick={linkedin}>Get LinkedIn search links</button>
      </div>
      <p className="muted">Live listings come from <a href="https://www.arbeitnow.com/" target="_blank" rel="noreferrer">Arbeitnow</a> (mostly Germany/Europe, so results may be sparse for India). Apply on the original listing.</p>
      <Loading on={live.loading} text="Fetching and ranking listings…" /><ErrorBox error={live.error} />
      {live.data?.provider_errors && Object.keys(live.data.provider_errors).length > 0 && (
        <div className="alert warn"><strong>Provider errors</strong><Result data={live.data.provider_errors} /></div>
      )}
      <div className="stack" style={{ marginTop: 12 }}>
        {results.map((j, i) => <JobCard key={idOf(j) ?? i} job={j} />)}
      </div>
      {live.data && !results.length && <Result data={live.data} />}
      <Loading on={li.loading} /><ErrorBox error={li.error} />
      {li.data && <div style={{ marginTop: 12 }}><h3>LinkedIn search links</h3><Result data={li.data} /><p className="muted">These open LinkedIn's own search results; nothing is scraped.</p></div>}
    </Section>
  );
}

export default function Jobs() {
  const { jobs, refreshJobs } = useStore();
  const seed = useAsync();
  return (
    <>
      <Section title={`Stored jobs (${jobs.length})`} actions={
        <>
          <button className="btn small ghost" disabled={seed.loading} onClick={async () => { await seed.run(api.seedJobs); refreshJobs(); }}>Seed demo jobs</button>
          <button className="btn small" onClick={refreshJobs}>Refresh</button>
        </>}>
        <ErrorBox error={seed.error} />
        <p className="muted">Demo jobs are shared; jobs you add are private to your account.</p>
        {!jobs.length && <p className="muted">No jobs stored yet. Add one below or seed demo jobs.</p>}
        <div className="stack">{jobs.map((j, i) => <JobCard key={idOf(j) ?? i} job={j} />)}</div>
      </Section>
      <AddJob />
      <LiveSearch />
    </>
  );
}
