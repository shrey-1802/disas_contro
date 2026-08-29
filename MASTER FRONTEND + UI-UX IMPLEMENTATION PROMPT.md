# MASTER FRONTEND + UI/UX IMPLEMENTATION PROMPT
# RELIEF ROUTE INTELLIGENCE PLATFORM
## WAREHOUSE MANAGER EXPERIENCE + SUPPLY SWAP

---

# 0. YOUR ROLE

Act as a:

- Senior Frontend Architect
- Senior UI/UX Designer
- Interaction Designer
- GIS Dashboard Designer
- Humanitarian Logistics UX Researcher
- Design Systems Engineer
- Accessibility Engineer
- Data Visualization Designer
- Emergency Operations Center Interface Designer

You are building a **mission-critical humanitarian logistics web application**.

The primary user for this version is:

> **WAREHOUSE MANAGER**

The Warehouse Manager is responsible for understanding:

- what inventory is physically available
- what inventory is operationally available
- what supplies are becoming critical
- which shelters require supplies
- which other warehouses have surplus
- which supply requests can be fulfilled
- whether supplies can safely move
- whether routes are changing
- whether convoys are affected
- whether the warehouse should offer supplies through Supply Swap
- what operational action should happen next

---

# 1. PRODUCT CONCEPT

The platform is a:

> **Real-Time Disaster Relief Supply Chain Intelligence & Coordination Platform**

The core operational network is:

```text
WAREHOUSE
     ↓
INVENTORY
     ↓
SUPPLY SWAP
     ↓
CONVOY
     ↓
ROUTE
     ↓
HAZARD
     ↓
SHELTER
     ↓
HUMANITARIAN NEED
```

The interface must make this network understandable.

Do NOT build disconnected pages.

Every page must connect to the same operational objects.

For example:

```text
Inventory
   ↓
Supply Swap
   ↓
Transfer
   ↓
Convoy
   ↓
Route
   ↓
Shelter
```

If a route becomes blocked:

```text
Hazard
   ↓
Route status changes
   ↓
Convoy affected
   ↓
ETA changes
   ↓
Supply delivery risk changes
   ↓
Warehouse Manager sees new action
```

This relationship is the heart of the UX.

---

# 2. IMPORTANT RESEARCH PRINCIPLE

Do NOT design the system as a conventional logistics dashboard.

Traditional logistics asks:

> "What is the shortest route?"

This system must help users reason about:

> "What decision remains reasonable when the transportation network, destination demand, and available information are uncertain?"

The uploaded research describes the disaster transportation network as a **moving target** and identifies the need to know whether a road is usable by a specific vehicle at a specific time and under current environmental conditions.

Therefore the UI must expose:

```text
CURRENT CONDITION
+
CONFIDENCE
+
TIME
+
IMPACT
+
ACTION
```

---

# 3. PRIMARY PERSONA

## WAREHOUSE MANAGER

Example:

```text
Name:
Operations Manager

Role:
Regional Warehouse Manager

Primary responsibility:
Manage relief inventory and respond to changing supply demands.

Main concern:
"I have supplies in my warehouse. Can I safely and responsibly make
those supplies available to a location that needs them?"
```

---

# 4. WAREHOUSE MANAGER MENTAL MODEL

The Warehouse Manager should think:

```text
WHAT DO I HAVE?
        ↓
WHAT MUST I KEEP?
        ↓
WHAT CAN I RELEASE?
        ↓
WHO NEEDS IT?
        ↓
CAN IT REACH THEM?
        ↓
WHAT WILL HAPPEN TO MY INVENTORY?
        ↓
APPROVE / REJECT / WAIT
```

The interface should support exactly this mental model.

---

# 5. UX NORTH STAR

The application must follow:

```text
SEE
 ↓
UNDERSTAND
 ↓
COMPARE
 ↓
DECIDE
 ↓
ACT
 ↓
MONITOR
 ↓
ADAPT
```

Never force the Warehouse Manager through:

```text
Page
→ another page
→ search
→ table
→ detail page
→ back
→ map
→ another page
```

Use:

- drawers
- inline expansion
- contextual panels
- map popovers
- quick actions
- persistent context

The existing UI/UX brief specifically requires preserving operator context when hazards are inspected on the map.

---

# 6. FRONTEND FILE ARCHITECTURE

Use exactly this structure:

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

IMPORTANT:

The architecture currently does not explicitly contain:

```text
inventory.html
supply-swap.html
```

Therefore do NOT silently invent a completely separate application architecture.

Integrate Supply Swap primarily through:

```text
dashboard.html
+
live-map.html
+
convoy-dispatch.html
+
shelter-board.html
```

and, if implementation requires a dedicated page, clearly create:

```text
supply-swap.html
js/pages/supplySwap.js
```

only after evaluating the existing architecture.

---

# 7. GLOBAL DESIGN SYSTEM

Use the existing approved palette.

Do NOT introduce an unrelated color system.

```css
:root {

  --bg-honeydew: #EDF3E0;

  --sage-500: #8FAF8C;

  --forest-600: #5A7A68;

  --forest-700: #4A6656;

  --sage-100: #E4EBE0;

  --slate-800: #3A4750;
}
```

Use color carefully.

The original UI/UX brief specifies:

- Honeydew background
- Sage/Forest operational colors
- Slate for stronger critical states
- icon + label instead of color-only communication.

---

