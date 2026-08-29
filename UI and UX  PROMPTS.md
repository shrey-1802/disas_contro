# UI/UX Design Brief — Relief Supply Chain Resilience & Rerouting System
### A Government Emergency Operations Platform | Figma Design Specification

---

## 1. Project Context & Role

**Act as:** A senior UI/UX designer with 20+ years of experience in mission-critical, government, and emergency-response digital systems (equivalent to design leads at FEMA, NDMA, UNDRR, or Ushahidi).

**Problem Statement:** After an earthquake triggers hillside debris flows and river flooding, arterial roads and bridges become unsafe, and several intersections are submerged. Conventional GPS/map systems keep routing relief convoys (infant nutrition, insulin, blood bags, potable water) onto damaged or flooded roads, causing stranded fleets, wasted hours, and isolated shelters going days without essentials.

**Product Goal:** Design a web-based **Relief Supply Chain Resilience & Rerouting System** that gives control-room operators, district disaster-management authorities, and field convoy drivers real-time, hazard-aware routing intelligence — so relief reaches shelters safely and fast.

**Design Deliverable:** A complete Figma file — wireframes → high-fidelity UI → interactive prototype → mini design system — ready for developer handoff.

---

## 2. Design Principles

1. **Calm authority over alarm** — the interface must instill confidence during chaos, not visual panic. Muted tones, clear structure, no flashing/red-heavy consumer-style alerts.
2. **Glanceable truth** — every screen must communicate status within 2–3 seconds to a stressed operator.
3. **Zero ambiguity** — no icon or color is used without a paired text label; nothing is inferred.
4. **Field-first resilience** — must work on tablets in bright sunlight, patchy connectivity, and by users wearing gloves.
5. **Institutional trust** — government emblem, data-source attribution, and timestamps are treated as core UI elements, not footnotes.

---

## 3. Color System (from approved government palette)

| Token | Hex | Usage |
|---|---|---|
| `bg-honeydew` | #EDF3E0 | App background, card surfaces, default map basemap |
| `sage-500` | #8FAF8C | Safe/cleared routes, resolved alerts, secondary buttons, success chips |
| `forest-600` | #5A7A68 | Primary buttons, active convoy paths, nav bar, links, focus states |
| `slate-800` | #3A4750 | Headers, body text, critical/blocked-route alerts, icon strokes |

**Rules:**
- Build 2–3 tint/shade steps off each token (e.g., `forest-600` → `forest-700` hover, `forest-100` light fill) for depth without introducing new hues.
- Slate Charcoal is reserved for **critical severity only** — overusing it collapses the hierarchy.
- Maintain WCAG AA contrast (4.5:1 body text, 3:1 large text/icons) — test Sage-on-Honeydew combinations carefully, as they run light; darken sage text variants if needed.
- Never use color alone to convey hazard severity — always pair with icon shape (triangle = warning, octagon = blocked, circle-check = safe) and text label.

**Typography:** Inter or IBM Plex Sans (Noto Sans as multilingual fallback for regional languages). Minimum body size 14px on desktop / 16px on field tablets. No font-weight below 400 for any data-bearing text; critical alerts set in 600–700 weight.

---

## 4. Information Architecture

```
Login (role-based: Control Room / District Admin / Field Driver)
 └── Dashboard (role-specific landing)
      ├── 1. Live Situational Map
      ├── 2. Convoy Dispatch & Tracking
      ├── 3. Shelter & Demand Board
      ├── 4. Hazard & Incident Log
      ├── 5. Alerts & Command Center
      └── Settings (users, offline sync, language, accessibility mode)
```

---

## 5. Screen-by-Screen Specification

### 5.1 Live Situational Map (primary/default screen)
- Full-bleed map (Honeydew basemap) with layered overlays: flood-depth zones (graduated Sage→Slate opacity), debris-blocked segments (dashed slate line), structurally unsafe bridges (octagon icon), live convoy markers (animated forest-600 dot with directional heading).
- Left panel: layer toggles + legend.
- Right panel: selected convoy/route detail card — cargo priority, current safe route, recalculation trigger reason, ETA delta.
- Top bar: search/filter by convoy ID, shelter, or region; global "last synced" timestamp; connectivity status indicator.
- **Interaction:** Clicking a hazard opens an inline detail popover (source, timestamp, confidence level) without navigating away from the map — preserve operator context.

