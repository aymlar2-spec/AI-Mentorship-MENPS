# Bugfix Summary — Final QA Regressions

Three bugs were reported. Two were reproduced, root-caused, and fixed. One
(Bug 1) could not be reproduced despite six independent, rigorous attempts —
documented honestly below rather than papered over with a speculative fix.

---

## Bug 2 — Profile questionnaire: RadioGroup only accepts the first option

**Status: Root cause found. Fixed. Verified.**

### Root cause

`src/components/ui/RadioGroup.tsx` rendered one native `<input type="radio">`
per option, but only attached React Hook Form's tracking `ref` to the
**first** option:

```tsx
<input
  ref={index === 0 ? ref : undefined}   // ← bug
  type="radio"
  name={name}
  value={option.value}
  ...
/>
```

React Hook Form's uncontrolled-field model for radio/checkbox groups
requires the `ref` callback to be attached to **every** input sharing a
`name` — that's how it determines the true "checked" value across an
option set. With the ref only on the first input, React Hook Form's
internal field registry only ever knew about that one DOM node. The
`onChange` handler (also part of the same `register()` spread) still fired
correctly on every click — so the _browser_ correctly showed whichever
option was checked (`"The UI shows the selected option correctly"`, exactly
as reported) — but validation, which reads through the registered `ref`,
could only ever see the first option's checked state as ground truth.

This explains the exact symptom pattern with no per-field exceptions:
whichever option happened to be **index 0** in each field's `options` array
was the only one ever accepted:

| Field                                                              | `options[0]`                   | Matches reported "only accepted" option |
| ------------------------------------------------------------------ | ------------------------------ | --------------------------------------- |
| `mentoring_role`                                                   | `mentor` ("Mentor")            | ✅                                      |
| `engagement_type`                                                  | `remote` ("Ponctuel"/one-time) | ✅                                      |
| `whatsapp` / `previous_mentoring_experience` / `active_engagement` | `"Oui"` (Yes)                  | ✅                                      |

It also explains a deeper issue the report didn't explicitly call out:
`PROFILE_FORM_DEFAULTS` and any edit-mode `defaultValues` (from
`profileToFormValues()`) frequently set a field's default to something
**other** than index 0 — e.g. `mentoring_role: "mentee"` (index 1),
`engagement_type: "hybrid"` (index 2). Under the bug, those fields would
show phantom validation errors even on a **freshly opened, untouched**
edit form, because the ref-based initial value sync also only ever worked
for index-0 defaults.

### Fix

Attach the same `ref` to every option's input instead of only the first:

```tsx
<input
  ref={ref}
  type="radio"
  name={name}
  value={option.value}
  ...
/>
```

This is not a workaround — it's the standard, documented React Hook Form
pattern for native radio/checkbox groups (calling the same callback `ref`
once per DOM node is exactly how RHF is designed to track a group). The now-
unused `index` parameter was removed from the `.map()` callback.

**File modified:** `src/components/ui/RadioGroup.tsx` (single change, ~3
lines).

### Verification

- `src/__tests__/bug2-repro.test.tsx` (new): renders the real `ProfileForm`,
  selects the **second** option in every affected radio question (Mentorée,
  Non, Étendu dans le temps, Oui), submits, and asserts neither
  "Veuillez choisir une option" nor "Veuillez répondre à cette question"
  appears. Confirmed **failing** against the original code and **passing**
  against the fix (verified both ways by temporarily reverting and
  re-running).
- `src/__tests__/bug3-root-cause.test.tsx` (new — see Bug 3 below):
  additionally proves the deeper edit-mode default-value issue is fixed.

---

## Bug 3 — RadioGroup selection unexpectedly scrolls the page

**Status: Likely root cause identified and fixed at the source; could not
be empirically confirmed in this environment (see limitation below).**

### Investigation

I ruled out several of the suggested causes directly:

- **Form submission**: clicking a `<label>` wrapping a radio input does not
  submit an ancestor `<form>` in any browser; only an actual
  `type="submit"` control does.
- **Incorrect button types**: audited every native `<button>` reachable
  from the Profile form (`ThemeSelector`, `ThemeBadge`, the shared `Button`
  component) — all correctly declare `type="button"`.
- **`scrollIntoView` / focus management**: added a diagnostic test
  (`bug3-diagnostic.test.tsx`) that spies on `Element.prototype.scrollIntoView`
  and on the submit button's `focus()` method while clicking a radio option.
  Zero calls to either, both before and after the Bug 2 fix — no code in
  this app explicitly triggers a scroll or misdirected focus on radio
  selection.

