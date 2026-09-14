# AstraList Design Context

Updated: 2026-09-14

# General aesthetic

AstraList uses a dark atmospheric purple/pink identity, but the desired UI is restrained rather than neon-heavy.

Current tokens:

```text
bg base        #14101C
surface        #1E1729
surface 2      #281E36
border         #4b3a5f
text primary   #EDE8F5
text secondary #B0A3C4
text muted     #7A6D91
accent         #A87CF0
accent hover   #BB95F5
accent pink    #E67AB8
danger         #E67AB8 (independent semantic token)
```

`--danger` currently copies the existing theme-specific pink value rather than
referencing `--accent-pink`. This is intentional: destructive UI can diverge
from brand pink later without changing decorative accents. The derived
`--danger-background` token provides the resting destructive surface.

Fonts:

- Fraunces — wordmark, display names, important headings.
- Manrope — general UI.
- IBM Plex Mono — numeric/data contexts.

---

# Design personality

Desired feel:

```text
editorial
atmospheric
clean
slightly playful
not generic dashboard SaaS
not over-carded
```

Motion should feel deliberate and alive but not become the main content.

---

# Reusable background

`AstraBackground` is the current reusable page background.

Direction:

- dark diagonal/mesh depth,
- purple/pink ambient variation,
- restrained detail,
- cheaper than large constantly blurred DOM blobs.

The content should remain clearly readable above it.

---

# LoadingPage

LoadingPage is built and used.

Visual motif:

- concentric Astra rings,
- central core,
- subtle 3D opposing rotations,
- theme accent/pink borders/glow,
- sparse centered layout.

It accepts custom text such as:

```text
Checking Authorization Status...
Loading Profile...
```

Reduced-motion support exists.

---

# ProfilePage design

Current intended structure:

```text
[avatar]  ASTRALIST PROFILE
          Display Name
          @handle
          bio                         [Edit Profile] [Settings]

------------------------------------------------------------

Right Now

[Watching Anime] [Playing Games] [Movies & TV]
```

Header traits:

- avatar/initial block,
- Fraunces display name,
- muted handle,
- small editorial eyebrow,
- owner controls aligned to the right on wide layouts.

Owner controls should only appear on the logged-in user's own profile.

---

# Right Now section

Three sibling category panels:

```text
Watching Anime
Playing Games
Movies & TV
```

Current responsive behavior is based on wrapping flex rather than many breakpoint-specific layouts:

```text
3 across
2 + 1
1 across
```

This behavior is liked and should be preserved unless there is a real issue.

---

# Profile media item placeholders

Current placeholder-art direction uses compact colorful gradients, not realistic generated covers.

Rotating palette concept:

```text
pink / purple
orange / red
lime / emerald
cyan / indigo
```

Small outlined-circle detail can be layered over the top-right of the fake artwork.

Once real provider images are wired, these become loading/fallback visuals rather than permanent fake covers.

---

# NavPill

Final-ish global navigation direction:

- fixed left vertical pill,
- stable across app pages,
- approximately 60px wide,
- AstraMini at top,
- Lists button,
- Profile link,
- no dynamic reshuffling based on page.

Right-side navigation was rejected.

Why left:

- feels like a persistent spatial landmark,
- works better with future labels/submenus,
- avoids fighting reading/content flow.

---

# Main nav indicator

A thin vertical gradient marker uses:

```text
accent pink -> accent purple
```

CSS Anchor Positioning is used so the indicator can move between interaction targets.

The preferred motion is a spring-like inset interpolation.

Important product semantics:

```text
Profile active
-> only on the logged-in user's own profile

someone else's profile
-> no permanent Profile active state
-> normal hover behavior only

Lists active
-> later when current location is /list/anime, /list/games, or /list/movies
```

Do not re-open the complicated Lists indicator work before list-route active state is wired.

---

# Lists submenu

Current final visual direction:

- separate floating panel to the right of the Lists button,
- no connector line,
- no metaball/fusion effect,
- no vertical-drop gimmick,
- simple fade + small translateX entrance/exit,
- compact rounded surface,
- submenu-specific moving indicator may remain.

The earlier "cartoon gun flag / extruded top edge" idea was explored and then intentionally abandoned as too visually forced/complex.

Simple and clean won.

---

# Native Popover design behavior

Submenu uses `popover="auto"`.

Desired behavior:

- Lists click toggles.
- outside click closes.
- Esc closes.
- no modal backdrop.
- no focus trap.

Animation:

```text
closed: opacity 0 + translateX(-5px)
open:   opacity 1 + translateX(0)
```

Use `@starting-style` and discrete `display`/`overlay` transitions for both entry and exit.

---

# Anime List — current design

The implemented direction is:

- use a list/row treatment rather than cards,
- image/cover on the left,
- dense enough to scan a library quickly,
- progress control must be immediately accessible,
- rating should be directly accessible,
- tags should be visible but secondary,
- detailed editing should be hidden behind a small edit affordance.

Core row information:

```text
cover
anime title
2-3 tags
progress x / y
+ increment control
user rating (- or 1..10)
small edit control
```

The user referenced a dense MAL-style row/table example for information density,
but the resulting design intentionally keeps AstraList's own atmospheric visual
language rather than reproducing MAL.

Current interaction model:

```text
Planning, x = 0
+ pressed
-> offer move to Watching

Watching
x reaches y
-> offer move to Completed

rating
-> compact 1..10 / unrated popover

edit
-> modal dialog for progress, status, dates, and score
```

Status changes are prompted rather than silently applied. The advanced editor
uses a local draft and writes to AniList only on explicit Save.

---

# Interaction/accessibility design note

Do not replace semantic links with buttons merely to make one browser's Tab preference include them.

A later dedicated keyboard-navigation pass should decide the pill's complete keyboard model as one coherent component.

---

# Anime detail page

Current direction:

- keep the fading anime banner treatment behind the content; the current image remains a temporary local asset,
- show the full banner at its natural aspect ratio rather than cropping it into a viewport-sized box,
- build the page layout with nested flex containers,
- keep the cover compact and the title/details left-aligned,
- show Relations before Synopsis as a simple wrapping cover-card container,
- reveal each relation's title and metadata in an attached hover/focus panel without shifting layout,
- use one section heading per concept rather than paired eyebrow/heading synonyms.

Current list-control direction:

- keep the control directly below the title,
- keep identical total dimensions before and after an entry is added,
- unlisted state uses a translucent accent surface, not an opaque accent block,
- current unlisted treatment uses a 30% accent background and 60% accent/border mix, increasing to 40% and 70% on hover,
- listed state stays quieter with status and chevron grouped in the main segment,
- removal uses a compact destructive segment and a small anchored confirmation rather than a central modal,
- only destructive actions use `--danger`; decorative pink, focus rings, shared errors, and Cancel remain on their existing tokens.
