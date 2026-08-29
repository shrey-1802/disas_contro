# FEATURE REFERENCE GUIDE
## Companion to: MASTER_FRONTEND_BUILD_PROMPT.md
### What each feature is, why it exists, how it works, and what the user actually sees

---

# HOW TO READ THIS

Every feature below is explained in four parts:
- **What it is** — the one-sentence definition.
- **Why it exists** — which part of the earthquake/flood scenario it directly solves.
- **How it works** — the underlying logic, in plain terms.
- **What the user sees** — the concrete UI moment.

Features are grouped into three layers: the **Routing Intelligence Engine** (the core problem — bad roads), **Supply Swap** (the secondary problem — inventory stuck in the wrong place), and **Platform-wide systems** (roles, alerts, field conditions) that tie both together.

---

# PART A — ROUTING INTELLIGENCE ENGINE

This is the layer that directly answers the problem statement: *"conventional GPS and map systems continue routing them onto damaged or submerged roads."* Every feature here exists to make sure that never happens on this platform.

## A.1 Hazard Fusion & Confidence Resolution

**What it is:** The logic that decides what to believe when multiple sources report conflicting information about the same road or bridge.

**Why it exists:** In a real disaster, you get a sensor reading, a driver's field report, and a satellite pass — and they often disagree, because they were captured at different times and have different reliability. A naive system either trusts everything (dangerous — a stale "all clear" sensor reading overrides a fresh "flooded" field report) or trusts nothing until manually checked (too slow — critical routing decisions can't wait for a human every time).

**How it works:** Every hazard report carries three properties: *recency* (how old is it), *source reliability* (a sensor is generally more consistent than an unverified phone report, but a fresh field report from someone standing at the bridge beats a 40-minute-old automated reading), and *corroboration* (do multiple independent sources agree). The fusion rule combines these: a newer, lower-confidence report can still outrank an older, higher-confidence one for *routing purposes* — but it's flagged **unconfirmed** until a Control Room operator explicitly verifies it. Verifying it doesn't change the routing decision (that already happened), it changes the report's permanent status in the log and removes the "unconfirmed" flag from the map.

**What the user sees:** On the map, an unconfirmed hazard renders with the same triangle/octagon shape and color as a confirmed one, but with a **dashed outline instead of solid**, plus a small "?" badge. Clicking it shows the popover: source, timestamp, confidence %. If you're Control Room, there's a "Verify" button right there — pressing it promotes the report, the outline goes solid, and if any convoy's route depends on that segment, it recalculates immediately.

---

## A.2 Live Route Cost Graph (the routing engine itself)

**What it is:** The actual mechanism that turns "this road is hazardous" into "here is the new safest path" — this is what "hazard-aware routing" means technically.

**Why it exists:** Every screen in the app — the map's convoy lines, the dispatch table's ETA, the shelter board's incoming-delivery estimate — needs to agree with each other. Without one shared engine, you'd get three different opinions about where a convoy is headed, which is exactly the kind of confusion that gets convoys stranded.

**How it works:** Think of the road network as a graph: intersections are nodes, road/bridge segments are edges. Each edge has a cost, calculated as:

```text
EDGE COST = base cost (distance, road class)
          × hazard penalty (Safe = ×1, Caution = ×3, Blocked = excluded entirely)
          × vehicle-fit penalty (does this convoy's vehicle class fit this bridge's weight limit)
```

Whenever a hazard's status changes anywhere in the network, the graph updates that edge's cost and reruns "shortest safe path" for every convoy whose route touches that edge. This happens automatically and pushes out as a `route:recalculated` event — no one has to manually ask for a recheck.

**What the user sees:** Nothing about the graph itself — that's invisible. What the user sees is the *effect*: a convoy's line on the map redraws itself, the dispatch table shows a new ETA with a one-line reason ("Bridge B14 downgraded to Blocked"), and the old path appears struck-through next to the new one so it's clear *why* the change happened, not just *that* it happened.

---

## A.3 Predictive Flash-Flood Zones

**What it is:** A forecast layer that flags a road segment as *likely* to become Blocked in the near future, before it's officially confirmed as such.

**Why it exists:** This is the single most direct fix for the scenario's worst failure mode: *"end up trapped in dynamic flash-flood zones."* A confirmed-hazard-only system is always reactive — it only knows a road is bad after someone reports it, which can be after a convoy is already on it. Flash floods move faster than that reporting loop.