# 8. DESIGN LANGUAGE

Visual direction:

```text
Humanitarian Operations Center
+
GIS Control Room
+
Enterprise Logistics Platform
+
Modern SaaS
```

The interface should feel:

- serious
- calm
- intelligent
- trustworthy
- operational
- modern
- highly organized

Avoid:

- excessive glassmorphism
- excessive gradients
- neon colors
- gaming UI
- giant cards
- excessive shadows
- unnecessary animations
- decorative charts

---

# 9. TYPOGRAPHY

Use:

```text
Inter
or
IBM Plex Sans
```

Hierarchy:

```text
Page title:
28–32px

Section:
18–22px

Card title:
15–18px

Body:
14–16px

Metadata:
12–13px
```

Use weight and spacing rather than excessive color.

---

# 10. GLOBAL APPLICATION SHELL

Every page after login must share the same shell.

```text
┌──────────────────────────────────────────────────────────────┐
│ LOGO │ OPERATIONS CENTER │ SEARCH │ ALERTS │ SYNC │ USER    │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Dashboard    │                                               │
│ Live Map     │                                               │
│ Inventory    │                MAIN CONTENT                   │
│ Supply Swap  │                                               │
│ Dispatch     │                                               │
│ Shelters     │                                               │
│ Hazards      │                                               │
│ Alerts       │                                               │
│ Settings     │                                               │
│              │                                               │
│──────────────│                                               │
│ ● LIVE       │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

# 11. SIDEBAR

Warehouse Manager navigation:

```text
Dashboard
Live Operations Map
Inventory
Supply Swap
Convoy Dispatch
Shelter Demand
Hazard Log
Alerts
Settings
```

Each item must have:

```text
icon
label
active state
hover state
focus state
optional badge
```

Example:

```text
Supply Swap     07
Alerts          03
```

But do not use notification badges everywhere.

Only show badges when actionable.

---

# 12. GLOBAL TOP BAR

Include:

```text
Warehouse:
Regional Warehouse A

Network:
● LIVE

Last synchronized:
12 seconds ago

Search:
"Search warehouse, shelter, convoy..."
```

User profile:

```text
Warehouse Manager
Regional Operations
```

---

# 13. GLOBAL SEARCH

Shortcut:

```text
Ctrl + K
```

Search across:

```text
Warehouses
Inventory
Shelters
Convoys
Supply Swaps
Routes
Hazards
Alerts
```

Search should support partial matching.

Example:

```text
User enters:

insulin
```

Results:

```text
INVENTORY

Insulin
Warehouse A
60 transferable units


SUPPLY REQUEST

Shelter 06
40 units required


SUPPLY SWAP

Warehouse B → Shelter 06
```

Clicking result opens the relevant contextual panel.

---

# 14. LIVE SYSTEM INDICATOR

Top right:

```text
● LIVE
Updated 12 sec ago
```

States:

```text
● LIVE
◌ SYNCING
△ DELAYED
○ OFFLINE
```

If stale:

```text
△ DATA MAY BE OUTDATED

Last update:
7 minutes ago
```

The interface must never imply real-time certainty when data is stale.

This is especially important because the underlying research identifies information reliability and outdated operational knowledge as central problems.

---

# 15. DASHBOARD PAGE

File:

```text
dashboard.html
```

The dashboard is the Warehouse Manager's:

> **Decision Center**

---

# 16. DASHBOARD HEADER

Display:

```text
Good morning, Warehouse Manager

Regional Warehouse A

Operational status:
● FUNCTIONAL

Last synchronized:
12 sec ago
```

Below:

```text
Current situation:
3 critical supply requests require attention.
2 routes are under restriction.
7 Supply Swap opportunities are available.
```

Do not make this a static paragraph.

Each item should be clickable.

---

# 17. DASHBOARD KPI AREA

Create:

```text
┌──────────────┐
│ INVENTORY    │
│ 2,480 units  │
│ 87% healthy  │
└──────────────┘

┌──────────────┐
│ CRITICAL     │
│ REQUESTS     │
│ 03           │
└──────────────┘

┌──────────────┐
│ SWAP         │
│ OPPORTUNITIES│
│ 07           │
└──────────────┘

┌──────────────┐
│ ACTIVE       │
│ TRANSFERS    │
│ 04           │
└──────────────┘
```

Cards must be clickable.

---

# 18. DASHBOARD — "WHAT NEEDS MY ATTENTION?"

This must be one of the largest sections.

```text
PRIORITY ACTIONS
```

Example:

```text
⬢ CRITICAL

Shelter 06 requires insulin.

Remaining:
4 hours

Available matching supply:
40 units

Route:
△ Caution

[REVIEW SUPPLY SWAP]
```

Second:

```text
△ ACTION REQUIRED

Warehouse B requests blood bags.

Current transferable inventory:
100 units

[VIEW REQUEST]
```

Third:

```text
△ ROUTE CHANGE

Bridge B14 became unsafe.

Transfer SW-014 may be affected.

[VIEW IMPACT]
```

---

# 19. PRIORITY LOGIC

Sort actions using:

```text
Humanitarian urgency
+
time-to-harm
+
population affected
+
inventory remaining
+
route reliability
+
confidence
```

Do not simply sort by timestamp.

The research identifies an important distinction between ordinary delivery delay and **delay relative to the time at which a shortage becomes harmful**.

Therefore the UI should prioritize:

```text
4 hours remaining
```

over:

```text
4 days remaining
```

even if both have the same delivery delay.

---

# 20. DASHBOARD — INVENTORY HEALTH

Create four major supply groups:

```text
INFANT NUTRITION
INSULIN
BLOOD BAGS
POTABLE WATER
```

Example:

```text
INSULIN

