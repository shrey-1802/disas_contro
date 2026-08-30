# MASTER PROMPT — BACKEND DEVELOPMENT
## Disaster Relief Supply Chain Intelligence Platform
### Warehouse Manager Backend

You are a **senior backend architect, NestJS/Node.js engineer, database architect, GIS systems engineer, real-time systems engineer, API designer, and disaster-response technology specialist** with 15+ years of professional experience.

You are responsible for designing and implementing the **complete production-quality backend** for the disaster-relief supply-chain web application described below.

Do NOT treat this as a generic CRUD project.

The system is designed around a disaster scenario where earthquakes, hillside debris flows, overflowing tributaries, flooding, damaged bridges, submerged intersections, and rapidly changing road conditions disrupt relief logistics.

The primary user for this implementation is the:

> **WAREHOUSE MANAGER**

The Warehouse Manager manages relief inventory, receives shelter supply requirements, evaluates supply availability, creates/approves Supply Swaps, prepares convoys, monitors route safety, responds to hazards, and tracks relief operations.

---

# 1. PRIMARY OBJECTIVE

Build a robust backend that connects the existing frontend to:

- authentication
- warehouse management
- inventory management
- shelter requirements
- supply requests
- Supply Swap operations
- route information
- hazard information
- convoy dispatch
- live convoy tracking
- alerts
- dashboard analytics
- user settings
- audit logging
- real-time updates

The backend must provide clean APIs for every frontend page and must maintain **data consistency, security, validation, authorization, and transactional integrity**.

---

# 2. IMPORTANT PRODUCT CONCEPT

The application is NOT simply:

> "a warehouse inventory management system."

It is a:

> **disaster-relief logistics coordination and supply redistribution platform.**

The central operational problem is that conventional routing and static logistics information can become unreliable during rapidly changing disasters.

The backend therefore needs to represent:

```text
HAZARDS
   ↓
ROUTE CONDITIONS
   ↓
CONVOY SAFETY
   ↓
SHELTER ACCESSIBILITY
   ↓
SUPPLY DEMAND
   ↓
WAREHOUSE INVENTORY
   ↓
SUPPLY SWAP
   ↓
CONVOY DISPATCH
   ↓
DELIVERY
```

The system should preserve these relationships in the database and expose them through APIs.

---

# 3. TECHNOLOGY STACK

Use:

```text
Node.js
TypeScript
NestJS
MySQL 8.0+
Prisma ORM
Redis
WebSocket / Socket.IO
JWT Authentication
Swagger / OpenAPI
class-validator
class-transformer
bcrypt or Argon2
Jest
Pino/Winston
```

Recommended architecture:

```text
Frontend
   ↓
REST API + WebSocket
   ↓
NestJS
   ↓
Service Layer
   ↓
Prisma
   ↓
MySQL
```

Use Redis for:

```text
cache
real-time event distribution
pub/sub
temporary locks
rate limiting
background jobs
```

Do NOT use Redis as the primary source of truth.

MySQL must remain the authoritative database.

---

# 4. PYTHON REQUIREMENT

Do NOT build the primary backend in Python.

Use:

```text
NestJS + TypeScript
```

as the main backend.

Python may be introduced later as a separate service for:

```text
AI demand forecasting
route risk prediction
ETA prediction
hazard classification
intelligent supply matching
```

If AI functionality is not required for the current implementation, create a clean interface/service boundary so it can be added later without restructuring the entire backend.

---

# 5. BACKEND ARCHITECTURE

Use a:

> **MODULAR MONOLITH ARCHITECTURE**

Do NOT create unnecessary microservices.

Recommended structure:

```text
backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│
│   ├── config/
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── pipes/
│   │   ├── middleware/
│   │   ├── enums/
│   │   ├── constants/
│   │   └── utils/
│
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│
│   ├── auth/
│   ├── users/
│   ├── warehouses/
│   ├── inventory/
│   ├── shelters/
│   ├── supply-requests/
│   ├── supply-offers/
│   ├── supply-swaps/
│   ├── routes/
│   ├── hazards/
│   ├── vehicles/
│   ├── convoys/
│   ├── alerts/
│   ├── notifications/
│   ├── dashboard/
│   ├── audit/
│   └── health/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── test/
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

Every major module should contain:

```text
module.ts
controller.ts
service.ts
dto/
```

Use additional services where business logic becomes complex.

---

# 6. FRONTEND CONTRACT

The existing frontend architecture is:

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
├── css/tokens.css
├── css/base.css
├── css/components.css
└── js/pages/
    ├── liveMap.js
    ├── convoyDispatch.js
    ├── shelterBoard.js
    ├── hazardLog.js
    ├── alerts.js
    └── settings.js
```

