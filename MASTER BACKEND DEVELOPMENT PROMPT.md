# MASTER BACKEND DEVELOPMENT PROMPT
# RELIEF ROUTE INTELLIGENCE PLATFORM
## WAREHOUSE MANAGER + SUPPLY SWAP BACKEND

---

# 0. ROLE

Act as a **Principal Backend Architect, Senior Node.js Engineer, NestJS Expert, PostgreSQL/PostGIS Engineer, Distributed Systems Engineer, GIS Backend Developer, API Architect, Security Engineer, and Humanitarian Logistics Systems Engineer**.

You are responsible for designing and implementing the complete backend for the frontend specification provided with this prompt.

The frontend is the primary consumer of this backend.

The backend MUST NOT be designed independently from the frontend.

Your job is to create the complete operational data and API layer required for:

```text
Warehouse
Inventory
Supply Swap
Shelter Demand
Convoy
Route
Hazard
Alert
Real-time Operations
Authentication
Audit Trail
```

---

# 1. IMPORTANT FRONTEND REFERENCE

The frontend architecture is:

```text
frontend/
├── login.html
├── dashboard.html
├── live-map.html
├── convoy-dispatch.html
├── shelter-board.html
├── hazard-log.html
├── alerts.html
├── settings.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   └── components.css
└── js/pages/
    ├── liveMap.js
    ├── convoyDispatch.js
    ├── shelterBoard.js
    ├── hazardLog.js
    ├── alerts.js
    └── settings.js
```

The backend must expose APIs that directly support these screens.

The most important frontend workflows are:

```text
Dashboard
    ↓
Critical shortage
    ↓
Supply Swap
    ↓
Inventory validation
    ↓
Route validation
    ↓
Impact preview
    ↓
Approval
    ↓
Convoy creation
    ↓
Live tracking
    ↓
Hazard update
    ↓
Rerouting
    ↓
Shelter delivery
```

---

# 2. RECOMMENDED TECHNOLOGY STACK

Use this architecture unless there is a strong technical reason not to.

## Core Backend

```text
Node.js
TypeScript
NestJS
```

Do NOT build the entire backend using raw Express unless absolutely necessary.

NestJS should be used because the application contains multiple bounded domains:

```text
Auth
Warehouses
Inventory
Supply Swap
Shelters
Convoys
Routes
Hazards
Alerts
Users
Audit
```

---

# 3. DATABASE

Use:

```text
PostgreSQL
```

with:

```text
PostGIS
```

PostGIS is important because this is not merely an inventory application.

The backend needs geographic operations such as:

```text
warehouse → shelter distance
convoy → hazard intersection
route → flood zone intersection
route → blocked bridge
shelter → nearest warehouse
warehouse → nearest transferable supply
```

Do NOT store all geographic information as plain strings.

Use proper:

```text
geometry
geography
POINT
LINESTRING
POLYGON
```

where appropriate.

---

# 4. REDIS

Use:

```text
Redis
```

for:

```text
API caching
real-time state
short-lived locks
rate limiting
background job coordination
event processing
temporary route calculations
```

Redis must NOT become the primary database.

PostgreSQL remains the source of truth.

---

# 5. REAL-TIME COMMUNICATION

Use:

```text
WebSocket
```

Prefer:

```text
Socket.IO
```

or NestJS WebSocket Gateway.

The frontend should receive events such as:

```text
hazard.created
hazard.updated

route.status_changed

convoy.created
convoy.updated
convoy.rerouted

inventory.updated

supply_swap.created
supply_swap.updated
supply_swap.approved
supply_swap.paused

shelter.demand_changed

alert.created
alert.acknowledged

system.sync_status_changed
```

Do NOT require the frontend to continuously refresh the page.

---

# 6. OPTIONAL PYTHON SERVICE

Python should NOT be the primary backend for the operational CRUD system.

Use Python later if the project requires:

```text
ML
AI
optimization
route-risk prediction
flood prediction
debris prediction
demand forecasting
ETA prediction
anomaly detection
```

Recommended architecture:

```text
                 ┌─────────────────────┐
                 │     FRONTEND        │
                 └──────────┬──────────┘
                            │
                         REST/WS
                            │
                 ┌──────────▼──────────┐
                 │    NESTJS API       │
                 │    NODE + TS        │
                 └──────────┬──────────┘
                            │
            ┌───────────────┼────────────────┐
            ↓               ↓                ↓
      PostgreSQL         Redis          External APIs
       + PostGIS
                            │
                            ↓
                    ┌──────────────┐
                    │ Python AI/ML │
                    │   Optional   │
                    └──────────────┘
```

Do NOT introduce Python unless an actual ML/optimization requirement exists.

---

# 7. BACKEND ARCHITECTURE

Use modular architecture.

