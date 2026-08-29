# FRONTEND ARCHITECTURE — FINAL

The frontend must follow this exact architecture.

```text
frontend/
│
├── login.html
├── dashboard.html
├── live-map.html
├── convoy-dispatch.html
├── shelter-board.html
├── hazard-log.html
├── alerts.html
├── settings.html
│
├── css/
│   ├── tokens.css
│   ├── base.css
│   └── components.css
│
└── js/
    └── pages/
        ├── liveMap.js
        ├── convoyDispatch.js
        ├── shelterBoard.js
        ├── hazardLog.js
        ├── alerts.js
        └── settings.js
```

## ARCHITECTURE RULES

### 1. HTML pages

Each HTML file represents one major operational surface.

```text
login.html
→ Authentication and role entry

dashboard.html
→ Role-specific operational overview

live-map.html
→ Primary real-time geospatial situational-awareness screen

convoy-dispatch.html
→ Relief convoy monitoring and dispatch

shelter-board.html
→ Shelter demand, supply and isolation monitoring

hazard-log.html
→ Hazard/incident history and field reporting

alerts.html
→ Emergency alert inbox and command actions

settings.html
→ User, Field Mode, language, accessibility and synchronization settings
```

Do not merge these pages into a single HTML file.

Do not create unnecessary additional HTML pages unless the existing application absolutely requires them.

---

# CSS ARCHITECTURE

## `css/tokens.css`

This file is the **single source of truth for the visual design system**.

### CRITICAL RULE

**Replace the existing palette with the approved palette.**

Do **not** merge this palette with any prior color set.

Do not retain old dashboard colors.

Do not add additional arbitrary brand colors.

Use:

```css
:root {
  --bg-honeydew: #EDF3E0;
  --sage-500: #8FAF8C;
  --forest-600: #5A7A68;
  --forest-700: #4A6656;
  --sage-100: #E4EBE0;
  --slate-800: #3A4750;

  --radius: 8px;

  --font-sans:
    'Inter',
    'IBM Plex Sans',
    'Noto Sans',
    system-ui,
    sans-serif;
}
```

All reusable visual values should originate from this file wherever practical.

The purpose is to prevent different pages from developing different visual systems.

---

## `css/base.css`

Responsible for global styling.

Include:

```text
body
html
headings
paragraphs
links
buttons reset
form reset
inputs
select
textarea
tables
focus states
scrollbars where appropriate
responsive base rules
```

Do not put page-specific styling here.

Do not put component-specific styling here unless it is genuinely a global primitive.

Base typography must follow the approved system.

Desktop:

```text
minimum body text: 14px
```

Field/tablet:

```text
minimum body text: 16px
```

Maintain WCAG 2.1 AA contrast.

---

# `css/components.css`

This file contains all reusable UI components.

Components must support the required **four-state operational model**:

```text
DEFAULT
HOVER / FOCUS
WARNING
CRITICAL
```

Where applicable, also support:

```text
DISABLED
LOADING
ERROR
```

Recommended component classes:

```text
.status-badge
.status-badge--safe
.status-badge--caution
.status-badge--blocked

.button
.button--primary
.button--secondary
.button--critical
.button--disabled

.card
.card--warning
.card--critical

.alert
.alert--warning
.alert--critical

.toast
.modal
.drawer

.data-table
.filter-bar
.search-bar

.connectivity-indicator
.sync-indicator

.map-legend
.hazard-popover
.convoy-card
.shelter-card
```

### Four-state semantics

The component system must clearly distinguish:

```text
DEFAULT
Normal operational state.

HOVER / FOCUS
Interactive state with clear keyboard/mouse indication.

WARNING
Requires attention but is not immediately critical.

CRITICAL
Requires immediate operational attention.
```

Never communicate these states using color alone.

Use:

```text
icon + text + visual treatment
```

for operational status.

---

# JAVASCRIPT PAGE ARCHITECTURE

Each operational page must have its own page controller.

```text
js/pages/
│
├── liveMap.js
├── convoyDispatch.js
├── shelterBoard.js
├── hazardLog.js
├── alerts.js
└── settings.js
```

## `liveMap.js`

Responsible only for live-map page behavior.

Responsibilities:

```text
Leaflet initialization
road layers
bridge layers
flood layers
debris layers
convoy markers
shelter markers
map search
map filters
hazard popovers
convoy selection
route visualization
real-time map updates
```

Do not place shelter-board or convoy-dispatch page logic here.

---

## `convoyDispatch.js`

Responsible for:

```text
mission loading
mission table
priority calculation/display
mission filtering
mission sorting
convoy selection
bulk selection
dispatch workflow
route information
ETA display
driver information
Socket.io mission updates
```

---

## `shelterBoard.js`

Responsible for:

```text
shelter loading
shelter cards
supply calculations
urgency presentation
regional filtering
shortage filtering
sorting
expanded shelter details
real-time shelter updates
```

Do not fabricate historical supply data.

---

## `hazardLog.js`

Responsible for:

```text
hazard loading
hazard timeline
hazard filtering
source display
confidence display
verification state
field report form
geolocation
photo handling
offline report queue
report synchronization
report verification
```

Field reporting must work correctly when connectivity is unavailable.

---

## `alerts.js`

Responsible for:

```text
alert loading
alert filtering
critical alert presentation
acknowledgment
escalation
map navigation
real-time alert events
alert state updates
```

Use:

```text
PATCH /api/alerts/:id/acknowledge
PATCH /api/alerts/:id/escalate
```

where those backend endpoints are available.

Never display a successful action when the backend request failed.

---

## `settings.js`

Responsible for:

```text
Field Mode
language preference
accessibility preferences
offline/sync information
user settings
local preference persistence
```

Field Mode must be persisted locally.

---

# SHARED JAVASCRIPT RULE

The page-specific files above should contain **page behavior**, not duplicated infrastructure.

If the repository already provides shared modules for:

```text
API communication
authentication
Socket.io
toast
status badges
navigation
offline synchronization
permissions
```

reuse those existing modules.

Do not duplicate:

```javascript
fetch(...)
```

logic throughout every page.

Do not create separate Socket.io connections for every component.

Use the existing shared infrastructure.

---

# PAGE INITIALIZATION

Each page should initialize only its own controller.

Conceptually:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    initLiveMap();
});
```

for:

```text
live-map.html → liveMap.js
```

and:

```text
convoy-dispatch.html → convoyDispatch.js
```

etc.

Do not initialize unrelated pages.

---

# DEPENDENCY FLOW

The intended architecture is:

```text
                    ┌──────────────────┐
                    │      Backend     │
                    │ REST + Socket.io │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Shared API Layer │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        liveMap.js    convoyDispatch.js   shelterBoard.js
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Reusable UI/CSS  │
                    │   Components     │
                    └──────────────────┘
```

The same architecture applies to:

```text
hazardLog.js
alerts.js
settings.js
```

---

# STRICT FILE RESPONSIBILITY

Use this rule:

```text
HTML
→ structure/content

tokens.css
→ design tokens

base.css
→ global styling

components.css
→ reusable component styling

page JS
→ page-specific behavior

shared JS
→ shared infrastructure
```

Do not mix responsibilities unnecessarily.

---

# DO NOT CREATE

Unless absolutely required by the existing project:

```text
❌ React components
❌ Vue components
❌ Angular modules
❌ Tailwind configuration
❌ Bootstrap
❌ unnecessary bundlers
❌ duplicate CSS frameworks
❌ duplicate API clients
❌ duplicate Socket.io clients
❌ separate design systems
```

The implementation must remain lightweight and consistent with the specified Vanilla HTML/CSS/JS architecture.

---

# FINAL ARCHITECTURE CHECK

Before considering the frontend architecture complete, verify:

```text
✓ Exactly the required HTML pages exist
✓ tokens.css contains the approved palette only
✓ No old color system remains
✓ base.css contains global styles
✓ components.css contains reusable components
✓ Components implement four operational states
✓ Each operational page has its own JS controller
✓ Shared functionality is not duplicated
✓ API access is centralized
✓ Socket.io handling is centralized
✓ Role permissions are respected
✓ Offline behavior is supported
✓ Field Mode is supported
✓ Accessibility is supported
✓ No fake operational data is generated
```

The architecture should remain understandable to another developer opening the project for the first time.

The priority is:

**simple structure + predictable responsibility + reusable components + reliable operational behavior.**