Do not change the frontend architecture unless absolutely necessary.

Instead, create backend APIs that map cleanly to these pages.

---

# 7. API VERSIONING

Every API must use:

```text
/api/v1/
```

Example:

```text
/api/v1/auth/login
/api/v1/dashboard/summary
/api/v1/inventory
/api/v1/shelters
/api/v1/hazards
/api/v1/routes
/api/v1/convoys
/api/v1/alerts
/api/v1/supply-swaps
```

---

# 8. AUTHENTICATION

Implement:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

Use secure password hashing.

Use:

```text
access token
refresh token
```

Implement JWT authentication.

Protect private endpoints using guards.

Never trust frontend authentication state.

The backend must independently verify:

```text
identity
role
permission
```

---

# 9. ROLE

The primary role is:

```text
WAREHOUSE_MANAGER
```

Design RBAC so additional roles can be added later.

Example:

```text
ADMIN
WAREHOUSE_MANAGER
DISPATCH_MANAGER
SHELTER_MANAGER
FIELD_OPERATOR
VIEWER
```

The Warehouse Manager should have permissions for:

```text
dashboard.read

warehouse.read
warehouse.update

inventory.read
inventory.create
inventory.update
inventory.reserve
inventory.release

shelter.read
shelter.request.read

supply_request.read
supply_offer.create

supply_swap.read
supply_swap.create
supply_swap.approve
supply_swap.reject

route.read
route.risk.read

hazard.read
hazard.create
hazard.verify

vehicle.read

convoy.read
convoy.create
convoy.dispatch
convoy.pause
convoy.reroute
convoy.track

alert.read
alert.acknowledge

settings.read
settings.update
```

Implement permission guards.

---

# 10. DATABASE

Use:

```text
MySQL 8.0+
Prisma ORM
```

Create a normalized relational schema.

Core entities should include:

```text
users
roles
permissions
user_roles
warehouses
inventory_items
inventory_transactions
shelters
shelter_supply_requirements
supply_requests
supply_offers
supply_swaps
supply_swap_items
vehicles
routes
route_segments
hazards
convoys
convoy_items
convoy_locations
alerts
notifications
audit_logs
```

Use appropriate:

```text
primary keys
foreign keys
unique constraints
indexes
timestamps
status fields
soft deletion where appropriate
```

Do not duplicate data unnecessarily.

---

# 11. INVENTORY MODEL

Inventory must support critical relief materials such as:

```text
infant nutrition
insulin
blood bags
potable water
```

Each inventory record should support concepts such as:

```text
warehouse
item
category
quantity
available_quantity
reserved_quantity
unit
batch
expiry
criticality
status
```

Maintain inventory through transactions.

Never directly overwrite stock quantities without recording the corresponding transaction.

Inventory transactions may include:

```text
RECEIPT
RESERVATION
RELEASE
TRANSFER
DISPATCH
DELIVERY
ADJUSTMENT
DAMAGE
EXPIRY
```

---

# 12. INVENTORY TRANSACTION SAFETY

Critical inventory operations MUST use database transactions.

Example:

```text
BEGIN TRANSACTION

check available inventory

lock relevant inventory row

validate quantity

reserve quantity

create inventory transaction

update Supply Swap

create audit record

COMMIT
```

If anything fails:

```text
ROLLBACK
```

This is critical because two users must never be able to allocate the same stock.

---

# 13. SUPPLY SWAP CONCEPT

Implement Supply Swap as a first-class backend feature.

Supply Swap means:

> When one warehouse cannot efficiently satisfy a shelter's requirement, the platform can identify another warehouse or supply source that can satisfy that requirement and coordinate redistribution.