```text
backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── auth/
│   ├── users/
│   ├── warehouses/
│   ├── inventory/
│   ├── supply-swap/
│   ├── shelters/
│   ├── convoys/
│   ├── routes/
│   ├── hazards/
│   ├── alerts/
│   ├── dashboard/
│   ├── realtime/
│   ├── audit/
│   ├── health/
│   ├── integrations/
│   ├── common/
│   └── database/
│
├── test/
│
├── prisma/
│
├── docker/
│
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

You may use:

```text
Prisma
```

or:

```text
TypeORM
```

Prefer Prisma for developer productivity unless advanced PostGIS requirements make another approach more appropriate.

For complex PostGIS queries, use parameterized raw SQL through the ORM safely.

---

# 8. DOMAIN MODEL

The backend must model these primary entities:

```text
User
Role
Warehouse
InventoryItem
InventoryTransaction
SupplyRequest
SupplyOffer
SupplySwap
Shelter
ShelterDemand
Convoy
ConvoyCargo
Route
RouteSegment
Hazard
HazardSource
Alert
AuditLog
```

Optional:

```text
Vehicle
Driver
WarehouseTransfer
ExternalDataSource
NotificationPreference
SystemEvent
```

---

# 9. USERS

Table:

```text
users
```

Fields:

```text
id
name
email
phone
password_hash
role_id
warehouse_id
is_active
last_login_at
created_at
updated_at
```

Never store plaintext passwords.

---

# 10. ROLES

Initially support:

```text
WAREHOUSE_MANAGER
ADMIN
OPERATOR
VIEWER
```

The main frontend persona is:

```text
WAREHOUSE_MANAGER
```

Future roles should be possible without redesigning authentication.

---

# 11. ROLE PERMISSIONS

Warehouse Manager can:

```text
view own warehouse
view network
view inventory
create supply offers
review supply requests
review Supply Swaps
approve eligible transfers
view shelters
view hazards
view convoys
acknowledge alerts
request rerouting
view audit history
```

Do NOT allow frontend-only authorization.

Backend must validate every protected operation.

---

# 12. AUTHENTICATION

Implement:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Use:

```text
JWT access token
refresh token
```

Use secure password hashing:

```text
Argon2
```

or bcrypt.

Prefer Argon2.

---

# 13. LOGIN RESPONSE

Return:

```json
{
  "user": {
    "id": "...",
    "name": "...",
    "role": "WAREHOUSE_MANAGER",
    "warehouseId": "..."
  },
  "accessToken": "...",
  "expiresIn": 900
}
```

Do not expose password hashes.

---

# 14. WAREHOUSE

Table:

```text
warehouses
```

Fields:

```text
id
code
name
description
location
latitude
longitude
capacity
status
operational_status
contact_name
contact_phone
created_at
updated_at
```

Statuses:

```text
FUNCTIONAL
LIMITED
DAMAGED
OFFLINE
```

---

# 15. INVENTORY

Do NOT model inventory simply as:

```text
item
quantity
```

The system must distinguish:

```text
physical quantity
reserved quantity
transferable quantity
at-risk quantity
```

Table:

```text
inventory_items
```

Fields:

```text
id
warehouse_id
supply_type
sku
name
unit
quantity_on_hand
quantity_reserved
quantity_transferable
quantity_at_risk
minimum_stock
critical_stock
expiry_date
batch_number
condition
status
created_at
updated_at
```

---

# 16. INVENTORY TYPES

Initial categories:

```text
INSULIN
BLOOD_BAGS
INFANT_NUTRITION
POTABLE_WATER
```

Allow future types.

Do NOT hardcode only four supply types into database architecture.

---

# 17. INVENTORY RULE

Backend invariant:

```text
quantity_transferable
<=
quantity_on_hand - quantity_reserved
```

Never allow:

```text
quantity_transferable > physically available
```

Validate this server-side.

---

# 18. INVENTORY TRANSACTIONS

Every inventory change must be auditable.

Table:

```text
inventory_transactions
```

Types:

```text
RECEIPT
RESERVATION
RELEASE
TRANSFER_OUT
TRANSFER_IN
DAMAGE
EXPIRY
ADJUSTMENT
DELIVERY
```

Fields:

```text
id
inventory_item_id
transaction_type
quantity
reference_type
reference_id
performed_by
created_at
```

Never silently modify inventory.

Important changes should create transactions.

---

# 19. INVENTORY API

Implement:

```text
GET /api/v1/inventory
GET /api/v1/inventory/:id
GET /api/v1/warehouses/:warehouseId/inventory

POST /api/v1/inventory
PATCH /api/v1/inventory/:id

GET /api/v1/inventory/:id/transactions
```

Filtering:

```text
supplyType
status
critical
transferable
warehouse
```

---

# 20. INVENTORY DASHBOARD RESPONSE

The dashboard needs:

```text
physical
operational
reserved
transferable
atRisk
coverage
```

Example:

```json
{
  "supplyType": "INSULIN",
  "onHand": 100,
  "reserved": 40,
  "transferable": 60,
  "atRisk": 0,
  "coverageHours": 18,
  "status": "HEALTHY"
}
```

---

# 21. SUPPLY REQUEST

A shelter or operational location can request supplies.

Table:

```text
supply_requests
```

Fields:

```text
id
shelter_id
supply_type
quantity_requested
quantity_fulfilled
priority
time_to_shortage_hours
status
created_at
updated_at
```

Statuses:

```text
OPEN
PARTIALLY_FULFILLED
FULFILLED
CANCELLED
EXPIRED
```

---

# 22. PRIORITY

Support:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

But internally preserve numeric urgency if useful:

```text
priority_score
```

---

# 23. TIME-TO-HARM

Critical requests should expose:

```text
time_to_shortage
```

The backend should calculate:

```text
remaining coverage
```

from current stock and consumption rate where data exists.

Do not rely only on a manually entered priority.

---

# 24. SHELTER DEMAND

Table:

```text
shelter_demands
```

Fields:

```text
id
shelter_id
supply_type
current_quantity
required_quantity
consumption_rate
coverage_hours
priority
last_updated_at
```

The frontend requires shelter cards showing current supply coverage.

---

# 25. SHELTER API

Implement:

```text
GET /api/v1/shelters
GET /api/v1/shelters/:id
GET /api/v1/shelters/:id/demand
GET /api/v1/shelters/:id/incoming
GET /api/v1/shelters/:id/history
```

Filters:

```text
priority
region
supplyType
isolationRisk
```

---

# 26. SUPPLY OFFER

A Warehouse Manager can offer transferable inventory.

Table:

```text
supply_offers
```

Fields:

```text
id
warehouse_id
inventory_item_id
supply_type
quantity
available_from
expires_at
status
created_by
created_at
updated_at
```

Statuses:

```text
AVAILABLE
RESERVED
MATCHED
TRANSFERRED
CANCELLED
EXPIRED
```

---

# 27. SUPPLY SWAP

Supply Swap is a first-class domain.

Table:

```text
supply_swaps
```

Fields:

```text
id
offer_id
request_id
source_warehouse_id
destination_shelter_id
supply_type
quantity
match_score
urgency_score
route_score
inventory_score
confidence_score
status
route_id
convoy_id
created_at
updated_at
approved_at
approved_by
```

Statuses:

```text
PROPOSED
UNDER_REVIEW
APPROVED
REJECTED
RESERVED
ACTIVE
PAUSED
REROUTING
DELIVERED
CANCELLED
FAILED
```

---

# 28. SUPPLY SWAP MATCHING ENGINE

The backend must provide a matching endpoint:

```text
GET /api/v1/supply-swaps/opportunities
```

and optionally:

```text
POST /api/v1/supply-swaps/match
```

The matching engine should evaluate:

```text
inventory availability
+
destination demand
+
urgency
+
distance
+
route feasibility
+
route confidence
+
warehouse reserve requirements
+
estimated arrival
+
risk
```

Do NOT simply match:

```text
same supply type
```

---

# 29. MATCH SCORE

Create explainable scoring.

Example:

```text
matchScore =
    inventoryScore * 0.25
  + urgencyScore * 0.25
  + routeScore * 0.20
  + proximityScore * 0.10
  + confidenceScore * 0.10
  + impactScore * 0.10