Available:
60

Reserved:
20

Transferable:
40

Coverage:
31%

████████░░░░░░░░
```

Click:

```text
INSULIN
```

opens inventory drawer.

---

# 21. IMPORTANT INVENTORY DISTINCTION

Do not display:

```text
Total inventory = usable inventory
```

Instead show:

```text
PHYSICAL
On hand

OPERATIONAL
Available

COMMITTED
Reserved

TRANSFERABLE
Can safely be offered

AT RISK
Potentially inaccessible
```

This is directly aligned with the research finding that inventory existing physically does not mean that it is operationally available to affected populations.

---

# 22. DASHBOARD — SUPPLY SWAP HERO

Create a major interactive Supply Swap section.

Header:

```text
SUPPLY SWAP

Rebalance critical supplies across the relief network.
```

Stats:

```text
07
Available Matches

03
Critical

04
Offers

02
Active
```

---

# 23. SUPPLY SWAP CORE CONCEPT

Supply Swap means:

```text
Warehouse with usable surplus
            ↓
offers transferable inventory
            ↓
matching system
            ↓
warehouse/shelter with shortage
            ↓
route feasibility check
            ↓
transfer
```

The UI must visually represent this.

---

# 24. SUPPLY SWAP NETWORK VISUALIZATION

Create a node-flow visualization.

```text
                 ┌─────────────────┐
                 │ WAREHOUSE A      │
                 │ SURPLUS          │
                 │                 │
                 │ INSULIN: 60      │
                 └────────┬────────┘
                          │
                          │ 40 units
                          ↓
                  ┌───────────────┐
                  │ SUPPLY SWAP   │
                  │ MATCH         │
                  └───────┬───────┘
                          │
                          ↓
                 ┌─────────────────┐
                 │ SHELTER 06      │
                 │ SHORTAGE        │
                 │                 │
                 │ INSULIN: 10     │
                 └─────────────────┘
```

Use subtle moving dots along active transfer lines.

---

# 25. SUPPLY SWAP MATCH CARD

Every match must answer seven questions:

```text
WHO HAS IT?
WHO NEEDS IT?
WHAT ITEM?
HOW MUCH?
IS IT TRANSFERABLE?
CAN IT MOVE?
WHAT HAPPENS IF I ACCEPT?
```

Example:

```text
INSULIN × 40

FROM
Regional Warehouse A

TO
Shelter 06

CURRENT SUPPLY
60 transferable

REQUEST
40

ROUTE
△ CAUTION

ETA
38 min

MATCH
87%

[REVIEW]
```

---

# 26. MATCH SCORE

Never show:

```text
AI score: 87%
```

without explanation.

Instead:

```text
MATCH SCORE
87%

WHY?

✓ Sufficient transferable inventory
✓ Requested quantity available
✓ Destination is high priority
✓ Convoy available
△ Route currently under caution
```

The user must understand why the match exists.

---

# 27. SUPPLY SWAP DETAIL DRAWER

When clicking:

```text
Review
```

open a right-side drawer.

Do NOT navigate away.

Drawer:

```text
SUPPLY SWAP #SW-014

INSULIN × 40

SOURCE
Warehouse A

DESTINATION
Shelter 06

────────────────

Inventory

On hand       100
Reserved       40
Transferable   60

Proposed       40

After transfer

Available      20

────────────────

Route

Distance       42 km
ETA            38 min
Status         △ CAUTION

────────────────

Destination

Population     420
Current stock  10
Coverage       4 hrs

────────────────

[APPROVE TRANSFER]
[REJECT]
[VIEW ROUTE]
```

---

# 28. SUPPLY SWAP IMPACT PREVIEW

Before approval show:

```text
TRANSFER IMPACT
```

Visualize:

```text
YOUR WAREHOUSE

Before
60 transferable

        ↓ -40

After
20 transferable
```

Destination:

```text
SHELTER 06

Before
10 insulin

        ↓ +40

After
50 insulin
```

Humanitarian impact:

```text
Critical shortage
        ↓
Reduced shortage risk
```

This must be understandable without reading a paragraph.

---

# 29. SUPPLY SWAP APPROVAL

When user clicks:

```text
APPROVE TRANSFER
```

show confirmation modal.

```text
APPROVE SUPPLY TRANSFER?

You are offering:

INSULIN × 40

From:
Warehouse A

To:
Shelter 06

After approval:

Your transferable inventory:
60 → 20

Route:
△ Caution

Estimated arrival:
38 minutes

[CONFIRM TRANSFER]
[CANCEL]
```

Do not hide consequences.

---

# 30. AFTER APPROVAL

Show success:

```text
✓ TRANSFER CREATED

Supply Swap:
SW-014

Insulin × 40

Warehouse A
      ↓
Convoy 14
      ↓
Shelter 06

[TRACK CONVOY]
```

---

# 31. SUPPLY SWAP — FAILURE STATE

If inventory changes while the drawer is open:

```text
TRANSFER NO LONGER AVAILABLE

The available quantity changed.

Previous:
60 units

Current:
20 units

Requested:
40 units