The matching system should consider available data such as:

```text
required supply
quantity
warehouse inventory
shelter urgency
warehouse distance
route status
route risk
estimated travel time
supply criticality
inventory availability
```

Do NOT create fake AI intelligence.

If AI is not yet implemented, use a transparent rule-based scoring service.

Example:

```text
matchScore =
    inventory availability
    + urgency
    + route safety
    + distance
    + criticality
```

Keep the scoring service isolated so it can later be replaced by an AI model.

---

# 14. SUPPLY SWAP APIs

Implement:

```text
GET    /api/v1/supply-swaps
GET    /api/v1/supply-swaps/:id
POST   /api/v1/supply-swaps
POST   /api/v1/supply-swaps/:id/approve
POST   /api/v1/supply-swaps/:id/reject
POST   /api/v1/supply-swaps/:id/cancel
```

Recommendation API:

```text
GET /api/v1/supply-swaps/recommendations
```

The recommendation response should explain WHY a source was recommended.

Example:

```json
{
  "warehouseId": "W-001",
  "quantity": 40,
  "matchScore": 94,
  "reasons": [
    "Sufficient available inventory",
    "Low route risk",
    "Shorter estimated travel time",
    "Shelter requirement marked critical"
  ]
}
```

Do not return unexplained black-box scores.

---

# 15. SHELTER SYSTEM

Shelters should have:

```text
name
location
population
capacity
status
accessibility
priority
isolation status
```

Shelter requirements should track:

```text
item
required quantity
available quantity
priority
urgency
request status
created time
deadline if applicable
```

APIs:

```text
GET /api/v1/shelters
GET /api/v1/shelters/:id
GET /api/v1/shelters/:id/requirements
GET /api/v1/shelters/:id/requests
GET /api/v1/shelters/critical
```

---

# 16. HAZARD SYSTEM

Hazards are dynamic.

Support:

```text
FLOOD
LANDSLIDE
DEBRIS_FLOW
DAMAGED_BRIDGE
SUBMERGED_ROAD
ROAD_BLOCKAGE
STRUCTURAL_DAMAGE
OTHER
```

Each hazard should support:

```text
type
severity
latitude
longitude
geometry where applicable
status
source
confidence
reported_at
verified_at
resolved_at
```

Hazard APIs:

```text
GET  /api/v1/hazards
GET  /api/v1/hazards/:id
POST /api/v1/hazards
PATCH /api/v1/hazards/:id
POST /api/v1/hazards/:id/verify
POST /api/v1/hazards/:id/resolve
```

---

# 17. ROUTE SYSTEM

Routes must have operational status.

Examples:

```text
SAFE
CAUTION
RESTRICTED
BLOCKED
UNKNOWN
```

A route can be affected by one or more hazards.

Create relationships between:

```text
hazard
route
route segment
convoy
```

APIs:

```text
GET  /api/v1/routes
GET  /api/v1/routes/:id
POST /api/v1/routes/calculate
GET  /api/v1/routes/:id/risk
POST /api/v1/routes/:id/reroute
```

Do not claim that a route is safe merely because a map provider reports it as open.

The application must distinguish:

```text
map availability
+
disaster operational status
```

---

# 18. GIS SUPPORT

Use MySQL spatial capabilities where appropriate.

Store geographic information in a way that supports:

```text
latitude
longitude
POINT
LINESTRING
```

where necessary.

The backend should be able to determine:

```text
Which hazards are near a route?
Which shelters are isolated?
Which warehouse is closest?
Which convoys are near a hazard?
```

Use spatial indexes where appropriate.

Return map-friendly geographic structures, preferably GeoJSON-compatible responses.

---

# 19. CONVOY SYSTEM

A convoy should connect:

```text
warehouse
destination shelter
vehicle(s)
cargo
route
driver/operator
status
```

Statuses:

```text
PLANNED
READY
DISPATCHED
IN_TRANSIT
DELAYED
AT_RISK
STRANDED
REROUTING
DELIVERED
CANCELLED
```

APIs:

```text
GET  /api/v1/convoys
GET  /api/v1/convoys/:id
POST /api/v1/convoys
POST /api/v1/convoys/:id/dispatch
POST /api/v1/convoys/:id/pause
POST /api/v1/convoys/:id/reroute
POST /api/v1/convoys/:id/deliver
POST /api/v1/convoys/:id/location
GET  /api/v1/convoys/:id/history
```

---

# 20. CONVOY LOCATION TRACKING

Support real-time location updates.

Example:

```text
POST /api/v1/convoys/:id/location
```

Store:

```text
latitude
longitude
speed
heading
timestamp
```

Do not overwrite historical positions.

Maintain location history.

---

# 21. WEBSOCKET

Implement WebSocket functionality for:

```text
convoy.location.updated
hazard.created
hazard.updated
route.status.changed
alert.created
inventory.changed
supply_swap.updated
shelter.request.created
```

Example flow:

```text
Convoy location
      ↓
NestJS
      ↓
Database
      ↓
Event
      ↓
WebSocket Gateway
      ↓
Frontend
```

The frontend should be able to update the live interface without refreshing the page.

---

# 22. HAZARD → CONVOY LOGIC

When a new verified critical hazard appears:

```text
hazard created
      ↓
identify affected routes
      ↓
identify active convoys
      ↓
calculate operational impact
      ↓
update convoy risk
      ↓
create alert
      ↓
broadcast WebSocket event
```

Do not automatically claim a convoy is stranded unless the data actually supports that state.

Use explicit business rules.

---

# 23. ALERT SYSTEM

Alert types:

```text
CRITICAL_INVENTORY
SHELTER_SHORTAGE
NEW_HAZARD
ROUTE_BLOCKED
CONVOY_AT_RISK
CONVOY_STRANDED
SUPPLY_SWAP_REQUEST
SUPPLY_SWAP_APPROVAL
DELIVERY_DELAY
SYSTEM_ALERT
```

Severity:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

APIs:

```text
GET  /api/v1/alerts
GET  /api/v1/alerts/unread
POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/resolve
```

Alerts must be persisted in MySQL.

---

# 24. DASHBOARD

Create:

```text
GET /api/v1/dashboard/summary
```

Return operational metrics such as:

```text
total inventory
critical inventory
reserved inventory
active shelters
critical shelters
isolated shelters
active convoys
at-risk convoys
stranded convoys
active hazards
critical hazards
pending Supply Swaps
```

Do not create redundant permanent dashboard tables unless there is a demonstrated performance requirement.

Use aggregation queries or optimized views/cache.

---

# 25. WAREHOUSE APIs

Implement:

```text
GET   /api/v1/warehouses
GET   /api/v1/warehouses/:id
PATCH /api/v1/warehouses/:id
GET   /api/v1/warehouses/:id/inventory
GET   /api/v1/warehouses/:id/requests
GET   /api/v1/warehouses/:id/convoys
```

Warehouse location must be stored geographically.

---

# 26. SETTINGS

Support user settings such as:

```text
name
email
phone if required
notification preferences
timezone
dashboard preferences
```

APIs:

```text
GET   /api/v1/settings
PATCH /api/v1/settings
```

Never allow users to modify protected role/permission fields through ordinary settings endpoints.

---

# 27. API RESPONSE FORMAT

Use a consistent response structure.

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "..."
  }
}
```

Pagination:

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

Errors:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Insufficient available inventory.",
    "requestId": "..."
  }
}
```

Never expose:

```text
SQL errors
stack traces
database credentials
internal filesystem paths
secret keys
```

---

# 28. VALIDATION

Every incoming request must be validated.

Use:

```text
class-validator
class-transformer
DTOs
```

Validate:

```text
quantity
IDs
coordinates
dates
statuses
enum values
pagination
filters
```

Reject invalid data before reaching business logic.

---

# 29. ERROR HANDLING

Implement a global exception filter.

Create meaningful application error codes:

```text
UNAUTHORIZED
FORBIDDEN
RESOURCE_NOT_FOUND
INVALID_REQUEST
INVALID_STATUS_TRANSITION
INSUFFICIENT_INVENTORY
INVENTORY_LOCKED
ROUTE_UNSAFE
CONVOY_NOT_DISPATCHABLE
SUPPLY_SWAP_ALREADY_PROCESSED
HAZARD_ALREADY_RESOLVED
```

