# MASTER FRONTEND BUILD PROMPT
## Relief Route Intelligence — Emergency Relief Supply Chain Resilience & Rerouting System
### Single source of truth. Consolidates the approved design brief, the backend-contract build prompt, and the Supply Swap + Route Intelligence feature addenda into one buildable frontend spec, role-based, end to end.

---

# 0. WHAT THIS PROMPT IS

This is the only frontend prompt you need. It replaces reading five separate documents by merging them:

- The approved government UI/UX brief (palette, principles, screens, accessibility)
- The backend-contract build prompt (stack, IA, API endpoints, component states)
- The Supply Swap addendum (inter-warehouse rebalancing)
- The Route Intelligence addendum (hazard fusion, predictive flooding, isolation detection)

**Frontend only, for now.** No backend build work — treat the API/socket contract below as fixed and flag anything missing, same as the original prompts did. Do not rebuild, do not introduce a new palette, do not invent a new IA outside what's defined here.

**Stack:** Vanilla HTML/CSS/JS, no framework, no build step. REST API at `http://localhost:4000/api`, Socket.io on the same host, Leaflet for the map.

---

# 1. DESIGN TOKENS — LOCKED

Four base hues only. Every tint/shade below is derived from them. Never introduce a new hue for status, severity, or role differentiation — role and severity are communicated by icon, label, layout, and structure, never a new color.

```css
:root {
  /* locked palette — do not add hues */
  --bg-honeydew: #EDF3E0;
  --sage-500:    #8FAF8C;
  --forest-600:  #5A7A68;
  --forest-700:  #4A6656;
  --sage-100:    #E4EBE0;
  --slate-800:   #3A4750;

  /* additive neutrals — structure only, not new hues */
  --white:       #FFFFFF;
  --slate-500:   #6B7680;
  --border-hairline: #D8E0D2;

  --radius: 8px;
  --radius-lg: 12px; /* modals/sheets only */
  --font-sans: 'Inter', 'IBM Plex Sans', 'Noto Sans', system-ui, sans-serif;

  /* spacing, 4px base */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px;

  /* type scale — data-dense ops UI, 1.2 ratio */
  --text-xs:12px; --text-sm:14px; --text-base:16px;
  --text-lg:19px; --text-xl:23px; --text-2xl:28px;

  --motion-fast:120ms; --motion-base:200ms; --ease:cubic-bezier(.2,.8,.2,1);
}

body.field-mode {
  --text-base:18px; --text-sm:16px;
  --border-hairline:#B9C6B4;
}
```

## 1.1 Status tier mapping — the only status system in the app

| Backend status | UI tier | Color | Icon shape |
|---|---|---|---|
| `normal`, `recoverable` | Safe | `sage-500` | Circle-check |
| `degraded`, `restricted` | Caution | `forest-600` | Triangle |
| `hazardous`, `impassable` | Blocked | `slate-800` | Octagon |

Applies identically to roads, bridges, convoy status, hazard severity, and shelter urgency. Do not invent a fourth color tier. A fourth *state of confidence* (confirmed vs. unconfirmed, §6.1) is shown by stroke style (solid vs. dashed) on the same three icons — never a new color.

## 1.2 Hard rules, apply everywhere

- Color is never the only signal — every status pairs icon shape + text label.
- `slate-800` is reserved for Critical/Blocked only. Overusing it collapses the hierarchy.
- WCAG AA minimum: 4.5:1 body text, 3:1 large text/icons. Sage-on-honeydew text needs a darkened variant — never ship raw `sage-500` as text on `bg-honeydew`.
- Cards: `--radius`, 1px `--border-hairline`, **no drop shadow** — flat, institutional. Differentiate cards on the honeydew background by border and white fill, not by shadow.
- Body text ≥14px desktop / ≥16px field mode. No weight below 400 on data-bearing text. Critical alerts always 600–700 weight.
- No fixed-width labels on chips/buttons (multilingual strings run longer than English) — `min-width` + padding only.
- All motion respects `prefers-reduced-motion: reduce`.

---

# 2. ROLES & ACCESS CONTROL

Four roles. Access is enforced in the frontend router/nav (`navbar.js`) **and** assumed to be enforced server-side — the frontend never relies on hiding a nav item as its only security measure; any direct URL hit to an unauthorized screen redirects to the role's default screen.