**How it works:** Using rainfall data, upstream river-gauge trends, and terrain modeling, the system estimates a rough time-to-block for a segment — e.g. "Segment R-22 likely Blocked within ~25 minutes." This isn't treated as a confirmed hazard (it doesn't get a solid octagon), but it *does* add a real cost penalty to that edge in the routing graph right away, so the engine avoids sending a convoy toward a segment that's probably about to fail, rather than waiting for confirmation and rerouting a convoy that's already halfway across it.

**What the user sees:** A separate, toggleable map layer — a soft graduated overlay (distinct from the confirmed flood-depth overlay) with a small forward-looking label like "△ ~25 min." It's off by default so it doesn't visually compete with confirmed hazards, but Control Room can switch it on to see what's coming, not just what's already happened.

---

## A.4 Isolated Shelter Detection (Reachability Check)

**What it is:** A check that runs per shelter, not per road — it asks "does *any* combination of safe segments connect *any* warehouse to this shelter at all," and flags the shelter as Isolated if the answer is no.

**Why it exists:** This is the scenario's absolute worst case: a shelter that's cut off entirely, not just delayed. It's also the case a human operator is least likely to notice on their own — a manager staring at a busy map, watching individual road segments go from Caution to Blocked one at a time, won't necessarily connect the dots that *every* path to one specific shelter has now failed. The system should say that plainly instead of leaving it to be inferred.

**How it works:** For every shelter, run the shortest-safe-path algorithm from every warehouse in the network. If none of them return a valid path under the exclusion rule (Blocked segments are removed from the graph entirely, not just penalized), the shelter is flagged Isolated. This recheck runs automatically every time the route graph changes — a shelter that's Isolated now might not be five minutes later if a bridge gets cleared, and the system needs to catch that too.

**What the user sees:** On the shelter board, an Isolated shelter's card sits visually *above* even a Critical-shortage card — it's the platform's most severe possible status, with its own icon and label, never conveyed by color alone. The moment a shelter is flagged Isolated, a matching entry appears automatically on the Alerts screen — the operator doesn't have to notice it themselves and manually create the alert.

---

## A.5 Relay / Vehicle-Handoff Points

**What it is:** A route type where a path is only passable past a certain point by a smaller/lighter vehicle — instead of marking the whole route Blocked, the system treats it as a two-leg route with a handoff in the middle.

**Why it exists:** In reality, damage is rarely all-or-nothing. A bridge might fail a heavy truck's weight limit but hold a 4x4 or even a handcart. Treating that route as fully Blocked wastes a genuinely usable path; treating it as fully Safe risks sending the wrong vehicle across it.

**How it works:** The routing graph can mark a node as a relay point — a location where cargo/vehicle assignment can change mid-route. A mission that uses a relay point is really two connected sub-missions: Warehouse → Relay Point (heavy vehicle) and Relay Point → Shelter (light vehicle), each independently routed and each with its own vehicle assignment.

**What the user sees:** On the dispatch table, a relay-based mission shows as two connected sub-rows instead of one, so the operator can see both legs, both vehicles, and both ETAs — not one row that mysteriously has two different vehicle types attached to it.

---

## A.6 Driver-Side Reroute Confirmation (offline-safe)

**What it is:** When the engine reroutes a convoy that's already in transit, the driver sees the change and has to actively acknowledge it — and that acknowledgment works even without a live connection.

**Why it exists:** A rerouted path is only useful if the driver actually knows about it. It's also a two-way trust problem: if a driver goes quiet after a reroute in a hazard zone, that silence is itself important information for the Control Room — it shouldn't just look like a blank, unremarkable field on their screen.

**How it works:** When the graph recalculates a route for a convoy in transit, the driver's device receives the update via the live socket connection if online. If the connection is patchy, the update queues locally and the driver's app shows it the moment connectivity returns. The driver taps "Acknowledge new route." If no acknowledgment comes back within a set time window, that's not silently ignored — it's surfaced back on the Control Room's dispatch table as a risk signal on that convoy's row.

**What the user sees:** For the driver: a non-blocking banner with the old path struck through and the new path highlighted, plus one button. For Control Room: a status indicator on the dispatch table showing whether the driver has acknowledged, is pending, or has gone past the acknowledgment timeout.

---

## A.7 Convoy Risk Index

**What it is:** A single composite score per convoy that lets an operator triage the whole dispatch table at a glance, instead of reading every row individually.