Do not return generic:

```text
500 Something went wrong
```

when a meaningful business error can be provided.

---

# 30. STATUS TRANSITIONS

Implement explicit state machines where necessary.

For example:

```text
PLANNED
   ↓
READY
   ↓
DISPATCHED
   ↓
IN_TRANSIT
   ↓
DELIVERED
```

Invalid transitions must be rejected.

For example:

```text
DELIVERED → DISPATCHED
```

should not be possible through a normal API.

---

# 31. AUDIT LOGGING

Every important operational mutation must generate an audit log.

Examples:

```text
inventory adjusted
inventory reserved
Supply Swap created
Supply Swap approved
Supply Swap rejected
convoy dispatched
convoy rerouted
hazard verified
hazard resolved
alert acknowledged
settings changed
```

Audit record should include:

```text
user
action
entity
entity_id
old_value
new_value
timestamp
request_id
```

Do not store sensitive credentials or tokens in audit logs.

---

# 32. SECURITY

Implement:

```text
JWT authentication
RBAC
permission guards
password hashing
Helmet
CORS
rate limiting
request IDs
input validation
secure headers
environment secrets
database parameterization
audit logging
```

Never hardcode:

```text
database password
JWT secret
API keys
external service credentials
```

Use `.env`.

Provide:

```text
.env.example
```

with placeholders only.

---

# 33. ENVIRONMENT VARIABLES

Example:

```text
NODE_ENV=development

PORT=3000

DATABASE_URL=mysql://root:PASSWORD@localhost:3306/disaster_relief

JWT_SECRET=CHANGE_ME
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGIN=http://localhost:5500
```

Never commit `.env`.

---

# 34. CACHING

Use Redis selectively.

Potential cache:

```text
dashboard summary
active hazards
active routes
active convoy locations
critical shelters
```

Invalidate cache whenever relevant data changes.

Do not allow stale cached data to override authoritative safety information.

---

# 35. BACKGROUND JOBS

Use BullMQ/Redis where appropriate.

Potential jobs:

```text
inventory expiry checking
alert generation
route risk recalculation
shelter demand calculation
convoy ETA calculation
cache refresh
notification processing
```

Do not put long-running tasks directly inside HTTP requests.

---

# 36. EXTERNAL API ARCHITECTURE

If map/weather/GPS services are provided later, isolate them.

Use:

```text
external/
├── maps/
├── weather/
├── gps/
└── satellite/
```

Controllers must NOT directly call external APIs.

Use:

```text
Controller
   ↓
Service
   ↓
External Provider Adapter
```

This makes providers replaceable.

---

# 37. API DOCUMENTATION

Implement Swagger.

Expose:

```text
/api/docs
```

Document:

```text
authentication
parameters
request bodies
responses
errors
roles
WebSocket events where possible
```

Every endpoint must have useful documentation.

---

# 38. TESTING

Write unit tests for:

```text
AuthService
InventoryService
SupplySwapService
MatchingService
HazardService
RouteRiskService
ConvoyService
AlertService
DashboardService
```

Write integration tests for:

```text
login
inventory reservation
Supply Swap approval
convoy dispatch
hazard → route update
route → convoy risk
alert creation
```

Most importantly test concurrent inventory allocation.

Example:

```text
Warehouse has 100 units.

Request A attempts to reserve 80.
Request B attempts to reserve 50.

The final database state must never become:

150 reserved.
```

---

# 39. SEED DATA

Create realistic seed data for demonstration.

Include:

```text
1+ Warehouse Manager users
multiple warehouses
multiple shelters
multiple inventory items
infant nutrition
insulin
blood bags
potable water
multiple hazards
multiple routes
multiple vehicles
multiple convoys
Supply Swap requests
alerts
```

The data should represent a disaster-response environment.

Do not use meaningless:

```text
test1
test2
abc
xyz
```

for all records.

Use realistic demo data.

---

# 40. FRONTEND INTEGRATION

After implementing APIs, verify that every frontend page can obtain the data it needs.

Mapping:

```text
login.html
        ↓
/api/v1/auth/*

dashboard.html
        ↓
/api/v1/dashboard/*
/api/v1/alerts/*

live-map.html
        ↓
/api/v1/hazards/*
/api/v1/routes/*
/api/v1/convoys/*
/api/v1/warehouses/*
/api/v1/shelters/*
        +
WebSocket

convoy-dispatch.html
        ↓
/api/v1/convoys/*
/api/v1/inventory/*
/api/v1/routes/*
/api/v1/supply-swaps/*

shelter-board.html
        ↓
/api/v1/shelters/*
/api/v1/supply-requests/*
/api/v1/supply-swaps/*

hazard-log.html
        ↓
/api/v1/hazards/*

alerts.html
        ↓
/api/v1/alerts/*
        +
WebSocket

settings.html
        ↓
/api/v1/settings
```

---

# 41. DO NOT BUILD FAKE FUNCTIONALITY

This is extremely important.

Do NOT:

```text
hardcode dashboard numbers
fake API responses
pretend GPS is live
pretend route safety is real
create fake AI predictions
store everything in frontend JavaScript
use localStorage as the database
silently swallow API errors
```

If external APIs are unavailable:

```text
create a clean mock provider
```

but clearly separate:

```text
mock provider
real provider
```

The production architecture must not depend on fake data.

---

# 42. IMPLEMENTATION PHASES

Build in this order.

## PHASE 1 — Foundation

Create:

```text
NestJS project
TypeScript
Prisma
MySQL connection
configuration
global validation
global exception handling
logging
Swagger
health endpoint
```

---

## PHASE 2 — Database

Create:

```text
Prisma schema
migrations
relationships
indexes
spatial fields
seed script
```

Run:

```text
prisma migrate
prisma generate
prisma db seed
```

---

## PHASE 3 — Authentication

Implement:

```text
login
JWT
refresh token
logout
current user
RBAC
permission guards
```

---

## PHASE 4 — Warehouse + Inventory

Implement:

```text
warehouses
inventory
inventory transactions
reservation
release
transfer
```

Make inventory transactions fully ACID-safe.

---

## PHASE 5 — Shelters + Supply Requests

Implement:

```text
shelters
requirements
requests
priority
urgency
```

---

## PHASE 6 — Supply Swap

Implement:

```text
Supply Swap creation
matching engine
recommendations
approval
rejection
reservation
audit
```

This is a major demonstration feature.

---

## PHASE 7 — Hazards + Routes

Implement:

```text
hazards
route status
route risk
hazard-route relationship
spatial queries
```

---

## PHASE 8 — Convoys

Implement:

```text
vehicles
convoys
cargo
dispatch
status transitions
location history
```

---

## PHASE 9 — Real-Time Layer

Implement:

```text
Redis
WebSocket
convoy tracking
hazard events
alert events
inventory events
```

---

## PHASE 10 — Alerts

Implement:

```text
alert generation
severity
acknowledgement
resolution
real-time delivery
```

---

## PHASE 11 — Dashboard

Implement:

```text
dashboard aggregation
critical metrics
operational summaries
cache
```

---

## PHASE 12 — Security + Testing

Complete:

```text
RBAC
rate limiting
audit logging
unit tests
integration tests
security validation
```

---

# 43. FINAL END-TO-END WORKFLOW

The finished system should support a flow similar to:

```text
1. Warehouse Manager logs in

             ↓

2. Dashboard loads operational status

             ↓

3. Shelter requirement becomes critical

             ↓

4. Backend records the request

             ↓

5. Supply Swap matching engine searches
   available warehouses

             ↓

6. Candidate warehouses are evaluated

             ↓

7. Route conditions are checked

             ↓

8. Best candidate is recommended

             ↓

9. Warehouse Manager approves

             ↓

10. Inventory is transactionally reserved

             ↓

11. Convoy is created

             ↓

12. Route is assigned

             ↓

13. Convoy is dispatched

             ↓

14. Convoy location updates arrive

             ↓

15. New flood hazard appears

             ↓

16. Hazard affects route

             ↓

17. Backend identifies affected convoy

             ↓

18. Convoy risk changes

             ↓

19. Alert is generated

             ↓

20. Warehouse Manager receives
    real-time alert

             ↓

21. Alternative route is calculated

             ↓

22. Convoy is rerouted

             ↓

23. Convoy reaches shelter

             ↓

24. Delivery is recorded

             ↓

25. Inventory is finalized

             ↓

26. Shelter requirement is updated

             ↓

27. Audit trail is preserved
```