| Role | Default landing screen | Core job |
|---|---|---|
| **Control Room** | `live-map.html` | Full network oversight, verifies hazard reports, owns escalations |
| **District Admin** | `shelter-board.html` | Regional oversight of convoys, shelters, and alerts within their district |
| **Warehouse Manager** | `dashboard.html` (warehouse) | Inventory, dispatch from their warehouse, inter-warehouse Supply Swap |
| **Field Driver** | `hazard-log.html` | Submits field reports, views their own route read-only, acknowledges reroutes |

## 2.1 Navigation by role

```text
                          Live   Convoy  Shelter  Hazard  Supply  Alerts  Settings
                          Map    Dispatch Board    Log     Swap
Control Room               ✓        ✓       ✓        ✓      view*     ✓        ✓
District Admin           view       ✓       ✓        —      view*     ✓        ✓
Warehouse Manager           —        ✓†      view      —       ✓        ✓        ✓
Field Driver              view      —        —        ✓       —      banner     ✓
```
`*` Control Room and District Admin see a read-only network-health rollup of Supply Swap activity (§8.6), not the transactional offer/request screens — those are Warehouse Manager-only.
`†` Warehouse Manager's Convoy Dispatch is scoped to convoys originating from their own warehouse.

## 2.2 Action-level permissions (not just page-level)

| Action | Allowed roles |
|---|---|
| Verify a field hazard report | Control Room only |
| Acknowledge / escalate an alert | Control Room, District Admin |
| Approve a Supply Swap transfer | Warehouse Manager (both sides of the transfer) |
| Dispatch a convoy | Control Room, Warehouse Manager (own warehouse) |
| Submit a field hazard report | Field Driver, Control Room (manual entry) |
| Acknowledge a mid-transit reroute | Field Driver (the assigned driver) |
| Toggle Field Mode | Any role, local preference only |

The frontend must disable (not hide) actions a signed-in user can view but not perform, with a plain-language reason on hover/focus — e.g. a District Admin viewing Supply Swap sees "Approving transfers is a Warehouse Manager action" rather than a missing button.

---

# 3. INFORMATION ARCHITECTURE (FULL)

```text
login.html                    (role-based sign-in)
dashboard.html                (role-specific landing, redirects)
├── live-map.html             (Control Room default / District Admin, Field Driver: read-only)
├── convoy-dispatch.html      (Control Room, District Admin, Warehouse Manager: scoped)
├── shelter-board.html        (District Admin default / Control Room, Warehouse Manager: view)
├── hazard-log.html           (Field Driver default / Control Room: full + verify)
├── supply-swap.html          (Warehouse Manager only — tabs: Offer / Request / Active Transfers)
├── alerts.html                (Control Room, District Admin: full inbox / others: banner only)
└── settings.html              (all roles — users*, offline sync, language, Field Mode)
```
`*` user management visible to Control Room only.

---

# 4. THE LAUNCH FLOW — END TO END, PER ROLE

This is what "the whole site working" means in practice. Every step below must be a real, working interaction — no dead links, no screen that only renders with hardcoded data once and never updates.

## 4.1 Universal entry

```text
1. Land on login.html
   → Government emblem + platform name + role selector (Control Room /
     District Admin / Warehouse Manager / Field Driver) + credentials.
   → No role is pre-selected; wrong-role login attempts show a plain
     error, not a silent redirect.
2. Successful login → dashboard.html
   → Reads role from the session, redirects immediately to that role's
     default screen (table in §2). No intermediate "choose a screen"
     step — the operator lands exactly where their job starts.
3. Every screen from here on shares:
   - Top bar: emblem, platform name, current screen name, search,
     "last synced Xs ago" indicator, connectivity dot, role badge,
     Field Mode toggle.
   - Persistent Critical-alert banner (rendered via toast.js on every
     screen, not just alerts.html) — one line, acknowledge action,
     never blocks the screen underneath it.
   - Nav sidebar/topnav scoped per §2.1 — items outside the role's
     access are not rendered, not just disabled.
```

## 4.2 Control Room journey