```

These weights must be configurable.

Do not hide them in random frontend JavaScript.

---

# 30. EXPLAINABLE MATCHING

Every match must return:

```json
{
  "matchScore": 87,
  "reasons": [
    "Sufficient transferable inventory",
    "Destination has critical shortage",
    "Available convoy capacity",
    "Route currently passable"
  ],
  "warnings": [
    "Route confidence is medium"
  ]
}
```

The frontend specifically requires the user to understand why a Supply Swap was recommended.

---

# 31. SUPPLY SWAP OPPORTUNITY API

Endpoint:

```text
GET /api/v1/supply-swaps/opportunities
```

Response should support:

```text
critical
high
available
source
destination
item
quantity
route
ETA
confidence
matchScore
reasons
```

---

# 32. SUPPLY SWAP DETAIL

Implement:

```text
GET /api/v1/supply-swaps/:id
```

Return:

```text
source warehouse
destination shelter
inventory before
requested quantity
transfer quantity
inventory after
route
ETA
risk
confidence
match explanation
humanitarian impact
```

---

# 33. IMPACT PREVIEW

Before approval:

```text
POST /api/v1/supply-swaps/:id/impact-preview
```

Return:

```json
{
  "sourceBefore": 60,
  "sourceAfter": 20,
  "destinationBefore": 10,
  "destinationAfter": 50,
  "coverageBeforeHours": 4,
  "coverageAfterHours": 18,
  "riskReduction": "HIGH"
}
```

This endpoint must NOT mutate inventory.

---

# 34. APPROVAL

Endpoint:

```text
POST /api/v1/supply-swaps/:id/approve
```

This is a transactional operation.

Use a database transaction.

Within one transaction:

```text
validate user permission
validate Supply Swap status
lock inventory row
recalculate transferable inventory
validate request still active
validate quantity
reserve inventory
create transfer state
create audit log
create event
```

Do NOT trust the values sent by frontend.

---

# 35. CONCURRENCY CONTROL

This is critical.

Two Warehouse Managers must not be able to reserve the same inventory.

Use:

```text
database transactions
row-level locks
optimistic versioning
```

For example:

```text
SELECT ... FOR UPDATE
```

where appropriate.

---

# 36. STALE DATA PROTECTION

If frontend displays:

```text
60 transferable units
```

but backend now has:

```text
20
```

approval must fail safely.

Return:

```json
{
  "error": "INVENTORY_CHANGED",
  "message": "Transfer can no longer be approved.",
  "currentQuantity": 20,
  "requestedQuantity": 40
}
```

The frontend can then show:

```text
TRANSFER NO LONGER AVAILABLE
```

---

# 37. ROUTE DOMAIN

Tables:

```text
routes
route_segments
```

A route contains:

```text
id
origin
destination
geometry
distance
estimated_duration
status
confidence
calculated_at
```

Statuses:

```text
OPEN
CAUTION
RESTRICTED
BLOCKED
UNKNOWN
```

---

# 38. ROUTE SEGMENTS

A route can contain multiple segments.

```text
Warehouse
 ↓
Road R17
 ↓
Bridge B14
 ↓
Road R21
 ↓
Shelter
```

Each segment can independently become:

```text
SAFE
CAUTION
BLOCKED
```

---

# 39. HAZARD DOMAIN

Table:

```text
hazards
```

Fields:

```text
id
type
severity
geometry
location_name
description
source_id
status
confidence
reported_at
verified_at
verified_by
expires_at
created_at
updated_at
```

Hazard types:

```text
FLOOD
DEBRIS_FLOW
BRIDGE_DAMAGE
ROAD_DAMAGE
LANDSLIDE
SUBMERGED_INTERSECTION
WEATHER
OTHER
```

---

# 40. HAZARD SOURCES

Table:

```text
hazard_sources
```

Types:

```text
SENSOR
FIELD_REPORT
SATELLITE
MANUAL_ENTRY
EXTERNAL_API
```

Fields:

```text
id
type
name
reliability_score
created_at
```

---

# 41. HAZARD CONFIDENCE

Use:

```text
LOW
MEDIUM
HIGH
VERIFIED
```

Do not represent confidence only as a color.

Return:

```json
{
  "confidence": "MEDIUM",
  "source": "FIELD_REPORT",
  "reportedAt": "..."
}
```

---

# 42. HAZARD API

Implement:

```text
GET /api/v1/hazards
GET /api/v1/hazards/:id

POST /api/v1/hazards
PATCH /api/v1/hazards/:id

POST /api/v1/hazards/:id/verify
POST /api/v1/hazards/:id/reject
```

Filters:

```text
type
severity
confidence
status
time range
bounding box
```

---

# 43. GEOSPATIAL HAZARD IMPACT

When a hazard is created or verified:

Find:

```text
affected routes
affected route segments
affected convoys
affected shelters
affected Supply Swaps
```

Use PostGIS.

Example conceptual query:

```text
hazard geometry
INTERSECTS
route segment geometry
```

Do NOT calculate this only in frontend JavaScript.

---

# 44. ROUTE STATUS RECALCULATION

If:

```text
Bridge B14
```

becomes:

```text
BLOCKED
```

the backend must identify routes using that bridge.

Then:

```text
route status → BLOCKED
```

or:

```text
route status → RESTRICTED
```

depending on business rules.

Then identify:

```text
affected convoys
affected transfers
```

---

# 45. CONVOY DOMAIN

Tables:

```text
convoys
convoy_cargo
```

Fields:

```text
id
code
origin_warehouse_id
destination_shelter_id
route_id
status
vehicle_id
driver_name
started_at
estimated_arrival
actual_arrival
last_location
created_at
updated_at
```

Statuses:

```text
PLANNED
PREPARING
LOADED
DEPARTED
ON_ROUTE
CAUTION
REROUTING
PAUSED
ARRIVED
DELIVERED
CANCELLED
STRANDED
```

---

# 46. CONVOY CARGO

Each convoy can contain multiple supplies.

```text
convoy_cargo
```

Fields:

```text
id
convoy_id
supply_type
quantity
inventory_transaction_id
```

---

# 47. CONVOY API

Implement:

```text
GET /api/v1/convoys
GET /api/v1/convoys/:id