[REFRESH MATCH]
```

Do not silently approve stale inventory.

---

# 32. SUPPLY SWAP — ROUTE FAILURE

If route becomes blocked:

```text
TRANSFER PAUSED

Bridge B14 has been marked unsafe.

Supply:
Insulin × 40

Destination:
Shelter 06

Current route:
⬢ BLOCKED

[VIEW ALTERNATIVE]
[PAUSE TRANSFER]
```

---

# 33. LIVE MAP PAGE

File:

```text
live-map.html
```

This should be the most visually immersive page.

The UI/UX brief already defines the live map as the primary situational screen with layered flood, debris, bridge, and convoy information.

---

# 34. MAP LAYOUT

```text
┌────────────────────────────────────────────────────────────┐
│ LIVE OPERATIONS MAP                                        │
├───────────────┬────────────────────────────────────────────┤
│ LAYERS        │                                            │
│               │                                            │
│ ☑ Flood       │                    MAP                     │
│ ☑ Debris      │                                            │
│ ☑ Bridges     │        ● Warehouse                         │
│ ☑ Convoys     │                     → Convoy               │
│ ☑ Shelters    │                          ⬢ Hazard          │
│               │                              ● Shelter      │
│ LEGEND        │                                            │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

---

# 35. MAP LAYERS

Support:

```text
Flood depth
Debris
Road status
Bridge status
Warehouses
Shelters
Convoys
Supply Swaps
```

Toggle independently.

---

# 36. MAP MARKER DESIGN

Different entity = different shape.

```text
Warehouse
■

Shelter
● / home

Convoy
→

Flood
gradient area

Hazard
△

Blocked bridge
⬢
```

The original brief explicitly requires map markers to use distinct shapes so meaning is not dependent on color alone.

---

# 37. MAP INTERACTION

Click warehouse:

```text
Warehouse A

Inventory:
2,480

Transferable:
420

Active swaps:
7

[VIEW INVENTORY]
```

Click shelter:

```text
Shelter 06

Population:
420

Critical:
Insulin

Coverage:
4 hrs

[VIEW NEED]
```

Click convoy:

```text
Convoy 14

Cargo:
Insulin ×40

Status:
△ REROUTING

ETA:
38 min

[TRACK]
```

Click hazard:

```text
Bridge B14

Status:
⬢ BLOCKED

Source:
Field report

Reported:
03:42

Confidence:
High

Affected:
2 convoys

[VIEW IMPACT]
```

---

# 38. MAP SIDE PANEL

Selecting an entity should open a right-side panel.

Do NOT navigate away.

This preserves operator context.

---

# 39. ROUTE VISUALIZATION

For rerouting:

```text
OLD ROUTE
Warehouse A ─── Bridge B14 ─── Shelter 06
                         X

NEW ROUTE
Warehouse A ───── Road R21 ───── Shelter 06
```

Use:

```text
old path = visually muted
new path = emphasized
blocked section = clear hazard indicator
```

The UI/UX brief specifically requires showing old versus new route when a convoy is rerouted so operators understand why the change occurred.

---

# 40. CONVOY DISPATCH PAGE

File:

```text
convoy-dispatch.html
```

Use a table/card hybrid.

Priority:

```text
Insulin
Blood bags
Infant nutrition
Water
General supplies
```

The original brief specifies priority sorting with insulin/blood above infant nutrition and water.

---

# 41. CONVOY CARD

```text
CONVOY 14

Cargo
Insulin ×40

FROM
Warehouse A

TO
Shelter 06

STATUS
△ REROUTING

ETA
38 min

Route
△ Caution

[VIEW]
```

---

# 42. CONVOY TIMELINE

```text
✓ Prepared
    ↓
✓ Loaded
    ↓
✓ Departed
    ↓
⬢ Route blocked
    ↓
● Rerouting
    ↓
○ Arrival
```

The current state must be visually obvious.

---

# 43. REROUTE EXPERIENCE

Click:

```text
REROUTE
```

Show:

```text
WHY?

Bridge B14
Status changed:
SAFE → BLOCKED

Current route:
No longer reliable

Alternative:
Road R21

ETA:
38 min

ETA change:
+11 min
```

Then:

```text
[ACCEPT NEW ROUTE]
[VIEW MAP]
[CANCEL]
```

---

# 44. SHELTER BOARD

File:

```text
shelter-board.html
```

The Shelter Board should answer:

> "Which shelter needs what, and how urgently?"

---

# 45. SHELTER CARD

```text
SHELTER 06
⬢ CRITICAL

Population
420

INSULIN
10 units
4 hrs remaining

BLOOD
△ Low

WATER
✓ Stable

INFANT NUTRITION
△ Low

Incoming:
Convoy 14

ETA:
38 min

[VIEW]
```

---

# 46. SHELTER SORTING

Provide:

```text
Critical first
Lowest coverage
Largest population
Nearest
Supply type
Isolation risk
```

The UI/UX brief calls for sorting/filtering by urgency, region, and supply type, with expanded shelter cards showing trends and communication status.

---

# 47. SHELTER DETAIL

Show:

```text
SHELTER 06

Population
420

Isolation risk
HIGH

Communication
Radio available

────────────────

SUPPLY COVERAGE

Insulin
4 hrs

Blood
18 hrs

Water
2.1 days

Infant Nutrition
11 hrs

────────────────

INCOMING

Convoy 14
ETA 38 min

────────────────

[VIEW SUPPLY SWAP]
[VIEW ROUTE]
```

