import React, { useEffect } from "react";
import { api } from "../api.js";
import { Section, Result, ErrorBox, Loading, useAsync } from "../components.jsx";
import { useStore } from "../store.jsx";

export default function Dashboard() {
  const health = useAsync();
  const status = useAsync();
  const seed = useAsync();
  const { refreshJobs } = useStore();

  useEffect(() => { health.run(api.health); status.run(api.aiStatus); /* eslint-disable-next-line */ }, []);

  return (
    <>
      <Section title="Backend health" actions={<button className="btn small" onClick={() => health.run(api.health)}>Refresh</button>}>
        <Loading on={health.loading} /><ErrorBox error={health.error} />
        <Result data={health.data} />
      </Section>
      <Section title="AI provider status" actions={<button className="btn small" onClick={() => status.run(api.aiStatus)}>Refresh</button>}>
        <Loading on={status.loading} /><ErrorBox error={status.error} />
        <Result data={status.data} />
        <p className="muted">Generative features need <code>gemini_configured: true</code>.</p>
      </Section>
      <Section title="Demo data">
        <p className="muted">Adds five demo jobs. Run this only once.</p>
        <button className="btn" disabled={seed.loading} onClick={async () => { await seed.run(api.seedJobs); refreshJobs(); }}>
          Seed demo jobs
        </button>
        <Loading on={seed.loading} /><ErrorBox error={seed.error} />
        {seed.data && <Result data={seed.data} />}
      </Section>
    </>
  );
}
