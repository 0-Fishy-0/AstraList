# AstraList — Current State

Updated: 2026-09-14

This file is the "what actually exists now" snapshot.

---

# Authentication / persistence

Working:

- AniList OAuth login.
- Authorization-code -> access-token exchange.
- AniList Viewer lookup.
- MongoDB Atlas connection.
- Persistent users.
- Persistent sessions.
- HttpOnly `astra_session` cookie.
- `/api/me` viewer inspection.
- logout.
- frontend auth state.
- LoadingPage shown during initial auth inspection and before OAuth navigation.

Current auth state in `App.jsx`:

```js
const [user, setUser] = useState(null);
const [authStatus, setAuthStatus] = useState('loading');
```

Auth states:

```text
loading
authenticated
unauthenticated
```

---

# AuthContext

Context has now been introduced because `user` is needed by multiple routed/shared components.

Conceptually:

```js
export const AuthContext = createContext(null);
```

and:

```jsx
<AuthContext.Provider value={{ user, setUser, authStatus }}>
    ...routes...
</AuthContext.Provider>
```

The user prefers to keep the live state in `App.jsx` and let descendants consume the exported context.

`AppLayout` should not receive `user` just to pass it into `NavPill`; `NavPill` can consume AuthContext directly.

Do not force a context-file refactor right now.

---

# Root route

`/` is the auth entry route.

Current behavior:

```text
auth loading
-> LoadingPage("Checking Authorization Status...")

authenticated
-> Navigate to /profile/<own handle> with replace

unauthenticated
-> LoginPage
```

There is intentionally no home/dashboard page yet.

---

# Shared AppLayout

A shared `AppLayout` exists around routed app pages.

Its important job is to render:

```text
NavPill
Outlet
```

The `Outlet` renders the matched child route.

Current routed children include:

```text
/profile/:handle
/list/anime
/anime/:mediaId
```

---

# Public ProfilePage

Working public route:

```text
/profile/:handle
```

`ProfilePage`:

- reads the route `handle`,
- fetches the profile independently,
- tracks `profileStatus`,
- supports loading / not-found / error states,
- reads the logged-in viewer from AuthContext,
- calculates `isOwnProfile`,
- shows owner controls only for the owner.

Important distinction:

```text
user    = logged-in viewer
profile = profile currently being displayed
```

The page must render identity from `profile`, not `user`.

Current owner controls:

```text
Edit Profile
Settings
```

They are visual placeholders for later functionality.

---

# Profile visual structure

Current profile design includes:

- reusable AstraBackground,
- profile header,
- avatar placeholder/initial,
- `ASTRALIST PROFILE` eyebrow,
- Fraunces display name,
- `@handle`,
- bio area,
- owner-only controls,
- separator,
- `Right Now` section.

`Right Now` currently has three categories:

```text
Watching Anime
Playing Games
Movies & TV
```

The layout uses wrapping flex cards:

```text
wide   -> 3 columns
medium -> 2 + 1
narrow -> 1 column
```

A reusable `ProfilePageCardItem` component exists for the compact media rows inside these categories.

Profile data/content is still partially placeholder data while the real media APIs are not wired.

---

# LoadingPage / AstraBackground

A reusable `LoadingPage` exists.

Current visual:

- concentric Astra rings,
- glowing core,
- subtle 3D ring rotations,
- customizable text prop,
- reduced-motion handling.

`AstraBackground` is now a reusable page background rather than rebuilding large expensive blur layers per page.

Important stacking reminder:

```text
page wrapper -> position: relative
background   -> behind
content      -> position: relative; z-index > background
```

---

# NavPill

A fixed vertical left navigation pill is implemented and shared across app pages.

Current contents:

```text
AstraMini brand
Lists button
Profile link
```

The pill should stay spatially stable across pages.

The Astra brand is branding, not necessarily a Home link.

Settings belongs on the user's own profile rather than in the global pill.

---

# AstraMini

A small two-ring + core version of the Astra motif is implemented for the nav pill.

Hover behavior includes:

- opposing 3D ring rotations,
- increased ring glow,
- core scale/brightness reaction.

---

# Main Nav indicator

The pill has a CSS Anchor Positioning-based vertical gradient indicator.

It can move between hover/active targets using named anchors and inset interpolation.

This became complicated when Lists needed both submenu positioning and nav-active behavior.

Current decision:

> Do not spend more time finalizing Lists-active indicator behavior until list routes/state are properly established.

The Profile active state intentionally represents the logged-in user's own profile, not every `/profile/*` page.

So when viewing someone else's profile, Profile should behave like a normal hover target rather than permanently appearing active.

---

# Lists submenu

The Lists control is a button, not a route.

It opens a submenu containing links to:

```text
Anime
Games
Movies & TV
```

The submenu now uses the native HTML Popover API rather than React state.

Current JSX concept:

```jsx
<button popoverTarget="nav-submenu-popup">...</button>

<nav id="nav-submenu-popup" popover="auto">...</nav>
```

Native behavior confirmed working:

- click opens,
- click again closes,
- Escape closes,
- click elsewhere closes.

The submenu is intentionally a popover, not a dialog:

- it is navigation, not a modal task,
- no focus trap is desired.

---

# Popover animation

Working native-popover transition pattern:

```css
.nav-submenu {
    opacity: 0;
    transform: translateX(-5px);
    transition:
        opacity 200ms ease,
        transform 200ms ease,
        display 200ms allow-discrete,
        overlay 200ms allow-discrete;
}

.nav-submenu:popover-open {
    opacity: 1;
    transform: translateX(0);
}

@starting-style {
    .nav-submenu:popover-open {
        opacity: 0;
        transform: translateX(-5px);
    }
}
```