---

# 48. HAZARD LOG

File:

```text
hazard-log.html
```

Use reverse chronological order.

Each event:

```text
03:42

BRIDGE B14

Heavy vehicle access blocked.

SOURCE:
Field Report

CONFIDENCE:
High

AFFECTED:
3 routes
2 convoys
1 transfer
```

The UI/UX brief explicitly calls for source type and confidence indicators and a verification workflow for field reports.

---

# 49. HAZARD SOURCES

Use:

```text
Sensor
Field Report
Satellite
Manual Entry
```

Example:

```text
FIELD REPORT
Confidence: Medium
```

Do not present every source as equally reliable.

---

# 50. HAZARD VERIFICATION

For unverified field report:

```text
△ UNVERIFIED

Flood depth:
Estimated 0.8–1.2m

Reported by:
Field Team 04

[VERIFY]
[REJECT]
```

After verification:

```text
✓ CONFIRMED

Map updated
Route status recalculated
Affected convoys notified
```

---

# 51. ALERTS

File:

```text
alerts.html
```

Separate:

```text
CRITICAL
ACTION REQUIRED
ADVISORY
INFORMATION
```

The original brief calls for a persistent top-of-app banner only for critical events, with acknowledgment and escalation workflows in the full alert inbox.

---

# 52. CRITICAL ALERT EXAMPLE

```text
⬢ CRITICAL

Convoy 14 stranded.

Sector 6.

Cargo:
Insulin ×40

Destination:
Shelter 06

[VIEW CONVOY]
```

Do not create critical alerts for trivial events.

---

# 53. ALERT ACKNOWLEDGEMENT

Click:

```text
ACKNOWLEDGE
```

Then:

```text
✓ Alert acknowledged

By:
Warehouse Manager

Time:
03:51
```

Keep an audit history.

---

# 54. SETTINGS

File:

```text
settings.html
```

Sections:

```text
Account
Warehouse
Notification Preferences
Map Preferences
Accessibility
Security
System
```

Keep settings simple.

---

# 55. COMPONENT SYSTEM

Create reusable components.

```text
Button
StatusBadge
KPI
Card
Drawer
Modal
Toast
Tooltip
Dropdown
Tabs
Filter
Search
Table
Timeline
ProgressBar
MapMarker
MapPopup
AlertCard
InventoryCard
SupplySwapCard
ConvoyCard
ShelterCard
HazardCard
```

Do not create one-off components for every page.

---

# 56. COMPONENT STATES

Every interactive component must support:

```text
DEFAULT
HOVER
FOCUS
ACTIVE
DISABLED
LOADING
SUCCESS
ERROR
```

The original UI/UX specification requires multiple operational states, including Default, Hover/Focus, Warning, Critical, and Disabled where applicable.

---

# 57. STATUS SYSTEM

Use:

```text
✓ SAFE

△ CAUTION

⬢ BLOCKED

● LIVE

◌ SYNCING

○ OFFLINE
```

Always:

```text
icon + label
```

Never:

```text
red = dangerous
green = safe
```

without text.

---

# 58. BUTTON SYSTEM

Primary:

```text
[APPROVE TRANSFER]
```

Secondary:

```text
[VIEW DETAILS]
```

Critical:

```text
[MARK ROUTE UNSAFE]
```

Disabled:

```text
[APPROVE TRANSFER]
```

with explanation:

```text
Insufficient transferable inventory
```

---

# 59. DRAWER SYSTEM

Drawers are critical to this application.

Use drawers for:

```text
Warehouse
Inventory
Shelter
Convoy
Hazard
Supply Swap
Alert
```

The drawer should open from the right.

Background remains visible.

This maintains spatial context.

---

# 60. MODAL RULE

Use modals only when:

```text
The user must confirm a consequential action.
```

Examples:

```text
Approve transfer
Reject transfer
Mark route unsafe
Cancel convoy
Escalate critical alert
```

Do not use modals for ordinary information.

---

# 61. TOAST SYSTEM

Success:

```text
✓ Supply Swap created
```

Warning:

```text
△ Route information changed
```

Error:

```text
Unable to approve transfer
```

Information:

```text
Convoy 14 updated
```

Toast should not hide critical information.

---

# 62. LOADING STATES

Never show a blank screen.

For Supply Swap:

```text
Finding transferable inventory...
Checking destination demand...
Checking route conditions...
Checking convoy availability...
Calculating match...
```

For map:

```text
Loading operational layers...
Loading hazards...
Loading convoy positions...
```

For inventory:

```text
Loading warehouse inventory...
```

---

# 63. EMPTY STATES

Example:

```text
NO SUPPLY SWAP OPPORTUNITIES

Your current transferable inventory
does not match an active request.

[VIEW INVENTORY]
```

Not:

```text
No data.
```

---

# 64. ERROR STATES

Every error must answer:

```text
WHAT FAILED?
WHY?
WHAT SHOULD I DO?
```

Example:

```text
TRANSFER CANNOT BE APPROVED

The inventory changed while you
were reviewing the request.

Available:
20

Requested:
40

[REFRESH MATCH]
```

---

# 65. OFFLINE MODE

If connection fails:

```text
○ OFFLINE

Last synchronized:
2 minutes ago
```

Do not pretend that information is live.

Show:

```text
Some operational data may be outdated.
```