POST /api/v1/convoys
PATCH /api/v1/convoys/:id

POST /api/v1/convoys/:id/depart
POST /api/v1/convoys/:id/pause
POST /api/v1/convoys/:id/reroute
POST /api/v1/convoys/:id/cancel
POST /api/v1/convoys/:id/arrive
POST /api/v1/convoys/:id/deliver
```

---

# 48. CONVOY CREATION FROM SUPPLY SWAP

When an approved Supply Swap requires transport:

```text
Supply Swap
      ↓
Transfer reservation
      ↓
Convoy creation
      ↓
Cargo assignment
      ↓
Route assignment
      ↓
Convoy ACTIVE
```

The backend should maintain references:

```text
supplySwap.convoyId
convoy.supplySwapId
```

where appropriate.

---

# 49. CONVOY LOCATION

Support:

```text
POST /api/v1/convoys/:id/location
```

Payload:

```json
{
  "latitude": 26.1445,
  "longitude": 91.7362,
  "timestamp": "..."
}
```

Validate:

```text
authentication
convoy state
location format
timestamp
```

Store current position.

Optionally maintain location history:

```text
convoy_locations
```

---

# 50. LIVE MAP API

The map needs a consolidated endpoint.

Implement:

```text
GET /api/v1/map/operations
```

Support:

```text
bbox
layers
time
```

Example:

```text
GET /api/v1/map/operations?layers=warehouses,shelters,convoys,hazards,routes
```

Return GeoJSON wherever appropriate.

---

# 51. MAP RESPONSE

Prefer:

```json
{
  "warehouses": {
    "type": "FeatureCollection",
    "features": []
  },
  "shelters": {
    "type": "FeatureCollection",
    "features": []
  },
  "convoys": {
    "type": "FeatureCollection",
    "features": []
  },
  "hazards": {
    "type": "FeatureCollection",
    "features": []
  },
  "routes": {
    "type": "FeatureCollection",
    "features": []
  }
}
```

This makes frontend GIS rendering straightforward.

---

# 52. DASHBOARD API

Do not make the frontend call 20 APIs to construct the dashboard.

Provide:

```text
GET /api/v1/dashboard
```

Return:

```text
warehouse summary
inventory health
critical requests
Supply Swap opportunities
active transfers
route warnings
critical alerts
system status
```

---

# 53. DASHBOARD RESPONSE

Example structure:

```json
{
  "warehouse": {},
  "inventory": {},
  "criticalRequests": [],
  "supplySwapOpportunities": [],
  "activeTransfers": [],
  "routeWarnings": [],
  "criticalAlerts": [],
  "systemStatus": {}
}
```

---

# 54. DASHBOARD PRIORITY ENGINE

The backend should help rank:

```text
WHAT NEEDS MY ATTENTION?
```

Consider:

```text
time-to-shortage
population affected
criticality
supply availability
route risk
confidence
isolation risk
```

Return:

```json
{
  "priority": "CRITICAL",
  "priorityScore": 94,
  "reason": [
    "Only 4 hours of insulin coverage remain",
    "Population affected: 420",
    "No confirmed incoming supply"
  ]
}
```

---

# 55. ALERT DOMAIN

Table:

```text
alerts
```

Fields:

```text
id
type
severity
title
message
entity_type
entity_id
status
created_at
acknowledged_at
acknowledged_by
resolved_at
```

Types:

```text
HAZARD
ROUTE
INVENTORY
SHELTER
CONVOY
SUPPLY_SWAP
SYSTEM
```

Severity:

```text
CRITICAL
ACTION_REQUIRED
ADVISORY
INFORMATION
```

---

# 56. ALERT API

```text
GET /api/v1/alerts
GET /api/v1/alerts/:id

POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/resolve
```

Filters:

```text
severity
status
type
date
```

---

# 57. ALERT GENERATION

The backend should generate alerts from events.

Example:

```text
Hazard created
     ↓
Route affected
     ↓
Convoy affected
     ↓
Critical Supply Swap affected
     ↓
CRITICAL alert
```

Do not make frontend responsible for creating operational alerts.

---

# 58. REAL-TIME EVENT ARCHITECTURE

Use an internal event system.

Example:

```text
InventoryUpdatedEvent
HazardCreatedEvent
HazardVerifiedEvent
RouteStatusChangedEvent
ConvoyReroutedEvent
SupplySwapApprovedEvent
ShelterDemandChangedEvent
AlertCreatedEvent
```

Flow:

```text
DATABASE TRANSACTION
        ↓
DOMAIN EVENT
        ↓
EVENT HANDLER
        ↓
Redis / WebSocket
        ↓
Frontend
```

---

# 59. WEBSOCKET EVENTS

Emit:

```text
inventory.updated
supplySwap.updated
convoy.updated
convoy.location.updated
route.updated
hazard.created
hazard.updated
alert.created
shelter.demand.updated
dashboard.updated
```

Payload should contain enough information for the frontend to update only the affected component.

---

# 60. EVENT EXAMPLE

```json
{
  "event": "hazard.updated",
  "entityId": "B14",
  "data": {
    "status": "BLOCKED",
    "confidence": "HIGH"
  },
  "timestamp": "..."
}
```

---

# 61. FRONTEND SYNC STATUS

Backend should expose:

```text
GET /api/v1/system/status
```

Return:

```json
{
  "status": "LIVE",
  "lastUpdatedAt": "...",
  "dataFreshnessSeconds": 12
}
```

Possible:

```text
LIVE
SYNCING
DELAYED
OFFLINE
```

---

# 62. STALE DATA

Every dynamic response should have:

```text
updatedAt
source
confidence
```

where relevant.

The frontend must be able to distinguish:

```text
current
stale
unknown
```

---

# 63. EXTERNAL API INTEGRATION LAYER

Do NOT hardwire external APIs throughout business logic.

Create:

```text
integrations/
```

with adapters.

Example:

```text
WeatherProvider
MappingProvider
FloodDataProvider
SatelliteProvider
TrafficProvider
```

The actual provider can be injected later.

---

# 64. API PLACEHOLDERS

The user will provide external APIs separately.

Therefore design configuration like:

```text
WEATHER_API_URL=
WEATHER_API_KEY=