**Why it exists:** Cargo priority alone (insulin/blood > infant nutrition > water > general) tells you what's *important*, but not what's *currently in trouble*. A high-priority convoy cruising safely and a lower-priority convoy stuck near a forecasted flood zone need very different amounts of attention right now — sorting by priority alone would bury the second one.

**How it works:** It's a weighted combination of: cargo priority, how many Caution/Blocked segments are on the convoy's current path, how long it's been since the convoy last checked in, and how close it is to a forecasted flash-flood zone. The result is one score per convoy.

**What the user sees:** A compact bar on the dispatch row — length and the existing three-tier color scale only, no new color introduced — so the worst-situation convoys visually stand out without needing a manual sort.

---

## A.8 After-Action Report

**What it is:** A short, auto-generated factual summary composed the moment a convoy is delivered or a stranded situation is resolved.

**Why it exists:** Government emergency platforms get audited. A log of raw timestamps and status changes is accurate but unreadable months later; a one-line human summary, generated from data that already exists, costs almost nothing to produce and is what actually gets read in a review.

**How it works:** It's not a new data source — it's a template filled from the mission's existing timestamps and status-change history. Example: *"Convoy 14 (Insulin, Blood) rerouted twice after Bridge B14 and Route R-9 were blocked. Delivered to Shelter 06, 3h 10m after dispatch, 1h 40m over original ETA."*

**What the user sees:** A field on the expanded dispatch row once a mission completes — not a new screen, just a readable summary sitting where the raw status history used to be the only thing available.

---

## A.9 Confidence Ring (signature map element)

**What it is:** A thin ring drawn around every hazard marker on the map, where the arc length represents that hazard's confidence percentage.

**Why it exists:** This is a deliberate design choice, not a routing feature — it's the one visually distinctive element the whole map is built around, so an operator can judge "is this a solid, well-corroborated report or a thin, single-source one" without opening the popover every time. It reuses the existing three-tier palette rather than introducing a fourth color, keeping it inside the locked design system.

**How it works:** Purely presentational — it reads the same confidence % already used in the fusion logic (A.1) and renders it as an arc around the marker instead of only showing it inside a popover.

**What the user sees:** Every hazard icon on the map has a small ring around it. A short arc = thin evidence, a nearly-complete ring = strong, corroborated evidence. It recurs identically on the hazard log's list entries, so it becomes a consistent visual language across the whole app rather than a one-off chart.

---

# PART B — SUPPLY SWAP (INTER-WAREHOUSE REBALANCING)

This layer solves the platform's second failure mode: a warehouse can have inventory while a nearby warehouse or shelter is in shortage, and nothing in a standard system notices or fixes that automatically.

## B.1 Predictive Shortage Forecasting

**What it is:** A dashboard signal that a warehouse is on track to run out of an item, calculated *before* it's actually critical.

**Why it exists:** The default flow starts when a manager happens to notice a shortage. This flips that — the system watches consumption rate against current stock and speaks up first, giving time to act instead of reacting after the fact.

**How it works:** `time-to-stockout = current stock ÷ consumption rate`, adjusted for any inbound transfers already in motion. If that number drops under a threshold, a forecast card appears. This is explicitly informational, not automatic — it never triggers a transfer on its own; a human still has to open Supply Swap and act.

**What the user sees:** A distinct card style (dashed border, clock icon) reading something like *"Warehouse B — Insulin — stockout in 6h 40m at current draw rate."* It's visually calmer than an actual Critical shortage card, so it doesn't create false urgency.

---

## B.2 Multi-Hop Chain Swaps

**What it is:** When no single warehouse has enough surplus to cover a shortage, the system finds a combination of multiple warehouses that together do.

**Why it exists:** Real networks rarely have one perfect donor warehouse sitting right next to the one in need. Without this, a real, fulfillable need gets marked "no match found" simply because the matching logic only ever looked for a single source.

**How it works:** The match engine, instead of stopping at "no single warehouse can fill this," tries combinations: e.g. Warehouse D can send 25, Warehouse A can send 15, together covering the 40 needed. Each contributing warehouse's leg is routed and evaluated independently — a chain isn't approved as one opaque block, each leg has its own route check and its own approval.

**What the user sees:** A card labeled "Partial match — chain available," which expands into a short list of each contributing warehouse, its quantity, and its own route status — the manager approves each leg, keeping full visibility into what's actually moving from where.

---

