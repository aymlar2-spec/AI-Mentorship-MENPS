# MENPS — Production Deployment Guide

This document covers Phase 10 (manual deployment checklist) and the final
report for the deployment-prep work. Nothing described here as "manual"
has been done automatically — no accounts were created, no credentials
entered, nothing deployed. Everything below was verified locally in this
environment (including against a real, temporarily-installed PostgreSQL 16
instance) before being written down.

---

## Phase 10 — Manual Deployment Checklist

### 1. Create the Render PostgreSQL database
- Render dashboard → **New** → **PostgreSQL**.
- Name: `menps-db` (or your choice — if you rename it, update `render.yaml`'s
  `fromDatabase.name` reference to match).
- Plan: Free tier is sufficient to start.
- Region: pick the same region you'll use for the web service (lower
  latency, and Render's free Postgres is only reachable from services in
  the same region on the free plan).
- Wait for it to finish provisioning, then copy the **Internal Database
  URL** (starts with `postgres://`) — you'll need it in step 4, though if
  you deploy via `render.yaml` (Blueprint), Render wires this automatically
  via the `fromDatabase` reference and you won't need to paste it manually.

### 2. Create the Render FastAPI Web Service
- Render dashboard → **New** → **Web Service**.
- Connect your GitHub repository (backend repo — push it first, see below).
- **If using the Blueprint (`render.yaml`)**: Render will detect it
  automatically and provision the service + database together — review the
  plan it proposes, it should match what's described in `render.yaml`.
- **If configuring manually instead**:
  - Runtime: Python 3
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Pre-deploy command (Render has a dedicated field for this): `alembic upgrade head`
  - Health check path: `/health`

### 3. Set Render environment variables
In the service's **Environment** tab, set (these are the `sync: false`
entries in `render.yaml` — Render won't set them for you):

| Variable | Value |
|---|---|
| `SECRET_KEY` | A long, random, unique value. **Generate this yourself** — e.g. `openssl rand -hex 32` — do not reuse the dev placeholder. |
| `GEMINI_API_KEY` | Your real Gemini API key. **You need to provide this** — I cannot generate or obtain it. |
| `CORS_ORIGINS` | Leave as a placeholder for now (e.g. `["http://localhost:5173"]`) — you'll update this in step 9 once the Vercel URL is known. |
| `DATABASE_URL` | If using the Blueprint, this is wired automatically via `fromDatabase`. If configuring manually, paste the Internal Database URL from step 1. |

Variables already given fixed, non-secret values in `render.yaml`
(`APP_NAME`, `APP_VERSION`, `ENVIRONMENT=production`, `DEBUG=False`,
`ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=1440`, `GEMINI_MODEL`,
`PYTHON_VERSION`) don't need manual entry unless you're configuring the
service by hand instead of via the Blueprint.

### 4. Connect PostgreSQL to the backend
- If deployed via Blueprint: already done automatically through the
  `fromDatabase` reference in `render.yaml`.
- If configured manually: paste the Internal Database URL into
  `DATABASE_URL` as shown in step 3. No code changes are needed for this —
  `app/database/session.py` already normalizes Render's `postgres://`
  scheme automatically (verified in this session against a real Postgres
  instance).

### 5. Run database migrations
- If using the Blueprint's `preDeployCommand`, this happens automatically
  on every deploy — nothing to do.
- If deploying manually, either add `alembic upgrade head` as a pre-deploy
  command in the Render dashboard, or run it once via Render's **Shell**
  tab after the first successful deploy.
- Expected output on first run (verified locally against real Postgres):
  ```
  INFO  [alembic.runtime.migration] Running upgrade  -> dab8f893a72c, initial schema
  ```

### 6. Test the backend `/docs` endpoint
- Visit `https://<your-render-service>.onrender.com/docs`.
- You should see the Swagger UI with all routes (auth, users, profiles,
  themes, matching, ai, conversations).
- Also check `https://<your-render-service>.onrender.com/health` returns
  `{"status": "ok"}`.

### 7. Create the Vercel frontend deployment
- Vercel dashboard → **Add New** → **Project** → import your frontend
  GitHub repository.
- Framework preset: Vite (should auto-detect).
- Build command: `npm run build` (default, already correct).
- Output directory: `dist` (default, already correct).
- `vercel.json` (already in the repo) handles the SPA rewrite so
  client-side routes don't 404 on refresh.

### 8. Set the frontend API URL
- In the Vercel project's **Settings → Environment Variables**, add:
  - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com`
- Apply to Production (and Preview, if you want preview deployments to
  hit the same backend — otherwise point Preview at a staging backend if
  you have one).
- Redeploy after adding the variable (Vite env vars are baked in at build
  time, so it must be set before the build runs, not just at runtime).

### 9. Update CORS with the Vercel URL
- Once you know your Vercel domain (e.g. `https://menps.vercel.app`), go
  back to the Render backend's environment variables and set:
  - `CORS_ORIGINS` = `["https://menps.vercel.app"]`
  - If you also want local dev to keep working against the production
    backend for testing, you can include both:
    `["https://menps.vercel.app", "http://localhost:5173"]`
- Save — Render will redeploy the service with the new value.

### 10. Test the complete production application
- Open the Vercel URL, register a new account, confirm you land on the
  Dashboard.
- Complete the Profile questionnaire, save it.
- Trigger a match (as a mentee) or use Administration (as an admin) to
  confirm the matching engine works against production Postgres.
- Open AI Chat, send a message — confirm you get a real Gemini reply (this
  is the one thing I could not verify end-to-end in this sandbox, since
  Gemini's API isn't reachable from here; it will work once a real
  `GEMINI_API_KEY` is set and Render has normal internet access).
