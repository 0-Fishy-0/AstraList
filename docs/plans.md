# AstraList Plans / Next Steps

Updated: 2026-09-14

# Immediate product focus

Finish the Anime detail/list-management error experience, then choose between
detail-page polish and one explicitly deferred navigation/accessibility item.

The core `/list/anime` experience, AniList mutations, public AnimePage, and its
add/change/remove control are working. Do not restart those completed design
and data-contract phases.

---

# Immediate sequence

## 1. Provider-failure UX on AnimePage

The missing-list-entry bug is fixed: AniList's MediaList `404` now becomes
`entry: null`, so a valid anime that is not on the viewer's list renders the
unlisted control.

Still to design and implement for genuine upstream failures:

- distinguish an active request from a completed error in cursor/disabled styling,
- provide a compact retry action or connection-problem prompt,
- expose enough provider-error meaning to present the right recovery action,
- avoid blind mutation retries because a request may have reached AniList before its response was lost.

Current mutation behavior already preserves the known entry on failed category
changes and removals; keep that behavior during the error-UX pass.

---

## 2. Verify live AniList detail and mutation behavior

Development fixtures intentionally bypass only anime-detail reads. With AniList
stable and `USE_ANIME_FIXTURES=false`, verify:

- public detail success/not-found/error behavior,
- logged-in list lookup for listed and unlisted anime,
- create, category update, and delete against real entries,
- provider rate-limit/token-expiry responses remain errors rather than looking unlisted.

---

## 3. AnimePage polish

After live verification, choose the next concrete detail-page improvement:

- dedicated not-found/error presentation instead of temporary placeholders,
- replace or formalize the temporary banner/fixture artwork path,
- review relation-tooltip behavior across browsers and narrow viewports,
- decide whether list score/progress need any detail-page affordance or should remain list-page-only.

Do not add score/progress controls merely for feature parity; the detail page
should stay focused.

---

## 4. Deferred option: navigation/accessibility

As an explicit alternative to more AnimePage polish, pick one postponed item
from `deferred-reminders.md`:

- wire the Lists active indicator now that `/list/anime` exists, or
- perform the whole NavPill keyboard/accessibility pass.

Do not mix both into an unrelated AnimePage task.

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

Current behavior:

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

Available as a focused next task now that `/list/anime` exists, but still
postponed until deliberately selected.

Then use route location conceptually:

```js
const location = useLocation();
const isListRoute = validListPaths.includes(location.pathname);
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

# Profile work after Anime core

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
Anime List row design and responsive implementation
Anime List fetching, search, categories, and empty/error states
progress, status, rating, and advanced-editor mutations
public /anime/:mediaId route and normalized detail API
anime relations and attached hover/focus details
AnimePage list lookup/create/category-change/remove control
MediaList missing-entry 404 normalization
independent danger tokens for destructive actions

NOW
design genuine provider-failure/retry UX for AnimePage list status

NEXT
verify detail and list mutations with fixtures disabled when AniList is stable

LATER
AnimePage dedicated error/not-found polish
Lists active indicator cleanup
whole-nav keyboard accessibility pass
Profile editing/settings
Games
Movies & TV
advanced animation/polish
production auth/security hardening
```