MAP_API_URL=
MAP_API_KEY=

FLOOD_API_URL=
FLOOD_API_KEY=

SATELLITE_API_URL=
SATELLITE_API_KEY=
```

Never commit actual keys.

---

# 65. EXTERNAL DATA NORMALIZATION

External APIs should be converted into internal formats.

For example:

```text
External Flood API
        ↓
FloodProviderAdapter
        ↓
NormalizedFloodEvent
        ↓
Hazard Service
        ↓
Database
```

Do not make the frontend depend directly on third-party API schemas.

---

# 66. WEATHER

If a weather API is provided later:

Backend endpoint:

```text
GET /api/v1/weather/current
GET /api/v1/weather/forecast
```

Normalize response.

The frontend should not need to know the external provider.

---

# 67. MAP PROVIDER

The backend should not proxy map tiles unless necessary.

Frontend can consume map tiles directly where appropriate.

Backend should provide:

```text
operational overlays
routes
hazards
convoy locations
warehouses
shelters
```

---

# 68. GEOJSON

For geographic entities use GeoJSON.

Examples:

```text
hazard geometry
route geometry
warehouse point
shelter point
convoy point
```

Ensure valid CRS handling.

---

# 69. DATABASE TRANSACTIONS

Critical operations MUST use transactions.

Especially:

```text
Supply Swap approval
Inventory reservation
Convoy creation
Delivery completion
Reroute
Inventory transfer
Hazard verification
```

---

# 70. AUDIT LOG

Table:

```text
audit_logs
```

Fields:

```text
id
user_id
action
entity_type
entity_id
old_value
new_value
ip_address
user_agent
created_at
```

For critical operations record:

```text
WHO
WHAT
WHEN
BEFORE
AFTER
```

---

# 71. AUDIT EVENTS

Examples:

```text
SUPPLY_SWAP_APPROVED
SUPPLY_SWAP_REJECTED
INVENTORY_RESERVED
CONVOY_CREATED
CONVOY_REROUTED
HAZARD_VERIFIED
ALERT_ACKNOWLEDGED
ROUTE_MARKED_BLOCKED
```

---

# 72. API VERSIONING

All APIs must use:

```text
/api/v1/
```

Do not mix:

```text
/api/
```

and:

```text
/api/v1/
```

---

# 73. RESPONSE FORMAT

Use consistent responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

List:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INVENTORY_CHANGED",
    "message": "Transfer can no longer be approved."
  }
}
```

---

# 74. HTTP STATUS CODES

Use correctly.

```text
200 OK
201 CREATED
204 NO CONTENT
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
422 UNPROCESSABLE ENTITY
429 TOO MANY REQUESTS
500 INTERNAL SERVER ERROR
503 SERVICE UNAVAILABLE
```

Use:

```text
409 CONFLICT
```

for stale inventory/concurrency conflicts where appropriate.

---

# 75. VALIDATION

Use:

```text
class-validator
```

or equivalent DTO validation.

Validate:

```text
quantity
coordinates
UUID
enum values
dates
pagination
filters
```

Never trust frontend input.

---

# 76. RATE LIMITING

Implement rate limiting for:

```text
login
refresh
public endpoints
location updates
hazard creation
```

Do not rate-limit normal internal operations excessively.

---

# 77. SECURITY

Implement:

```text
Helmet
CORS
JWT validation
RBAC
rate limiting
input validation
SQL injection prevention
secure headers
```

Never expose:

```text
database credentials
API keys
JWT secret
Redis password
internal errors
```

---

# 78. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Example:

```text
NODE_ENV=development

PORT=3000

DATABASE_URL=

REDIS_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

MAP_API_KEY=
WEATHER_API_KEY=
FLOOD_API_KEY=
SATELLITE_API_KEY=

CORS_ORIGIN=
```

The actual `.env` must remain gitignored.

---

# 79. DATABASE INDEXING

Add indexes for:

```text
warehouse_id
shelter_id
supply_type
status
priority
created_at
updated_at
route_id
convoy_id
```

Spatial indexes:

```text
GIST
```

for PostGIS geometry/geography columns.

---

# 80. PAGINATION

All large lists must support:

```text
page
limit
sort
order
```

Examples:

```text
GET /api/v1/hazards?page=1&limit=20
GET /api/v1/convoys?page=1&limit=20
GET /api/v1/alerts?page=1&limit=20
```

---

# 81. FILTERING

Support frontend filters.

Example Supply Swap:

```text
priority
supplyType
status
warehouse
destination
routeStatus
```

Example Hazards:

```text
type
severity
confidence
status
```

Example Shelters:

```text
priority
region
supplyType
isolationRisk
```

---

# 82. SEARCH

Implement global search:

```text
GET /api/v1/search?q=insulin
```

Search:

```text
warehouses
inventory
shelters
convoys
hazards
Supply Swaps
alerts
```

Return grouped results.

---

# 83. SETTINGS API

Implement:

```text
GET /api/v1/settings
PATCH /api/v1/settings
```

Support:

```text
notification preferences
map preferences
timezone
language
accessibility preferences
```

---

# 84. HEALTH CHECK

Implement:

```text
GET /health
GET /health/database
GET /health/redis
```

Return service status.

---

# 85. LOGGING

Use structured logging.

Prefer:

```text
Pino
```

or equivalent.

Log:

```text
request ID
user ID
route
status code
latency
errors
important domain events
```

Do not log:

```text
passwords
tokens
API keys
sensitive credentials
```

---

# 86. REQUEST ID

Every request should receive:

```text
X-Request-ID
```

This ID should appear in logs and error responses where appropriate.

---

# 87. API DOCUMENTATION

Use:

```text
Swagger / OpenAPI
```

Expose:

```text
/api/docs
```

Document:

```text
authentication
request schemas
response schemas
errors
query parameters
WebSocket events
```