```text
Login → live-map.html (default)
  → Sees full-bleed map, all overlays on, right panel empty until a
    convoy/hazard is selected.
  → Clicks a hazard marker → inline popover (source, timestamp,
    confidence, confirmed/unconfirmed) without leaving the map.
  → If unconfirmed and Control Room role → popover shows a "Verify"
    action → promotes the report → route graph recalculates → any
    convoy on that segment gets a reroute pushed live (visible without
    a page reload, via socket).
  → Switches to convoy-dispatch.html → full table, sortable by cargo
    priority and Risk Index → selects a stranded convoy → sees the
    old-path/new-path diff and the recalculation reason in plain
    language → can bulk-select multiple convoys and dispatch to a
    newly cleared route.
  → Switches to shelter-board.html → card grid, urgency-tier colored
    numerals, any Isolated shelter shown above Critical, visually
    distinct (icon + label, not just color).
  → Switches to hazard-log.html → full reverse-chronological feed,
    can verify field reports here too (same action as the map
    popover, same backend call).
  → Switches to alerts.html → full inbox, severity tiers, acknowledges
    or escalates — escalation notifies District Admin.
  → supply-swap.html is visible as a read-only network rollup
    (§8.6) — Control Room can see that a critical insulin transfer is
    stuck, but the approve action is disabled with the reason shown
    per §2.2.
```

## 4.3 District Admin journey

```text
Login → shelter-board.html (default)
  → Same card grid as Control Room sees, filtered to their district.
  → Expands a shelter card → sparkline (or "not enough data yet" if
    no history endpoint — never fabricate a trend).
  → Switches to convoy-dispatch.html → same table, district-scoped,
    can dispatch within their district.
  → Switches to live-map.html → same map, read-only (no verify
    action — that's Control Room only, disabled with the reason).
  → Switches to alerts.html → full inbox for their district, can
    acknowledge and escalate further up the chain.
```

## 4.4 Warehouse Manager journey

```text
Login → dashboard.html (warehouse-scoped)
  → Sees inventory summary + a Supply Swap Opportunities card
    ("3 potential rebalancing opportunities") if any exist.
  → Clicks into supply-swap.html → three tabs: Offer Supply /
    Request Supply / Active Transfers (§8).
  → On a critical match, opens the Impact Preview (§8.4) before
    approving — sees what the transfer does to both warehouses'
    stock before committing.
  → Approves → transfer enters the lifecycle (Requested → Matched →
    Approved → Picking → Loading → Dispatched → In Transit →
    Received → Completed) → visible on Active Transfers and, once
    dispatched, as a new layer on live-map.html (read-only for this
    role, but the transfer marker is visible).
  → Switches to convoy-dispatch.html scoped to their own warehouse's
    missions, including supply-transfer convoys.
  → Switches to alerts.html → sees the banner only, plus any alert
    directly naming their warehouse.
```

## 4.5 Field Driver journey (tablet, field-mode-first)

```text
Login → hazard-log.html (default)
  → Primary task: the field report form is the first thing visible,
    not buried in a tab — geolocation pin (auto-filled, editable),
    problem type, severity, photo, description → Submit.
  → Submission enters the fusion pipeline (§6.1); driver sees a
    plain confirmation, not the backend's confidence math.
  → Switches to live-map.html → read-only, shows their own current
    route only (not the full network) to reduce clutter on a small
    screen.
  → If Control Room reroutes them mid-transit: a non-blocking banner
    appears — "New route assigned — Bridge B14 now blocked" — with
    old/new path diff and a single "Acknowledge new route" action.
    Works offline: the acknowledgment queues and syncs when
    connectivity returns, with a visible pending-count indicator,
    never a silent drop.
  → Field Mode is expected ON by default for this role (settings.html
    can still toggle it) — larger text, thicker borders, reduced map
    overlay opacity.
```

---

# 5. MASTER WORKFLOW — ONE STATE MACHINE FOR THE WHOLE SITE

Every screen above is a view into one of these branches. Build against this diagram, not five separate screen-level flows.