---

# 44. CODE QUALITY RULES

Write code as if another professional team will maintain it.

Follow:

```text
SOLID
DRY
separation of concerns
dependency injection
clean DTOs
service boundaries
typed responses
meaningful names
small functions
centralized configuration
```

Avoid:

```text
god classes
god services
giant controllers
business logic in controllers
duplicate validation
duplicate database logic
hardcoded business rules
```

---

# 45. IMPORTANT BUSINESS RULE

The backend must distinguish between:

```text
DATA
```

and:

```text
DECISION
```

For example:

```text
Data:
Road has a flood hazard.

Decision:
Road should not be used by heavy convoy.
```

The backend should make the decision through an explicit business rule/service rather than hiding it inside frontend JavaScript.

---

# 46. SOURCE OF TRUTH

Define clear ownership:

```text
MySQL
    = authoritative operational data

Redis
    = cache/realtime infrastructure

WebSocket
    = delivery mechanism

External APIs
    = external observations

AI
    = prediction/recommendation

Frontend
    = presentation and user interaction
```

Never allow the frontend to become the source of truth.

---

# 47. FINAL DELIVERABLES

At completion, provide:

```text
1. Complete NestJS backend

2. Complete Prisma schema

3. MySQL migration files

4. Database seed script

5. Authentication system

6. RBAC system

7. REST APIs

8. WebSocket gateway

9. Redis integration

10. Supply Swap engine

11. Inventory transaction system

12. Hazard/route relationship

13. Convoy tracking

14. Alert system

15. Dashboard API

16. Audit system

17. Swagger documentation

18. Unit tests

19. Integration tests

20. .env.example

21. README

22. API documentation

23. Database ERD documentation

24. Frontend integration documentation
```

---

# 48. DEVELOPMENT RULE

Do NOT implement the entire system blindly in one pass.

Work phase-by-phase.

After each phase:

```text
1. implement
2. compile
3. run tests
4. verify database
5. verify API
6. verify frontend contract
7. fix errors
8. document what was completed
9. continue to next phase
```

Never move forward while a foundational phase is broken.

---

# 49. FIRST ACTION

Before writing substantial code:

1. Inspect the existing frontend.
2. Inspect all provided UI/UX and frontend specification files.
3. Extract every backend data requirement.
4. Identify every frontend API dependency.
5. Identify every entity required by the UI.
6. Identify every user action that requires backend persistence.
7. Produce an API-to-page mapping.
8. Produce the final database entity relationship plan.
9. Identify any conflicts or missing requirements.
10. Then begin implementation.

Do not silently invent requirements that contradict the supplied frontend/UI/UX specifications.

If something is genuinely missing, choose the smallest architecture-compatible assumption and document it.

---

# 50. SUCCESS CRITERIA

The backend is considered complete only when:

```text
✓ Warehouse Manager can authenticate

✓ Dashboard receives real database data

✓ Inventory is persistent

✓ Inventory transactions are safe

✓ Shelters and requirements are persistent

✓ Supply Swap is functional

✓ Supply Swap recommendations are explainable

✓ Hazards are persistent

✓ Routes have operational status

✓ Convoys can be created

✓ Convoys can be dispatched

✓ Convoys have location history

✓ Real-time events work

✓ Alerts are persistent

✓ Alerts update in real time

✓ Dashboard metrics are database-driven

✓ RBAC works

✓ Audit logs work

✓ API validation works

✓ Error handling works

✓ MySQL transactions work

✓ Swagger works

✓ Tests pass

✓ Frontend can communicate with backend

✓ No critical business logic is hardcoded into frontend

✓ No fake production functionality is presented as real
```

Build the system as a **serious disaster-relief logistics backend**, not as a simple student CRUD API.

The final architecture must remain understandable, modular, testable, secure, and extensible toward future GIS intelligence and AI-based decision support.