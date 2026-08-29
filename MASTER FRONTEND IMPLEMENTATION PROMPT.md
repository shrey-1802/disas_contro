# MASTER FRONTEND IMPLEMENTATION PROMPT
## Relief Supply Chain Resilience & Rerouting Intelligence Platform

---

# ROLE

Act as a **Senior Frontend Architect + Mission-Critical UI/UX Engineer + Geospatial Dashboard Engineer + Emergency Operations System Designer** with 20+ years of experience building interfaces for:

- government emergency operations
- disaster-management command centers
- humanitarian logistics
- GIS/geospatial systems
- transportation control rooms
- mission-critical dashboards
- offline-first field applications
- real-time operational systems
- accessibility/WCAG-compliant applications

You are not building a generic admin dashboard.

You are building a **mission-critical emergency logistics intelligence frontend** where a wrong interpretation of information can result in:

- a convoy entering a dangerous road
- a vehicle becoming stranded
- critical medical supplies being delayed
- shelters running out of essential supplies
- emergency resources being wasted

Therefore, prioritize:

**clarity > decoration**

**operational awareness > visual complexity**

**truthfulness > fake data**

**safety > convenience**

**readability > density**

**graceful degradation > application failure**

---

# 1. UNDERSTAND THE ACTUAL PROBLEM BEFORE CODING

The system exists because of the following disaster scenario.

An earthquake triggers widespread hillside debris flows while overflowing river tributaries create rapidly changing flood conditions.

Consequences include:

- arterial highways becoming hazardous
- rural feeder roads becoming unsafe
- bridges suffering structural damage
- intersections becoming submerged
- flood depth changing over time
- debris blocking transportation corridors
- conventional GPS/maps continuing to treat damaged roads as usable
- relief convoys becoming stranded
- convoys wasting hours turning back
- vehicles entering dynamically dangerous areas
- isolated shelters experiencing shortages
- critical supplies becoming operationally inaccessible even when inventory physically exists elsewhere

Critical cargo includes:

- insulin
- blood bags
- infant nutrition
- potable water
- general relief materials

The deeper problem is NOT simply "find the shortest route."

The system exists because the disaster creates a gap between:

1. the physical state of the transportation network
2. the information available about that network
3. the current location of vehicles
4. shelter demand
5. inventory availability
6. humanitarian urgency
7. the reliability/freshness of information
8. rapidly changing environmental conditions

The frontend must therefore help operators understand:

> **What is happening now?**

> **Where is it happening?**

> **What information can be trusted?**

> **Which convoys are affected?**

> **Which shelters are becoming vulnerable?**

> **Why did a route change?**

> **What information caused the change?**

Do NOT design the UI as if the system were simply Google Maps for emergency vehicles.

---

# 2. SOURCE OF TRUTH

Use the two provided UI/UX documents as the primary frontend specification.

Do not casually replace their terminology, colors, information architecture, interaction model, or accessibility requirements.

The approved UI/UX brief defines the product as a government emergency-operations platform and establishes the principles:

- Calm authority over alarm
- Glanceable truth
- Zero ambiguity
- Field-first resilience
- Institutional trust

These principles must influence every component.

The existing frontend contract specifies:

- Vanilla HTML
- CSS
- JavaScript
- no framework
- no build step
- Node.js/Express REST API
- Socket.io
- Leaflet for maps

Follow this stack unless the existing repository already contains an unavoidable compatible dependency.

Do not introduce React, Vue, Angular, Tailwind, Bootstrap, Material UI, or another frontend framework.

---

# 3. FIRST PHASE — REPOSITORY AUDIT

Before creating or modifying UI files, inspect the existing repository.

Do NOT immediately start writing pages.

First identify:

```text
frontend/
backend/
api/
css/
js/
assets/
components/
```

and inspect:

- existing HTML pages
- existing CSS
- existing JavaScript
- API helper
- authentication helper
- Socket.io helper
- status badge implementation
- toast/notification implementation
- navbar implementation
- existing map code
- existing API routes
- existing data structures
- existing authentication flow
- existing localStorage usage
- package/dependency configuration

Specifically look for:

```text
api.js
socket.js
auth.js
statusBadge.js
toast.js
navbar.js
tokens.css
```

The supplied frontend contract explicitly says these existing modules should be reused, with `tokens.css` and `navbar.js` updated where necessary.

DO NOT duplicate functionality that already exists.

---

# 4. BACKEND CONTRACT AUDIT

Before implementing interactive pages, inspect the actual backend.

Required existing data endpoints include:

```text
GET /api/roads
GET /api/bridges
GET /api/shelters
GET /api/missions
GET /api/vehicles
GET /api/reports
GET /api/alerts
GET /api/priority
```

Required mutation operations include:

```text
POST /api/missions
POST /api/reports
```

The frontend specification additionally requires:

```text
PATCH /api/reports/:id/verify
PATCH /api/alerts/:id/acknowledge
PATCH /api/alerts/:id/escalate
```

These three endpoints must be confirmed before depending on the corresponding UI functionality.

If they do not exist:

- document the missing endpoint
- implement the frontend service abstraction
- show an appropriate unavailable state
- DO NOT silently pretend the action worked
- DO NOT fake successful API responses

The frontend must distinguish between:

```text
SUCCESS
LOADING
EMPTY
ERROR
OFFLINE
PERMISSION DENIED
NOT IMPLEMENTED
```

---

# 5. DESIGN SYSTEM — NON-NEGOTIABLE

Use the approved palette.

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

These tokens are explicitly specified by the frontend contract.

Do not introduce arbitrary:

- red
- orange
- yellow
- blue
- purple
- neon colors

for severity.

The interface uses a restrained green/sage/slate visual language.

This is intentional.

The UI should communicate:

> "controlled emergency operation"

not:

> "panic dashboard."

---

# 6. STATUS SEMANTICS

The backend has six road/bridge states, but the UI must show only three tiers.

Map them exactly:

```text
normal
recoverable
    ↓
SAFE

degraded
restricted
    ↓
CAUTION

hazardous
impassable
    ↓
BLOCKED
```

Visual semantics:

```text
SAFE
icon: circle-check
color: sage

CAUTION
icon: triangle
color: forest

BLOCKED
icon: octagon
color: slate
```

Do not invent a fourth severity level.

Do not rely on color alone.

Every status must contain:

```text
ICON + TEXT LABEL
```

This is explicitly required by the frontend specification.

---

# 7. TYPOGRAPHY

Use:

```text
Inter
IBM Plex Sans
Noto Sans
system-ui
```

Desktop:

```text
minimum body = 14px
```

Field/tablet:

```text
minimum body = 16px
```

Do not use font weights below 400 for data-bearing information.

Critical information:

```text
600–700
```

Maintain WCAG AA contrast.

Do not use light sage text directly on honeydew.

---

# 8. COMPONENT ARCHITECTURE

Create reusable components instead of copying HTML repeatedly.

Recommended conceptual component structure:

```text
components/
│
├── Navbar
├── PageHeader
├── StatusBadge
├── PriorityBadge
├── ConnectivityIndicator
├── LastSynced
├── CriticalBanner
├── Toast
├── Modal
├── Drawer
├── DataTable
├── EmptyState
├── LoadingState
├── ErrorState
├── OfflineState
├── SearchBar
├── FilterBar
├── ShelterCard
├── ConvoyCard
├── HazardCard
├── RouteDiff
├── MapLegend
├── MapLayerControl
├── HazardPopover
├── ConfirmationDialog
├── Pagination
├── Sparkline
└── FieldReportForm
```

If the project architecture doesn't support physical component files, implement reusable JavaScript render functions.

Do not create inconsistent one-off components.

---

# 9. COMPONENT STATE MODEL

Every interactive component must support:

```text
DEFAULT
HOVER / FOCUS
WARNING
CRITICAL
DISABLED
LOADING
ERROR
```

The design brief explicitly requires Default → Hover/Focus → Warning → Critical, plus Disabled where relevant.

Do not implement component state through random inline styles.

Use CSS classes.

Example conceptual pattern:

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
```

---

# 10. INFORMATION ARCHITECTURE

Implement:

```text
login.html
dashboard.html
live-map.html
convoy-dispatch.html
shelter-board.html
hazard-log.html
alerts.html
settings.html
```

Role defaults:

```text
Control Room
→ live-map.html

District Admin
→ shelter-board.html

Field Driver
→ hazard-log.html
```

Role navigation:

```text
CONTROL ROOM
live-map
convoy-dispatch
shelter-board
hazard-log
alerts
settings

DISTRICT ADMIN
live-map
convoy-dispatch
shelter-board
alerts

FIELD DRIVER
hazard-log
live-map read-only
```

This role model is explicitly defined in the frontend contract.

Never show an unauthorized action and merely disable it if the user should not even know that functionality exists.

Hide role-inappropriate navigation.

---

# PHASE 1 — GLOBAL APPLICATION SHELL

Build the shared shell first.

Implement:

```text
┌──────────────────────────────────────────────────────────┐
│ Government identity │ Page title │ Search │ Sync │ User │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│ Navigation   │              Main content                 │
│              │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