```text
                    ┌─────────────────────────────┐
                    │       SIGNAL DETECTED         │
                    │ Sensor / Field report / Sat /  │
                    │ Manual / Forecast model        │
                    └───────────────┬─────────────────┘
                                    ↓
                    HAZARD FUSION & CONFIDENCE RESOLUTION
                    (recency + source reliability + corroboration)
                                    ↓
                ┌───────────────────┴───────────────────┐
                ↓                                       ↓
     Below verification threshold             Control Room "Verify"
     → shown Caution/Blocked but              → status promoted,
       marked unconfirmed (dashed icon)          confirmed
                └───────────────────┬───────────────────┘
                                    ↓
                    ROUTE COST GRAPH UPDATED
                    (+ predictive flash-flood penalty)
                                    ↓
                    SHORTEST-SAFE-PATH RECOMPUTED
                    for every convoy and every warehouse pair
                    touching the changed segment
        ┌───────────────────────────┼───────────────────────────┐
        ↓                           ↓                           ↓
  Convoy not yet       Convoy IN TRANSIT              Shelter reachability
  dispatched           → reroute pushed to driver        recheck
  → dispatch plan        (§4.5), old/new path diff       → NO PATH from
    silently updates      shown on convoy-dispatch          any warehouse
        │                       │                           → ISOLATED,
        │                 Driver acknowledges                 auto-escalates
        │                 (or times out → flags                    │
        │                  as risk on dispatch table)               │
        │                       │                                   │
        └───────────┬───────────┘                                   │
                     ↓                                               │
          CONVOY CONTINUES (possibly via a relay point)              │
                     ↓                                               │
               DELIVERED to shelter                                  │
                     ↓                                               │
          SHELTER BOARD updates supply/urgency tier ←─────────────────┘
                     ↓
          Still short after delivery? ──yes──→ SUPPLY SWAP branch:
                     │                          Warehouse-level match
                    no                          (single or chain) →
                     │                          Impact Preview → Approve
                     ↓                          → same convoy/route
              AFTER-ACTION RECORD                 pipeline above,
              composed automatically              tagged as a transfer
                                                   mission

  ALWAYS-ON, PARALLEL:
  Alerts & Command Center listens to every branch for Critical-tier
  events (stranded convoy, isolated shelter, unacknowledged reroute
  past timeout, stalled critical supply transfer) and surfaces them on
  the persistent top-of-app banner, visible to every role regardless
  of which screen they're on.
```

---

# 6. SCREEN SPECS

## 6.1 `live-map.html`
Full-bleed Leaflet map on honeydew basemap. Overlays: graduated flood-depth zones, dashed debris segments, octagon bridge markers, animated convoy heading arrows, and a Supply Swap transfer layer (line between two warehouses, cargo label, toggle-able). A confidence ring around each hazard marker (arc length = confidence %, filled using only the three tier colors) is this screen's signature element. Unconfirmed hazards render with a dashed icon stroke, not a new color. Left panel: layer toggles + shape-based legend. Right panel: selected entity detail (convoy, hazard, or transfer). Top bar: search, sync status, connectivity dot. Clicking any marker opens an inline popover — never navigates away. Role gating: Field Driver sees own-route only; verify action Control-Room-only.
Data: `GET /api/roads`, `/api/bridges`, `/api/shelters`, `/api/missions`, `/api/vehicles`, `/api/transfers`; subscribes to all socket events to patch markers in place, including `route:recalculated`.

## 6.2 `convoy-dispatch.html`
Table/card hybrid, sortable by cargo priority (Insulin/Blood > Infant Nutrition > Water > General) and by the composite Risk Index (cargo priority + route caution/blocked segment count + time since last check-in + proximity to a forecasted flood zone), rendered as a compact bar using the existing three-tier scale, no new hue. Row: cargo icon, priority chip, origin, destination, status (On Route/Rerouted/Stranded/Delivered), ETA, driver-ack status, driver contact action. Rerouted rows show the old-path-struck-through / new-path-highlighted diff. Missions may include a relay-point leg (vehicle handoff for partial-vehicle-only routes) shown as two connected sub-rows. Bulk-dispatch action bar. Role gating: Warehouse Manager sees only their warehouse's missions.
Data: `GET /api/missions`, `POST /api/missions`; listens for `mission:risk_update`, `route:recalculated`.

