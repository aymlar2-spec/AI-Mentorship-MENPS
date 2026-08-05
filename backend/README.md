# MENPS — AI Mentorship Platform for Women (Backend)

Production-ready FastAPI backend for a women's mentorship platform: authentication,
profile management, a **deterministic** mentor–mentee matching engine, and an
AI coaching assistant powered by Google Gemini.

## Tech Stack

- Python 3.12
- FastAPI + Pydantic v2
- SQLAlchemy 2.0 (ORM) + Alembic (migrations)
- SQLite by default, one-line switch to PostgreSQL
- JWT authentication (python-jose) + bcrypt password hashing (passlib)
- Google Generative AI SDK (Gemini) for the coaching assistant

## Project Structure

```
backend/
└── app/
    ├── api/            # Shared FastAPI dependencies (auth, RBAC)
    │   └── deps.py
    ├── core/            # Config & security (JWT, hashing)
    │   ├── config.py
    │   └── security.py
    ├── database/        # Engine, session, declarative base
    │   ├── base.py
    │   └── session.py
    ├── models/          # SQLAlchemy ORM models
    │   ├── user.py
    │   ├── profile.py
    │   ├── theme.py
    │   ├── matching.py
    │   └── conversation.py
    ├── schemas/         # Pydantic request/response models
    ├── services/        # Business logic (repository/service layer)
    │   ├── auth_service.py
    │   ├── user_service.py
    │   ├── profile_service.py
    │   ├── theme_service.py
    │   ├── conversation_service.py
    │   ├── matching/
    │   │   ├── engine.py     # Deterministic scoring algorithm (NO AI)
    │   │   └── service.py    # Orchestration + persistence
    │   └── ai/
    │       ├── gemini_client.py  # Gemini SDK wrapper
    │       ├── prompts.py        # Prompt templates
    │       └── ai_service.py     # Coaching use cases
    ├── routers/         # HTTP route handlers, grouped by domain
    ├── utils/
    │   └── exceptions.py # Domain exceptions -> HTTP responses
    └── main.py           # App factory, middleware, router registration

alembic/                  # Database migrations
requirements.txt
.env.example
```

## Getting Started

### 1. Install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

- `SECRET_KEY` — a long random string (used to sign JWTs)
- `GEMINI_API_KEY` — your Google Generative AI API key (get one at
  https://aistudio.google.com/app/apikey). The AI endpoints (`/api/v1/ai/*`)
  will return a 502 error until this is set.

`DATABASE_URL` defaults to SQLite (`sqlite:///./menps.db`), so no extra setup
is required for local development. To use PostgreSQL instead:

```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/menps
```

Note: `psycopg2-binary` is not in `requirements.txt` by default — add it if you switch to PostgreSQL.

### 3. Run database migrations

```bash
alembic upgrade head
```

(The app also auto-creates tables on startup via `create_all()` for extra
local-dev convenience, but running Alembic explicitly is the recommended,
production-safe path and is required if you plan to evolve the schema.)

### 4. Run the server

```bash
uvicorn app.main:app --reload
```

The API is now available at `http://localhost:8000`.

- Interactive Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Raw OpenAPI schema: `http://localhost:8000/openapi.json`

## Authentication

1. `POST /api/v1/auth/register` — create a user (`role`: `admin`, `mentor`,
   or `mentee`). Returns a user object + JWT access token.
2. `POST /api/v1/auth/login` — authenticate with email/password. Returns the
   same shape.
3. Use the token as a Bearer token on every subsequent request:
   `Authorization: Bearer <access_token>`.

In Swagger UI, click **Authorize** and paste the raw token (no `Bearer `
prefix needed — the UI adds it for you).

## Core Workflow Example

```bash
# 1. Register a mentor and a mentee
curl -X POST localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"full_name":"Fatima","email":"fatima@menps.com","password":"secret123","role":"mentor"}'

curl -X POST localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"full_name":"Sara","email":"sara@menps.com","password":"secret123","role":"mentee"}'

# 2. (Admin) create themes, then have each user create a profile and attach themes
curl -X POST localhost:8000/api/v1/profiles/me -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mentoring_role":"mentee","engagement_type":"remote","theme_ids":["<theme_id>"]}'

# 3. Run the deterministic matching engine for the mentee
curl -X POST "localhost:8000/api/v1/matching/me?top_n=3" -H "Authorization: Bearer <mentee_token>"

# 4. Ask the AI assistant to explain the recommendation
curl -X POST localhost:8000/api/v1/ai/explain-match -H "Authorization: Bearer <mentee_token>" \
  -H "Content-Type: application/json" -d '{"mentor_id":"<mentor_id>"}'
```

## Matching Engine (Deterministic — No AI)

`app/services/matching/engine.py` computes a 0–100 compatibility score for
every mentor against a mentee, using four weighted signals:

| Signal                          | Weight |
|----------------------------------|--------|
| Common themes (needs vs. skills)| 40%    |
| Mentoring experience             | 20%    |
| Availability / engagement type   | 20%    |
| Organization / entity            | 20%    |

The top N mentors (default 3) are returned with a human-readable
explanation string and persisted to the `matchings` table for auditing and
history (`GET /api/v1/matching/history/me`).

The AI module never influences this score — it can only *explain* an
already-computed result in natural language via `/api/v1/ai/explain-match`.

## AI Assistant (Gemini)

All endpoints live under `/api/v1/ai/*` and require authentication. Each
call receives the caller's profile as context and stores both sides of the
exchange in the `conversations` / `messages` tables. Pass `conversation_id`
to continue an existing conversation; omit it to start a new one.

| Endpoint                    | Purpose                                   |
|------------------------------|--------------------------------------------|
| `POST /ai/chat`             | Free-form mentoring Q&A                    |
| `POST /ai/smart-goals`      | Turn an objective into SMART goals         |
| `POST /ai/session-summary`  | Summarize mentoring session notes          |
| `POST /ai/action-plan`      | Suggest a step-by-step action plan         |
| `POST /ai/explain-match`    | Explain a computed match in plain language |
| `POST /ai/reformulate`      | Clarify a stated need/question             |

Conversation history: `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}`.

## Database Schema

- **User** — account + role (`admin`/`mentor`/`mentee`)
- **Profile** — 1:1 with User; mentoring-specific fields
- **Theme** / **ProfileTheme** — many-to-many topic tags used by the matching engine
- **Matching** — persisted mentor/mentee score + explanation history
- **Conversation** / **Message** — AI assistant chat history

## Role-Based Access Control

- `admin` — manage users, themes, trigger matching for any mentee
- `mentor` / `mentee` — manage their own profile, run their own matching,
  use the AI assistant, view their own conversations
- All role checks are enforced via the `require_roles(...)` FastAPI
  dependency in `app/api/deps.py`.

## Database Migrations

An initial migration (`alembic/versions/`) already creates the full schema.
To generate a new migration after changing models:

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

## Notes on Production Readiness

- Switch `DATABASE_URL` to PostgreSQL and add `psycopg2-binary` to
  `requirements.txt`.
- Set `DEBUG=False` and a strong, unique `SECRET_KEY` in production.
- Restrict `CORS_ORIGINS` to your actual frontend domain(s).
- Run migrations via `alembic upgrade head` in your deploy pipeline instead
  of relying on the `create_all()` startup convenience hook.
- Consider fronting the app with a process manager (gunicorn + uvicorn
  workers) for production traffic.
