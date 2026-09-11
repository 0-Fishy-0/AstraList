# AstraList — Deferred Reminders / Postponed Work

Updated: 2026-09-01

This file is specifically for things that were intentionally postponed so they do not get repeatedly rediscovered or forgotten.

---

# 1. Main Nav Lists-active indicator

Do not keep fighting this before list route state exists.

When `/list/anime`, `/list/games`, `/list/movies` are established, use `useLocation()` to detect `/list/*` and give the Lists item a real active state.

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

# 5. Shared Nav layout variables

Nav pill width is intended to be a shared layout concern, not duplicated magic numbers inside page-specific CSS.

Current NavPill already uses something like:

```css
width: var(--nav-pill-width);
```

Verify the shared variable is defined at a common AppLayout/root scope and that page content offset uses the same variable.

If this has already been completed, remove this reminder on the next cleanup pass.

---

# 6. Session lifetime

Current session expiry is roughly one hour.

This is too aggressive for final consumer UX because it can force unnecessary provider login.

Revisit after core list functionality is stable.

Need to balance:

- security,
- persistent login UX,
- provider token expiry,
- session renewal strategy.

---

# 7. OAuth/security hardening

Before production:

- OAuth `state`,
- production Secure cookies,
- token expiry lifecycle,
- verify refresh-token support,
- environment validation,
- rate limiting,
- never log access tokens/secrets.

---

# 8. Profile data polish

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

# 9. Handle system follow-up

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

# 10. Popover submenu details

Current simple translateX + opacity animation is considered final enough.

Do NOT resurrect unless specifically requested:

- connector line,
- metaball fusion,
- extruded border/top-edge animation,
- complicated vertical drop choreography.

Simple clean behavior won.

---

# 11. Advanced motion backlog

Still postponed:

- shared-element / FLIP transitions,
- richer route transitions,
- card-to-dialog morphs,
- excessive ring reactions,
- final logo motion polish.

Functionality comes first.

---

# 12. Anime List behavior reminders

When implementing progress:

```text
Planning, progress 0 -> press +
=> offer switch to Watching

Watching, progress becomes total
=> offer switch to Completed
```

When implementing rating:

```text
- = unrated
1..10 = rating
```

Detailed edit should later support:

```text
progress / episodes
status
start date
end date
score
```

Exact UI container for detailed editing is intentionally undecided.

---

# 13. Anime List toolbar controls

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

# 14. AniList custom-list disclosure

Add a short note near the AniList login option explaining that custom list
groups are not imported and custom-only/hidden entries may be omitted. Decide
the exact wording later.
