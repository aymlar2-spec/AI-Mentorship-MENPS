# Sprint 3 Summary — Profile & Matching

## Components created

**Profile module** (`src/components/profile/`)

- `ProfileForm` — the full questionnaire (RHF + Zod), composed only of `SectionCard`/`Input`/`TextArea`/`RadioGroup`/`ThemeSelector`. Works for both create and edit via `defaultValues`.
- `ProfileSummary` — read-only view of a completed profile.
- `ThemeSelector` — loads themes from the backend, enforces the 1–3 selection rule, shows selection as removable chips.
- `ThemeBadge` — single theme chip, removable or read-only.
- `questionnaire.ts` — the original French question wording (extracted verbatim from the uploaded xlsx export), option labels, and the two mapping functions (`profileToFormValues`, `formValuesToCreatePayload`/`formValuesToUpdatePayload`) that convert between form state and the exact backend payload shape.

**Matching module** (`src/components/mentor/`)

- `MentorCard` — extended to optionally show current position, entity, and themes (in addition to the score/explanation it already had from Sprint 2).
- `CompatibilityBadge` / `CompatibilityProgress` — score display, sharing one `compatibilityVariant()` helper (`src/lib/matching.ts`) so badge and bar always agree on color.
- `MentorDetailsModal` — full mentor view; degrades gracefully when the backend denies profile access (see Bugs Found).
- `EmptyMatchingState` — two variants: "complete your profile first" vs. "no mentors available."

**New shared UI primitives** (`src/components/ui/`)

- `SectionCard` — titled section wrapper, gives the questionnaire its government-form structure.
- `RadioGroup` — accessible segmented control for the questionnaire's Yes/No and 2–4-option questions (native radios under the hood, fully RHF-compatible).
- `ButtonLink` — a `<Link>` styled identically to `Button`, extracted from `Button`'s own styles (`button-styles.ts`) so navigation CTAs never nest an `<a>` inside a `<button>`.

**Pages**

- `pages/Profile.tsx` — load/create/edit with Loading/Empty/Error states and success toasts. No profile yet → the Empty state _is_ the create form.
- `pages/Matching.tsx` — triggers the deterministic engine, enriches each result with profile data (when accessible), and renders the Mentor Details modal.

## APIs consumed (all pre-existing, none added)

- `GET /api/v1/themes`
- `POST /api/v1/profiles/me`, `GET /api/v1/profiles/me`, `PATCH /api/v1/profiles/me`, `POST /api/v1/profiles/me/themes`
- `GET /api/v1/profiles/{user_id}` (with graceful 403/404 degradation — see below)
- `POST /api/v1/matching/me?top_n=3`
- Two new _frontend-only_ convenience wrappers were added to `api/profiles.ts` — `getMineSafe()` and `getByUserIdSafe()` — which call the exact same endpoints as `getMine()`/`getByUserId()` but resolve to `null` on 404/403 instead of throwing. No backend change, no new endpoint.

## Tests executed (against the real running backend, not mocked)

1. `npm run lint`, `npm run typecheck`, `npm run build` — all pass, zero errors/warnings.
2. Seeded the 9 real theme names from the xlsx via the existing admin `POST /api/v1/themes`.
3. Registered a mentor and a mentee, created both profiles via the **exact JSON shape** `formValuesToCreatePayload` produces — both succeeded and returned data matching the `Profile` TS type field-for-field.
4. Ran `POST /api/v1/matching/me?top_n=3` as the mentee — got a **100% match** with a real, human-readable explanation string.
5. Confirmed the RBAC-degradation path explicitly: `GET /api/v1/profiles/{mentorId}` as the mentee → real `403`; same call as admin → full profile returned.
6. Registered a fresh mentee with no profile, confirmed `GET /profiles/me` → 404 and `POST /matching/me` → `{"top_matches": []}` (not an error).
7. Exercised the edit flow: `PATCH /profiles/me` followed by `POST /profiles/me/themes` — both succeeded.
8. Started the Vite dev server against the live backend and force-transformed `Profile.tsx`/`Matching.tsx` — no compile errors.

## Bugs found (backend/questionnaire contract gaps — not fixed, per "do not modify the backend")

1. **`EngagementType` enum mismatch.** The original questionnaire's engagement question is about _time commitment_ (Ponctuel / Étendu dans le temps / Les deux). The backend's `EngagementType` enum (`remote` / `in_person` / `hybrid`) was modeled around _meeting modality_. The form shows the original wording as labels while storing into the existing enum positionally. **Recommendation:** rename the backend enum in a future sprint.
2. **`GET /api/v1/profiles/{user_id}` RBAC blocks mentee→mentor profile viewing.** Only the profile owner or an admin can fetch a profile by id. `MentorCard`/`MentorDetailsModal` degrade gracefully rather than erroring. **Recommendation:** relax this check for mentees viewing a mentor they've actually been matched with.
3. **`MentoringRole` enum is missing a 4th original option.** The form's "Pas intéressée à ce stade" has no backend equivalent (`mentor`/`mentee`/`both` only). Omitted from the form.

## Bugs found and fixed (this sprint, frontend-only)

- `RadioGroup` combined with `{...register(name)}` produced a duplicate `name` prop (TS2783) — fixed.
- `CompatibilityBadge.tsx` exported both a component and a helper function, breaking Fast Refresh — the helper was extracted to `src/lib/matching.ts`.

## Remaining work before Sprint 4

None blocking — Profile and Matching are complete per this sprint's scope.