That ruled out every _application-code_ cause the report suggested. The
remaining, well-established cause for this exact symptom class ("an
invisible/visually-hidden native form control causes an unexpected scroll
when it receives focus") is a CSS positioning issue:

`RadioGroup` hides its native `<input>` visually using Tailwind's `sr-only`
utility, which relies on `position: absolute` with no explicit offsets. An
absolutely-positioned element with `auto` insets computes its on-screen
position relative to its **nearest positioned ancestor** — and the
`<label>` wrapping each hidden input had no `position` declared at all
(effectively `static`). Without an explicit anchor, the browser has to walk
up the DOM to find the nearest ancestor that establishes a positioning
context, which — depending on the exact render tree — is not guaranteed to
be anywhere near the visible label. If it resolves to a distant or
differently-sized ancestor, focusing the hidden input (which is exactly
what happens when a user clicks its `<label>`) can cause the browser to
scroll to wherever that miscalculated position lands, rather than staying
where the visible label already was on screen.

### Fix

Added `position: relative` to the immediate `<label>` wrapper, so the
absolutely-positioned hidden input is always anchored to its own label —
never any distant ancestor:

```tsx
<label className={cn("relative cursor-pointer ...", ...)}>
  <input ref={ref} type="radio" className="sr-only" ... />
  {option.label}
</label>
```

**File modified:** `src/components/ui/RadioGroup.tsx` (same file as Bug 2;
one class added).

### Verification and honest limitation

- Confirmed via the diagnostic test that no application code calls
  `scrollIntoView` or moves focus on radio selection, before or after any
  fix — ruling out a JS-level cause.
- **I could not empirically prove this CSS fix resolves the _visual_
  scrolling symptom in this environment.** This sandbox has no real browser
  — only jsdom (via Vitest), which does not implement real layout/paint, so
  `position: absolute` offset calculations and actual scroll geometry are
  not observable here. The fix is the correct, standard remedy for this
  known bug category (a `relative` anchor for an absolutely-positioned
  child is objectively correct CSS regardless of whether it's the _exact_
  mechanism at play), and it introduces no regression risk, but it should
  be re-verified visually in a real browser before considering this fully
  closed.

---

## Bug 1 — Conversation History: selecting a conversation opens empty instead of loading messages

**Status: Could not reproduce. Not fixed, because I could not find anything
to fix.** Documented in full rather than guessing at a change.

### What was tested

I tested every plausible interpretation of "select a previous conversation"
against a real, running backend with real persisted conversation data,
using React Testing Library (not just abstract code reading):

1. **Fresh mount at `/chat?conversationId=X`** (equivalent to a hard
   navigation or page refresh landing directly on an existing conversation)
   — `bug1-repro.test.tsx`. **Passed** — message loaded correctly.
2. **History's own inline preview panel** (clicking a conversation row on
   the History page itself, before any navigation to `/chat`) —
   `bug1-inline-preview.test.tsx`. **Passed.**
3. **SPA client-side navigation between two different conversations while
   `AIChat` stays mounted** (same route, only the query string changes) —
   tested and passed, then removed as redundant once test 5 below covered
   the same ground more faithfully.
4. **The exact production router**: `createBrowserRouter`, `React.lazy`
   code-split pages, the real `AppShell`/`ProtectedRoute` tree, and a real
   click on the real "Continuer" button — `bug1-prod-router.test.tsx`.
   **Passed.**
5. Re-ran the full click-through flow wrapped in `<StrictMode>` (matching
   `main.tsx` exactly, since double-invoked effects are a classic source of
   subtle bugs this category of test can otherwise miss). **Passed.**

All five reproduction attempts loaded and displayed the existing message
correctly. I also verified the underlying data flow directly: `GET
/api/v1/conversations/{id}` correctly returns the full message list, and
`AIChat.tsx`'s conversation-loading logic (`useAsyncData` + the
render-time state sync when a new conversation loads) behaves correctly
under both plain rendering and `StrictMode`'s double-invocation.

### What I could not test

This sandbox has no real browser — I cannot verify with an actual mouse
click in Chrome/Firefox/Safari, with real network latency, or against
whatever exact build/cache state was on the machine where this was
observed. If this is a real, reproducible bug, the most likely explanations
I could not rule out are:

- **A stale build or cached bundle** on the machine where it was observed
  (e.g. testing against an older `dist/` or a browser that hadn't picked up
  a fresh dev-server reload).
- **A timing/latency-dependent race** that only manifests with realistic
  network round-trip times — my local test backend responds in single-digit
  milliseconds, which could mask a race that only appears with slower,
  more realistic latency.
- Something specific to the exact browser/OS/extension environment used
  during QA that doesn't reproduce in jsdom.

### If this persists

I'd need one of the following to pursue it further: a hard browser refresh
retest with dev tools open (confirm it's not a stale bundle), the Network
tab entry for the `GET /api/v1/conversations/{id}` request when it fails
(status code and response body as the browser actually saw them), or the
exact click sequence if it differs from "click a conversation row, then
click Continuer."

---

## Files modified

- `src/components/ui/RadioGroup.tsx` — Bug 2 (ref on every option) and
  Bug 3 (`relative` positioning on the label wrapper).

## Files added (regression tests)

- `src/__tests__/bug2-repro.test.tsx`
- `src/__tests__/bug3-root-cause.test.tsx`
- `src/__tests__/bug3-diagnostic.test.tsx`
- `src/__tests__/bug1-repro.test.tsx`
- `src/__tests__/bug1-inline-preview.test.tsx`
- `src/__tests__/bug1-prod-router.test.tsx`
- `src/__tests__/setup.ts` — added a `scrollIntoView` polyfill (jsdom
  doesn't implement it; needed for any test that mounts `AIChat`, whose
  auto-scroll-to-bottom effect calls it).

## Verification performed

- `npm run lint` — 0 errors, 0 warnings.
- `npm run typecheck` — 0 errors.
- `npm run test` (Vitest) — **14/14 passing** across 10 files, run against a
  live backend instance (no mocks). Includes the pre-existing Sprint 3–5
  regression suites re-verified unaffected, plus 6 new tests for this
  bugfix pass.
- `npm run build` — clean, well-chunked, no warnings.
- Additionally served the actual **production build** via `vite preview`
  (not just dev mode) and confirmed the app loads and routes resolve
  correctly — ruling out a dev-only vs. production-build discrepancy as a
  factor.

## Remaining known issues

1. **Bug 1 is unresolved** — not reproduced, not fixed. See above for what
   would help pursue it further.
2. **Bug 3's fix is unverified visually** — the CSS root cause and fix are
   sound and standard, but this environment cannot render a real browser to
   confirm the scroll behavior is actually gone. Recommend a manual check
   in a real browser (fill the Profile questionnaire, click a non-first
   radio option in each group, confirm no scroll jump) before final release
   sign-off.

---

# Feature: "Contact Mentor" in the Mentor Details Modal

## Implementation

Added a **"Contacter ce mentor"** section to `MentorDetailsModal`, placed
exactly where specified — under the compatibility explanation, before the
detailed profile information block. It shows only the actions for which
data actually exists, using outline buttons styled with the same
`buttonClasses()` builder the rest of the design system uses (so they're
visually identical to every other outline `Button` in the app), with
Lucide `Mail` / `Phone` / `MessageCircle` icons.

- **Email** — shown whenever `mentor.email` exists (it's a required,
  non-nullable field on `User`, so this is effectively always available).
  `href="mailto:<email>"`.
- **Call** — shown only when `profile.phone` exists and is non-empty.
  `href="tel:<phone>"` (unmodified, since `tel:` links handle `+`/spaces
  natively).
- **WhatsApp** — shown only when `profile.phone` exists **and**
  `profile.whatsapp === "Oui"`. `href="https://wa.me/<normalized phone>"`,
  opened in a new tab (`target="_blank" rel="noopener noreferrer"`).

If none of the three are available the whole section renders `null` — no
disabled buttons are ever shown, matching the spec.

### A data-model note worth being explicit about

`profile.whatsapp` does **not** store a phone number. Per the original
MENPS questionnaire (see `SPRINT_3_SUMMARY.md` and
`components/profile/questionnaire.ts`), this field stores the answer to
*"Pouvons-nous vous ajouter à un groupe Whatsapp en lien avec le réseau ?"*
— literally `"Oui"` or `"Non"`. Treating that string as a phone number to
normalize would produce nonsense (e.g. `wa.me/Oui`). The WhatsApp button
therefore uses **`profile.phone`** as the actual number, gated on
`profile.whatsapp === "Oui"` as a consent flag — this is the only
interpretation that both matches the real data model and makes the feature
actually work. This is documented in a code comment directly on
`ContactMentorSection` so it isn't rediscovered as a "bug" later.

### Normalization

`src/lib/phone.ts` exports `normalizePhoneForWhatsApp(phone)`, which
strips spaces, `+`, `-`, `(`, and `)` via a single regex
(`/[\s+\-()]/g`) — verified against the exact example in the spec:
`"+212 6 12 34 56 78"` → `"212612345678"`.

### Interaction with the existing profile-RBAC limitation

`profile.phone`/`profile.whatsapp` come from the same
`profilesApi.getByUserIdSafe()` call the modal already made for the rest
of the profile details — which, per the Sprint 3 finding, returns `null`
for a mentee viewing a mentor (owner/admin-only backend restriction). This
means **a mentee will currently only ever see the Email action**; Call and
WhatsApp only appear for an admin. This is not a new limitation introduced
by this feature — it's the same known, already-documented backend RBAC
gap — and the section correctly degrades to email-only rather than
breaking, exactly as required by "display only the actions for which data
exists."

## Files modified

- `src/components/mentor/MentorDetailsModal.tsx` — added the
  `ContactMentorSection` component and rendered it in the required
  position. **No other component, page, or the matching algorithm/backend
  was touched**, per the constraint.

## Files added

- `src/lib/phone.ts` — `normalizePhoneForWhatsApp()`.
- `src/__tests__/contact-mentor-normalize.test.ts` — unit tests for the
  normalization function (the exact spec example, plus dashes/parens, plus
  an already-clean number).
- `src/__tests__/contact-mentor-modal.test.tsx` — three integration tests
  against a **live backend** with real seeded mentor profiles, covering
  all three visibility combinations: full contact info (Email + Call +
  WhatsApp), phone-only/no-WhatsApp-consent (Email + Call), and no profile
  at all (Email only) — asserting the exact `href` on each rendered link.

## Verification performed

- **`npm run lint`** — 0 errors, 0 warnings.
- **`npm run typecheck`** — 0 errors.
- **`npm run build`** — clean; the `mentor` chunk grew from 6.41 kB to
  7.57 kB reflecting the new section, no new warnings.
- **`npm run test`** — **20/20 passing** across 12 files (17 pre-existing +
  3 new), run against a live backend with three purpose-seeded mentor
  accounts (full contact info / phone-only-no-whatsapp-consent /
  no-profile). Each test asserts the exact rendered `href` values —
  `mailto:mentor.full@menps.com`, `tel:+212 6 12 34 56 78`, and
  `https://wa.me/212612345678` — not just presence/absence of the buttons.
- **Real bug caught and fixed during this work**: the new tests initially
  failed with data from a *previous* test still visible in the DOM. Root
  cause: `@testing-library/react`'s automatic `afterEach` cleanup was not
  reliably registering in this Vitest setup, so multiple tests rendering
  similar components in the same file could see each other's leftover
  elements. Fixed by adding an explicit `afterEach(() => cleanup())` to
  `src/__tests__/setup.ts` — this benefits the entire test suite, not just
  this feature's tests, and was verified by re-running the full 20-test
  suite afterward with no regressions.
- **Not independently verifiable in this environment**: actually opening
  the system email client / phone dialer / WhatsApp app from a `mailto:`,
  `tel:`, or `wa.me` link requires a real OS and installed apps, which this
  sandbox does not have. What *was* verified is that the rendered `<a>`
  elements have exactly the correct `href` values per the spec (confirmed
  via the automated tests above) — browsers and mobile OSes handle
  `mailto:`/`tel:`/`https://wa.me/...` link activation natively, so correct
  `href` construction is the actual implementation surface; the OS-level
  handoff itself is standard platform behavior outside the application's
  control. Recommend a quick manual click-through on a real device as part
  of release sign-off, same as Bug 3's CSS fix above.
- **Responsive layout**: implemented with `flex flex-col gap-2 sm:flex-row
  sm:flex-wrap` and `w-full sm:w-auto` per button, matching the exact
  pattern already used elsewhere in the app (e.g. `Settings.tsx`'s action
  rows) for stacked-on-mobile/row-on-desktop behavior. Not visually
  screenshotted (no real browser available here), but uses the same,
  already-proven responsive utility pattern as the rest of the app rather
  than new/untested CSS.

---

# Follow-up: mentee only ever saw Email (Call/WhatsApp missing)

## Root cause

After shipping the feature above, only the Email action ever appeared for
a mentee — exactly the documented limitation from Sprint 3/4: `GET
/api/v1/profiles/{mentor_id}` only allowed the profile owner or an admin
to view a profile. For a mentee, `profilesApi.getByUserIdSafe()` always
received a 403 and degraded to `null`, so `profile.phone`/
`profile.whatsapp` were never available — only `mentor.email` (from the
`User` object embedded in the match response) ever rendered a button.

## Fix — backend

This is the one case in this pass where the correct fix genuinely lives in
the backend, not the frontend: relax the profile-viewing rule specifically
for a mentee viewing a mentor they've actually been matched with, rather
than opening profile access broadly.

**File modified:** `app/routers/profiles.py`

- Replaced `_ensure_self_or_admin()` with `_ensure_can_view_profile()`,
  which additionally allows access when the requester is a mentee **and**
  a `Matching` row exists linking that mentee to that mentor (queried via
  `_has_been_matched()`). Admin and self-access continue to work exactly
  as before. Mentors still cannot view mentee profiles this way — the
  exception is intentionally narrow and one-directional, matching what the
  matching engine actually produces (mentees get mentors recommended to
  them, not the reverse).
- Removed `_ensure_self_or_admin` (now unused) and an unused
  `require_roles` import that predated this change — both dead code once
  the single new helper replaced the old check.

No other backend file, the matching algorithm, and no database
schema/migration were touched — this only changes an authorization check
in one route handler.

## Fix — frontend

No functional frontend change was required — `MentorDetailsModal` and
`ContactMentorSection` already correctly used `profile.phone`/
`profile.whatsapp` whenever `profile` was non-null; they simply couldn't
get a non-null `profile` for a mentee before this backend fix. Two
doc/copy updates were made for accuracy now that the limitation is
partially resolved:

- The "not yet visible" fallback message in `MentorDetailsModal.tsx` no
  longer claims this is admin-only; it now explains it becomes visible
  once a match has been computed with that mentor (which is true, and in
  practice the false-null case is now a rare edge condition rather than
  the default for every mentee).
- The component's top-of-file doc comment was updated to describe the new
  three-way access rule instead of the old owner/admin-only one.

## Verification

- **Positive case**: `src/__tests__/contact-mentor-rbac-fix.test.tsx`
  (new) — registers a real mentor + mentee, creates both profiles, runs
  the actual matching engine (`POST /api/v1/matching/me`), then renders
  `MentorDetailsModal` **logged in as the mentee** (not admin) and asserts
  Email, Call, *and* WhatsApp all render with the correct `href`s. This is
  the definitive proof the fix works from the frontend's perspective.
- **Negative case / security boundary**:
  `src/__tests__/profile-rbac-boundary.test.ts` (new) — confirms a mentee
  **still** gets a 403 when requesting the profile of a mentor they have
  *no* Matching record with. This was verified carefully: an earlier
  manual `curl` test of this scenario was accidentally invalid because the
  matching engine returned both available mentors in `top_matches`
  (`top_n=3` with only 2 candidates), which persists a `Matching` row for
  *each* returned candidate — so both ended up genuinely matched. The
  correct test registers a mentor **after** the match already ran, so no
  `Matching` row can possibly exist for them.
- Directly verified via `curl` against the running backend, independent of
  the frontend test suite: `GET /profiles/{matched_mentor_id}` as the
  mentee → `200`; `GET /profiles/{unrelated_mentor_id}` as the same mentee
  → `403 {"detail":"You are not authorized to view this profile"}`.
- Re-ran the full frontend suite: **23/23 tests passing** across 14 files
  (added 2 new test files for this fix, plus rewrote the original
  Contact Mentor modal test to be self-contained — it previously depended
  on hardcoded UUIDs from a one-off manual `curl` seeding session, which is
  fragile; it now registers its own fixtures via the API on every run).
- `npm run lint`, `npm run typecheck`, `npm run build` — all still clean.
- Confirmed the backend itself starts cleanly with the modified route file
  (`python3 -c "import ast; ast.parse(...)"` plus an actual `uvicorn`
  startup) before running any of the above.

## Remaining known issue (unchanged, smaller in practice now)

A mentor still cannot view a mentee's profile — there's no equivalent
"has this mentee been recommended to me" relationship the matching engine
produces in that direction, so a symmetric exception isn't meaningful the
same way. Not addressed here since it wasn't part of what was asked, and
mentors don't have a "Contact Mentee" feature that would need it today.