Disable dangerous actions when the system cannot safely validate current state.

---

# 66. REAL-TIME UPDATE BEHAVIOR

When new information arrives:

Do NOT refresh the whole page.

Update only affected components.

Example:

```text
Bridge B14
SAFE
```

becomes:

```text
⬢ BLOCKED
```

Then:

```text
Convoy 14
ON ROUTE
```

becomes:

```text
△ REROUTING
```

Then:

```text
Supply Swap SW-014
ACTIVE
```

becomes:

```text
PAUSED
```

The interface should visually communicate this chain.

---

# 67. MICRO-INTERACTIONS

Use subtle motion.

Examples:

Supply count:

```text
60 → 40
```

animate the number.

Map marker:

```text
selected → subtle pulse
```

Drawer:

```text
slide in
```

Toast:

```text
fade + slide
```

Transfer line:

```text
small moving indicator
```

Do not use excessive animation.

---

# 68. ANIMATION RULE

Normal interaction:

```text
150–250ms
```

Complex transition:

```text
250–350ms
```

Never use long dramatic animations for operational actions.

---

# 69. INFORMATION DENSITY

The Warehouse Manager is an operational user.

Do not make every card oversized.

Use:

```text
compact
scannable
structured
high-information
```

The UI should allow many relevant signals to be visible simultaneously.

---

# 70. RESPONSIVE DESIGN

Desktop:

```text
Full sidebar
Large map
Multi-column dashboard
```

Tablet:

```text
Collapsed sidebar
Two-column layout
```

Mobile:

```text
Bottom navigation
Stacked cards
Full-width actions
```

Critical action buttons must remain reachable.

---

# 71. MOBILE NAVIGATION

Use:

```text
Home
Map
Swap
Dispatch
More
```

---

# 72. ACCESSIBILITY

Implement:

```text
Keyboard navigation
Focus indicators
Semantic HTML
ARIA labels
Accessible drawers
Accessible dialogs
Accessible map controls
Screen-reader-friendly status
```

Touch targets should be sufficiently large.

Do not rely on color alone.

---

# 73. DATA VISUALIZATION PRINCIPLE

Never create charts merely to make the dashboard look sophisticated.

Every chart must answer a question.

Examples:

```text
How much inventory is available?

How long will it last?

Which supply is becoming critical?

Which warehouse has transferable inventory?

Which shelter is approaching shortage?

How has supply coverage changed?
```

---

# 74. SUPPLY COVERAGE VISUALIZATION

Use:

```text
INSULIN

Current:
4 hrs

Incoming:
38 min

Projected:
> 1 day
```

Visual:

```text
NOW
│
├──── shortage risk
│
├──── convoy arrival
│
└──────── projected coverage
```

This is more meaningful than a decorative pie chart.

---

# 75. NETWORK THINKING

The application must not treat objects independently.

Example:

If:

```text
Bridge B14
```

changes to:

```text
BLOCKED
```

the frontend should allow the user to discover:

```text
Affected route
↓
Affected convoy
↓
Affected supply
↓
Affected shelter
↓
Potential Supply Swap impact
```

This is the core value of the application.

---

# 76. CRITICAL USER JOURNEY

Implement this complete scenario:

```text
Warehouse Manager opens dashboard
        ↓
Sees critical insulin request
        ↓
Clicks Supply Swap
        ↓
Sees Warehouse A has transferable insulin
        ↓
Reviews destination
        ↓
Checks route
        ↓
Sees route is caution
        ↓
Checks convoy availability
        ↓
Reviews transfer impact
        ↓
Approves transfer
        ↓
Convoy created
        ↓
Live map tracks convoy
        ↓
Bridge hazard appears
        ↓
Route changes
        ↓
Convoy reroutes
        ↓
Shelter receives supply
        ↓
Transfer becomes delivered
```

Every stage should have visual feedback.

---

# 77. SECOND USER JOURNEY — ROUTE FAILURE

```text
Warehouse Manager
        ↓
Supply Swap active
        ↓
Bridge becomes blocked
        ↓
Hazard Log receives event
        ↓
Map updates
        ↓
Convoy status changes
        ↓
Supply Swap risk changes
        ↓
Manager receives alert
        ↓
Manager views alternative route
        ↓
Manager approves reroute
        ↓
Convoy continues
```

---

# 78. THIRD USER JOURNEY — INVENTORY CHANGE

```text
Manager reviews 40 insulin units
        ↓
Another transfer consumes 30
        ↓
Transferable inventory becomes 10
        ↓
Current request = 40
        ↓
System prevents stale approval
        ↓
Drawer displays conflict
        ↓
Manager refreshes matching
        ↓
New recommendation appears
```

---

# 79. FOURTH USER JOURNEY — SHELTER PRIORITY

```text
Shelter 06
        ↓
4 hours insulin remaining
        ↓
Population 420
        ↓
No incoming confirmed supply
        ↓
Priority increases
        ↓
Dashboard surfaces shelter
        ↓
Supply Swap finds matching warehouse
        ↓
Manager reviews transfer
```

---

# 80. DESIGN THE SYSTEM AS A NETWORK

Every important object should have relationships.

