# ResumeAI — React (Vite) Frontend

## Run
1. Start the backend: `uvicorn app.main:app --reload` (http://127.0.0.1:8000)
2. In this folder:
```
npm install
npm run dev
```
Open http://localhost:5173. In dev, Vite proxies `/api` to the backend, so no CORS setup is needed.
Different backend URL? `VITE_BACKEND=http://host:port npm run dev`. For production builds set `VITE_API_URL` (see `.env.example`) and enable CORS on the backend.

## Pages -> endpoints
- Dashboard: GET /api/health, GET /api/ai/status, POST /api/jobs/seed
- Resumes: POST /api/resumes/upload, GET /api/resumes, GET/DELETE /api/resumes/{id}
- Jobs: GET/POST /api/jobs, POST /api/jobs/seed, GET /api/jobs/search-live/{id}, GET /api/jobs/linkedin-search/{id}
- Matching: GET /api/recommendations/{id}, POST /api/analysis
- AI Review: POST /api/ai/resume-analysis
- Interview: POST /api/ai/interviews/start, POST /api/ai/interviews/answer, GET /api/ai/interviews/{id}
- Chat: POST /api/ai/resume-chat

## If something doesn't line up
The README doesn't list response/field names, so responses are rendered generically. Two guesses to verify in `src/api.js` / `src/pages/Jobs.jsx`:
- upload form field name is `file`
- add-job body fields: `title, company, location, description, required_skills[]`

## Accounts (important)
The backend has no authentication, so login is handled in the browser (`src/auth.jsx`): accounts are stored in localStorage with salted SHA-256 password hashes. Each user only sees the resumes and interviews they created (tracked per account in `src/store.jsx`).
This separates users on one device/browser for demos and personal use; it is **not real security**. Resumes still live in one shared backend collection, and anyone who can reach the API can read them. For real multi-user use, add JWT auth + an `owner_id` on resumes/interviews in the backend.