## 6.3 `shelter-board.html`
Card grid: name, population, days-of-supply-remaining as a large tabular-numeral colored by urgency tier, isolation risk badge (Isolated ranks above Critical, distinct icon), incoming convoy ETA. Expand → sparkline if history data exists, otherwise an honest "not enough data yet" state — never fabricate a trend. Sort/filter by urgency, region, shortage type.
Data: `GET /api/shelters`, `GET /api/priority`; listens for `shelter:demand_update`.

## 6.4 `hazard-log.html`
Reverse-chronological feed, each entry tagged by source with a confidence %. Fusion conflicts (two sources disagreeing on one segment) show both entries linked, with the resolution rule stated in plain language ("Newer field report is being used for routing pending verification"). "Verify" action (Control Room only) promotes a report and triggers a route recalculation. Also hosts the Field Driver's report submission form (geolocation, type, severity, photo, description) as the primary view for that role.
Data: `GET /api/reports`, `POST /api/reports`, `PATCH /api/reports/:id/verify` *(flagged — confirm exists or add)*.

## 6.5 `supply-swap.html` (Warehouse Manager only)
Three tabs: **Offer Supply**, **Request Supply**, **Active Transfers**. Dashboard summary strip: Offering / Requests / Active Transfers counts. Offer/Request forms distinguish On Hand / Reserved / Available / Transferable — never imply stock is transferable just because on-hand is high. Matching includes route feasibility and convoy cold-chain fit as hard filters, not soft warnings — a non-refrigerated vehicle is never offered for insulin or blood. Supports partial-match chain swaps (a need split across multiple warehouses, each leg approved independently). Before approval, an Impact Preview modal shows the after-state of both warehouses' stock and days-of-cover, with a suggested safer quantity if the source would drop below its own safety threshold. Active Transfers board mirrors the convoy lifecycle and shows live route status per transfer.
Data: `GET/POST /api/inventory`, `GET/POST /api/transfers`, `GET /api/warehouses`; listens for `transfer:status_update`, `route:recalculated`.

## 6.6 `alerts.html`
Persistent Critical-only banner rendered globally via `toast.js`. Full inbox here: severity tiers (Critical/Warning/Advisory), acknowledgment workflow, escalate-to-district-command action. Auto-populated by the always-on watcher in §5 (stranded convoy, isolated shelter, unacknowledged reroute timeout, stalled critical transfer) — these should never require a human to have manually created the alert first.
Data: `GET /api/alerts`, `PATCH /api/alerts/:id/acknowledge`, `PATCH /api/alerts/:id/escalate` *(flagged — confirm exist or add)*; listens for `alert:new`.

## 6.7 `settings.html`
Users (Control Room only), offline sync status, language selector, Field Mode toggle (a token override per §1, not a parallel stylesheet). No new backend contract — local `localStorage` state plus a strings dictionary swap for language.

---

# 7. COMPONENT SYSTEM

Build every interactive component with these states as CSS classes, never one-off inline styles: `.default`, `.hover-focus`, `.warning`, `.critical`, `.disabled`.

| State | Rule |
|---|---|
| Default | `--border-hairline`, `--slate-800` text |
| Hover/Focus | 2px `--forest-600` ring/border, no shadow added |
| Warning | Left border `--forest-600` 3px + triangle icon + 600 weight |
| Critical | Left border `--slate-800` 3px + octagon icon + 700 weight, reserved strictly for true criticals |
| Disabled | `--slate-500` text, reduced opacity, no icon, tooltip states the reason (see §2.2) |

- **Buttons:** Primary = `forest-600` fill / `forest-700` hover. Secondary = `sage-500` outline. Destructive/Critical = `slate-800` fill, reserved for actions like "Mark route unsafe" — never routine deletes.
- **Status chips:** rounded, icon + label, three tiers only.
- **Map markers:** shape encodes entity type independent of color (convoy = arrow, shelter = home, hazard = triangle/octagon).
- **Data tables:** honeydew/white zebra striping, sticky header in `slate-800`.
- **Forms:** `forest-600` focus ring, `slate-800` error state with icon + inline text, never color-only.
- **Icons:** one outline set, one stroke width, two sizes (16px inline / 20–24px standalone). Never mix filled and outline icons, never substitute an emoji in production.