## B.3 Cold-Chain Convoy Fit (hard gate)

**What it is:** A rule that prevents insulin or blood from ever being assigned to a vehicle that can't keep it cold — not a warning, an outright block.

**Why it exists:** The problem statement explicitly names insulin and blood bags as cargo. Both fail if temperature control breaks down in transit. A soft warning that a manager can click past defeats the purpose; this has to be a real gate.

**How it works:** Every convoy vehicle has a capability flag (refrigerated / standard). Every cargo type has a requirement flag. If cargo requires cold-chain and a vehicle doesn't have it, that vehicle is never offered as an assignment option for that transfer — it's excluded from the list, not shown-but-disabled.

**What the user sees:** When assigning a convoy to a cold-chain transfer, only refrigerated vehicles appear as options. If a manager tries to force a mismatch some other way, the interface states plainly: *"This vehicle isn't refrigerated — insulin can't be assigned to it."*

---

## B.4 Mid-Transit Reroute Alerts (Supply Swap side)

**What it is:** The same reroute-awareness described in A.6, applied specifically to an active supply transfer, visible to *both* the source and destination warehouse.

**Why it exists:** A supply transfer in transit has two interested parties, not one — if the route degrades, both the sending and receiving warehouse manager need to know their plan just changed, not just the driver.

**How it works:** Same underlying `route:recalculated` event as the routing engine. When it affects an active transfer, it pushes a visible event to the Active Transfers board and a socket-driven toast to both warehouses' dashboards.

**What the user sees:** On the Active Transfer card: *"⚠ Route changed — in transit. Bridge B14 downgraded: Caution → Hazardous. Convoy 14 auto-rerouted via Route C. New ETA: 38 min → 61 min,"* with a link to view the new route and contact the convoy.

---

## B.5 Transfer Impact Preview

**What it is:** Before approving a transfer, a screen showing what the transfer does to *both* warehouses' stock levels and days-of-cover — not just the raw quantity being moved.

**Why it exists:** This is the single highest-value feature in Supply Swap. A plain "Warehouse A has 100 units" tells a manager nothing about consequences. The actual decision a manager needs to make is "can Warehouse A afford to give up 40 units without creating a *new* shortage there" — and that requires seeing the after-state, not just the before-state.

**How it works:** Given a proposed transfer quantity, the system computes each warehouse's resulting stock and days-of-cover, and checks that against each warehouse's own configured safety threshold. If the source warehouse would drop below its threshold, the system proposes a smaller, safer quantity instead of just letting the manager approve a number that creates a second problem.

**What the user sees:** A modal: *"Warehouse A: 60 → 20 (6 days cover → 2 days). Warehouse B: 8 → 48 (0.4 days → 2.4 days). ⚠ Warehouse A drops below its own 3-day safety threshold. Recommend reducing to 30 units instead of 40?"* with buttons to adjust or confirm anyway — the decision stays with the human, but it's now an informed one.

---

## B.6 Escalation on Stalled Critical Transfers

**What it is:** If a Critical-priority transfer sits unactioned for too long, it automatically escalates to a coordinating role instead of waiting indefinitely for someone to notice.

**Why it exists:** Critical means time-sensitive by definition. A critical insulin request sitting in "Requested" for 40 minutes because the responsible manager is dealing with something else elsewhere is exactly the kind of gap this feature exists to close.

**How it works:** A timer starts the moment a transfer is marked Critical and enters Requested/Matched. If it's still there after a configurable window (e.g. 15 minutes), it's marked Escalated and a notification goes to the regional/coordinating role, who can approve on the original manager's behalf or reassign it to a different warehouse.

**What the user sees:** The transfer's status badge changes to "Escalated," it appears on the coordinating role's alerts, and the original warehouse's dashboard shows it's been picked up by someone else — not silently taken away, visibly handed off.

---

## B.7 Low-Bandwidth Shelter Need Ping

**What it is:** A minimal-data path for a shelter coordinator with no full app access to submit a supply need — a short form or SMS/USSD-style submission, not the full Supply Swap interface.

**Why it exists:** Shelters are often the least connected point in the whole network, and they're the ones actually experiencing the shortage. If the only way to register a need is through a full warehouse-manager interface, shelters with poor connectivity or no dedicated device get systematically underrepresented in the data.

**How it works:** A shelter coordinator submits: shelter ID, item, a rough quantity, and a one-tap urgency level. This enters the exact same request pipeline as a warehouse manager's manual request — same lifecycle, same matching engine — it's just a lighter-weight entry point.