Desktop:

- persistent navigation
- top operational bar
- main content area

Tablet:

- compact navigation
- larger touch targets
- field mode support

Mobile:

- prioritize essential information
- do not attempt to squeeze the desktop dashboard into mobile

The global shell must preserve:

```text
Last synced
Connectivity status
Current user/role
Critical alert banner
```

---

# PHASE 2 — AUTHENTICATION / ROLE ENTRY

Build:

```text
login.html
```

Design it as an institutional government access screen.

Do NOT make it look like a consumer SaaS login.

Include:

- government/emergency-system identity
- system title
- username/email field
- password field
- role context
- login button
- authentication error state
- connection state

Role selection:

```text
Control Room
District Admin
Field Driver
```

After authentication:

```text
Control Room → live-map
District Admin → shelter-board
Field Driver → hazard-log
```

Do not expose role-specific functionality to unauthorized users.

---

# PHASE 3 — DASHBOARD / LANDING EXPERIENCE

Build:

```text
dashboard.html
```

The dashboard must be role-specific.

Do not make three roles see the same dashboard.

## Control Room

Prioritize:

```text
Current critical alerts
Active convoys
Blocked routes
Shelter shortages
Hazard updates
Network connectivity
```

## District Admin

Prioritize:

```text
Shelter conditions
Supply urgency
Incoming convoys
Regional alerts
Regional transportation state
```

## Field Driver

Prioritize:

```text
Current assignment
Current route
Hazards ahead
Report hazard
Connectivity
Last synchronization
```

The dashboard should function as an operational orientation screen.

Do not overload it with analytics that aren't required for immediate decisions.

---

# PHASE 4 — LIVE SITUATIONAL MAP

This is the most important screen.

File:

```text
live-map.html
```

The approved design defines it as the primary/default screen.

Use:

```text
Leaflet
```

Map structure:

```text
┌───────────────────────────────────────────────────────────┐
│ Search │ Region │ Last Synced │ Connectivity              │
├───────────────┬──────────────────────────────┬────────────┤
│ Layers        │                              │ Selected   │
│               │                              │ convoy /   │
│ Legend        │          MAP                 │ route      │
│               │                              │ details    │
│               │                              │            │
└───────────────┴──────────────────────────────┴────────────┘
```

Map overlays:

### Flood zones

Represent:

```text
flood depth
```

using graduated opacity.

Never rely on color alone.

### Debris

Use:

```text
dashed slate line
```

### Unsafe bridge

Use:

```text
octagon marker
```

### Convoy

Use:

```text
directional arrow
```

with:

```text
forest-600
```

### Shelter

Use:

```text
home icon
```

Shape should communicate entity type independently of color.

---

# LIVE MAP INTERACTION MODEL

Clicking a hazard MUST NOT navigate away.

Instead:

```text
map
 ↓
hazard click
 ↓
inline popover
```

Popover:

```text
Hazard
Flood

Source
Field Report

Reported
3 min ago

Confidence
87%

Region
Sector 6

Current status
Caution
```

The approved UI explicitly requires source, timestamp and confidence in the inline hazard popover while preserving map context.

---

# MAP SEARCH

Search:

```text
Convoy ID
Shelter
Region
```

Search must intelligently locate the entity on the map.

Examples:

```text
CV-014
Shelter 07
Sector 6
```

When selected:

- pan map
- zoom appropriately
- open relevant detail
- preserve active layers

---

# MAP RIGHT PANEL

When a convoy is selected:

Display:

```text
Convoy 14

Cargo
Insulin

Priority
Critical

Origin
Regional Hub A

Destination
Shelter 06

Current route
Route B

Status
Rerouted

Why recalculated
Bridge B-14 marked hazardous

ETA
1h 42m

ETA change
+38 min
```

The panel should answer:

> What is happening?

> Why?

> Where?

> How much delay?

without requiring the operator to navigate through multiple pages.

---

# PHASE 5 — REAL-TIME MAP DATA

On load:

```text
GET /api/roads
GET /api/bridges
GET /api/shelters
GET /api/missions
GET /api/vehicles
```

Then subscribe to Socket.io events.

Do not refresh the entire map for every update.

Patch individual objects:

```text
road update
→ update road layer

bridge update
→ update bridge marker

convoy update
→ update convoy marker

shelter update
→ update shelter marker
```

Avoid flickering.

