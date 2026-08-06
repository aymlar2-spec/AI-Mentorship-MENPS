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
correctly on every click — so the *browser* correctly showed whichever
option was checked (`"The UI shows the selected option correctly"`, exactly
as reported) — but validation, which reads through the registered `ref`,
could only ever see the first option's checked state as ground truth.

This explains the exact symptom pattern with no per-field exceptions:
whichever option happened to be **index 0** in each field's `options` array
was the only one ever accepted:

| Field | `options[0]` | Matches reported "only accepted" option |
|---|---|---|
| `mentoring_role` | `mentor` ("Mentor") | ✅ |
| `engagement_type` | `remote` ("Ponctuel"/one-time) | ✅ |
| `whatsapp` / `previous_mentoring_experience` / `active_engagement` | `"Oui"` (Yes) | ✅ |

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

That ruled out every *application-code* cause the report suggested. The
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
- **I could not empirically prove this CSS fix resolves the *visual*
  scrolling symptom in this environment.** This sandbox has no real browser
  — only jsdom (via Vitest), which does not implement real layout/paint, so
  `position: absolute` offset calculations and actual scroll geometry are
  not observable here. The fix is the correct, standard remedy for this
  known bug category (a `relative` anchor for an absolutely-positioned
  child is objectively correct CSS regardless of whether it's the *exact*
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