```text
Warehouse
 ├── Inventory
 ├── Supply Offers
 ├── Active Transfers
 └── Convoys

Supply Swap
 ├── Source
 ├── Destination
 ├── Item
 ├── Quantity
 ├── Route
 └── Convoy

Convoy
 ├── Cargo
 ├── Origin
 ├── Destination
 ├── Route
 └── Hazards

Shelter
 ├── Population
 ├── Demand
 ├── Inventory
 ├── Incoming Convoys
 └── Risk
```

---

# 81. DESIGN FOR UNCERTAINTY

Do not show false precision.

Instead of:

```text
ETA: 37 minutes
```

when route confidence is poor:

```text
ETA:
35–50 min

Confidence:
Medium
```

Instead of:

```text
Flood depth: 1.2m
```

show:

```text
Estimated flood depth:
1.0–1.4m

Source:
Field report

Confidence:
Medium
```

---

# 82. SOURCE + TIME + CONFIDENCE

Every dynamic operational fact should be able to expose:

```text
SOURCE
TIME
CONFIDENCE
```

Example:

```text
ROAD R17

Status:
△ CAUTION

Source:
Field Team 04

Reported:
03:42

Confidence:
Medium
```

---

# 83. HUMANITARIAN SUCCESS ≠ TRANSPORT SUCCESS

Do not design the dashboard around:

```text
Delivered = Success
```

A delivery can technically arrive but still fail humanitarian objectives.

The research explicitly distinguishes successful transportation from successful relief and notes cases where supplies may be wrong, damaged, contaminated, inaccessible, or no longer needed.

Therefore show:

```text
Delivery status
+
Supply adequacy
+
Destination need
+
Operational accessibility
```

---

# 84. "TIME TO HARM" UX

For critical supplies display:

```text
TIME TO SHORTAGE

4h 12m
```

For insulin:

```text
Criticality:
Very High

Remaining:
4h

Incoming:
38m
```

For water:

```text
Remaining:
2.1 days
```

This makes different delays understandable.

---

# 85. SUPPLY SWAP DECISION PANEL

The most important decision interface should visually combine:

```text
SUPPLY
+
NEED
+
ROUTE
+
TIME
+
IMPACT
```

Example:

```text
┌────────────────────────────────────────────┐
│ SHOULD I SEND THIS SUPPLY?                 │
├────────────────────────────────────────────┤
│                                            │
│ INSULIN ×40                                │
│                                            │
│ SOURCE                                     │
│ Warehouse A                                │
│                                            │
│ DESTINATION                                │
│ Shelter 06                                 │
│                                            │
│ NEED                                       │
│ ⬢ 4 hours remaining                        │
│                                            │
│ ROUTE                                      │
│ △ Medium confidence                        │
│                                            │
│ ETA                                        │
│ 35–50 min                                  │
│                                            │
│ YOUR INVENTORY AFTER TRANSFER              │
│ 60 → 20                                    │
│                                            │
│ HUMANITARIAN IMPACT                        │
│ Critical shortage significantly reduced    │
│                                            │
│ [APPROVE]                 [REVIEW ROUTE]   │
└────────────────────────────────────────────┘
```

This is the core decision interface.

---

# 86. DESIGN SYSTEM RULE

Do not create different visual languages for:

```text
Dashboard
Map
Supply Swap
Dispatch
Shelters
Hazards
Alerts
```

They must feel like one application.

---

# 87. COMPONENT REUSE

For example:

```text
StatusBadge
```

must be reused everywhere.

```text
SupplySwapCard
```

must appear consistently in:

```text
Dashboard
Supply Swap
Shelter Detail
Inventory
```

---

# 88. FRONTEND CODE QUALITY

Use:

```text
semantic HTML
modular CSS
reusable JS
event delegation where appropriate
clean state management
centralized UI utilities
```

Avoid:

```text
massive inline JavaScript
duplicate HTML logic
duplicated CSS
hardcoded repeated values
```

---

# 89. DATA CONTRACT EXPECTATION

The frontend should expect structured objects such as:

```text
warehouse
inventory
shelter
convoy
hazard
route
supplySwap
alert
```

Example Supply Swap object conceptually:

```text
{
  id,
  item,
  quantity,
  sourceWarehouse,
  destination,
  urgency,
  routeStatus,
  eta,
  confidence,
  matchScore,
  reasons,
  impact
}
```

Do not hardcode these as permanent values.

Use mock data only as a temporary development layer.

---

# 90. MOCK DATA RULE

If backend APIs are unavailable:

Create a clearly isolated mock-data layer.

Example:

```text
js/mock/
```

Do not mix mock data directly throughout page JavaScript.

The UI must later be replaceable with API responses.

---

# 91. FRONTEND ERROR HANDLING

Every API request should handle:

```text
loading
success
empty
error
timeout
offline
stale data
```

---

# 92. SECURITY UX

Do not expose:

```text
API keys
JWT secrets
internal prompts
backend credentials
```

Frontend should never determine whether a user is authorized to perform a critical operation.

The backend must validate permissions.

---

# 93. ACCESSIBILITY + EMERGENCY UX

Critical information must remain understandable under:

```text
stress
low attention
poor lighting
small screen
keyboard-only use
color-vision differences
```

Therefore:

```text
icon
+
label
+
position
+
clear wording
```

must reinforce each other.

---

# 94. FINAL PAGE CHECKLIST

## Dashboard

Must answer:

> What needs my attention?

## Live Map

Must answer:

> What is happening geographically?

## Inventory

Must answer:

> What can I actually release?

## Supply Swap

Must answer:

> Where can my inventory create the greatest useful impact?