Avoid rebuilding the complete DOM/map layer unnecessarily.

---

# PHASE 6 — CONVOY DISPATCH & TRACKING

File:

```text
convoy-dispatch.html
```

The approved interface is a table/card hybrid.

Priority order:

```text
Insulin / Blood
    ↓
Infant Nutrition
    ↓
Water
    ↓
General
```

Until backend priority tagging exists, derive priority client-side from `cargo_json`.

Create a static lookup:

```javascript
const CARGO_PRIORITY = {
  insulin: 1,
  blood: 1,
  infant_nutrition: 2,
  water: 3,
  general: 4
};
```

Do not invent a backend priority field.

---

# CONVOY ROW

Every convoy should show:

```text
Cargo
Priority
Origin
Destination
Status
ETA
Driver
Action
```

Statuses:

```text
On Route
Rerouted
Stranded
Delivered
```

---

# REROUTED VISUALIZATION

This is an important trust feature.

When a convoy has been rerouted:

```text
OLD ROUTE
────────────
slate
struck-through / visually deprecated

        ↓

NEW ROUTE
────────────
forest
active
```

Also show:

```text
Reason:
Bridge B-14 became hazardous

ETA:
+38 min
```

The operator should understand not only:

> "route changed"

but:

> "route changed BECAUSE this happened."

---

# BULK DISPATCH

Allow:

```text
checkbox selection
↓
bulk action bar
↓
Dispatch to cleared route
```

Before committing a potentially consequential action, show a confirmation dialog with:

```text
Selected convoys
Selected route
Current route status
Expected change
```

Never use:

> "Are you sure?"

Instead use direct operational language:

```text
Dispatch 4 Convoys to Route C
```

---

# PHASE 7 — SHELTER & DEMAND BOARD

File:

```text
shelter-board.html
```

The approved design uses a card-grid approach.

Each card:

```text
Shelter name

Population
1,240 people

Supply remaining
2.4 days

Isolation risk
Blocked access

Incoming convoy
ETA 1h 20m
```

The `*_hours_remaining` values must be converted client-side into days.

Do not fabricate historical values.

---

# SHELTER URGENCY

Create meaningful urgency tiers using the existing three-tier semantic model.

Example conceptual interpretation:

```text
SAFE
adequate remaining supply

CAUTION
supply becoming constrained

BLOCKED / CRITICAL
immediate shortage or access risk
```

But do not invent arbitrary backend statuses.

Keep the actual backend value available in the data model.

---

# SHELTER FILTERING

Allow:

```text
Urgency
Region
Shortage type
```

Sorting:

```text
Most urgent
Least remaining supply
Nearest convoy ETA
Region
```

The UI should help an operator identify:

> Which shelter requires attention first?

without manually opening every card.

---

# SHELTER EXPANSION

Click:

```text
Shelter card
```

opens expanded information.

Show current supply state.

If historical API data does not exist:

```text
DO NOT FAKE A SPARKLINE.
```

Instead show:

```text
Historical supply trend
Not available
```

The supplied frontend specification explicitly says not to fake historical data.

---

# PHASE 8 — HAZARD & INCIDENT LOG

File:

```text
hazard-log.html
```

Reverse chronological.

Newest first.

Each item:

```text
Hazard
Flood

Source
Field Report

Confidence
82%

Location
Sector 6

Reported
3 min ago

Status
Unverified
```

Sources:

```text
Sensor
Field Report
Satellite
Manual Entry
```

Filters:

```text
Hazard type
Region
Source
Verification status
```

Hazard types:

```text
Flood
Debris
Bridge
Road closure
```

---

# FIELD REPORT FORM

For Field Driver role, hazard-log should also contain the mobile-first report submission workflow.

Fields:

```text
Current geolocation
Problem type
Severity
Photo
Description
```

The form must be designed for:

- tablet
- outdoor conditions
- gloves
- unstable connectivity
- one-handed use where possible

Touch targets:

```text
minimum 44 × 44 px
```

This requirement is explicit in the frontend specification.

---

# OFFLINE FIELD REPORTING

If offline:

```text
submit
↓
save locally
↓
mark as pending
↓
show pending count
↓
sync when connection returns
```

Never tell the driver:

```text
Report submitted
```

if it hasn't reached the server.

Instead:

```text
Saved locally
Pending synchronization
```

This distinction is mission-critical.

---

# VERIFY REPORT

Control Room only.

Button:

```text
Verify Report
```

When clicked:

```text
PATCH /api/reports/:id/verify
```

On success:

```text
report status → confirmed
map → updated
toast → confirmation
```

On failure:

```text
report remains unverified
show error
do not modify UI state as if successful
```

---

# PHASE 9 — ALERTS & COMMAND CENTER

File:

```text
alerts.html
```

There must also be a persistent critical banner across the application.

Example:

```text
CRITICAL
Convoy 14 stranded — Sector 6
```

Critical banner should be:

- persistent
- compact
- impossible to confuse with ordinary notifications
- dismissible only when the workflow permits it

The design brief requires persistent critical alerts while keeping the overall interface restrained rather than red-heavy.

---

# ALERT INBOX

Display:

```text
Critical
Warning
Advisory
```

Every alert:

```text
severity icon
title
description
location
timestamp
source
acknowledgment state
```

Actions:

```text
Acknowledge
Escalate
View on Map
```

---

# ACKNOWLEDGMENT

API:

```text
PATCH /api/alerts/:id/acknowledge
```

After success:

```text
Acknowledged
```

Do not remove the alert completely.

Keep historical visibility.

---

# ESCALATION

API:

```text
PATCH /api/alerts/:id/escalate
```

Show:

```text
Escalated to District Command
```

Again:

Never fake success.

---

# PHASE 10 — SETTINGS

File:

```text
settings.html
```

Sections:

```text
User
Offline Sync
Language
Accessibility
Field Mode
```

---

# FIELD MODE

Field Mode must be a global body class:

```text
<body class="field-mode">
```

When enabled:

- increase base font size
- increase contrast
- increase readable weight
- reduce map layer opacity clutter
- increase touch target comfort
- simplify dense layouts
- improve outdoor readability

Store:

```text
localStorage
```

Apply the preference before rendering so the user doesn't see a visual flash between modes.

The UI/UX specification explicitly defines Field Mode for outdoor tablet use.

---

# PHASE 11 — OFFLINE-FIRST ARCHITECTURE

This is not optional.

Every page should know whether the application is:

```text
ONLINE
OFFLINE
RECONNECTING
DEGRADED
```

Top bar:

```text
Connected
Updated 3 min ago
```

or:

```text
Offline
Last synced 18 min ago
3 actions pending
```

When an API request fails:

DO NOT silently fail.

Show a degradation banner.

Example:

```text
Live data unavailable.
Showing last synchronized information from 18 min ago.
```

This is explicitly required by the frontend contract.

---

# ACTION QUEUE

Create an offline queue abstraction.

Conceptually:

```text
pendingActions = [
  {
    id,
    type,
    payload,
    createdAt,
    retryCount,
    status
  }
]
```

Store in:

```text
IndexedDB
```

if practical.

Use localStorage only for simple preferences.

Do not store large report photos directly in localStorage.

When connectivity returns:

```text
detect connection
↓
attempt sync
↓
process queue
↓
mark successful actions
↓
retain failed actions
↓
show result
```

Never silently discard a failed action.

---

# PHASE 12 — REAL-TIME SOCKET ARCHITECTURE

Create a centralized Socket.io event handler.

Potential event types:

```text
mission:risk_update
shelter:demand_update
alert:new
road:update
bridge:update
vehicle:update
report:update
```

Do not allow each page to create uncontrolled socket connections.

Use one reusable connection layer.

Handle:

```text
connect
disconnect
reconnect
error
```

The UI must reflect connection state.

---

# PHASE 13 — DATA FRESHNESS

Every operational data object should preserve:

```text
updatedAt
source
confidence
```

where provided by backend.

The UI should distinguish:

```text
LIVE
RECENT
STALE
UNKNOWN
```

Do not claim "real-time" when the actual data is old.

Use explicit language:

```text
Updated 3 min ago
```

not:

```text
3
```

and not:

```text
Live
```

when it isn't.

---

# PHASE 14 — LOADING STATES

Every page must have intentional loading states.

Do NOT leave blank white areas.

Example:

```text
Loading shelters...
```

For cards:

```text
skeleton
```

For tables:

```text
row skeleton
```

For maps:

```text
map loading indicator
```

Loading states must not look like errors.

---

# PHASE 15 — EMPTY STATES

Create meaningful empty states.

Example:

```text
No active convoys

There are currently no active convoy missions.
```

Do not use:

```text
Nothing here!
```

No exclamation marks.

Keep copy factual.

---

# PHASE 16 — ERROR STATES

Example:

```text
Unable to load shelter data.

Last synchronized data:
18 min ago

Retry
```

If there is cached data:

```text
Unable to refresh live data.
Showing last synchronized data from 18 min ago.
```

