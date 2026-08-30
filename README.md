# 🚨 DISISTA CONTROL — Disaster Relief Supply Chain Intelligence Platform

> **Relief Route Intelligence & Dynamic Supply Swap Optimization System**  
> Built with NestJS, MySQL / MariaDB, Prisma ORM, GraphHopper Routing, WebSockets, and Vanilla Web Technologies.

---

## 🌟 Features Overview

- **📦 Real-time Logistics Dashboard**: Live tracking of available, reserved, and critical inventory across regional relief hubs.
- **🔄 Supply Swap Intelligence Engine**: Multi-parameter optimization algorithm matching surplus warehouse inventory with critical shelter demand based on urgency tier, road clearance, and proximity.
- **🗺️ Live Tactical Map & Convoy Dispatch**: Interactive routing engine powered by GraphHopper with real-time hazard avoidance (floods, landslides, bridge collapses).
- **⚠️ Hazard & Alert Management**: Field driver observation logging, automated verification workflows, and instant WebSocket broadcast alerts.
- **🔐 Role-Based Access Control (RBAC)**: Dedicated interfaces for *Warehouse Managers*, *Control Room Officers*, *District Administrators*, and *Field Drivers*.

---

## 🗄️ Database Architecture & Setup

The system uses **MySQL 8.0+ / MariaDB 10.4+** with **InnoDB**, **Spatial Geometry Indexes (`POINT`, `LINESTRING`, `GEOMETRY`)**, and **Prisma ORM**.

### 1. Database Schema (`backend/schema.sql`)
The standalone SQL file [`backend/schema.sql`](backend/schema.sql) contains the complete production-grade DDL & DML:
- **24 Normalized Tables**: `warehouses`, `inventory_items`, `shelters`, `shelter_demands`, `supply_swaps`, `convoys`, `routes`, `hazards`, `alerts`, `audit_logs`, etc.
- **Analytical Views**: `vw_inventory_availability`, `vw_shelter_supply_status`, `vw_active_convoys`, `vw_critical_operations`.
- **Stored Procedures & Triggers**: Automatic status evaluation and inventory reservations.
- **Realistic Seed Data**: Pre-loaded with regional hubs (Guwahati, Riverside, Hillside), shelters, critical supplies (Insulin, Blood, Water), active convoys, and road hazards.

### 2. How to Import the Database in MySQL / XAMPP
```bash
# Using XAMPP Shell or Terminal:
mysql -u root < backend/schema.sql
```
*Or open **phpMyAdmin** (`http://localhost/phpmyadmin`) -> **Import** -> Select `backend/schema.sql` -> **Go**.*

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- MySQL / MariaDB (XAMPP / WAMP / Standalone MySQL)

### 1. Backend Setup
```bash
cd backend
npm install
npm run prisma:generate
npm run start:dev
```
- **REST API Base URL**: `http://localhost:3000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`

### 2. Frontend Setup
```bash
# In the root directory:
npm run dev
```
- **Web Application URL**: `http://localhost:8080`

---

## 🔑 Demo Login Accounts

| Role | Username / Email | Password | Default Screen |
| :--- | :--- | :--- | :--- |
| **Warehouse Manager** | `manager1@relief.local` | `password123` | `dashboard.html` |
| **Control Room Officer** | `control@relief.org` | `password123` | `live-map.html` |
| **District Administrator** | `admin@relief.local` | `password123` | `shelter-board.html` |
| **Field Driver** | `driver4@relief.org` | `password123` | `hazard-log.html` |

---

## 📁 Repository Structure

```
disas_contro/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Prisma ORM schema definition
│   ├── src/
│   │   ├── auth/                 # JWT Authentication & RBAC guards
│   │   ├── database/             # Prisma Service & lifecycle hooks
│   │   ├── inventory/            # Inventory control & transactions
│   │   ├── supply-swaps/         # Intelligent Swap Matching Engine
│   │   ├── routes/               # GraphHopper routing & risk scoring
│   │   ├── convoys/              # Convoy dispatch & GPS telemetry
│   │   ├── hazards/              # Incident reporting & verification
│   │   └── main.ts               # NestJS application bootstrap
│   ├── schema.sql                # Complete MySQL DDL/DML & seed script
│   └── package.json
├── frontend/
│   ├── index.html                # Entry point & role router
│   ├── login.html                # Interactive role-selection login
│   ├── dashboard.html            # Logistics & inventory dashboard
│   ├── live-map.html             # Tactical map & hazard overlays
│   ├── supply-swap.html          # Peer-to-peer swap matching engine
│   ├── convoy-dispatch.html      # Fleet & convoy dispatch manager
│   ├── shelter-board.html        # Emergency shelter urgency board
│   ├── hazard-log.html           # Field hazard submission log
│   ├── alerts.html               # Broadcast emergency alert center
│   ├── settings.html             # System & notification preferences
│   ├── css/                      # Tokens, base, and component styles
│   └── js/                       # Client APIs, state store, and pages
├── package.json
└── README.md
```

---

## 🛡️ License
UNLICENSED — Disaster Relief Supply Chain Intelligence Platform.
