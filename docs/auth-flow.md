# Authentication Flow — Current AstraList Notes

Updated: 2026-09-14

# Why there is a backend

Anything shipped to React can be inspected.

Therefore:

```text
React
- AniList client secret: NEVER
- raw AniList access token: should not be exposed

Express
- client secret: YES
- access token: YES
```

The browser authenticates to AstraList with its own opaque session cookie rather than directly holding the provider token.

---

# OAuth entities

## Client ID

Identifies AstraList to AniList.

## Client secret

Proves the backend is the registered OAuth app. Backend-only.

## Authorization code

Temporary approval code returned to the callback:

```text
/auth/anilist/callback?code=...
```

It is not the access token.

## Access token

Obtained by exchanging the code. Used by the backend to call AniList GraphQL.

---

# Current login flow

```text
LoginPage
-> user clicks Login with AniList
-> LoadingPage appears immediately
-> browser navigates to Express /auth/anilist
-> Express redirects to AniList authorization
-> AniList redirects to /auth/anilist/callback?code=...
-> Express exchanges code for access token
-> Express queries AniList Viewer
-> user is inserted/upserted in MongoDB
-> AstraList session is created in MongoDB
-> Set-Cookie astra_session=<opaque random id>
-> backend redirects browser to frontend
-> App calls GET /api/me
-> AuthContext user/authStatus updated
-> authenticated viewer redirected to /profile/<own handle>
```

There may still be a very small visual flash around the OAuth return; this is accepted for now and belongs to polish, not core functionality.

---

# Why OAuth login uses navigation

OAuth requires the browser to visit the provider.

So login is navigation, not a background fetch.

Conceptually:

```js
window.location.href = 'http://localhost:3000/auth/anilist';
```

A loading state is shown before that navigation so the click receives immediate visual feedback.

---

# CORS and cookies

Frontend and backend are different origins because their ports differ:

```text
http://localhost:5173
http://localhost:3000
```

Backend CORS needs credentials enabled.

Frontend requests requiring the Astra session use:

```js
credentials: 'include'
```

---

# Astra session cookie

The cookie contains only something conceptually like:

```text
astra_session=<random opaque id>
```

It does not contain the AniList token.

Current development settings include the usual localhost-friendly choices such as:

```text
HttpOnly
SameSite=Lax
Secure=false on localhost
```

Production HTTPS should use secure-cookie settings.

---

# Session persistence

Sessions are no longer an in-memory `Map`.

They are persisted in MongoDB and reference the persistent AstraList user.

Current session lifetime is still roughly one hour and should be revisited later because forcing frequent provider re-login is poor product UX.

---

# `/api/me` — current meaning

This endpoint answers:

> Who is the current viewer, if anyone?

It is intentionally useful on public pages.

Current desired semantics:

```text
valid session
-> 200
{
  loggedIn: true,
  user: {
    handle,
    displayName,
    profileSetupComplete,
    ...safe viewer fields
  }
}

missing / invalid / expired session
-> 200
{
  loggedIn: false,
  user: null
}
```

This is different from a protected endpoint.

A protected endpoint should still return 401 when the user must be authenticated.

Frontend `App.jsx` therefore does something conceptually like:

```text
fetch /api/me
if !data.loggedIn
  -> user = null
  -> authStatus = unauthenticated
else
  -> populate viewer user
  -> authStatus = authenticated
```

---

# Public profile flow

Public profile URL:

```text
/profile/:handle
```

This must work whether a viewer is logged in or not.

The page simultaneously has:

```text
AuthContext.user  -> viewer, maybe null
profile           -> fetched subject
```

This is why `/api/me` should not treat "logged out" as an exceptional error on public pages.

---

# Profile ownership

Ownership check:

```js
const isOwnProfile = user?.handle === profile?.handle;
```

Only then show owner-only controls.

Do not render public profile identity using `user.displayName`, `user.handle`, etc. The subject data must come from `profile`.

---

# Logout

Current conceptual flow:

```text
POST /auth/logout
-> locate current Astra session
-> delete/invalidate session
-> clear cookie
-> return { loggedOut: true }
-> frontend sets user = null
-> authStatus = unauthenticated
```

---

# Protected AnimePage list state

`/anime/:mediaId` and its anime-detail API are public, but personal list state
is viewer-specific.

```text
logged-out viewer
-> render public anime details
-> skip personal list lookup
-> Add to list returns to /

logged-in viewer
-> browser sends astra_session to protected list endpoint
-> Express resolves the persistent user and backend-only AniList token
-> AniList MediaList lookup returns the viewer's entry or no entry
```

An AniList MediaList `404 Not Found` means the viewer has no matching personal
entry. The provider helper normalizes that result to `null`; it is not an auth
failure. A `401` from the protected AstraList endpoint still means the local
session is invalid/expired and returns the frontend to unauthenticated state.

Create, category-change, and removal mutations continue through Express so the
raw provider token never reaches React.

---

# Error-handling lesson already established

`fetch()` does not throw merely because the server returns 401/404/500.

Use:

```js
response.ok
response.status
```

Use `try/catch` for actual network/fetch failures and explicitly thrown HTTP errors.

---

# Security / auth work still deferred

Before production, revisit:

- OAuth `state` / CSRF protection.
- Final session duration / persistent-login UX.
- Secure production cookie settings.
- Provider token expiry/renewal behavior.
- Verify provider refresh-token support rather than assuming it.
- Better environment validation.
- Rate limiting where useful.
- Never log secrets or raw access tokens.