The API documentation should allow frontend developers to understand exactly how to consume the backend.

---

# 88. FRONTEND-BACKEND CONTRACT

For every frontend screen create an explicit API mapping.

Example:

```text
dashboard.html

GET /api/v1/dashboard
GET /api/v1/alerts
GET /api/v1/supply-swaps/opportunities
```

Live map:

```text
GET /api/v1/map/operations
WebSocket:
hazard.updated
convoy.updated
route.updated
```

Supply Swap:

```text
GET /api/v1/supply-swaps/opportunities
GET /api/v1/supply-swaps/:id
POST /api/v1/supply-swaps/:id/impact-preview
POST /api/v1/supply-swaps/:id/approve
```

Convoy:

```text
GET /api/v1/convoys
GET /api/v1/convoys/:id
POST /api/v1/convoys/:id/reroute
```

Shelter:

```text
GET /api/v1/shelters
GET /api/v1/shelters/:id
GET /api/v1/shelters/:id/demand
```

Hazard:

```text
GET /api/v1/hazards
POST /api/v1/hazards
POST /api/v1/hazards/:id/verify
```

Alerts:

```text
GET /api/v1/alerts
POST /api/v1/alerts/:id/acknowledge
```

---

# 89. CRITICAL END-TO-END WORKFLOW

Implement and test this complete flow.

```text
Warehouse A
     ↓
Inventory:
Insulin 100
     ↓
Transferable:
60
     ↓
Shelter 06
     ↓
Needs:
40
     ↓
Coverage:
4 hours
     ↓
Matching engine
     ↓
Supply Swap SW-014
     ↓
Impact preview
     ↓
Manager approves
     ↓
Inventory reservation
     ↓
Convoy created
     ↓
Route assigned
     ↓
Convoy departed
```

---

# 90. HAZARD INTERRUPTION

While convoy is active:

```text
Bridge B14
        ↓
Hazard reported
        ↓
Confidence MEDIUM
        ↓
Route impacted
        ↓
Convoy identified
        ↓
Alert generated
        ↓
Manager sees notification
```

If hazard becomes verified:

```text
MEDIUM
   ↓
VERIFIED
   ↓
Route BLOCKED
   ↓
Convoy REROUTING
```

---

# 91. REROUTING

Endpoint:

```text
POST /api/v1/convoys/:id/reroute
```

Backend must:

```text
validate convoy
find current route
identify blocked segment
calculate/select alternative route
estimate ETA
update route
update convoy
create audit log
emit event
```

Return:

```json
{
  "oldRoute": {},
  "newRoute": {},
  "etaBefore": 27,
  "etaAfter": 38,
  "etaDelta": 11,
  "reason": "Bridge B14 blocked",
  "confidence": "MEDIUM"
}
```

---

# 92. ALTERNATIVE ROUTE

Never return an alternative route without explaining:

```text
WHY
ETA
RISK
CONFIDENCE
```

Example:

```text
Alternative route found.

Reason:
Bridge B14 blocked.

ETA:
38 minutes

Additional:
+11 minutes

Confidence:
Medium
```

---

# 93. DELIVERY

When convoy arrives:

```text
POST /api/v1/convoys/:id/deliver
```

Within transaction:

```text
validate convoy
validate destination
create inventory transaction
update destination demand
update Supply Swap
update convoy
write audit
emit events
generate success alert
```

---

# 94. SUPPLY SWAP FINAL STATE

After delivery:

```text
SUPPLY_SWAP
DELIVERED
```

and:

```text
REQUEST
FULFILLED
```

if the requested amount has been completely delivered.

---

# 95. SHELTER COVERAGE UPDATE

After delivery:

Before:

```text
Insulin:
10 units
Coverage:
4 hours
```

After:

```text
Insulin:
50 units
Coverage:
18 hours
```

This update should propagate to:

```text
Shelter Board
Dashboard
Supply Swap
Alerts
WebSocket
```

---

# 96. EVENTUAL CONSISTENCY VS STRONG CONSISTENCY

Use strong consistency for:

```text
inventory reservation
inventory transfer
Supply Swap approval
delivery
critical state transitions
```

Eventual consistency is acceptable for:

```text
map refresh
analytics
historical aggregates
non-critical dashboard metrics
```

---

# 97. CACHING

Cache:

```text
warehouse metadata
static supply types
map metadata
non-critical dashboard summaries
```

Do NOT blindly cache:

```text
transferable inventory
Supply Swap approval state
critical shelter demand
critical convoy state
```

unless invalidation is correctly implemented.

---

# 98. BACKGROUND JOBS

Use:

```text
BullMQ
```

with Redis where useful.

Jobs:

```text
route recalculation
hazard impact analysis
external API synchronization
expired Supply Swap cleanup
expired offers
alert escalation
data synchronization
analytics
```

---

# 99. SCHEDULED JOBS

Examples:

```text
every 1 minute
check stale hazards

every 5 minutes
refresh external hazard data

every 1 minute
evaluate critical supply coverage

every 30 minutes
clean expired offers

daily
archive/aggregate historical data
```

Do not make schedules unnecessarily aggressive.

---

# 100. DATABASE SEED

Create realistic development seed data.

At minimum:

```text
3 warehouses
8 shelters
20 inventory records
10 supply requests
8 Supply Swap opportunities
6 convoys
10 hazards
10 alerts
```

Include:

```text
critical insulin shortage
blood shortage
infant nutrition shortage
water shortage
blocked bridge
flood zone
debris flow
rerouting convoy
```

---

# 101. DEMO SCENARIO

The seeded database must reproduce this scenario:

```text
Warehouse A
Insulin transferable = 60

Shelter 06
Insulin remaining = 10
Time-to-shortage = 4 hours

Supply Swap:
40 insulin

Route:
CAUTION

Convoy:
available

Manager:
reviews

Manager:
approves

Convoy:
created

Bridge B14:
blocked

Convoy:
reroutes

Shelter:
receives supply
```

This should work without manually editing the database.

---

# 102. TESTING

Write:

```text
unit tests
integration tests
e2e tests
```

Critical tests:

```text
authentication
RBAC
inventory reservation
concurrent Supply Swap approval
stale inventory
hazard creation
route impact
convoy rerouting
delivery
alert generation
WebSocket event
```

