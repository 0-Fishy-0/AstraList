# AstraList Plans / Next Steps

Updated: 2026-09-12

# Immediate product focus

Design the actual `/list/anime` experience.

The route shell and surrounding application infrastructure are already present, so the next work should finally target the core tracking product rather than more infrastructure refactors.

---

# Immediate sequence

## 1. Finalize Anime List visual hierarchy

Do not code the full feature until the row design feels right.

Requirements already decided:

```text
list/rows, not cards
cover image left
anime title
2-3 tags
progress x / y
+ increment button
user rating: - or 1..10
small edit affordance
```

Design goal:

- dense enough for quick scanning,
- not as sterile as a raw table,
- not as chunky as cards,
- clearly AstraList.

Previous mockups were rejected; start from the functional brief rather than polishing them further.

---

## 2. Build the static AnimeList row component

Once the visual direction is approved, build a reusable row with placeholder data.

Do not immediately connect AniList.

First prove:

- layout,
- responsive behavior,
- hover/focus behavior,
- progress/rating/edit controls visually fit.

---

## 3. Local interaction prototype

Before backend mutations, prototype the interactions locally:

### Progress

```text
x / y [+]
```

Click +:

```text
x -> x + 1
```

Boundary behaviors:

```text
if status = Planning and progress changes 0 -> 1
-> prompt: move to Watching?

if status = Watching and progress reaches total
-> prompt: mark Completed?
```

Do not silently change status unless that product behavior is explicitly chosen.

### Rating

Current intended model:

```text
-  = no rating
1..10 = selected rating
```

Click should expose a compact choice rather than permanently occupying huge row space.

### Edit

Small edit action opens a more detailed entry editor containing at least:

```text
progress / episode count
status
start date
end date
score
```

Exact component type (popover/dialog/side panel) is not yet finalized.

---

## 4. Define actual Anime data shape needed by the frontend

Only after the UI is clear, decide what the backend must return.

Likely information includes:

```text
media id
title
cover image
genres/tags
episode total
current progress
status
user score
start date
end date
possibly studio/year/format if the UI truly needs them
```

Do not fetch/display metadata merely because AniList exposes it.

The UI should drive the data contract.

---

## 5. AniList GraphQL/backend list data

Then implement backend AniList functionality:

1. GraphQL helper/service.
2. Fetch authenticated user's media list collection.
3. Normalize provider response into AstraList API response.
4. Keep provider token backend-only.
5. Add protected AstraList endpoint(s) consumed by AnimeListPage.
6. Add loading/empty/error states.

---

## 6. List mutations

Working:

- progress mutation,
- status mutation,
- score mutation,
- dates/details edit.

Current decision: AniList is the source of truth. AstraList sends partial updates through one protected backend endpoint and updates React only from AniList-confirmed responses.

The advanced editor sends one mutation only when Save is clicked. All other dismissal paths discard the local draft without changing AniList.

---

# List routes

Current working route:

```text
/list/anime
```

Planned:

```text
/list/games
/list/movies
```

Keep them as separate pages.

Do not introduce `/list/:category` unless future code genuinely becomes generic enough to benefit.

Do not introduce a shared `ListLayout` until there is actual duplicated list-page structure.

---

# Authentication on list pages

List pages are personal/private management pages.

Unlike public profiles, valid `/list/*` routes should require authentication.

Desired behavior:

```text
user authenticated
-> render list page

user unauthenticated
-> redirect to /
```

Prefer one shared protected-route/layout mechanism once multiple protected list pages exist rather than repeating identical redirect logic in every page.

Do not confuse this with `/api/me`, which remains optional viewer inspection.

---

# Main Nav Lists-active behavior

Postponed until list routes are in place.

Then use route location conceptually:

```js
const location = useLocation();
const isListRoute = location.pathname.startsWith('/list/');
```

The single Lists button should appear active on:

```text
/list/anime
/list/games
/list/movies
```

Submenu links themselves can still use exact `NavLink` active state for Anime vs Games vs Movies.

Once this exists, revisit the main moving indicator so Lists can own the active `--nav` anchor cleanly.

---

# Profile work after Anime core begins working

Later:

- real bio field,
- avatar,
- profile settings/editor,
- handle-change flow,
- handle validation,
- handle-change cooldown using `handleChangedAt`,
- connect `Right Now` sections to real media state,
- empty/loading states.

---

# Product expansion later

Games and Movies/TV come after Anime proves the architecture/product patterns.

Do not force Anime abstractions onto them prematurely.

Potential future providers will have different usernames, IDs, tokens, schemas, and status systems; AstraList keeps its own canonical handle/user identity.

---

# Production/security backlog

Before production:

- OAuth state/CSRF protection.
- revisit one-hour session lifetime.
- secure cookies under HTTPS.
- token expiry/renewal handling.
- verify refresh-token support.
- rate limiting where needed.
- environment validation.
- robust backend errors/logging without secrets.

---

# Build-order summary

```text
DONE
AniList OAuth
MongoDB users/sessions
Auth cookie
/api/me viewer state
logout
LoadingPage
AstraBackground
public profile route/API
ProfilePage shell/design
AppLayout + nested routing
AuthContext
NavPill
native Lists popover
popover open/close animation
/list/anime route shell

NOW
Anime List mutation verification and polish

NEXT
decide the next Anime List feature after mutation behavior is manually exercised

LATER
Lists active indicator cleanup
whole-nav keyboard accessibility pass
Profile editing/settings
Games
Movies & TV
advanced animation/polish
production auth/security hardening
```