## 7.1 Typography roles
Screen title (`--text-2xl`, 600) · Panel/section label (`--text-sm`, 600, uppercase, tracked) · Data numeral (`--text-xl`/`--text-2xl`, 700, tabular-nums — this is what a stressed operator reads first, so it's always the visually heaviest element on a card) · Body/meta (`--text-sm`/`--text-xs`, `--slate-500` for meta, consistent position bottom-left of every card).

## 7.2 Motion — explains, never decorates
Convoy markers drift continuously along their path (functional — shows "en route" vs. "stalled"). Route diffs draw in once over ~400ms on change, never looping. Critical alert banner pulses once on entry, then static — no continuous flashing, per "calm authority over alarm." All motion respects reduced-motion preference.

## 7.3 Accessibility & field-use floor
44×44px minimum touch targets on any driver-facing screen. Field Mode as a body-class token override. Persistent "last synced Xm ago," graceful degradation banner on failed requests (never fail silently), queued-action indicator when offline. WCAG AA minimum throughout, tested against a colorblindness simulator given the green-heavy palette.

---

# 8. UI COPY TONE

Direct, factual, imperative for actions: "Reroute Convoy 14," not "Would you like to reroute?" No exclamation marks, no decorative micro-copy. Always explicit units and relative time: "Updated 3 min ago," "1.2m flood depth." Errors state what happened and what to do, in the interface's voice — never an apology, never vague.

---

# 9. FRONTEND DELIVERABLE (FILE SET)

```text
frontend/
├── login.html
├── dashboard.html
├── live-map.html
├── convoy-dispatch.html
├── shelter-board.html
├── hazard-log.html
├── supply-swap.html
├── alerts.html
├── settings.html
│
├── css/
│   ├── tokens.css            (section 1 — single source, no merges)
│   ├── base.css
│   └── components.css        (section 7 — four-state components)
│
└── js/
    ├── api.js
    ├── socket.js
    ├── auth.js                (role resolution + route guarding, section 2)
    ├── navbar.js               (NAV_ITEMS scoped per section 2.1)
    ├── statusBadge.js
    ├── toast.js                 (global critical-alert banner, section 6.6)
    └── pages/
        ├── liveMap.js
        ├── convoyDispatch.js
        ├── shelterBoard.js
        ├── hazardLog.js
        ├── supplySwap.js
        ├── alerts.js
        └── settings.js
```

Reuse `api.js`, `socket.js`, `auth.js`, `statusBadge.js`, `toast.js` from the existing module contract. Only `tokens.css`, `navbar.js`'s `NAV_ITEMS`, and the addition of `supply-swap.html`/`supplySwap.js` are new relative to the original backend-contract prompt.

**Before writing any page**, confirm these backend endpoints exist or get them added — the site is non-functional without them:
- `PATCH /api/reports/:id/verify`
- `PATCH /api/alerts/:id/acknowledge`
- `PATCH /api/alerts/:id/escalate`
- `GET/POST /api/transfers` (Supply Swap)
- A `route:recalculated` socket event with one shared payload shape used by every screen that shows a path

---

# 10. ACCEPTANCE CRITERIA

The frontend is complete only when a single reviewer can walk, without hitting a dead end, through:

```text
1. Log in as each of the four roles → land on the correct default screen.
2. Attempt to open a screen/action outside a role's access → correctly
   redirected or shown a disabled state with a plain reason, never a
   silent failure or crash.
3. On live-map.html, click an unconfirmed hazard as Control Room →
   verify it → see the route recalculate and a convoy on that segment
   reroute live, without a page reload.
4. On convoy-dispatch.html, see that same reroute reflected as an
   old/new path diff on the correct convoy row.
5. As Field Driver, receive the reroute notification, acknowledge it
   offline, reconnect, and see the pending action sync — no data loss.
6. As Warehouse Manager, open a critical Supply Swap match, view the
   Impact Preview, approve, and watch the transfer progress through
   its full lifecycle to Completed, appearing on the map as it moves.
7. Let a shelter's supply run out with no viable warehouse path → see
   it flagged Isolated on shelter-board.html and see a matching entry
   auto-appear on alerts.html without manual creation.
8. Toggle Field Mode on any screen → text, borders, and overlay
   opacity all update from token overrides, nothing breaks layout.
9. Every status shown anywhere in the app pairs an icon shape with a
   text label — never color alone.
```