### 5.2 Convoy Dispatch & Tracking Panel
- Table/card hybrid view, sortable by priority (Insulin/Blood > Infant Nutrition > Water > General).
- Each convoy row: cargo icon, priority chip (color + label, never color-only), origin hub, destination shelter, route status (On Route / Rerouted / Stranded / Delivered), ETA, driver contact action.
- "Rerouted" state shows a small diff — old path (struck-through slate) vs. new path (forest-600) — so operators understand *why* a change happened.
- Bulk action bar for dispatching multiple convoys to a newly cleared route.

### 5.3 Shelter & Demand Board
- Card grid, one per shelter: name, population served, days-of-supply-remaining (large numeral, color-coded by urgency tier), isolation risk badge, incoming convoy ETA.
- Sort/filter by urgency, region, or supply type shortage.
- Expand card → historical supply trend sparkline + contact/radio status.

### 5.4 Hazard & Incident Log
- Reverse-chronological feed, each entry tagged by source type (Sensor / Field Report / Satellite / Manual Entry) with a confidence indicator.
- Filter by hazard type (flood, debris, bridge, road closure) and region.
- "Verify" action for control-room staff to promote a field report to confirmed status, which then updates the live map.

### 5.5 Alerts & Command Center
- Persistent top-of-app banner for Critical severity items only (e.g., "Convoy 14 stranded — Sector 6").
- Full alert inbox with severity tiers (Critical / Warning / Advisory), acknowledgment workflow, and escalation-to-district-command action.

---

## 6. Component & State System (for Figma component library)

Build every interactive component in **four states**: Default → Hover/Focus → Warning → Critical, plus Disabled where relevant.

- **Buttons:** Primary (forest-600 fill), Secondary (sage-500 outline), Destructive/Critical (slate-800 fill, used sparingly for "Mark Route Unsafe" type actions).
- **Status Chips:** Rounded, icon + label, three tiers — Safe (sage), Caution (forest with warning icon), Blocked (slate with octagon icon).
- **Cards:** Consistent 8px radius, subtle 1px border (no heavy shadows — flat, institutional feel), Honeydew fill on Honeydew background differentiated by border only.
- **Map Markers:** Distinct shapes per entity type (convoy = arrow, shelter = home icon, hazard = triangle/octagon) so shape, not just color, carries meaning.
- **Data Tables:** Zebra striping using Honeydew/white, sticky header row in slate-800.
- **Forms/Inputs:** High-contrast focus rings (forest-600), clear error states in slate-800 with icon + inline text (never color-only).

---

## 7. Accessibility & Field-Use Requirements

- WCAG 2.1 AA minimum across all screens; test with a color-blindness simulator given the green/sage-heavy palette.
- High-contrast "Field Mode" toggle for outdoor tablet use — increases contrast and font weight, reduces map layer opacity clutter.
- Touch targets minimum 44×44px for tablet/field driver interfaces.
- Offline-first affordances: visible "last synced" state, graceful degradation banners when connectivity drops, queued-action indicators.
- Multilingual support built into the type scale and component spacing from the start (avoid fixed-width labels that break with longer translated strings).

---

## 8. Figma File Deliverable Structure

1. **Cover page** — project name, palette, typography, principles.
2. **Design tokens page** — color styles, text styles, spacing/grid (8pt system), effect styles.
3. **Component library page** — all components with variants/states as Figma Variants.
4. **Wireframes page** — low-fidelity flows for all five core screens (desktop + tablet).
5. **High-fidelity screens page** — final UI, organized by role (Control Room / District Admin / Field Driver).
6. **Prototype flow** — clickable, connecting login → dashboard → map → dispatch → alert acknowledgment.
7. **Handoff annotations** — spacing, states, and interaction notes for developers.

---

## 9. Tone of Voice for UI Copy
Direct, factual, imperative where action is needed (e.g., "Reroute Convoy 14" not "Would you like to reroute?"). No exclamation marks. No decorative micro-copy. Timestamps and units always explicit (e.g., "Updated 3 min ago," "1.2m flood depth").