If no cached data:

```text
Shelter data unavailable.
Retry
```

Never fabricate fallback values.

---

# PHASE 17 — SEARCH / FILTER ARCHITECTURE

Search and filters should be reusable.

Filtering should happen client-side where the dataset is already loaded and small enough.

Server-side filtering should be used where necessary.

Do not make filtering trigger excessive API calls.

Debounce text search.

Example:

```text
300ms
```

But do not debounce immediate operational controls unnecessarily.

---

# PHASE 18 — ACCESSIBILITY

Target:

```text
WCAG 2.1 AA
```

Requirements:

- keyboard navigation
- visible focus
- semantic HTML
- proper labels
- ARIA only where needed
- accessible status messages
- screen-reader-friendly alerts
- no color-only status
- adequate contrast
- 44×44 touch targets
- no hover-only essential information
- focus trapping for modal dialogs
- Escape closes non-critical overlays
- logical tab order

The UI/UX brief explicitly requires WCAG 2.1 AA.

---

# PHASE 19 — MULTILINGUAL DESIGN

The application must support future regional languages.

Never create fixed-width buttons such as:

```css
width: 100px;
```

Use:

```css
min-width
padding
```

Allow translated strings to expand.

Example:

```text
Verify Report
```

may become substantially longer in another language.

The layout must survive this.

---

# PHASE 20 — UI COPY

Use direct operational language.

Good:

```text
Reroute Convoy 14
```

Bad:

```text
Would you like to reroute Convoy 14?
```

Good:

```text
Updated 3 min ago
```

Bad:

```text
Last update: recently
```

Good:

```text
1.2 m flood depth
```

Bad:

```text
1.2
```

Good:

```text
Bridge B-14 blocked
```

Bad:

```text
Bridge issue
```

Never use decorative microcopy.

Never use exclamation marks.

The tone requirements are explicitly defined in the frontend contract and design brief.

---

# PHASE 21 — VISUAL HIERARCHY

Every page must answer three questions immediately:

### Question 1

What requires attention?

### Question 2

What changed?

### Question 3

What action is available?

Use hierarchy:

```text
Critical operational state
        ↓
Current situation
        ↓
Supporting information
        ↓
Historical/context information
        ↓
Secondary controls
```

Do not make every card equally visually loud.

---

# PHASE 22 — INFORMATION DENSITY

This is a command center.

It needs more information than a normal website.

But density must be controlled.

Use:

```text
grouping
whitespace
consistent alignment
visual hierarchy
progressive disclosure
```

Do not use:

```text
huge cards
massive rounded containers
gradient backgrounds
decorative illustrations
unnecessary charts
```

Every pixel must serve an operational purpose.

---

# PHASE 23 — MAP PERFORMANCE

Leaflet must remain responsive with many markers.

Avoid:

```text
full map redraw
```

on every Socket event.

Use:

```text
marker lookup by ID
layer lookup by ID
```

Example conceptual structure:

```javascript
const markers = new Map();

markers.set(entityId, marker);
```

When updated:

```text
existing marker
→ update position
→ update icon
→ update popup
```

not:

```text
remove all
→ recreate all
```

---

# PHASE 24 — DATA NORMALIZATION

Create frontend adapters so UI code doesn't directly depend on inconsistent backend payloads.

Conceptual:

```javascript
normalizeMission(raw)
normalizeShelter(raw)
normalizeRoad(raw)
normalizeBridge(raw)
normalizeAlert(raw)
normalizeReport(raw)
```

This allows:

```text
API
 ↓
adapter
 ↓
UI model
 ↓
component
```

instead of:

```text
API
 ↓
random UI code
```

---

# PHASE 25 — SECURITY

Do not trust frontend role checks alone.

Frontend role checks are for UX.

Backend must remain authoritative.

Never:

- expose secrets
- put API keys in source
- trust client-provided permissions
- store passwords
- log sensitive credentials
- expose unnecessary backend information

Escape user-generated content before inserting into HTML.

Prefer:

```javascript
textContent
```

over unsafe:

```javascript
innerHTML
```

when displaying user-controlled values.

---

# PHASE 26 — FILE STRUCTURE

