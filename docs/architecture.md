# AstraList Architecture

Updated: 2026-09-14

## Project goal

AstraList is intended to become a unified media-tracking application.

Current product areas:

- Anime — active development, AniList integration.
- Games — planned later.
- Movies / TV — planned later.

These areas share the AstraList shell/navigation, but should not be over-generalized into one media model too early. Their list semantics, statuses, metadata, provider APIs, filters, and interactions are expected to diverge.

---

# High-level runtime architecture

```text
Browser / React (localhost:5173)
        |
        | fetch + credentials: include
        v
Node / Express (localhost:3000)
        |
        +--> MongoDB Atlas
        |      users
        |      sessions
        |
        +--> AniList OAuth / GraphQL
```

The frontend never needs the AniList access token.

The browser receives only an opaque AstraList session cookie.

---

# Frontend architecture

Current important pieces:

```text
App.jsx
├── AuthContext.Provider
├── route / auth-entry logic
└── shared nested routes
    └── AppLayout
        ├── NavPill
        └── Outlet
            ├── ProfilePage
            ├── AnimeListPage
            └── AnimePage
```

`AppLayout` exists to hold persistent shared layout/navigation around routed pages.

`<Outlet />` is the router-controlled placeholder where the matched child page renders.

---

# AuthContext

Top-level auth state still lives in `App.jsx`:

```js
const [user, setUser] = useState(null);
const [authStatus, setAuthStatus] = useState('loading');
```

The context object is created with a neutral default, conceptually:

```js
export const AuthContext = createContext(null);
```

The Provider supplies the live values:

```jsx
<AuthContext.Provider value={{ user, setUser, authStatus }}>
    ...
</AuthContext.Provider>
```

Components that actually need auth state can consume it directly with `useContext(AuthContext)` instead of forcing `AppLayout` to receive `user` merely to pass it downward.

Current preference: keep this simple. Do not force a context-file refactor unless it becomes useful rather than theoretical cleanup.

---

# Routing

Current route model:

```text
/
/profile/:handle
/list/anime
/anime/:mediaId
```

`/anime/:mediaId` is public and identifies anime by the AniList media ID, not a user's personal MediaList entry ID.

Viewer-specific list state remains behind protected endpoints:

```text
GET  /api/list/anime/media/:mediaId -> look up an entry by anime ID
POST /api/list/anime                -> create/upsert by anime ID
PATCH /api/list/anime/:entryId      -> edit an existing list entry
DELETE /api/list/anime/:entryId     -> remove an existing list entry
```

This keeps the public anime-detail response independent of the current viewer
and preserves the `mediaId` versus MediaList entry `id` distinction.

List-entry lookup semantics:

```text
anime details missing
-> GET /api/anime/:mediaId returns 404

anime exists but viewer has no MediaList entry
-> AniList MediaList lookup reports 404
-> provider helper normalizes that lookup result to null
-> GET /api/list/anime/media/:mediaId returns 200 { entry: null }

viewer has an entry
-> return its MediaList entry id, status, rating, progress, and dates
```

The list-entry `id` returned by the lookup is subsequently used by PATCH and
DELETE. Other provider failures are not normalized to `null`; Express returns
the existing upstream-failure response.

For local UI development during provider outages, the server may return normalized anime-detail fixtures when `USE_ANIME_FIXTURES=true`. This path is explicitly disabled under `NODE_ENV=production` and is never an automatic runtime fallback.

Planned sibling routes:

```text
/list/games
/list/movies
```

The list routes should remain separate pages rather than immediately using `/list/:category` because the three domains are expected to diverge significantly.

Likewise, do not introduce a shared `ListLayout` until there is real duplicated structure worth extracting.

The URLs can still later be nested under a shared layout without changing their public paths.

---

# `/` route behavior

`/` is not a home page.

It acts as the auth entry point:

```text
authStatus === loading
-> LoadingPage

authenticated
-> redirect to /profile/<own handle>

unauthenticated
-> LoginPage
```