Important lesson:

```text
base rule          = closed / exit destination
:popover-open      = open state
@starting-style    = entry starting state
allow-discrete     = lets display/overlay participate so exit animation can finish
```

The earlier connector-line / vertical-drop submenu animation was intentionally scrapped. Simple horizontal slide + fade is preferred.

---

# Keyboard accessibility status

Keyboard navigation for the full pill is deliberately postponed.

Observed development-browser behavior:

- Vivaldi can be configured to Tab only through form controls and skip links.
- Lists button received Tab focus.
- Profile `NavLink` was focusable programmatically and had `tabIndex === 0`, but was skipped by that browser's Tab policy.

Decision:

> Do not convert semantic navigation links into buttons merely to fight a browser-wide focus preference.

The entire pill/submenu keyboard model will receive one dedicated accessibility pass later.

Do not half-fix each link individually now.

---

# `/list/anime`

`AnimeListPage` is a protected personal list route rendered through the shared AppLayout.

Working:

- authenticated AniList list fetching through Express,
- normalized row data with real covers and metadata,
- loading, error, empty-list, and empty-category states,
- category filtering,
- debounced ordered title search with final-word prefix matching within the active category,
- responsive row/category behavior,
- progress, rating, status-prompt, and advanced-editor mutations.

---

# Anime List mutations

AniList remains the source of truth. Editable list values are not mirrored in MongoDB.

Protected mutation endpoint:

```text
PATCH /api/list/anime/:entryId
```

Anime detail list-state endpoints:

```text
GET  /api/list/anime/media/:mediaId
POST /api/list/anime
DELETE /api/list/anime/:entryId
```

The GET endpoint returns the authenticated viewer's normalized entry or `null`.
The POST endpoint creates/upserts an entry from `{ mediaId, status }`; later
category changes continue through the entry-ID PATCH endpoint. DELETE removes
an existing entry only after AniList confirms the deletion.

AniList reports a missing `MediaList` entry as a GraphQL `404 Not Found`.
`getAnimeListEntry()` translates that specific lookup result to `null`; it is
not treated as an upstream failure and does not affect anime-detail 404s.
Connection, authentication, rate-limit, and unexpected provider errors still
propagate to the route error path.

Provider helper coverage currently includes entry lookup/normalization,
missing-entry `null` behavior for both response shapes, creation, and deletion.

Supported partial fields:

```text
progress
status
rating
startedAt
completedAt
```

Only supplied fields are sent to AniList. This preserves provider details AstraList does not expose, including `REPEATING` when an unrelated field is edited.

Rating contract:

```text
AstraList UI: 1..10 or null
AniList write: scoreRaw = rating * 10, or 0 to clear
AniList read: score(format: POINT_10)
```

This avoids depending on the AniList user's configured score format.

Advanced editor behavior:

```text
field changes -> editDraft only
explicit Save -> one multi-field AniList mutation
Cancel / Escape / outside click / close -> discard draft, no mutation
```

The dialog remains open on failed saves and blocks dismissal only while a requested save is in flight.

AniList fuzzy dates are preserved when untouched. Complete dates can be edited with native date inputs, while partial dates are shown as provider hints and can be explicitly cleared.

---

# `/anime/:mediaId`

A public anime-detail route shell exists under the shared AppLayout.

Working:

- list-row covers and titles link using the anime `mediaId`,
- the route and `GET /api/anime/:mediaId` do not require authentication,
- the existing LoadingPage is shown while anime details are fetched,
- temporary not-found and error states are present pending dedicated pages,
- core details include banner, cover, title, synopsis, genres, format, total episodes, airing status, and main studio,
- anime relations include their provider relation type and link recursively to their own detail routes,
- the full banner keeps its natural aspect ratio and fades behind overlapping page content,
- Relations uses a simple wrapping cover-card container before Synopsis,
- relation cards reveal an attached high-layer title/metadata panel on hover or keyboard focus,
- the list control sits below the title and reads the viewer's entry by anime `mediaId`,
- logged-out Add to list clicks return to `/`,
- authenticated Add to list defaults to Planning, while its adjacent rotated `>` opens direct category choices,
- after creation, the control displays the current category and acts as one category-menu trigger,
- listed entries expose a compact remove segment with an anchored Cancel / Remove confirmation,
- unlisted and listed controls preserve the same total width and segment proportions,
- the unlisted control uses a stronger translucent accent wash rather than an opaque accent block,
- destructive controls use independent global `--danger` and `--danger-background` tokens rather than borrowing the brand-pink token directly,
- list popovers explicitly hide overflow to avoid Firefox painting a transient scrollbar during dismissal,
- non-anime relations are omitted until AstraList has routes for those media types.

The detail-page control handles category creation, category changes, and
confirmed removal. Score, progress, and date editing remain list-page concerns.

Development-only anime detail fixtures can be enabled in `server/.env`:

```text
USE_ANIME_FIXTURES=true
```

Fixture mode:

- is forcibly disabled when `NODE_ENV=production`,
- replaces only the anime-detail provider request,
- preserves the real normalized API response shape,
- adds a 500ms delay so LoadingPage can be inspected,
- provides linked Bleach records for media IDs `269`, `116674`, `159322`, `1686`, `2889`, `4835`, and `8247`,
- returns `404 ANIME_NOT_FOUND` for unknown IDs,
- must never become an automatic provider-outage fallback.