**What the user sees:** On Supply Swap and the shelter board, entries that came in this way carry a small "Field Report" tag, signaling to the manager that the numbers are coarser than a warehouse system's inventory data and worth a quick verification before committing a large transfer against them.

---

# PART C — PLATFORM-WIDE SYSTEMS

These aren't single features so much as the connective tissue that makes the two engines above work as one product.

## C.1 Role-Based Access Control

**What it is:** Four distinct roles — Control Room, District Admin, Warehouse Manager, Field Driver — each with their own default screen, their own visible navigation, and their own allowed actions, not just their own visible pages.

**Why it exists:** These are genuinely different jobs with different responsibilities and different failure costs. A Field Driver acting on a false understanding of the whole network is a wasted-time problem; a District Admin being able to approve a warehouse's internal transfer without warehouse-level inventory context is a data-integrity problem. Separating both what's *visible* and what's *actionable* per role keeps each role focused on their actual job and prevents actions being taken by people without the context to take them safely.

**How it works:** Two layers. Page-level: the navigation only renders the screens a role is allowed to see — an unauthorized direct URL hit redirects to that role's default screen rather than 404ing or partially rendering. Action-level: even on a shared screen, specific buttons are permission-gated — e.g. a District Admin can *see* Supply Swap activity for network awareness but the "Approve" button is disabled with a plain-language reason, because approving inventory transfers is specifically a Warehouse Manager's call.

**What the user sees:** Each role logs in and lands exactly where their job starts (a Field Driver never has to click past a dashboard designed for someone else's job). Where an action isn't available to them, it's visibly present but disabled with a one-line explanation on hover — never just missing, which would look like a bug rather than a deliberate boundary.

---

## C.2 Alerts & Command Center Auto-Escalation

**What it is:** A background watcher that listens across every other feature — routing, dispatch, shelters, supply transfers — for anything that crosses a Critical threshold, and surfaces it on one persistent banner visible from any screen, regardless of role.

**Why it exists:** Several features above (Isolated shelter detection, stalled critical transfers, unacknowledged reroutes past timeout, stranded convoys) each generate their own Critical event. Without a single unifying layer, an operator would need to separately check the map, the dispatch table, the shelter board, and Supply Swap to catch all of them. This collapses all of that into one place that's always visible.

**How it works:** It's not a separate detection system — it subscribes to the same events every other feature already emits (`route:recalculated`, `shelter:demand_update`, `transfer:status_update`, reachability rechecks) and filters for anything tagged Critical, then pushes it to the global banner and the full alerts inbox.

**What the user sees:** A single-line banner at the top of every screen — e.g. *"Convoy 14 stranded — Sector 6"* — with an acknowledge action, appearing the instant any of the features above generates a Critical event, without anyone having to have manually created that alert first.

---

## C.3 Field Mode

**What it is:** A single toggle that adjusts the whole interface for outdoor tablet use — bigger text, thicker borders, and reduced map-overlay opacity — implemented as an override of the existing design tokens rather than a second stylesheet.

**Why it exists:** The scenario explicitly includes field drivers working on tablets, in bright sunlight, potentially with gloves on. A normal desktop-density interface fails all three of those conditions at once.

**How it works:** Rather than maintaining a parallel "field" version of every component (which would drift out of sync as the app evolves), Field Mode simply redefines a handful of the same CSS custom properties the whole app already uses — `--text-base`, `--text-sm`, `--border-hairline` — at the `<body class="field-mode">` level. Every component built against those tokens updates automatically; nothing needs a field-specific version of itself.

**What the user sees:** One toggle in Settings (or the top bar). Text gets larger, card borders get heavier and more visible in bright light, and map overlays fade back so hazard shapes stand out through visual clutter — the underlying layout and information don't change, only how legible it is outdoors.

---

# QUICK REFERENCE — WHICH SCREEN EACH FEATURE LIVES ON

```text
live-map.html        A.1 A.2 A.3 A.9, B.4 (transfer layer)
convoy-dispatch.html A.2 A.5 A.6 A.7 A.8
shelter-board.html   A.4
hazard-log.html      A.1
supply-swap.html     B.1 B.2 B.3 B.4 B.5 B.6 B.7
alerts.html          C.2
settings.html        C.3
all screens           C.1 (role gating), C.2 (banner)
```