---

# 103. CONCURRENCY TEST

Simulate:

```text
Manager A → approves 40 insulin

Manager B → approves 40 insulin

Available:
60
```

Expected:

```text
One succeeds.

One receives:
409 CONFLICT
```

Never allow:

```text
-20 inventory
```

---

# 104. API TEST SCENARIO

Test:

```text
POST /supply-swaps/:id/approve
```

with:

```text
valid inventory
valid request
valid route
```

Expected:

```text
200/201
inventory reserved
audit created
event emitted
convoy created where applicable
```

---

# 105. FAILURE TEST

Test:

```text
route blocked
```

during approval.

Expected:

```text
approval rejected or flagged according to policy
```

Do not approve a transfer blindly if the route is no longer operationally valid.

---

# 106. SECURITY TESTING

Test:

```text
unauthorized user
wrong warehouse
expired token
invalid token
SQL injection
malformed UUID
invalid quantity
negative quantity
excessive quantity
```

---

# 107. API PERFORMANCE

Target:

```text
simple CRUD:
<300ms typical

dashboard:
<500ms typical

map query:
<1000ms typical

Supply Swap opportunity:
<1000ms typical
```

These are development targets, not guarantees.

Optimize only after measuring.

---

# 108. DATABASE PERFORMANCE

Use:

```text
indexes
spatial indexes
pagination
selective joins
query optimization
connection pooling
```

Do not fetch entire tables into memory.

---

# 109. OBSERVABILITY

Expose:

```text
health
logs
request latency
error rate
database health
Redis health
external API health
```

Future-ready for:

```text
Prometheus
Grafana
OpenTelemetry
```

---

# 110. ERROR CODES

Create standardized codes.

Examples:

```text
AUTH_INVALID
AUTH_EXPIRED

WAREHOUSE_NOT_FOUND
INVENTORY_NOT_FOUND
INVENTORY_INSUFFICIENT
INVENTORY_CHANGED

SUPPLY_SWAP_NOT_FOUND
SUPPLY_SWAP_EXPIRED
SUPPLY_SWAP_INVALID_STATE

ROUTE_BLOCKED
ROUTE_NOT_FOUND

HAZARD_NOT_FOUND
HAZARD_ALREADY_VERIFIED

CONVOY_NOT_FOUND
CONVOY_INVALID_STATE

SHELTER_NOT_FOUND

FORBIDDEN_OPERATION
VALIDATION_ERROR
```

---

# 111. NO MAGIC STRINGS

Use enums/constants for:

```text
status
severity
priority
supply types
roles
event names
```

---

# 112. API CONTRACT DOCUMENTATION

Create a document:

```text
docs/api-contract.md
```

containing:

```text
Authentication
Dashboard
Inventory
Supply Swap
Map
Convoy
Shelters
Hazards
Alerts
Settings
WebSocket events
Error codes
```

---

# 113. FRONTEND INTEGRATION DOCUMENTATION

Create:

```text
docs/frontend-integration.md
```

Explain:

```text
which API each page calls
what data it receives
which WebSocket events update it
what errors frontend must handle
```

Example:

```text
dashboard.html

Initial:
GET /api/v1/dashboard

Realtime:
dashboard.updated
alert.created
supplySwap.updated
inventory.updated
```

---

# 114. API RESPONSE DESIGN PRINCIPLE

Do not make the frontend reconstruct business logic unnecessarily.

Bad:

```text
Frontend gets:
inventory
request
route
shelter
convoy

and calculates everything itself.
```

Good:

```text
Backend returns:
Supply Swap opportunity
matchScore
reasons
route status
ETA
impact
```

The backend owns business rules.

---

# 115. FRONTEND SHOULD NOT DECIDE

Never let frontend decide:

```text
whether inventory is sufficient
whether transfer is valid
whether route is safe
whether user is authorized
whether Supply Swap should be approved
whether delivery is complete
```

Frontend presents.

Backend decides.

---

# 116. BACKEND SHOULD NOT OWN VISUAL PRESENTATION

Backend should NOT return:

```text
HTML
CSS
pixel coordinates
UI-specific styling
```

Return semantic operational data.

Example:

```text
status = "CRITICAL"
```

not:

```text
color = "#ff0000"
```

---

# 117. DOMAIN EVENT EXAMPLE

When hazard is verified:

```text
HazardService
      ↓
verify hazard
      ↓
RouteImpactService
      ↓
affected routes
      ↓
ConvoyImpactService
      ↓
affected convoys
      ↓
SupplySwapImpactService
      ↓
affected swaps
      ↓
AlertService
      ↓
create alerts
      ↓
RealtimeGateway
      ↓
frontend
```

This is the backend's central operational chain.

---

# 118. ARCHITECTURAL PRINCIPLE

Do NOT create a giant:

```text
app.service.ts
```

with every business operation.

Use domain services:

```text
InventoryService
SupplySwapService
RouteService
HazardService
ConvoyService
ShelterService
AlertService
DashboardService
```

---

# 119. SERVICE RESPONSIBILITIES

## InventoryService

Own:

```text
stock
reservation
release
transfer
transactions
```

## SupplySwapService

Own:

```text
matching
opportunity
impact
approval
state
```

## RouteService

Own:

```text
route
status
ETA
risk
rerouting
```

## HazardService

Own:

```text
hazards
verification
confidence
impact
```

## ConvoyService

Own:

```text
dispatch
tracking
rerouting
arrival
delivery
```

---

# 120. FINAL BACKEND ARCHITECTURE

The final system should conceptually operate as:

```text
                    FRONTEND
                       │
             REST API + WebSocket
                       │
                ┌──────▼──────┐
                │   NESTJS    │
                │ API GATEWAY │
                └──────┬──────┘
                       │
       ┌───────────────┼─────────────────┐
       │               │                 │
       ▼               ▼                 ▼
    DOMAIN          REALTIME         INTEGRATIONS
    SERVICES        EVENTS           ADAPTERS
       │               │                 │
       └───────────────┼─────────────────┘
                       │
              ┌────────▼────────┐
              │   POSTGRESQL    │
              │    + POSTGIS    │
              └────────┬────────┘
                       │
                    REDIS
                       │
                 BACKGROUND JOBS
                       │
                 OPTIONAL PYTHON
                    AI/ML LAYER
```

