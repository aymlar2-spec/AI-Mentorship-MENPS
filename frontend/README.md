# MENPS — AI Mentorship Platform for Women (Frontend)

Production-ready React frontend for the MENPS mentoring platform. Consumes the
existing FastAPI backend (see `../menps-backend` or the accompanying backend
delivery) — no backend changes required.

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 8 + Tailwind CSS v4
- React Router v7
- Axios
- React Hook Form + Zod
- Context API (auth, toasts)
- Vitest + React Testing Library (integration tests against a live backend)

## Getting Started

```bash
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:8000
npm run dev
```

The app expects the backend running and reachable at `VITE_API_BASE_URL`
(default `http://localhost:8000`). CORS on the backend must include this
frontend's origin (see the backend's `CORS_ORIGINS` setting).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then produce a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` / `npm run lint:fix` | ESLint (flat config, typescript-eslint + react-hooks + react-refresh) |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run test` | Vitest — **requires a running backend** (tests hit real endpoints, no mocks) |

## Project Structure

```
src/
├── api/            # One service module per backend domain (auth, users,
│                    profiles, themes, matching, ai, conversations) + the
│                    shared Axios client (JWT interceptor, error normalization)
├── components/
│   ├── ui/          # Design-system primitives (Button, Input, Modal, Tabs, ...)
│   ├── layout/       # AppShell, Sidebar, Navbar, AuthLayout, ProtectedRoute
│   ├── admin/        # Administration page components
│   ├── chat/         # AI Chat page components
│   ├── mentor/        # Matching page components
│   └── profile/       # Profile questionnaire components
├── context/         # AuthContext, ToastContext
├── hooks/           # useAuth, useToast, useAsyncData
├── pages/           # One file per route
├── router/          # Route table (lazy-loaded, code-split per page)
├── schemas/         # Zod validation schemas, one file per domain
├── types/           # TypeScript types mirroring backend Pydantic schemas
├── lib/             # Small shared utilities (cn, errors, matching, constants)
└── __tests__/       # Vitest integration tests (run against a live backend)
```

## Pages

Login (sign-in/create-account), Dashboard, Profile (questionnaire), Matching,
AI Chat, Conversation History, Administration (admin-only), Settings, plus
403/404 error pages.

## Testing

`npm run test` runs real integration tests against a live backend instance —
registering users, creating profiles, running matches, editing via
Administration, etc. Start the backend first:

```bash
cd ../menps-backend
uvicorn app.main:app --reload
```

Then in this project:

```bash
npm run test
```

## Known Backend-Side Limitations

These are documented in detail in `SPRINT_3_SUMMARY.md`, `SPRINT_4_SUMMARY.md`,
and `SPRINT_5_SUMMARY.md` (each sprint's findings), and are **not** things this
frontend can fix without backend changes:

- The backend's `EngagementType` enum (`remote`/`in_person`/`hybrid`) doesn't
  semantically match the original questionnaire's engagement-type question
  (a time-commitment axis, not a modality axis). The frontend shows the
  original wording while storing into the existing enum.
- `GET /api/v1/profiles/{user_id}` and `GET /api/v1/users/{user_id}` are both
  owner/admin-only — a mentee cannot view a matched mentor's full profile or
  resolve their name via these endpoints. The frontend works around this by
  sourcing mentor info from the *live* matching endpoint (which embeds the
  full mentor object) wherever possible, and degrades gracefully elsewhere.
- The backend's Gemini request timeout doesn't fully bound the SDK's internal
  retry loop when Gemini is unreachable.

## Design System

Colors, typography, spacing, and radii come from `MENPS_Design_System.docx`
and are implemented as Tailwind `@theme` tokens in `src/styles/index.css`.
The Profile questionnaire's exact wording comes from the original MENPS
Google Forms export.