Target:

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
│   ├── components.css
│   ├── layout.css
│   └── pages/
│
├── js/
│   ├── api.js
│   ├── socket.js
│   ├── auth.js
│   ├── navbar.js
│   ├── statusBadge.js
│   ├── toast.js
│   ├── offline.js
│   ├── permissions.js
│   ├── utils.js
│   │
│   └── pages/
│       ├── liveMap.js
│       ├── convoyDispatch.js
│       ├── shelterBoard.js
│       ├── hazardLog.js
│       ├── alerts.js
│       └── settings.js
│
└── assets/
```

Do not create unnecessary files.

Reuse existing modules whenever possible.

---

# PHASE 27 — IMPLEMENTATION ORDER

Implement in this exact order.

## PHASE A

Repository audit.

Deliver:

```text
architecture report
existing modules
API inventory
socket inventory
missing dependencies
missing backend endpoints
```

Do not modify UI yet.

---

## PHASE B

Design system.

Implement:

```text
tokens.css
base.css
components.css
```

Verify:

- colors
- typography
- spacing
- buttons
- badges
- cards
- tables
- forms
- focus states
- modal
- toast
- alert banner

---

## PHASE C

Application shell.

Implement:

```text
navbar
topbar
sync indicator
connectivity indicator
critical banner
role handling
field mode
```

Test across all pages.

---

## PHASE D

Authentication.

Implement:

```text
login
role selection
session handling
redirect
logout
unauthorized handling
```

---

## PHASE E

Live map.

Implement this before the other operational screens because it is the central situational-awareness surface.

Build:

```text
Leaflet
layers
markers
legend
filters
search
hazard popovers
convoy detail panel
live updates
```

---

## PHASE F

Convoy dispatch.

Implement:

```text
mission table
priority sorting
status
ETA
driver contact
route diff
bulk actions
creation form
risk updates
```

---

## PHASE G

Shelter board.

Implement:

```text
cards
urgency
population
days remaining
isolation risk
incoming ETA
filters
sorting
expanded state
```

---

## PHASE H

Hazard log.

Implement:

```text
timeline
filters
confidence
verification
field report form
offline queue
```

---

## PHASE I

Alerts.

Implement:

```text
critical banner
alert inbox
acknowledgment
escalation
socket notifications
```

---

## PHASE J

Settings.

Implement:

```text
field mode
language
offline state
user information
```

---

## PHASE K

Cross-page integration.

Verify:

```text
Map ↔ Convoys
Map ↔ Shelters
Map ↔ Hazards
Hazards ↔ Reports
Reports ↔ Map
Alerts ↔ Map
Convoys ↔ Alerts
Shelters ↔ Convoys
```

The application must feel like **one operational system**, not eight independent pages.

---

# PHASE 28 — CRITICAL CROSS-SCREEN SCENARIOS

After implementation, test these scenarios.

## Scenario 1 — Bridge becomes hazardous

Backend/socket:

```text
bridge status
→ hazardous
```

Expected:

```text
map bridge marker updates
↓
affected road state updates
↓
convoy risk update
↓
alert generated if applicable
↓
operator sees reason
```

---

## Scenario 2 — Convoy stranded

Expected:

```text
convoy status
→ stranded

map marker
→ stranded state

critical alert
→ persistent banner

dispatch page
→ status updates

operator
→ can inspect route context
```

---

## Scenario 3 — Shelter supply decreases

Expected:

```text
shelter:demand_update
↓
shelter card updates
↓
urgency changes if appropriate
↓
incoming convoy information remains visible
```

Do not reload the entire page.

---

## Scenario 4 — Driver reports flood while offline

Expected:

```text
driver opens report
↓
fills form
↓
submits
↓
network unavailable
↓
report saved locally
↓
"Pending synchronization"
↓
network returns
↓
upload
↓
confirmed
```

---

## Scenario 5 — Critical alert arrives

Expected:

```text
Socket event
↓
persistent top banner
↓
alert inbox update
↓
toast / accessible announcement
↓
no destructive page navigation
```

---

# PHASE 29 — FAILURE TESTING

Explicitly test:

```text
API unavailable
Socket unavailable
slow API
empty API response
malformed API response
expired authentication
offline mode
reconnection
duplicate socket event
stale data
missing confidence
missing timestamp
missing image
missing ETA
missing driver
```

The frontend must degrade gracefully.

---

# PHASE 30 — DO NOT FABRICATE DATA

This is a hard rule.

Never invent:

```text
historical shelter data
fake route calculations
fake flood measurements
fake confidence
fake ETA
fake API success
fake socket events
fake operational statistics
```

If backend data doesn't exist:

```text
Not available
```

is better than fabricated intelligence.

The UI specification explicitly says historical supply data must not be faked when the backend endpoint doesn't exist.

---

# PHASE 31 — DO NOT TURN THE SYSTEM INTO A GENERIC AI DASHBOARD

Avoid:

```text
AI generated recommendations
AI score
AI confidence
AI magic button
```

unless the backend actually provides these concepts.

The frontend's job is to represent **operational truth**.

If a future intelligence layer is added, it must clearly distinguish:

```text
Observed
Reported
Inferred
Recommended
Confirmed
```

Never visually blur these categories.

---

# PHASE 32 — TRUST MODEL

The interface should make the origin of information visible.

Whenever possible:

```text
Source
Timestamp
Confidence
Status
```

Example:

```text
Flood report