---

# 121. IMPLEMENTATION ORDER

Do NOT build everything simultaneously.

Implement in this order:

## PHASE 1

```text
Project setup
NestJS
TypeScript
PostgreSQL
PostGIS
Redis
Environment configuration
Docker
Swagger
logging
health checks
```

## PHASE 2

```text
Users
Roles
Authentication
JWT
RBAC
```

## PHASE 3

```text
Warehouses
Inventory
Inventory transactions
```

## PHASE 4

```text
Shelters
Shelter demand
Supply requests
```

## PHASE 5

```text
Supply Offers
Supply Swap
Matching engine
Impact preview
Approval
Concurrency protection
```

## PHASE 6

```text
Routes
Route segments
PostGIS
Hazards
Hazard verification
Route impact
```

## PHASE 7

```text
Convoys
Cargo
Tracking
Rerouting
Delivery
```

## PHASE 8

```text
Alerts
Event system
WebSockets
Realtime synchronization
```

## PHASE 9

```text
Dashboard aggregation
Global search
Settings
```

## PHASE 10

```text
External APIs
Weather
Flood
Maps
Satellite
```

## PHASE 11

```text
Background jobs
Caching
Performance
Monitoring
```

## PHASE 12

```text
Unit tests
Integration tests
E2E tests
Security testing
Load testing
Documentation
```

---

# 122. PHASE GATE

At the end of every phase:

```text
1. Run backend.
2. Run database migrations.
3. Run tests.
4. Test APIs through Swagger.
5. Verify database state.
6. Verify authorization.
7. Verify error handling.
8. Verify logs.
9. Verify frontend compatibility.
10. Fix failures.
11. Only then continue.
```

---

# 123. DO NOT DO THESE THINGS

Do NOT:

```text
hardcode inventory in controllers
hardcode Supply Swap results
hardcode routes
hardcode user permissions
store API keys in source code
use frontend-only validation
allow negative inventory
ignore concurrency
make every API return huge objects
put all business logic in controllers
use Redis as primary storage
make Python mandatory for CRUD
create fake "AI" scores with no explanation
pretend stale information is real-time
```

---

# 124. MOST IMPORTANT BUSINESS RULE

The backend must distinguish:

```text
PHYSICAL
```

from:

```text
OPERATIONALLY AVAILABLE
```

and:

```text
TRANSFERABLE
```

and:

```text
DELIVERABLE
```

These are NOT the same.

Example:

```text
Warehouse has:
100 insulin

Reserved:
40

Transferable:
60

But route blocked:
0 currently deliverable
```

This distinction must exist in backend logic.

---

# 125. SECOND MOST IMPORTANT BUSINESS RULE

A route is not simply:

```text
OPEN / CLOSED
```

It should carry:

```text
status
confidence
source
lastUpdated
vehicle suitability
hazard exposure
```

Example:

```text
Route:
CAUTION

Confidence:
MEDIUM

Source:
Field Report

Updated:
3 minutes ago
```

---

# 126. THIRD MOST IMPORTANT BUSINESS RULE

A successful logistics action is not simply:

```text
CONVOY DELIVERED
```

The backend should maintain enough information to determine:

```text
Was the correct supply delivered?
Was the requested quantity delivered?
Was the shelter still in need?
Was the supply usable?
```

This allows the system to evolve from transportation tracking toward genuine humanitarian decision support.

---

# 127. FINAL SUCCESS CRITERIA

The backend is complete only when this works end-to-end:

```text
LOGIN
 ↓
WAREHOUSE IDENTIFIED
 ↓
DASHBOARD LOADED
 ↓
INVENTORY SHOWN
 ↓
CRITICAL SHELTER IDENTIFIED
 ↓
SUPPLY SWAP OPPORTUNITY GENERATED
 ↓
MATCH EXPLAINED
 ↓
IMPACT PREVIEW GENERATED
 ↓
MANAGER APPROVES
 ↓
INVENTORY RESERVED
 ↓
AUDIT CREATED
 ↓
CONVOY CREATED
 ↓
ROUTE ASSIGNED
 ↓
LIVE LOCATION RECEIVED
 ↓
HAZARD CREATED
 ↓
ROUTE IMPACT DETECTED
 ↓
ALERT GENERATED
 ↓
CONVOY REROUTED
 ↓
SHELTER RECEIVES SUPPLY
 ↓
INVENTORY UPDATED
 ↓
DEMAND UPDATED
 ↓
SUPPLY SWAP COMPLETED
 ↓
AUDIT TRAIL COMPLETE
```

---

# 128. FINAL INSTRUCTION TO THE CODING AGENT

Do not merely create APIs that return JSON.

Build the backend as the **operational brain behind the frontend**.

The frontend should be able to ask:

```text
What do I have?
```

Backend:

```text
Inventory Service
```

```text
What can I release?
```

Backend:

```text
Transferable Inventory Logic
```

```text
Who needs it?
```

Backend:

```text
Shelter Demand + Supply Requests
```

```text
What is the best match?
```

Backend:

```text
Supply Swap Matching Engine
```

```text
Can it reach them?
```

Backend:

```text
Route + Hazard + Convoy Feasibility
```

```text
What happens if I send it?
```

Backend:

```text
Impact Preview
```

```text
What changed?
```

Backend:

```text
Events + Hazard + Inventory + Route State
```

```text
What should I know immediately?
```

Backend:

```text
Alert Engine
```

```text
What happened historically?
```

Backend:

```text
Audit Log
```

The final system should therefore operate as:

```text
                 OBSERVE
                    ↓
              INGEST DATA
                    ↓
             NORMALIZE DATA
                    ↓
                ANALYZE
                    ↓
             MATCH DEMAND
                    ↓
             CHECK INVENTORY
                    ↓
              CHECK ROUTE
                    ↓
            CALCULATE IMPACT
                    ↓
               DECISION
                    ↓
                DISPATCH
                    ↓
               MONITOR
                    ↓
             DETECT CHANGE
                    ↓
              REASSESS
                    ↓
               ADAPT
```

Build the backend around this loop.

The goal is not to make a large number of endpoints.

The goal is to create a **consistent, transactional, explainable, real-time operational backend that makes the Warehouse Manager frontend possible.**