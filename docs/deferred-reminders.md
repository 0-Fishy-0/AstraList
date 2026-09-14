# AstraList — Deferred Reminders / Postponed Work

Updated: 2026-09-14

This file is specifically for things that were intentionally postponed so they do not get repeatedly rediscovered or forgotten.

---

# 1. Main Nav Lists-active indicator

`/list/anime` now exists, so this is available as a focused task when selected.
Use `useLocation()` to detect valid `/list/*` routes and give the Lists item a
real active state without treating arbitrary invalid paths as active.

Then revisit the CSS Anchor Positioning indicator.

Goal:

```text
own profile -> Profile active anchor
/list/*      -> Lists active anchor
other public profile -> no permanent Profile active state
hover        -> temporary indicator movement
```

The submenu positioning anchor (`--list`) and main nav indicator anchor (`--nav`) should remain separate responsibilities.

---

# 2. Whole NavPill keyboard/accessibility pass

Postponed intentionally.

Current native popover behavior already provides:

- Esc close,
- outside-click close,
- toggle from Lists button.

But the entire pill/submenu keyboard experience should later be reviewed as one system.

Topics to decide then:

- normal Tab behavior,
- browser settings that skip links,
- whether arrow-key navigation is desirable,
- focus movement after opening Lists,
- focus return after closing,
- visible `:focus-visible` treatment,
- optional Home/End behavior if an arrow-key model is adopted.

Do not convert `NavLink` navigation into buttons merely to work around Vivaldi's optional link-skipping Tab preference.

Do not nest links and buttons.

---

# 3. Protected `/list/*` routing

Public profiles may be viewed logged out, but personal list-management routes should not.

Once more than one list route exists, add a shared protected route/layout rather than writing the same `if (!user)` logic in every list page.

Desired behavior:

```text
loading -> loading UI
no user -> Navigate /
user -> Outlet/list page
```

---

# 4. AuthContext organization

Current decision: context may remain exported from `App.jsx`; live state remains in App.

A separate `AuthContext.jsx` file can be introduced later if module organization becomes annoying.

Do not refactor it merely because a cleaner import graph is theoretically possible.

---

# 5. Session lifetime

Current session expiry is roughly one hour.

This is too aggressive for final consumer UX because it can force unnecessary provider login.

Revisit after core list functionality is stable.

Need to balance:

- security,
- persistent login UX,
- provider token expiry,
- session renewal strategy.

---

# 6. OAuth/security hardening

Before production:

- OAuth `state`,
- production Secure cookies,
- token expiry lifecycle,
- verify refresh-token support,
- environment validation,
- rate limiting,
- never log access tokens/secrets.

---

# 7. Profile data polish

Current Profile page still has placeholder media content and incomplete data fields.

Later:

- avatar,
- bio persistence,
- public safe profile API fields,
- real Right Now data,
- empty/loading state design,
- Edit Profile,
- Settings,
- handle change UI/validation/cooldown.

---

# 8. Handle system follow-up

Current desired canonical model:

```text
one normalized handle field
```

Later UI work:

- validate allowed symbols,
- reject offensive/reserved values as appropriate,
- uniqueness check,
- database unique index remains final guard,
- rate-limit handle changes using `handleChangedAt`,
- temporary random handle onboarding prompt.

---

# 9. Popover submenu details

Current simple translateX + opacity animation is considered final enough.

Do NOT resurrect unless specifically requested:

- connector line,
- metaball fusion,
- extruded border/top-edge animation,
- complicated vertical drop choreography.

Simple clean behavior won.

---

# 10. Advanced motion backlog

Still postponed:

- shared-element / FLIP transitions,
- richer route transitions,
- card-to-dialog morphs,
- excessive ring reactions,
- final logo motion polish.

Functionality comes first.

---

# 11. Anime List toolbar controls

The current `.al-toolbar-item` buttons displaying `T`, `E`, `M`, `P`, and
`R` are temporary visual placeholders. Their behavior and final labels/icons
have not been decided yet.

When implementing the toolbar:

- define the purpose of each control before wiring interactions,
- replace placeholder letters with meaningful labels or icons,
- provide accessible names for icon-only controls,
- design clear active, hover, focus, and disabled states,
- verify the toolbar still works on narrow screens.

Do not assign arbitrary behavior merely to make the placeholder buttons
functional. Their actions should be driven by the Anime List's actual sorting,
filtering, and display needs.

---

# 12. AniList custom-list disclosure

Add a short note near the AniList login option explaining that custom list
groups are not imported and custom-only/hidden entries may be omitted. Decide
the exact wording later.

---

# 13. AnimePage provider-failure UX

The normal unlisted case is no longer an error: AniList MediaList `404` is
normalized to `entry: null`.

Genuine provider failures still need a deliberate UI pass:

- show a waiting cursor only while a request is actually in flight,
- show a clear connection/provider failure after the request ends,
- offer a compact retry action,
- keep the existing behavior that preserves known list state on failed mutations,
- expose enough provider-error meaning to choose the correct recovery action,
- do not blindly retry mutations whose upstream completion is ambiguous.