The redirect uses `replace` so the auth-entry route does not clutter browser history.

---

# Public Profile architecture

Public URL:

```text
/profile/:handle
```

`ProfilePage` independently fetches the requested profile using the route handle.

The page also reads the logged-in viewer from AuthContext.

Mental model:

```text
user    = viewer
profile = subject
```

Ownership is determined by something like:

```js
const isOwnProfile = user?.handle === profile?.handle;
```

Owner-only controls such as Edit Profile / Settings appear only when this is true.

Public profiles must remain usable with `user === null`.

---

# Current user schema direction

Latest user document shape:

```js
{
  handle: "fishy_96",               // canonical normalized handle
  handleChangedAt: Date(...) | null,
  displayName: "Fishy",
  profileSetupComplete: true,

  accounts: {
    anime: {
      anilist: {
        userId: 12345,
        username: "AniListName",
        accessToken: "...",
        tokenExpiresAt: Date(...),
        connectedAt: Date(...)
      },
      myanimelist: {}
    },
    movies: {},
    games: {}
  },

  createdAt: Date(...),
  updatedAt: Date(...)
}
```

Important decisions:

- Only one canonical normalized `handle` field is desired.
- Do not maintain both `handle` and `handleNormalized`.
- Incoming profile handles can be normalized before lookup.
- A unique index should guard `handle` at the database level.
- Provider usernames are still preserved under their provider account data.
- Provider access tokens remain backend-only.

New users can initially receive a temporary random AstraList handle such as:

```text
user2894901471
```

and later be prompted to change it in account settings.

---

# MongoDB architecture

MongoDB Atlas is already in use.

The project now persists:

- users,
- sessions.

Sessions reference the persistent user rather than treating OAuth identity as the frontend user object.

Session documents have their own Mongo `_id` values and a separate opaque session identifier used by the cookie.

TTL/session cleanup can be handled through expiry logic/indexing.

---

# Session architecture

```text
Browser
  |
  | HttpOnly cookie
  | astra_session=<opaque random id>
  v
Express
  |
  | MongoDB sessions collection
  | session -> persistent user reference + expiry
  v
users collection
  |
  v
provider account/token data
```

Current cookie/session lifetime is still around one hour and is considered temporary/product-tuning work, not the final desired UX.

---

# Frontend responsibilities

React is responsible for:

- auth-state presentation,
- shared routing/layout,
- public profile rendering,
- personal list pages,
- local UI interaction,
- initiating OAuth navigation,
- calling AstraList backend APIs.

React should not receive:

- AniList client secret,
- raw provider access token.

---

# Backend responsibilities

Express currently owns or is expected to own:

- CORS,
- cookies,
- AniList OAuth redirect/callback,
- token exchange,
- provider Viewer lookup,
- user upsert,
- session creation/lookup/expiry,
- `/api/me`,
- logout,
- public profile lookup,
- public normalized AniList anime-detail lookup,
- protected Anime list lookup/create/update/delete APIs,
- AniList GraphQL provider helpers and response normalization.

Protected mutations/data routes should eventually use shared auth middleware rather than duplicating session validation.

---

# Important API semantics

## `/api/me`

This is now best treated as optional viewer inspection rather than a protected resource.

Meaning:

```text
valid logged-in session
-> 200 { loggedIn: true, user: ... }

no/invalid/expired session
-> 200 { loggedIn: false, user: null }
```

This lets public pages ask "who is viewing?" without generating expected 401 noise.

Actual protected APIs should still use 401 when authentication is required.

## `/api/profile/:handle`

Public profile lookup.

Expected behavior:

```text
normalize handle
find public user
return safe profile fields
```

Missing profile should be:

```text
404 PROFILE_NOT_FOUND
```

not 401.

---

# Backend organization philosophy

Do not prematurely split the backend into a production-style folder tree just because it is theoretically cleaner.

Keep code understandable while learning.

Refactor when `server.js` actually becomes difficult to reason about.