- Check the browser's Network tab: confirm requests go to your Render URL,
  not `localhost`, and that no API keys appear in any request the browser
  makes (the frontend should never see `GEMINI_API_KEY` — it isn't in the
  bundle, verified in this session).

---

## Final Report

### A. Files modified
**Backend:**
- `app/database/session.py` — added `postgres://` → `postgresql://` URL
  normalization (Render/Heroku compatibility).
- `alembic/env.py` — reuses the same normalization for migrations.
- `app/main.py` — wired `settings.DEBUG` into FastAPI's `debug` parameter
  (previously defined but unused).
- `requirements.txt` — added `psycopg2-binary==2.9.10`.
- `.env.example` — added a note documenting the `postgres://` normalization.

**Frontend:**
- None. No application source files were changed.

### B. Files created
**Backend:**
- `.gitignore` (did not exist before).
- `render.yaml`.
- `BUGFIX_SUMMARY.md` was already present from prior work; not part of this
  task.

**Frontend:**
- `vercel.json`.

### C. Files that must NOT be committed
- `.env` (both projects) — real secrets go here locally only.
- `menps-backend/menps.db` (or any `*.db`/`*.sqlite*`) — local dev database.
- `menps-frontend/node_modules/`, `menps-frontend/dist/`.
- `menps-backend/__pycache__/`, `*.pyc`.
- Both `.gitignore`s now correctly exclude all of the above — verified via
  `git status` that none of them were ever staged.

### D. Commands to run locally
Backend:
```bash
cd menps-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real SECRET_KEY / GEMINI_API_KEY for local testing
alembic upgrade head   # or rely on the dev-only create_all() on startup
uvicorn app.main:app --reload
```

Frontend:
```bash
cd menps-frontend
npm install
cp .env.example .env   # defaults to http://localhost:8000, adjust if needed
npm run dev
npm run build           # production build, verified working
npm run lint             # verified clean
```

### E. Render configuration
See `render.yaml` in the backend repo, and the checklist above. Summary:
- Runtime: Python 3.12.3
- Build: `pip install -r requirements.txt`
- Pre-deploy: `alembic upgrade head`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/health`

### F. Vercel configuration
- Framework: Vite (auto-detected)
- Build: `npm run build` / Output: `dist` (defaults)
- `vercel.json` provides the SPA rewrite for client-side routing.
- Required env var: `VITE_API_BASE_URL`.

### G. Environment variables required

**Backend (Render):**
| Variable | Source |
|---|---|
| `APP_NAME`, `APP_VERSION`, `ENVIRONMENT`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `GEMINI_MODEL` | Fixed, non-secret — already in `render.yaml` |
| `DEBUG` | `False` in production — already in `render.yaml` |
| `DATABASE_URL` | Wired automatically from the Render Postgres instance |
| `SECRET_KEY` | **You must set this manually** — generate a real random value |
| `GEMINI_API_KEY` | **You must set this manually** — your real Gemini key |
| `CORS_ORIGINS` | **You must set this manually** once the Vercel domain is known |

**Frontend (Vercel):**
| Variable | Source |
|---|---|
| `VITE_API_BASE_URL` | **You must set this manually** — your Render backend URL |

### H. Database migration procedure
1. `alembic upgrade head` — creates all 7 tables (`users`, `profiles`,
   `themes`, `profile_themes`, `matchings`, `conversations`, `messages`)
   plus the `alembic_version` tracking table.
2. Verified against a real local PostgreSQL 16 instance in this session —
   ran successfully, all tables and enum types created correctly, and the
   full application (auth, profile, matching, conversations) worked
   against it identically to SQLite.
3. Future schema changes: `alembic revision --autogenerate -m "..."` then
   `alembic upgrade head` — this workflow was already in place before this
   task and needed no changes.

### I. Remaining manual steps (things I cannot do for you)
1. Push both repositories to GitHub (I don't have GitHub access/credentials).
2. Create the Render account/database/service (needs your account).
3. Create the Vercel account/project (needs your account).
4. Generate and enter a real `SECRET_KEY` (should be done by you, not
   auto-generated by me, per your instructions).
5. Provide and enter your real `GEMINI_API_KEY` (I don't have one and
   cannot generate one).
6. Set `CORS_ORIGINS` to the real Vercel domain once it's known (chicken-
   and-egg: the domain doesn't exist until Vercel deployment happens).
7. Set `VITE_API_BASE_URL` to the real Render domain once it's known (same
   reason, reversed).
8. Manual end-to-end test of the deployed app, especially the AI Chat
   feature actually reaching Gemini — this sandbox cannot reach Gemini's
   API at all, so this is the one functional path I could not verify
   myself at any point in this project's development, not just now.

### J. Deployment blockers
**Resolved in this session:**
- Missing PostgreSQL driver — fixed.
- `postgres://` scheme incompatibility — fixed and verified against real
  Postgres.
- Missing backend `.gitignore` — fixed.

**Not blockers, but require your action (not something I can resolve):**
- No GitHub repository exists yet for either project — needs to be pushed
  by you (or tell me if you'd like me to prepare exact `git remote add` /
  `git push` commands for you to run).
- No Render or Vercel accounts/projects exist yet.
- `SECRET_KEY` and `GEMINI_API_KEY` need real values only you can provide.

**I have not deployed anything.** Both repositories are committed locally
and ready to push, but no code has been pushed to GitHub, no Render or
Vercel service exists, and nothing is live. I did not create accounts,
enter credentials, or purchase anything, per your instructions.