## Convoy Dispatch

Must answer:

> What is moving and is it still safe?

## Shelter Board

Must answer:

> Who is approaching shortage?

## Hazard Log

Must answer:

> What changed and how reliable is that information?

## Alerts

Must answer:

> What requires action now?

## Settings

Must answer:

> How is my operational environment configured?

---

# 95. FINAL ACCEPTANCE TEST

Do not consider the frontend complete until the following works:

### Test 1

```text
Open Dashboard
↓
Identify critical shortage
↓
Open Supply Swap
```

### Test 2

```text
Select matching warehouse
↓
Review inventory
↓
Review route
↓
Review destination
```

### Test 3

```text
Approve transfer
↓
Inventory updates
↓
Transfer created
↓
Convoy appears
```

### Test 4

```text
Hazard appears
↓
Route changes
↓
Convoy status changes
↓
Alert appears
```

### Test 5

```text
User opens shelter
↓
Sees shortage
↓
Sees incoming convoy
↓
Tracks route
```

### Test 6

```text
Inventory changes while
transfer drawer is open
↓
Stale approval prevented
```

### Test 7

```text
Connection lost
↓
LIVE changes to OFFLINE
↓
Stale-data warning shown
↓
Unsafe action disabled where necessary
```

---

# 96. FINAL VISUAL TARGET

The application should feel like:

```text
                 HUMANITARIAN
                OPERATIONS HUB
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      INVENTORY      DEMAND       HAZARDS
          │            │            │
          └────────────┼────────────┘
                       ↓
                  SUPPLY SWAP
                       │
                       ↓
                    CONVOY
                       │
                       ↓
                    ROUTE
                       │
                       ↓
                    SHELTER
                       │
                       ↓
                HUMANITARIAN
                   IMPACT
```

The visual design must communicate this continuously.

---

# 97. MOST IMPORTANT RULE

Do not build:

> "A dashboard with many cards."

Build:

> **"A decision-support interface that helps a Warehouse Manager understand how inventory, demand, routes, hazards, and convoys interact during a rapidly changing disaster."**

The interface should make the invisible relationships visible.

---

# 98. FINAL DEVELOPMENT INSTRUCTION

Implement this in phases.

## PHASE 1 — FOUNDATION

Build:

```text
tokens.css
base.css
components.css
global shell
sidebar
topbar
buttons
cards
badges
drawers
modals
toasts
```

Test responsive behavior.

---

## PHASE 2 — DASHBOARD

Build:

```text
KPI system
priority actions
inventory health
Supply Swap opportunities
network status
mini map
```

---

## PHASE 3 — SUPPLY SWAP

Build:

```text
matching
opportunity cards
match explanation
impact preview
approval workflow
success state
failure state
stale inventory handling
```

---

## PHASE 4 — LIVE MAP

Build:

```text
layers
markers
popovers
side panel
route visualization
hazards
convoys
Supply Swap relationships
```

---

## PHASE 5 — CONVOY

Build:

```text
dispatch
tracking
timeline
rerouting
route comparison
status changes
```

---

## PHASE 6 — SHELTERS

Build:

```text
demand board
priority
supply coverage
incoming convoy
isolation risk
historical trend
```

---

## PHASE 7 — HAZARDS

Build:

```text
incident timeline
source
confidence
verification
map integration
impact relationships
```

---

## PHASE 8 — ALERTS

Build:

```text
critical banner
alert inbox
acknowledgment
escalation
```

---

## PHASE 9 — POLISH

Implement:

```text
micro-interactions
loading states
empty states
error states
success states
offline states
keyboard navigation
accessibility
responsive design
performance optimization
```

---

# 99. AFTER EACH PHASE

The agent MUST:

```text
1. Run the frontend.
2. Inspect every modified page.
3. Test all interactions.
4. Test responsive layout.
5. Check browser console.
6. Check broken links.
7. Check JavaScript errors.
8. Check CSS overflow.
9. Check accessibility.
10. Fix errors before moving to the next phase.
```

Do NOT implement all phases blindly in one giant modification.

---

# 100. FINAL QUALITY STANDARD

Before completion ask:

```text
Can a Warehouse Manager understand the current situation
within 5–10 seconds?

Can they identify the most critical shortage?

Can they see whether they have transferable inventory?

Can they understand why a Supply Swap was recommended?

Can they understand the route risk?

Can they see what happens to their warehouse inventory
after approving a transfer?

Can they see how a hazard affects a convoy?

Can they understand whether operational information is current
and how confident the system is?

Can they recover when information becomes stale?

Can they make a critical decision without leaving context?
```

If the answer to any is NO:

> redesign that interaction before considering the frontend complete.

---

# FINAL PRODUCT PRINCIPLE

The product is NOT:

```text
Warehouse Management Software
```

and it is NOT:

```text
GPS Navigation Software
```

It is:

# A HUMANITARIAN DECISION INTELLIGENCE INTERFACE

The Warehouse Manager should feel that the application is continuously answering:

```text
"What do I have?"

"What can I safely release?"

"Who needs it most?"

"Can it reach them?"

"What changed?"

"What happens if I act?"

"What should I do next?"
```

The ultimate UX loop is:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
MATCH
   ↓
SIMULATE IMPACT
   ↓
DECIDE
   ↓
DISPATCH
   ↓
MONITOR
   ↓
ADAPT
```

Build the frontend around this loop.