Source:
Field Driver

Reported:
4 min ago

Confidence:
86%

Verification:
Unverified
```

This helps operators distinguish:

> "Someone reported this"

from:

> "This has been verified."

That distinction is central to institutional trust.

---

# PHASE 33 — COMMAND CENTER MENTAL MODEL

The operator should mentally experience the system as:

```text
WHAT IS HAPPENING?
        ↓
WHERE?
        ↓
HOW CERTAIN ARE WE?
        ↓
WHO IS AFFECTED?
        ↓
WHAT SUPPLY IS AT RISK?
        ↓
WHAT CONVOY IS AFFECTED?
        ↓
WHAT ACTION IS AVAILABLE?
```

The frontend should support this flow naturally.

---

# PHASE 34 — FINAL QUALITY BAR

Do not stop when:

```text
all pages exist
```

Stop only when:

```text
all pages work
+
all roles work
+
API integration works
+
Socket updates work
+
offline behavior works
+
accessibility works
+
responsive layouts work
+
loading states work
+
error states work
+
empty states work
+
critical workflows work
+
cross-page state remains consistent
```

---

# PHASE 35 — FINAL TEST MATRIX

Create a test matrix:

| Area | Desktop | Tablet | Field Mode | Offline | Keyboard |
|---|---:|---:|---:|---:|---:|
| Login | ✓ | ✓ | — | ✓ | ✓ |
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Live Map | ✓ | ✓ | ✓ | ✓ | ✓ |
| Convoys | ✓ | ✓ | ✓ | ✓ | ✓ |
| Shelters | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hazards | ✓ | ✓ | ✓ | ✓ | ✓ |
| Alerts | ✓ | ✓ | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ |

---

# PHASE 36 — AGENT WORKING RULES

While implementing:

### Rule 1

Do not rewrite working backend code unless absolutely necessary.

### Rule 2

Do not replace the specified frontend stack.

### Rule 3

Do not introduce random UI libraries.

### Rule 4

Do not change the approved color palette.

### Rule 5

Do not use color as the only status indicator.

### Rule 6

Do not fabricate data.

### Rule 7

Do not silently swallow API errors.

### Rule 8

Do not silently discard offline actions.

### Rule 9

Do not create duplicate utility functions.

### Rule 10

Reuse existing modules.

### Rule 11

Keep role permissions explicit.

### Rule 12

Keep UI copy factual and concise.

### Rule 13

Every consequential action requires an understandable confirmation or clear immediate state.

### Rule 14

Preserve operator context whenever possible.

### Rule 15

Never navigate away from the map unnecessarily.

---

# PHASE 37 — DEVELOPMENT OUTPUT FORMAT

After each phase, report:

```text
PHASE:
What was implemented

FILES CREATED:
...

FILES MODIFIED:
...

API USED:
...

SOCKET EVENTS USED:
...

NEW DEPENDENCIES:
...

KNOWN LIMITATIONS:
...

BACKEND BLOCKERS:
...

TESTS PERFORMED:
...

NEXT PHASE:
...
```

Do not claim something is complete if it depends on a missing backend endpoint.

---

# FINAL OBJECTIVE

The finished frontend should feel like a **government emergency operations command platform**, not a startup analytics dashboard.

The user should be able to look at the system and immediately understand:

```text
NETWORK
What roads/bridges are usable?

HAZARDS
What changed?

CONFIDENCE
How reliable is the information?

CONVOYS
Where are relief vehicles?

ROUTES
Why did a route change?

SHELTERS
Who is running out of supplies?

ALERTS
What requires immediate attention?

FIELD
What information is coming from the ground?

CONNECTIVITY
Can I trust that what I'm seeing is current?
```

The interface should remain calm even when the underlying situation is chaotic.

The design philosophy is:

> **Calm interface. High information density. Zero ambiguity. Explicit uncertainty. Operational truth.**

Do not optimize for visual impressiveness.

Optimize for:

> **a stressed emergency operator understanding the situation correctly within 2–3 seconds and taking the correct next action.**