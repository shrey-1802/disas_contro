-- ================================================================
-- RELIEF ROUTE INTELLIGENCE
-- Disaster Relief Supply Chain + Supply Swap Platform
-- MySQL 8.0+ | InnoDB | utf8mb4
-- Warehouse Manager focused demo database
--
-- This standalone SQL file creates the database, schema, indexes,
-- views, procedures, triggers, and realistic demo data.
-- It is intentionally executable without Prisma.
-- ================================================================

DROP DATABASE IF EXISTS relief_supply_chain;
CREATE DATABASE relief_supply_chain
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE relief_supply_chain;

SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. ACCESS CONTROL
-- ================================================================

CREATE TABLE roles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_permissions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id CHAR(36) NOT NULL,
    permission_id CHAR(36) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. WAREHOUSES
-- ================================================================

CREATE TABLE warehouses (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    location POINT NOT NULL,
    capacity DECIMAL(14,2) NOT NULL DEFAULT 0,
    status ENUM('FUNCTIONAL','LIMITED','DAMAGED','OFFLINE')
        NOT NULL DEFAULT 'FUNCTIONAL',
    operational_status ENUM('NORMAL','RECOVERABLE','DEGRADED','RESTRICTED','HAZARDOUS','IMPASSABLE')
        NOT NULL DEFAULT 'NORMAL',
    contact_name VARCHAR(150),
    contact_phone VARCHAR(30),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    UNIQUE KEY uq_warehouses_code (code),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180),
    CHECK (capacity >= 0),
    SPATIAL INDEX idx_warehouses_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role_id CHAR(36) NOT NULL,
    warehouse_id CHAR(36),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role_id),
    KEY idx_users_warehouse (warehouse_id),
    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_users_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. SUPPLY + INVENTORY
-- ================================================================

CREATE TABLE supply_types (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    unit VARCHAR(30) NOT NULL,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    requires_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    shelf_life_days INT,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_supply_types_code (code),
    CHECK (shelf_life_days IS NULL OR shelf_life_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_items (
    id CHAR(36) NOT NULL PRIMARY KEY,
    warehouse_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    sku VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    batch_number VARCHAR(80),
    quantity_on_hand DECIMAL(14,2) NOT NULL DEFAULT 0,
    quantity_reserved DECIMAL(14,2) NOT NULL DEFAULT 0,
    quantity_at_risk DECIMAL(14,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(14,2) NOT NULL DEFAULT 0,
    critical_stock DECIMAL(14,2) NOT NULL DEFAULT 0,
    unit VARCHAR(30) NOT NULL,
    item_condition ENUM('GOOD','DAMAGED','CONTAMINATED','EXPIRED') NOT NULL DEFAULT 'GOOD',
    status ENUM('AVAILABLE','LOW','CRITICAL','EXPIRED','DAMAGED','BLOCKED')
        NOT NULL DEFAULT 'AVAILABLE',
    expiry_date DATE,
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    UNIQUE KEY uq_inventory_sku (sku),
    KEY idx_inventory_warehouse (warehouse_id),
    KEY idx_inventory_supply (supply_type_id),
    KEY idx_inventory_status (status),
    KEY idx_inventory_warehouse_supply (warehouse_id, supply_type_id),
    CHECK (quantity_on_hand >= 0),
    CHECK (quantity_reserved >= 0),
    CHECK (quantity_at_risk >= 0),
    CHECK (minimum_stock >= 0),
    CHECK (critical_stock >= 0),
    CHECK (quantity_reserved <= quantity_on_hand),
    CONSTRAINT fk_inventory_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_transactions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    inventory_item_id CHAR(36) NOT NULL,
    transaction_type ENUM(
        'RECEIPT','RESERVATION','RELEASE','TRANSFER_OUT',
        'TRANSFER_IN','DAMAGE','EXPIRY','ADJUSTMENT','DELIVERY'
    ) NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id CHAR(36),
    performed_by CHAR(36),
    notes VARCHAR(500),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_inventory_tx_item (inventory_item_id),
    KEY idx_inventory_tx_created (created_at),
    CONSTRAINT fk_inventory_tx_item
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_tx_user
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. SHELTERS + DEMAND + REQUESTS
-- ================================================================

CREATE TABLE shelters (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    region VARCHAR(120),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    location POINT NOT NULL,
    population INT NOT NULL DEFAULT 0,
    capacity INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE','LIMITED','ISOLATED','EVACUATED','CLOSED')
        NOT NULL DEFAULT 'ACTIVE',
    isolation_risk ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    contact_name VARCHAR(150),
    contact_phone VARCHAR(30),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at DATETIME(3),
    UNIQUE KEY uq_shelters_code (code),
    KEY idx_shelters_region (region),
    SPATIAL INDEX idx_shelters_location (location),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180),
    CHECK (population >= 0),
    CHECK (capacity >= 0),
    CHECK (population <= capacity OR status IN ('ACTIVE','LIMITED','ISOLATED','EVACUATED','CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shelter_demands (
    id CHAR(36) NOT NULL PRIMARY KEY,
    shelter_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    current_quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
    required_quantity DECIMAL(14,2) NOT NULL DEFAULT 0,
    consumption_rate DECIMAL(14,4) NOT NULL DEFAULT 0,
    coverage_hours DECIMAL(14,2),
    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    priority_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    last_updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_shelter_demand (shelter_id, supply_type_id),
    KEY idx_shelter_demands_shelter (shelter_id),
    KEY idx_shelter_demands_supply (supply_type_id),
    KEY idx_shelter_demands_priority (priority),
    CONSTRAINT fk_shelter_demands_shelter
        FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shelter_demands_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT,
    CHECK (current_quantity >= 0),
    CHECK (required_quantity >= 0),
    CHECK (consumption_rate >= 0),
    CHECK (priority_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supply_requests (
    id CHAR(36) NOT NULL PRIMARY KEY,
    shelter_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    quantity_requested DECIMAL(14,2) NOT NULL,
    quantity_fulfilled DECIMAL(14,2) NOT NULL DEFAULT 0,
    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    priority_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    time_to_shortage_hours DECIMAL(14,2),
    status ENUM('OPEN','PARTIALLY_FULFILLED','FULFILLED','CANCELLED','EXPIRED')
        NOT NULL DEFAULT 'OPEN',
    requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    fulfilled_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_requests_status_priority (status, priority),
    KEY idx_requests_shelter (shelter_id),
    KEY idx_requests_supply (supply_type_id),
    CONSTRAINT fk_requests_shelter
        FOREIGN KEY (shelter_id) REFERENCES shelters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_requests_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT,
    CHECK (quantity_requested > 0),
    CHECK (quantity_fulfilled >= 0),
    CHECK (quantity_fulfilled <= quantity_requested),
    CHECK (priority_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. SUPPLY OFFERS + SUPPLY SWAPS
-- ================================================================

CREATE TABLE supply_offers (
    id CHAR(36) NOT NULL PRIMARY KEY,
    warehouse_id CHAR(36) NOT NULL,
    inventory_item_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    available_from DATETIME(3),
    expires_at DATETIME(3),
    status ENUM('AVAILABLE','RESERVED','MATCHED','TRANSFERRED','CANCELLED','EXPIRED')
        NOT NULL DEFAULT 'AVAILABLE',
    created_by CHAR(36),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_offers_status (status),
    KEY idx_offers_warehouse (warehouse_id),
    KEY idx_offers_supply (supply_type_id),
    CONSTRAINT fk_offers_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_offers_inventory
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_offers_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_offers_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supply_swaps (
    id CHAR(36) NOT NULL PRIMARY KEY,
    offer_id CHAR(36) NOT NULL,
    request_id CHAR(36) NOT NULL,
    source_warehouse_id CHAR(36) NOT NULL,
    destination_shelter_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    match_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    inventory_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    urgency_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    route_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    proximity_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    confidence_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    impact_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    status ENUM(
        'PROPOSED','UNDER_REVIEW','APPROVED','REJECTED','RESERVED',
        'ACTIVE','PAUSED','REROUTING','DELIVERED','CANCELLED','FAILED'
    ) NOT NULL DEFAULT 'PROPOSED',
    route_id CHAR(36),
    convoy_id CHAR(36),
    created_by CHAR(36),
    approved_by CHAR(36),
    approved_at DATETIME(3),
    match_reasons JSON,
    warnings JSON,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_swaps_status_score (status, match_score),
    KEY idx_swaps_source (source_warehouse_id),
    KEY idx_swaps_request (request_id),
    KEY idx_swaps_route (route_id),
    CONSTRAINT fk_swaps_offer
        FOREIGN KEY (offer_id) REFERENCES supply_offers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_swaps_request
        FOREIGN KEY (request_id) REFERENCES supply_requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_swaps_source
        FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_swaps_destination
        FOREIGN KEY (destination_shelter_id) REFERENCES shelters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_swaps_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_swaps_creator
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_swaps_approver
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (quantity > 0),
    CHECK (match_score BETWEEN 0 AND 100),
    CHECK (inventory_score BETWEEN 0 AND 100),
    CHECK (urgency_score BETWEEN 0 AND 100),
    CHECK (route_score BETWEEN 0 AND 100),
    CHECK (proximity_score BETWEEN 0 AND 100),
    CHECK (confidence_score BETWEEN 0 AND 100),
    CHECK (impact_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 6. ROUTES + SEGMENTS
-- ================================================================

CREATE TABLE routes (
    id CHAR(36) NOT NULL PRIMARY KEY,
    route_code VARCHAR(50) NOT NULL,
    origin_warehouse_id CHAR(36) NOT NULL,
    destination_shelter_id CHAR(36) NOT NULL,
    geometry LINESTRING NOT NULL,
    distance_meters DECIMAL(14,2) NOT NULL,
    estimated_duration_seconds INT NOT NULL,
    status ENUM('OPEN','CAUTION','RESTRICTED','BLOCKED','UNKNOWN')
        NOT NULL DEFAULT 'UNKNOWN',
    confidence DECIMAL(6,2) NOT NULL DEFAULT 0,
    risk_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    vehicle_suitability ENUM('GENERAL','HEAVY','REFRIGERATED','LIGHT_ONLY')
        NOT NULL DEFAULT 'GENERAL',
    calculated_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_routes_code (route_code),
    KEY idx_routes_status (status),
    KEY idx_routes_origin (origin_warehouse_id),
    KEY idx_routes_destination (destination_shelter_id),
    SPATIAL INDEX idx_routes_geometry (geometry),
    CONSTRAINT fk_routes_origin
        FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_routes_destination
        FOREIGN KEY (destination_shelter_id) REFERENCES shelters(id) ON DELETE RESTRICT,
    CHECK (distance_meters >= 0),
    CHECK (estimated_duration_seconds >= 0),
    CHECK (confidence BETWEEN 0 AND 100),
    CHECK (risk_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE route_segments (
    id CHAR(36) NOT NULL PRIMARY KEY,
    route_id CHAR(36) NOT NULL,
    segment_order INT NOT NULL,
    geometry LINESTRING NOT NULL,
    distance_meters DECIMAL(14,2) NOT NULL,
    estimated_duration_seconds INT NOT NULL,
    status ENUM('SAFE','CAUTION','BLOCKED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    confidence DECIMAL(6,2) NOT NULL DEFAULT 0,
    road_name VARCHAR(150),
    road_identifier VARCHAR(80),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_route_segment_order (route_id, segment_order),
    KEY idx_route_segments_route (route_id),
    SPATIAL INDEX idx_route_segments_geometry (geometry),
    CONSTRAINT fk_route_segments_route
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
    CHECK (segment_order >= 1),
    CHECK (distance_meters >= 0),
    CHECK (estimated_duration_seconds >= 0),
    CHECK (confidence BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. HAZARDS
-- ================================================================

CREATE TABLE hazard_sources (
    id CHAR(36) NOT NULL PRIMARY KEY,
    type ENUM('SENSOR','FIELD_REPORT','SATELLITE','MANUAL_ENTRY','EXTERNAL_API') NOT NULL,
    name VARCHAR(150) NOT NULL,
    reliability_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    metadata JSON,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    CHECK (reliability_score BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE hazards (
    id CHAR(36) NOT NULL PRIMARY KEY,
    type ENUM(
        'FLOOD','DEBRIS_FLOW','BRIDGE_DAMAGE','ROAD_DAMAGE',
        'LANDSLIDE','SUBMERGED_INTERSECTION','WEATHER','OTHER'
    ) NOT NULL,
    severity ENUM('LOW','MODERATE','HIGH','CRITICAL') NOT NULL,
    geometry GEOMETRY NOT NULL,
    location_name VARCHAR(200),
    description VARCHAR(1000),
    source_id CHAR(36) NOT NULL,
    status ENUM('REPORTED','UNDER_REVIEW','VERIFIED','REJECTED','RESOLVED','EXPIRED')
        NOT NULL DEFAULT 'REPORTED',
    confidence ENUM('LOW','MEDIUM','HIGH','VERIFIED') NOT NULL DEFAULT 'LOW',
    reported_at DATETIME(3) NOT NULL,
    verified_at DATETIME(3),
    verified_by CHAR(36),
    expires_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_hazards_type (type),
    KEY idx_hazards_severity (severity),
    KEY idx_hazards_status (status),
    KEY idx_hazards_status_severity (status, severity),
    SPATIAL INDEX idx_hazards_geometry (geometry),
    CONSTRAINT fk_hazards_source
        FOREIGN KEY (source_id) REFERENCES hazard_sources(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hazards_verifier
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 8. VEHICLES + CONVOYS
-- ================================================================

CREATE TABLE vehicles (
    id CHAR(36) NOT NULL PRIMARY KEY,
    registration_number VARCHAR(40) NOT NULL,
    vehicle_type VARCHAR(80) NOT NULL,
    capacity DECIMAL(14,2) NOT NULL,
    capacity_unit VARCHAR(30) NOT NULL,
    heavy_vehicle BOOLEAN NOT NULL DEFAULT FALSE,
    refrigerated BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('AVAILABLE','ASSIGNED','IN_TRANSIT','MAINTENANCE','OFFLINE')
        NOT NULL DEFAULT 'AVAILABLE',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_vehicle_registration (registration_number),
    KEY idx_vehicles_status (status),
    CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE convoys (
    id CHAR(36) NOT NULL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    supply_swap_id CHAR(36),
    origin_warehouse_id CHAR(36) NOT NULL,
    destination_shelter_id CHAR(36) NOT NULL,
    route_id CHAR(36),
    vehicle_id CHAR(36) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_phone VARCHAR(30),
    status ENUM(
        'PLANNED','PREPARING','LOADED','DEPARTED','ON_ROUTE',
        'CAUTION','REROUTING','PAUSED','ARRIVED','DELIVERED','CANCELLED','STRANDED'
    ) NOT NULL DEFAULT 'PLANNED',
    started_at DATETIME(3),
    estimated_arrival DATETIME(3),
    actual_arrival DATETIME(3),
    last_location POINT,
    last_check_in_at DATETIME(3),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_convoys_code (code),
    KEY idx_convoys_status_updated (status, updated_at),
    KEY idx_convoys_origin (origin_warehouse_id),
    KEY idx_convoys_destination (destination_shelter_id),
    KEY idx_convoys_route (route_id),
    SPATIAL INDEX idx_convoys_last_location (last_location),
    CONSTRAINT fk_convoys_swap
        FOREIGN KEY (supply_swap_id) REFERENCES supply_swaps(id) ON DELETE SET NULL,
    CONSTRAINT fk_convoys_origin
        FOREIGN KEY (origin_warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_convoys_destination
        FOREIGN KEY (destination_shelter_id) REFERENCES shelters(id) ON DELETE RESTRICT,
    CONSTRAINT fk_convoys_route
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    CONSTRAINT fk_convoys_vehicle
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE convoy_cargo (
    id CHAR(36) NOT NULL PRIMARY KEY,
    convoy_id CHAR(36) NOT NULL,
    supply_type_id CHAR(36) NOT NULL,
    quantity DECIMAL(14,2) NOT NULL,
    inventory_transaction_id CHAR(36),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_convoy_cargo_convoy (convoy_id),
    CONSTRAINT fk_convoy_cargo_convoy
        FOREIGN KEY (convoy_id) REFERENCES convoys(id) ON DELETE RESTRICT,
    CONSTRAINT fk_convoy_cargo_supply
        FOREIGN KEY (supply_type_id) REFERENCES supply_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_convoy_cargo_tx
        FOREIGN KEY (inventory_transaction_id) REFERENCES inventory_transactions(id) ON DELETE SET NULL,
    CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE convoy_locations (
    id CHAR(36) NOT NULL PRIMARY KEY,
    convoy_id CHAR(36) NOT NULL,
    location POINT NOT NULL,
    recorded_at DATETIME(3) NOT NULL,
    speed DECIMAL(8,2),
    heading DECIMAL(6,2),
    source VARCHAR(50) NOT NULL DEFAULT 'GPS',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_convoy_locations_convoy_time (convoy_id, recorded_at),
    SPATIAL INDEX idx_convoy_locations_location (location),
    CONSTRAINT fk_convoy_locations_convoy
        FOREIGN KEY (convoy_id) REFERENCES convoys(id) ON DELETE RESTRICT,
    CHECK (speed IS NULL OR speed >= 0),
    CHECK (heading IS NULL OR heading >= 0 AND heading <= 360)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 9. ALERTS + SETTINGS + AUDIT + EVENTS
-- ================================================================

CREATE TABLE alerts (
    id CHAR(36) NOT NULL PRIMARY KEY,
    type ENUM('HAZARD','ROUTE','INVENTORY','SHELTER','CONVOY','SUPPLY_SWAP','SYSTEM') NOT NULL,
    severity ENUM('CRITICAL','ACTION_REQUIRED','ADVISORY','INFORMATION') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    entity_type VARCHAR(50),
    entity_id CHAR(36),
    status ENUM('UNREAD','ACKNOWLEDGED','RESOLVED','DISMISSED') NOT NULL DEFAULT 'UNREAD',
    district VARCHAR(120),
    warehouse_id CHAR(36),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    acknowledged_at DATETIME(3),
    acknowledged_by CHAR(36),
    resolved_at DATETIME(3),
    KEY idx_alerts_status_severity_created (status, severity, created_at),
    KEY idx_alerts_entity (entity_type, entity_id),
    KEY idx_alerts_warehouse (warehouse_id),
    CONSTRAINT fk_alerts_warehouse
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
    CONSTRAINT fk_alerts_ack_user
        FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_preferences (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    critical_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    route_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    inventory_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    convoy_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    shelter_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    supply_swap_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_notification_preferences_user (user_id),
    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36) NOT NULL,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_created (created_at),
    KEY idx_audit_user (user_id),
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id CHAR(36),
    payload JSON,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    processed_at DATETIME(3),
    KEY idx_events_processed_created (processed, created_at),
    KEY idx_events_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 10. VIEWS
-- ================================================================

CREATE OR REPLACE VIEW vw_inventory_availability AS
SELECT
    i.id AS inventory_id,
    w.id AS warehouse_id,
    w.code AS warehouse_code,
    w.name AS warehouse,
    st.id AS supply_type_id,
    st.code AS supply_code,
    st.name AS supply_type,
    i.sku,
    i.quantity_on_hand,
    i.quantity_reserved,
    (i.quantity_on_hand - i.quantity_reserved) AS quantity_transferable,
    i.quantity_at_risk,
    i.status,
    i.expiry_date
FROM inventory_items i
JOIN warehouses w ON w.id = i.warehouse_id
JOIN supply_types st ON st.id = i.supply_type_id
WHERE i.deleted_at IS NULL
  AND w.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_shelter_supply_status AS
SELECT
    sd.id AS demand_id,
    s.id AS shelter_id,
    s.code AS shelter_code,
    s.name AS shelter,
    s.region,
    st.id AS supply_type_id,
    st.code AS supply_code,
    st.name AS supply,
    sd.current_quantity,
    sd.required_quantity,
    CASE
        WHEN sd.consumption_rate > 0
        THEN sd.current_quantity / sd.consumption_rate
        ELSE NULL
    END AS coverage_hours,
    sd.priority,
    s.status AS shelter_status,
    s.isolation_risk
FROM shelter_demands sd
JOIN shelters s ON s.id = sd.shelter_id
JOIN supply_types st ON st.id = sd.supply_type_id
WHERE s.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_active_convoys AS
SELECT
    c.id AS convoy_id,
    c.code AS convoy_code,
    w.code AS warehouse_code,
    w.name AS warehouse,
    s.code AS shelter_code,
    s.name AS shelter,
    r.route_code,
    r.status AS route_status,
    v.registration_number,
    v.vehicle_type,
    v.refrigerated,
    c.status,
    c.last_location,
    c.last_check_in_at,
    c.estimated_arrival
FROM convoys c
JOIN warehouses w ON w.id = c.origin_warehouse_id
JOIN shelters s ON s.id = c.destination_shelter_id
LEFT JOIN routes r ON r.id = c.route_id
JOIN vehicles v ON v.id = c.vehicle_id
WHERE c.status IN ('PREPARING','LOADED','DEPARTED','ON_ROUTE','CAUTION','REROUTING','PAUSED','STRANDED');

CREATE OR REPLACE VIEW vw_critical_operations AS
SELECT 'CRITICAL_SHELTER' AS operation_type, s.id AS entity_id, s.name AS entity_name,
       s.isolation_risk AS severity_or_status, NULL AS reference_id
FROM shelters s
WHERE s.status = 'ISOLATED' OR s.isolation_risk IN ('HIGH','CRITICAL')
UNION ALL
SELECT 'CRITICAL_INVENTORY', i.id, CONCAT(w.name, ' - ', st.name),
       i.status, w.id
FROM inventory_items i
JOIN warehouses w ON w.id=i.warehouse_id
JOIN supply_types st ON st.id=i.supply_type_id
WHERE i.status='CRITICAL'
UNION ALL
SELECT 'CRITICAL_HAZARD', h.id, h.location_name,
       h.severity, NULL
FROM hazards h
WHERE h.severity='CRITICAL' AND h.status IN ('REPORTED','UNDER_REVIEW','VERIFIED')
UNION ALL
SELECT 'BLOCKED_ROUTE', r.id, r.route_code,
       r.status, NULL
FROM routes r
WHERE r.status='BLOCKED'
UNION ALL
SELECT 'STRANDED_CONVOY', c.id, c.code,
       c.status, NULL
FROM convoys c
WHERE c.status='STRANDED';

-- ================================================================
-- 11. DEMO DATA
-- 15 dummy/demo records are included in every major operational
-- collection where practical, while maintaining the richer minimum
-- seed structure required by the product.
-- ================================================================

-- Fixed UUIDs make this SQL deterministic and easy to reference.

-- Roles
INSERT INTO roles (id,name,description) VALUES
('00000000-0000-0000-0000-000000000001','ADMIN','Full platform administrator'),
('00000000-0000-0000-0000-000000000002','WAREHOUSE_MANAGER','Manages warehouse inventory, swaps and dispatch'),
('00000000-0000-0000-0000-000000000003','OPERATOR','Operational logistics operator'),
('00000000-0000-0000-0000-000000000004','VIEWER','Read-only operational viewer');

-- Permissions
INSERT INTO permissions (id,name,description) VALUES
('10000000-0000-0000-0000-000000000001','VIEW_DASHBOARD','View dashboard'),
('10000000-0000-0000-0000-000000000002','VIEW_INVENTORY','View inventory'),
('10000000-0000-0000-0000-000000000003','MANAGE_INVENTORY','Manage inventory'),
('10000000-0000-0000-0000-000000000004','VIEW_SHELTERS','View shelters'),
('10000000-0000-0000-0000-000000000005','VIEW_SUPPLY_REQUESTS','View supply requests'),
('10000000-0000-0000-0000-000000000006','CREATE_SUPPLY_OFFER','Create supply offers'),
('10000000-0000-0000-0000-000000000007','VIEW_SUPPLY_SWAPS','View Supply Swaps'),
('10000000-0000-0000-0000-000000000008','CREATE_SUPPLY_SWAP','Create Supply Swaps'),
('10000000-0000-0000-0000-000000000009','APPROVE_SUPPLY_SWAP','Approve Supply Swaps'),
('10000000-0000-0000-0000-000000000010','REJECT_SUPPLY_SWAP','Reject Supply Swaps'),
('10000000-0000-0000-0000-000000000011','VIEW_CONVOYS','View convoys'),
('10000000-0000-0000-0000-000000000012','CREATE_CONVOY','Create convoy'),
('10000000-0000-0000-0000-000000000013','MANAGE_CONVOYS','Manage convoys'),
('10000000-0000-0000-0000-000000000014','REROUTE_CONVOY','Reroute convoy'),
('10000000-0000-0000-0000-000000000015','VIEW_HAZARDS','View hazards'),
('10000000-0000-0000-0000-000000000016','CREATE_HAZARD','Create hazard'),
('10000000-0000-0000-0000-000000000017','VERIFY_HAZARD','Verify hazard'),
('10000000-0000-0000-0000-000000000018','VIEW_ALERTS','View alerts'),
('10000000-0000-0000-0000-000000000019','ACKNOWLEDGE_ALERT','Acknowledge alert'),
('10000000-0000-0000-0000-000000000020','VIEW_AUDIT_LOG','View audit log'),
('10000000-0000-0000-0000-000000000021','MANAGE_SETTINGS','Manage settings');

-- Admin gets all permissions
INSERT INTO role_permissions
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions;

-- Warehouse manager gets operational permissions
INSERT INTO role_permissions (role_id,permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id
FROM permissions
WHERE name IN (
'VIEW_DASHBOARD','VIEW_INVENTORY','MANAGE_INVENTORY','VIEW_SHELTERS',
'VIEW_SUPPLY_REQUESTS','CREATE_SUPPLY_OFFER','VIEW_SUPPLY_SWAPS',
'CREATE_SUPPLY_SWAP','APPROVE_SUPPLY_SWAP','REJECT_SUPPLY_SWAP',
'VIEW_CONVOYS','CREATE_CONVOY','MANAGE_CONVOYS','REROUTE_CONVOY',
'VIEW_HAZARDS','VIEW_ALERTS','ACKNOWLEDGE_ALERT','MANAGE_SETTINGS'
);

-- Operator
INSERT INTO role_permissions (role_id,permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE name IN ('VIEW_DASHBOARD','VIEW_INVENTORY','VIEW_SHELTERS','VIEW_CONVOYS','CREATE_CONVOY','MANAGE_CONVOYS','VIEW_HAZARDS','CREATE_HAZARD','VIEW_ALERTS','ACKNOWLEDGE_ALERT');

-- Viewer
INSERT INTO role_permissions (role_id,permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE name LIKE 'VIEW_%';

-- Warehouses
INSERT INTO warehouses
(id,code,name,description,latitude,longitude,location,capacity,status,operational_status,contact_name,contact_phone)
VALUES
('20000000-0000-0000-0000-000000000001','WH-GHY-01','Guwahati Regional Relief Hub','Primary regional storage hub',26.1445,91.7362,ST_GeomFromText('POINT(91.7362 26.1445)',4326),50000,'FUNCTIONAL','NORMAL','Anil Das','+91-9000000001'),
('20000000-0000-0000-0000-000000000002','WH-RIV-02','Riverside Relief Warehouse','Secondary hub near river corridor',26.1508,91.7830,ST_GeomFromText('POINT(91.7830 26.1508)',4326),35000,'LIMITED','DEGRADED','Maya Sharma','+91-9000000002'),
('20000000-0000-0000-0000-000000000003','WH-HIL-03','Hillside Emergency Depot','Hillside depot affected by debris flow',26.1785,91.7110,ST_GeomFromText('POINT(91.7110 26.1785)',4326),20000,'LIMITED','RESTRICTED','Rakesh Bora','+91-9000000003');

-- Users (demo passwords are placeholders; production hashes must be generated by backend)
INSERT INTO users
(id,name,email,phone,password_hash,role_id,warehouse_id,is_active)
VALUES
('30000000-0000-0000-0000-000000000001','System Administrator','admin@relief.local','+91-9000010001','$2b$12$DEMO_HASH_REPLACE_IN_BACKEND','00000000-0000-0000-0000-000000000001',NULL,1),
('30000000-0000-0000-0000-000000000002','Warehouse Manager - Guwahati','manager1@relief.local','+91-9000010002','$2b$12$DEMO_HASH_REPLACE_IN_BACKEND','00000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',1),
('30000000-0000-0000-0000-000000000003','Warehouse Manager - Riverside','manager2@relief.local','+91-9000010003','$2b$12$DEMO_HASH_REPLACE_IN_BACKEND','00000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',1),
('30000000-0000-0000-0000-000000000004','Operations Officer','operator@relief.local','+91-9000010004','$2b$12$DEMO_HASH_REPLACE_IN_BACKEND','00000000-0000-0000-0000-000000000003',NULL,1),
('30000000-0000-0000-0000-000000000005','Read Only Analyst','viewer@relief.local','+91-9000010005','$2b$12$DEMO_HASH_REPLACE_IN_BACKEND','00000000-0000-0000-0000-000000000004',NULL,1);

-- Supply types
INSERT INTO supply_types
(id,code,name,description,unit,is_critical,requires_cold_chain,shelf_life_days)
VALUES
('40000000-0000-0000-0000-000000000001','INSULIN','Insulin','Temperature-sensitive insulin supplies','vials',1,1,180),
('40000000-0000-0000-0000-000000000002','BLOOD_BAGS','Blood Bags','Blood collection and transfusion bags','bags',1,1,35),
('40000000-0000-0000-0000-000000000003','INFANT_NUTRITION','Infant Nutrition','Infant formula and nutrition packs','packs',1,0,365),
('40000000-0000-0000-0000-000000000004','POTABLE_WATER','Potable Water','Safe drinking water','litres',1,0,365),
('40000000-0000-0000-0000-000000000005','ORAL_REHYDRATION','Oral Rehydration Salts','ORS packets','packets',0,0,730),
('40000000-0000-0000-0000-000000000006','BLANKETS','Emergency Blankets','Thermal emergency blankets','units',0,0,3650);

-- 20 inventory records
INSERT INTO inventory_items
(id,warehouse_id,supply_type_id,sku,name,batch_number,quantity_on_hand,quantity_reserved,quantity_at_risk,minimum_stock,critical_stock,unit,item_condition,status,expiry_date)
VALUES
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','INS-GHY-001','Insulin Vials Batch A','IN-A01',100,40,5,50,25,'vials','GOOD','LOW','2027-02-28'),
('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','BLD-GHY-001','Blood Bags Batch A','BL-A01',180,20,0,80,40,'bags','GOOD','AVAILABLE','2027-01-31'),
('50000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003','INF-GHY-001','Infant Nutrition Batch A','IF-A01',600,100,0,250,120,'packs','GOOD','AVAILABLE','2028-01-31'),
('50000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','WTR-GHY-001','Potable Water Batch A','WT-A01',12000,2500,300,5000,2500,'litres','GOOD','AVAILABLE','2028-12-31'),
('50000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000005','ORS-GHY-001','ORS Batch A','OR-A01',900,100,0,300,100,'packets','GOOD','AVAILABLE','2028-06-30'),
('50000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000006','BLK-GHY-001','Emergency Blankets Batch A','EB-A01',500,50,0,200,80,'units','GOOD','AVAILABLE','2030-12-31'),
('50000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','INS-RIV-001','Insulin Vials Batch R','IN-R01',75,15,10,45,25,'vials','GOOD','LOW','2027-03-31'),
('50000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','BLD-RIV-001','Blood Bags Batch R','BL-R01',100,10,0,50,25,'bags','GOOD','AVAILABLE','2027-02-28'),
('50000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000003','INF-RIV-001','Infant Nutrition Batch R','IF-R01',300,60,0,150,75,'packs','GOOD','AVAILABLE','2028-02-28'),
('50000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000004','WTR-RIV-001','Potable Water Batch R','WT-R01',7000,1200,500,3000,1500,'litres','GOOD','AVAILABLE','2028-12-31'),
('50000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000005','ORS-RIV-001','ORS Batch R','OR-R01',500,50,0,200,75,'packets','GOOD','AVAILABLE','2028-07-31'),
('50000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000006','BLK-RIV-001','Emergency Blankets Batch R','EB-R01',300,20,0,100,50,'units','GOOD','AVAILABLE','2030-12-31'),
('50000000-0000-0000-0000-000000000013','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001','INS-HIL-001','Insulin Vials Batch H','IN-H01',35,10,20,30,20,'vials','GOOD','CRITICAL','2027-01-15'),
('50000000-0000-0000-0000-000000000014','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000002','BLD-HIL-001','Blood Bags Batch H','BL-H01',45,5,10,35,20,'bags','GOOD','LOW','2026-12-31'),
('50000000-0000-0000-0000-000000000015','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003','INF-HIL-001','Infant Nutrition Batch H','IF-H01',120,20,10,80,40,'packs','GOOD','LOW','2027-10-31'),
('50000000-0000-0000-0000-000000000016','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000004','WTR-HIL-001','Potable Water Batch H','WT-H01',2500,500,500,1500,700,'litres','GOOD','LOW','2028-12-31'),
('50000000-0000-0000-0000-000000000017','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000005','ORS-HIL-001','ORS Batch H','OR-H01',200,20,0,100,40,'packets','GOOD','AVAILABLE','2028-05-31'),
('50000000-0000-0000-0000-000000000018','20000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000006','BLK-HIL-001','Emergency Blankets Batch H','EB-H01',100,10,0,60,25,'units','GOOD','AVAILABLE','2030-12-31'),
('50000000-0000-0000-0000-000000000019','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','INS-GHY-002','Insulin Vials Batch B','IN-B01',80,20,0,40,20,'vials','GOOD','AVAILABLE','2027-04-30'),
('50000000-0000-0000-0000-000000000020','20000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000004','WTR-RIV-002','Potable Water Batch S','WT-R02',5000,500,200,2500,1200,'litres','GOOD','AVAILABLE','2028-12-31');

-- 8 shelters
INSERT INTO shelters
(id,code,name,description,region,latitude,longitude,location,population,capacity,status,isolation_risk,contact_name,contact_phone)
VALUES
('60000000-0000-0000-0000-000000000001','SH-01','North River Relief Shelter','Large temporary shelter','North River',26.1600,91.7500,ST_GeomFromText('POINT(91.7500 26.1600)',4326),420,600,'ACTIVE','MEDIUM','Nandita Roy','+91-9100000001'),
('60000000-0000-0000-0000-000000000002','SH-02','East Bank Community Shelter','River-bank evacuation center','East Bank',26.1450,91.8050,ST_GeomFromText('POINT(91.8050 26.1450)',4326),380,500,'LIMITED','HIGH','Pallav Singh','+91-9100000002'),
('60000000-0000-0000-0000-000000000003','SH-03','Hillview School Shelter','School converted to shelter','Hillside',26.1900,91.7200,ST_GeomFromText('POINT(91.7200 26.1900)',4326),240,350,'ISOLATED','CRITICAL','Biren Kalita','+91-9100000003'),
('60000000-0000-0000-0000-000000000004','SH-04','Central Stadium Shelter','Central emergency shelter','Central',26.1550,91.7350,ST_GeomFromText('POINT(91.7350 26.1550)',4326),700,1000,'ACTIVE','LOW','Mita Das','+91-9100000004'),
('60000000-0000-0000-0000-000000000005','SH-05','South Village Shelter','Rural feeder-road shelter','South Village',26.1200,91.7450,ST_GeomFromText('POINT(91.7450 26.1200)',4326),180,300,'LIMITED','HIGH','Raju Ahmed','+91-9100000005'),
('60000000-0000-0000-0000-000000000006','SH-06','Sector 6 Medical Shelter','Medical priority shelter','Sector 6',26.1700,91.7650,ST_GeomFromText('POINT(91.7650 26.1700)',4326),310,400,'ISOLATED','CRITICAL','Dr. Kavita Sen','+91-9100000006'),
('60000000-0000-0000-0000-000000000007','SH-07','West Ridge Shelter','Remote ridge shelter','West Ridge',26.1800,91.6900,ST_GeomFromText('POINT(91.6900 26.1800)',4326),150,250,'ACTIVE','MEDIUM','Deep Bora','+91-9100000007'),
('60000000-0000-0000-0000-000000000008','SH-08','Airport Transit Shelter','Transit evacuation shelter','Airport',26.1050,91.5900,ST_GeomFromText('POINT(91.5900 26.1050)',4326),500,800,'ACTIVE','LOW','Sanjay Nath','+91-9100000008');

-- 15 shelter demands
INSERT INTO shelter_demands
(id,shelter_id,supply_type_id,current_quantity,required_quantity,consumption_rate,coverage_hours,priority,priority_score)
VALUES
('61000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004',1200,4000,150,8,'HIGH',82),
('61000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000004',800,3000,200,4,'CRITICAL',96),
('61000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001',10,60,2.5,4,'CRITICAL',99),
('61000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003',35,180,5,7,'HIGH',90),
('61000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000004',6000,9000,500,12,'MEDIUM',60),
('61000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003',40,160,4,10,'HIGH',84),
('61000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000001',10,100,2.5,4,'CRITICAL',100),
('61000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000002',12,80,3,4,'CRITICAL',98),
('61000000-0000-0000-0000-000000000009','60000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000004',1500,3500,120,12,'MEDIUM',62),
('61000000-0000-0000-0000-000000000010','60000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000004',3000,5000,250,12,'MEDIUM',58),
('61000000-0000-0000-0000-000000000011','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',20,100,4,5,'CRITICAL',95),
('61000000-0000-0000-0000-000000000012','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001',15,80,3,5,'CRITICAL',97),
('61000000-0000-0000-0000-000000000013','60000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000003',90,250,10,9,'HIGH',80),
('61000000-0000-0000-0000-000000000014','60000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000004',900,3000,100,9,'HIGH',85),
('61000000-0000-0000-0000-000000000015','60000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000003',20,100,4,5,'CRITICAL',91);

-- 10 supply requests
INSERT INTO supply_requests
(id,shelter_id,supply_type_id,quantity_requested,quantity_fulfilled,priority,priority_score,time_to_shortage_hours,status)
VALUES
('62000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001',50,0,'CRITICAL',99,4,'OPEN'),
('62000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000001',90,20,'CRITICAL',100,4,'PARTIALLY_FULFILLED'),
('62000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000002',60,0,'CRITICAL',98,4,'OPEN'),
('62000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000004',2200,0,'CRITICAL',96,4,'OPEN'),
('62000000-0000-0000-0000-000000000005','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',80,0,'CRITICAL',95,5,'OPEN'),
('62000000-0000-0000-0000-000000000006','60000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003',120,0,'HIGH',84,10,'OPEN'),
('62000000-0000-0000-0000-000000000007','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001',60,0,'CRITICAL',97,5,'OPEN'),
('62000000-0000-0000-0000-000000000008','60000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000003',80,0,'CRITICAL',91,5,'OPEN'),
('62000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000003',160,50,'HIGH',80,9,'PARTIALLY_FULFILLED'),
('62000000-0000-0000-0000-000000000010','60000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000004',2000,0,'MEDIUM',58,12,'OPEN');

-- Hazard sources
INSERT INTO hazard_sources (id,type,name,reliability_score,metadata) VALUES
('70000000-0000-0000-0000-000000000001','SENSOR','River Gauge Network',92,'{"network":"Assam Flood Sensors","sampling":"5m"}'),
('70000000-0000-0000-0000-000000000002','FIELD_REPORT','Driver Field Reports',85,'{"verification":"control-room"}'),
('70000000-0000-0000-0000-000000000003','SATELLITE','Satellite Flood Monitor',88,'{"refresh":"15m"}'),
('70000000-0000-0000-0000-000000000004','MANUAL_ENTRY','Control Room Manual Entry',95,'{"authority":"control-room"}'),
('70000000-0000-0000-0000-000000000005','EXTERNAL_API','Weather Risk Feed',78,'{"provider":"demo-weather-feed"}');

-- 15 hazards: earthquake consequences
INSERT INTO hazards
(id,type,severity,geometry,location_name,description,source_id,status,confidence,reported_at,verified_at,verified_by)
VALUES
('71000000-0000-0000-0000-000000000001','FLOOD','CRITICAL',ST_GeomFromText('POLYGON((91.7800 26.1400,91.8000 26.1400,91.8000 26.1550,91.7800 26.1550,91.7800 26.1400))',4326),'East Bank Junction','Fast-moving river overflow; depth approximately 1.2m.','70000000-0000-0000-0000-000000000001','VERIFIED','VERIFIED','2026-08-30 07:30:00.000','2026-08-30 07:45:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000002','DEBRIS_FLOW','CRITICAL',ST_GeomFromText('LINESTRING(91.7050 26.1750,91.7200 26.1850)',4326),'Hillside Road H-14','Earthquake-triggered debris flow across rural feeder road.','70000000-0000-0000-0000-000000000002','VERIFIED','HIGH','2026-08-30 07:20:00.000','2026-08-30 07:50:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000003','BRIDGE_DAMAGE','CRITICAL',ST_GeomFromText('POINT(91.7420 26.1610)',4326),'Bridge B-14','Structural damage; heavy vehicles prohibited.','70000000-0000-0000-0000-000000000004','VERIFIED','VERIFIED','2026-08-30 07:10:00.000','2026-08-30 07:25:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000004','SUBMERGED_INTERSECTION','HIGH',ST_GeomFromText('POINT(91.7680 26.1500)',4326),'Sector 5 Intersection','Intersection submerged under approximately 0.8m water.','70000000-0000-0000-0000-000000000001','UNDER_REVIEW','HIGH','2026-08-30 07:40:00.000',NULL,NULL),
('71000000-0000-0000-0000-000000000005','ROAD_DAMAGE','HIGH',ST_GeomFromText('LINESTRING(91.7350 26.1800,91.7480 26.1850)',4326),'North Feeder Road','Road surface failure after seismic shaking.','70000000-0000-0000-0000-000000000002','REPORTED','MEDIUM','2026-08-30 07:55:00.000',NULL,NULL),
('71000000-0000-0000-0000-000000000006','FLOOD','HIGH',ST_GeomFromText('POLYGON((91.7300 26.1150,91.7500 26.1150,91.7500 26.1280,91.7300 26.1280,91.7300 26.1150))',4326),'South Village Floodplain','Tributary overflow affecting feeder roads.','70000000-0000-0000-0000-000000000003','VERIFIED','HIGH','2026-08-30 06:50:00.000','2026-08-30 07:20:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000007','LANDSLIDE','MODERATE',ST_GeomFromText('POINT(91.6980 26.1900)',4326),'West Ridge Cut','Partial slope movement beside road.','70000000-0000-0000-0000-000000000002','REPORTED','MEDIUM','2026-08-30 08:00:00.000',NULL,NULL),
('71000000-0000-0000-0000-000000000008','WEATHER','HIGH',ST_GeomFromText('POLYGON((91.6900 26.1300,91.7300 26.1300,91.7300 26.1700,91.6900 26.1700,91.6900 26.1300))',4326),'Western Storm Cell','Heavy rainfall forecast; flash-flood risk elevated.','70000000-0000-0000-0000-000000000005','VERIFIED','HIGH','2026-08-30 07:00:00.000','2026-08-30 07:30:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000009','ROAD_DAMAGE','MODERATE',ST_GeomFromText('LINESTRING(91.7550 26.1650,91.7650 26.1720)',4326),'Sector 6 Access Road','Multiple cracks; light vehicles only.','70000000-0000-0000-0000-000000000004','VERIFIED','VERIFIED','2026-08-30 06:45:00.000','2026-08-30 07:05:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000010','FLOOD','MODERATE',ST_GeomFromText('POINT(91.7950 26.1600)',4326),'River Tributary Crossing','Water level rising rapidly.','70000000-0000-0000-0000-000000000001','REPORTED','HIGH','2026-08-30 08:10:00.000',NULL,NULL),
('71000000-0000-0000-0000-000000000011','BRIDGE_DAMAGE','HIGH',ST_GeomFromText('POINT(91.7550 26.1450)',4326),'Bridge B-22','Deck displacement; closed to heavy vehicles.','70000000-0000-0000-0000-000000000002','VERIFIED','HIGH','2026-08-30 06:30:00.000','2026-08-30 07:10:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000012','DEBRIS_FLOW','HIGH',ST_GeomFromText('LINESTRING(91.6900 26.1800,91.7050 26.1880)',4326),'West Ridge Debris Channel','Fresh debris across access track.','70000000-0000-0000-0000-000000000003','VERIFIED','HIGH','2026-08-30 07:15:00.000','2026-08-30 07:55:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000013','SUBMERGED_INTERSECTION','HIGH',ST_GeomFromText('POINT(91.7400 26.1250)',4326),'South Junction','Fast water crossing rural junction.','70000000-0000-0000-0000-000000000002','REPORTED','MEDIUM','2026-08-30 08:05:00.000',NULL,NULL),
('71000000-0000-0000-0000-000000000014','ROAD_DAMAGE','LOW',ST_GeomFromText('LINESTRING(91.7200 26.1450,91.7280 26.1500)',4326),'Central Link Road','Minor cracking; monitored.','70000000-0000-0000-0000-000000000004','VERIFIED','VERIFIED','2026-08-30 05:50:00.000','2026-08-30 06:20:00.000','30000000-0000-0000-0000-000000000001'),
('71000000-0000-0000-0000-000000000015','FLOOD','CRITICAL',ST_GeomFromText('POINT(91.7650 26.1700)',4326),'Sector 6 Medical Approach','Flooding isolates medical shelter access.','70000000-0000-0000-0000-000000000002','VERIFIED','VERIFIED','2026-08-30 07:25:00.000','2026-08-30 07:40:00.000','30000000-0000-0000-0000-000000000001');

-- Routes (10)
INSERT INTO routes
(id,route_code,origin_warehouse_id,destination_shelter_id,geometry,distance_meters,estimated_duration_seconds,status,confidence,risk_score,vehicle_suitability,calculated_at)
VALUES
('80000000-0000-0000-0000-000000000001','R-GHY-SH01','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7440 26.1500,91.7500 26.1600)',4326),2800,900,'OPEN',92,18,'GENERAL','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000002','R-GHY-SH02','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7600 26.1500,91.7900 26.1450)',4326),6200,1800,'BLOCKED',55,92,'GENERAL','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000003','R-GHY-SH03','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7200 26.1650,91.7120 26.1850)',4326),7600,2400,'CAUTION',68,72,'LIGHT_ONLY','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000004','R-RIV-SH04','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000004',ST_GeomFromText('LINESTRING(91.7830 26.1508,91.7600 26.1550,91.7350 26.1550)',4326),5000,1500,'CAUTION',75,54,'GENERAL','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000005','R-RIV-SH06','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000006',ST_GeomFromText('LINESTRING(91.7830 26.1508,91.7750 26.1600,91.7650 26.1700)',4326),4300,1700,'BLOCKED',50,96,'LIGHT_ONLY','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000006','R-HIL-SH07','20000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000007',ST_GeomFromText('LINESTRING(91.7110 26.1785,91.7000 26.1800,91.6900 26.1800)',4326),3900,1500,'RESTRICTED',60,81,'LIGHT_ONLY','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000007','R-GHY-SH05','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000005',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7500 26.1350,91.7450 26.1200)',4326),4300,1600,'CAUTION',70,61,'GENERAL','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000008','R-GHY-SH06','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000006',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7550 26.1550,91.7650 26.1700)',4326),4200,1500,'BLOCKED',48,94,'LIGHT_ONLY','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000009','R-RIV-SH08','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000008',ST_GeomFromText('LINESTRING(91.7830 26.1508,91.7500 26.1400,91.7000 26.1200,91.5900 26.1050)',4326),21000,5200,'OPEN',90,22,'GENERAL','2026-08-30 08:00:00.000'),
('80000000-0000-0000-0000-000000000010','R-GHY-SH04','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004',ST_GeomFromText('LINESTRING(91.7362 26.1445,91.7350 26.1550)',4326),1600,600,'OPEN',96,10,'HEAVY','2026-08-30 08:00:00.000');

-- 30 route segments: 3 per route
INSERT INTO route_segments
(id,route_id,segment_order,geometry,distance_meters,estimated_duration_seconds,status,confidence,road_name,road_identifier)
SELECT
    CONCAT('81000000-0000-0000-0000-',LPAD(ROW_NUMBER() OVER (ORDER BY r.route_code,s.segment_order),12,'0')),
    r.id,
    s.segment_order,
    r.geometry,
    ROUND(r.distance_meters/3,2),
    ROUND(r.estimated_duration_seconds/3),
    CASE
      WHEN r.status='BLOCKED' THEN 'BLOCKED'
      WHEN r.status IN ('CAUTION','RESTRICTED') THEN 'CAUTION'
      WHEN r.status='OPEN' THEN 'SAFE'
      ELSE 'UNKNOWN'
    END,
    r.confidence,
    CONCAT('Segment ',s.segment_order,' - ',r.route_code),
    CONCAT('SEG-',r.route_code,'-',s.segment_order)
FROM routes r
CROSS JOIN (
    SELECT 1 AS segment_order
    UNION ALL SELECT 2
    UNION ALL SELECT 3
) s
ORDER BY r.route_code, s.segment_order;

-- Vehicles
INSERT INTO vehicles
(id,registration_number,vehicle_type,capacity,capacity_unit,heavy_vehicle,refrigerated,status)
VALUES
('90000000-0000-0000-0000-000000000001','AS01-TR-1001','Refrigerated Van',1000,'kg',0,1,'AVAILABLE'),
('90000000-0000-0000-0000-000000000002','AS01-TR-1002','Heavy Relief Truck',8000,'kg',1,0,'ASSIGNED'),
('90000000-0000-0000-0000-000000000003','AS01-TR-1003','Refrigerated Truck',5000,'kg',1,1,'IN_TRANSIT'),
('90000000-0000-0000-0000-000000000004','AS01-TR-1004','Light Utility Truck',2500,'kg',0,0,'AVAILABLE'),
('90000000-0000-0000-0000-000000000005','AS01-TR-1005','Emergency Truck',6000,'kg',1,0,'MAINTENANCE');

-- 10 supply offers
INSERT INTO supply_offers
(id,warehouse_id,inventory_item_id,supply_type_id,quantity,available_from,expires_at,status,created_by)
VALUES
('A0000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',40,NOW(),DATE_ADD(NOW(),INTERVAL 12 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002'),
('A0000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000019','40000000-0000-0000-0000-000000000001',30,NOW(),DATE_ADD(NOW(),INTERVAL 12 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002'),
('A0000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002',60,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002'),
('A0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003',120,NOW(),DATE_ADD(NOW(),INTERVAL 48 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002'),
('A0000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000004',2000,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002'),
('A0000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000001',50,NOW(),DATE_ADD(NOW(),INTERVAL 12 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000003'),
('A0000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000002',50,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000003'),
('A0000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000009','40000000-0000-0000-0000-000000000003',80,NOW(),DATE_ADD(NOW(),INTERVAL 48 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000003'),
('A0000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000010','40000000-0000-0000-0000-000000000004',1500,NOW(),DATE_ADD(NOW(),INTERVAL 24 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000003'),
('A0000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000015','40000000-0000-0000-0000-000000000003',50,NOW(),DATE_ADD(NOW(),INTERVAL 48 HOUR),'AVAILABLE','30000000-0000-0000-0000-000000000002');

-- 10 Supply Swaps. Critical insulin scenario is included.
INSERT INTO supply_swaps
(id,offer_id,request_id,source_warehouse_id,destination_shelter_id,supply_type_id,quantity,
match_score,inventory_score,urgency_score,route_score,proximity_score,confidence_score,impact_score,
status,route_id,created_by,approved_by,approved_at,match_reasons,warnings)
VALUES
('B0000000-0000-0000-0000-000000000001','A0000000-0000-0000-0000-000000000001','62000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001',40,94,92,99,62,78,88,85,'UNDER_REVIEW','80000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002',NULL,NULL,
'["Shelter has less than 6 hours of insulin coverage","Warehouse has transferable inventory","Critical request"]',
'["Destination route is caution-rated","Bridge damage reported nearby"]'),
('B0000000-0000-0000-0000-000000000002','A0000000-0000-0000-0000-000000000002','62000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001',30,88,86,97,20,72,81,77,'PROPOSED','80000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',NULL,NULL,
'["Available insulin","Critical shelter request"]',
'["Primary route blocked"]'),
('B0000000-0000-0000-0000-000000000003','A0000000-0000-0000-0000-000000000003','62000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',60,91,94,95,82,75,91,89,'APPROVED','80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',NOW(),
'["Blood stock available","Route currently open"]','[]'),
('B0000000-0000-0000-0000-000000000004','A0000000-0000-0000-0000-000000000004','62000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003',120,86,83,84,70,80,85,79,'RESERVED','80000000-0000-0000-0000-000000000007','30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',NOW(),
'["Infant nutrition available","High shelter urgency"]','["Flood risk on southern approach"]'),
('B0000000-0000-0000-0000-000000000005','A0000000-0000-0000-0000-000000000005','62000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000004',1500,83,90,58,90,60,87,76,'ACTIVE','80000000-0000-0000-0000-000000000009','30000000-0000-0000-0000-000000000002',NULL,NULL,
'["Large transferable water stock","Open route"]','[]'),
('B0000000-0000-0000-0000-000000000006','A0000000-0000-0000-0000-000000000006','62000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000001',35,72,78,100,18,74,65,82,'REROUTING','80000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003',NULL,NULL,
'["Riverside warehouse has insulin","Medical shelter critical"]',
'["Route blocked by flooding"]'),
('B0000000-0000-0000-0000-000000000007','A0000000-0000-0000-0000-000000000007','62000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000002',45,79,82,98,18,70,71,84,'PAUSED','80000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000003',NULL,NULL,
'["Blood available","Medical shelter critical"]',
'["Bridge and flood hazards on route"]'),
('B0000000-0000-0000-0000-000000000008','A0000000-0000-0000-0000-000000000008','62000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000003',80,89,85,91,58,81,86,83,'DELIVERED','80000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002',NOW(),
'["Infant nutrition match","Feasible light-vehicle route"]','[]'),
('B0000000-0000-0000-0000-000000000009','A0000000-0000-0000-0000-000000000009','62000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000004',1000,87,88,80,72,83,90,81,'ACTIVE','80000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000003',NULL,NULL,
'["Water surplus at source","Partial request already fulfilled"]','["Route caution"]'),
('B0000000-0000-0000-0000-000000000010','A0000000-0000-0000-0000-000000000010','62000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000003',50,67,64,91,45,82,63,75,'REJECTED','80000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',NOW(),
'["Destination need is high"]','["Source inventory below safety threshold"]');

-- Link convoys after swaps exist.
UPDATE supply_swaps SET convoy_id='C0000000-0000-0000-0000-000000000001'
WHERE id='B0000000-0000-0000-0000-000000000003';

-- Convoys
INSERT INTO convoys
(id,code,supply_swap_id,origin_warehouse_id,destination_shelter_id,route_id,vehicle_id,driver_name,driver_phone,status,started_at,estimated_arrival,last_location,last_check_in_at)
VALUES
('C0000000-0000-0000-0000-000000000001','CNV-001','B0000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000003','Arun Das','+91-9200000001','ON_ROUTE','2026-08-30 07:30:00.000','2026-08-30 08:05:00.000',ST_GeomFromText('POINT(91.7480 26.1540)',4326),'2026-08-30 08:01:00.000'),
('C0000000-0000-0000-0000-000000000002','CNV-002',NULL,'20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000001','Bikash Roy','+91-9200000002','REROUTING','2026-08-30 07:10:00.000','2026-08-30 09:20:00.000',ST_GeomFromText('POINT(91.7210 26.1680)',4326),'2026-08-30 07:58:00.000'),
('C0000000-0000-0000-0000-000000000003','CNV-003','B0000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000008','80000000-0000-0000-0000-000000000009','90000000-0000-0000-0000-000000000002','Ratul Bora','+91-9200000003','DEPARTED','2026-08-30 06:45:00.000','2026-08-30 08:20:00.000',ST_GeomFromText('POINT(91.6900 26.1250)',4326),'2026-08-30 08:00:00.000'),
('C0000000-0000-0000-0000-000000000004','CNV-004',NULL,'20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000006','80000000-0000-0000-0000-000000000005','90000000-0000-0000-0000-000000000004','Milan Paul','+91-9200000004','STRANDED','2026-08-30 06:30:00.000','2026-08-30 08:00:00.000',ST_GeomFromText('POINT(91.7680 26.1600)',4326),'2026-08-30 07:20:00.000'),
('C0000000-0000-0000-0000-000000000005','CNV-005','B0000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000005','80000000-0000-0000-0000-000000000007','90000000-0000-0000-0000-000000000002','Jatin Nath','+91-9200000005','PAUSED','2026-08-30 07:00:00.000','2026-08-30 09:00:00.000',ST_GeomFromText('POINT(91.7480 26.1320)',4326),'2026-08-30 07:40:00.000'),
('C0000000-0000-0000-0000-000000000006','CNV-006','B0000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000006','90000000-0000-0000-0000-000000000004','Pritam Das','+91-9200000006','DELIVERED','2026-08-30 05:30:00.000','2026-08-30 07:00:00.000',ST_GeomFromText('POINT(91.6900 26.1800)',4326),'2026-08-30 07:00:00.000'),
('C0000000-0000-0000-0000-000000000007','CNV-007','B0000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000006','80000000-0000-0000-0000-000000000005','90000000-0000-0000-0000-000000000001','Nikhil Deka','+91-9200000007','CAUTION','2026-08-30 07:50:00.000','2026-08-30 09:30:00.000',ST_GeomFromText('POINT(91.7800 26.1550)',4326),'2026-08-30 08:00:00.000'),
('C0000000-0000-0000-0000-000000000008','CNV-008',NULL,'20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000010','90000000-0000-0000-0000-000000000004','Rohit Sen','+91-9200000008','PLANNED',NULL,'2026-08-30 09:00:00.000',NULL,NULL);

-- Convoy cargo
INSERT INTO convoy_cargo (id,convoy_id,supply_type_id,quantity) VALUES
('D0000000-0000-0000-0000-000000000001','C0000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',60),
('D0000000-0000-0000-0000-000000000002','C0000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001',40),
('D0000000-0000-0000-0000-000000000003','C0000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000004',1500),
('D0000000-0000-0000-0000-000000000004','C0000000-0000-0000-0000-000000000004','40000000-0000-0000-0000-000000000001',30),
('D0000000-0000-0000-0000-000000000005','C0000000-0000-0000-0000-000000000005','40000000-0000-0000-0000-000000000003',120),
('D0000000-0000-0000-0000-000000000006','C0000000-0000-0000-0000-000000000006','40000000-0000-0000-0000-000000000003',80),
('D0000000-0000-0000-0000-000000000007','C0000000-0000-0000-0000-000000000007','40000000-0000-0000-0000-000000000001',35),
('D0000000-0000-0000-0000-000000000008','C0000000-0000-0000-0000-000000000008','40000000-0000-0000-0000-000000000004',1000);

-- 30 convoy location history records
INSERT INTO convoy_locations (id,convoy_id,location,recorded_at,speed,heading,source) VALUES
('E0000000-0000-0000-0000-000000000001','C0000000-0000-0000-0000-000000000001',ST_GeomFromText('POINT(91.7400 26.1480)',4326),'2026-08-30 07:35:00.000',28,65,'GPS'),
('E0000000-0000-0000-0000-000000000002','C0000000-0000-0000-0000-000000000001',ST_GeomFromText('POINT(91.7440 26.1510)',4326),'2026-08-30 07:45:00.000',26,55,'GPS'),
('E0000000-0000-0000-0000-000000000003','C0000000-0000-0000-0000-000000000001',ST_GeomFromText('POINT(91.7480 26.1540)',4326),'2026-08-30 08:01:00.000',24,45,'GPS'),
('E0000000-0000-0000-0000-000000000004','C0000000-0000-0000-0000-000000000002',ST_GeomFromText('POINT(91.7300 26.1550)',4326),'2026-08-30 07:20:00.000',20,40,'GPS'),
('E0000000-0000-0000-0000-000000000005','C0000000-0000-0000-0000-000000000002',ST_GeomFromText('POINT(91.7240 26.1630)',4326),'2026-08-30 07:40:00.000',12,20,'GPS'),
('E0000000-0000-0000-0000-000000000006','C0000000-0000-0000-0000-000000000002',ST_GeomFromText('POINT(91.7210 26.1680)',4326),'2026-08-30 07:58:00.000',8,10,'GPS'),
('E0000000-0000-0000-0000-000000000007','C0000000-0000-0000-0000-000000000003',ST_GeomFromText('POINT(91.7200 26.1400)',4326),'2026-08-30 07:10:00.000',35,190,'GPS'),
('E0000000-0000-0000-0000-000000000008','C0000000-0000-0000-0000-000000000003',ST_GeomFromText('POINT(91.7000 26.1300)',4326),'2026-08-30 07:30:00.000',32,210,'GPS'),
('E0000000-0000-0000-0000-000000000009','C0000000-0000-0000-0000-000000000003',ST_GeomFromText('POINT(91.6900 26.1250)',4326),'2026-08-30 08:00:00.000',30,220,'GPS'),
('E0000000-0000-0000-0000-000000000010','C0000000-0000-0000-0000-000000000004',ST_GeomFromText('POINT(91.7750 26.1550)',4326),'2026-08-30 06:40:00.000',25,160,'GPS'),
('E0000000-0000-0000-0000-000000000011','C0000000-0000-0000-0000-000000000004',ST_GeomFromText('POINT(91.7720 26.1580)',4326),'2026-08-30 07:00:00.000',5,145,'GPS'),
('E0000000-0000-0000-0000-000000000012','C0000000-0000-0000-0000-000000000004',ST_GeomFromText('POINT(91.7680 26.1600)',4326),'2026-08-30 07:20:00.000',0,0,'GPS'),
('E0000000-0000-0000-0000-000000000013','C0000000-0000-0000-0000-000000000005',ST_GeomFromText('POINT(91.7400 26.1400)',4326),'2026-08-30 07:05:00.000',15,200,'GPS'),
('E0000000-0000-0000-0000-000000000014','C0000000-0000-0000-0000-000000000005',ST_GeomFromText('POINT(91.7460 26.1350)',4326),'2026-08-30 07:25:00.000',12,180,'GPS'),
('E0000000-0000-0000-0000-000000000015','C0000000-0000-0000-0000-000000000005',ST_GeomFromText('POINT(91.7480 26.1320)',4326),'2026-08-30 07:40:00.000',0,180,'GPS'),
('E0000000-0000-0000-0000-000000000016','C0000000-0000-0000-0000-000000000006',ST_GeomFromText('POINT(91.7100 26.1780)',4326),'2026-08-30 06:10:00.000',25,270,'GPS'),
('E0000000-0000-0000-0000-000000000017','C0000000-0000-0000-0000-000000000006',ST_GeomFromText('POINT(91.7000 26.1800)',4326),'2026-08-30 06:30:00.000',20,270,'GPS'),
('E0000000-0000-0000-0000-000000000018','C0000000-0000-0000-0000-000000000006',ST_GeomFromText('POINT(91.6900 26.1800)',4326),'2026-08-30 07:00:00.000',0,270,'GPS'),
('E0000000-0000-0000-0000-000000000019','C0000000-0000-0000-0000-000000000007',ST_GeomFromText('POINT(91.7830 26.1500)',4326),'2026-08-30 07:50:00.000',18,180,'GPS'),
('E0000000-0000-0000-0000-000000000020','C0000000-0000-0000-0000-000000000007',ST_GeomFromText('POINT(91.7800 26.1550)',4326),'2026-08-30 07:55:00.000',8,160,'GPS'),
('E0000000-0000-0000-0000-000000000021','C0000000-0000-0000-0000-000000000007',ST_GeomFromText('POINT(91.7800 26.1550)',4326),'2026-08-30 08:00:00.000',5,150,'GPS'),
('E0000000-0000-0000-0000-000000000022','C0000000-0000-0000-000000000008',ST_GeomFromText('POINT(91.7362 26.1445)',4326),'2026-08-30 08:00:00.000',0,0,'GPS'),
('E0000000-0000-0000-0000-000000000023','C0000000-0000-0000-0000-000000000001',ST_GeomFromText('POINT(91.7410 26.1490)',4326),'2026-08-30 07:40:00.000',27,60,'GPS'),
('E0000000-0000-0000-0000-000000000024','C0000000-0000-0000-0000-000000000002',ST_GeomFromText('POINT(91.7260 26.1600)',4326),'2026-08-30 07:30:00.000',15,25,'GPS'),
('E0000000-0000-0000-0000-000000000025','C0000000-0000-0000-0000-000000000003',ST_GeomFromText('POINT(91.7100 26.1300)',4326),'2026-08-30 07:40:00.000',30,215,'GPS'),
('E0000000-0000-0000-0000-000000000026','C0000000-0000-0000-0000-000000000004',ST_GeomFromText('POINT(91.7680 26.1600)',4326),'2026-08-30 07:30:00.000',0,0,'GPS'),
('E0000000-0000-0000-0000-000000000027','C0000000-0000-0000-0000-000000000005',ST_GeomFromText('POINT(91.7480 26.1320)',4326),'2026-08-30 07:50:00.000',0,0,'GPS'),
('E0000000-0000-0000-0000-000000000028','C0000000-0000-0000-0000-000000000006',ST_GeomFromText('POINT(91.6950 26.1800)',4326),'2026-08-30 06:50:00.000',10,270,'GPS'),
('E0000000-0000-0000-0000-000000000029','C0000000-0000-0000-0000-000000000007',ST_GeomFromText('POINT(91.7820 26.1520)',4326),'2026-08-30 07:52:00.000',15,175,'GPS'),
('E0000000-0000-0000-0000-000000000030','C0000000-0000-0000-000000000008',ST_GeomFromText('POINT(91.7362 26.1445)',4326),'2026-08-30 08:01:00.000',0,0,'GPS');

-- 15 alerts
INSERT INTO alerts
(id,type,severity,title,message,entity_type,entity_id,status,district,warehouse_id)
VALUES
('F0000000-0000-0000-0000-000000000001','CONVOY','CRITICAL','Convoy CNV-004 stranded','Convoy CNV-004 is stopped near Sector 6 flood zone.','CONVOY','C0000000-0000-0000-0000-000000000004','UNREAD','Sector 6','20000000-0000-0000-0000-000000000002'),
('F0000000-0000-0000-0000-000000000002','INVENTORY','CRITICAL','Critical insulin inventory','Warehouse WH-GHY-01 has insulin stock below critical threshold after reservations.','INVENTORY','50000000-0000-0000-0000-000000000001','UNREAD','Central','20000000-0000-0000-0000-000000000001'),
('F0000000-0000-0000-0000-000000000003','SHELTER','CRITICAL','Shelter SH-06 isolated','No currently safe heavy-vehicle route reaches the medical shelter.','SHELTER','60000000-0000-0000-0000-000000000006','UNREAD','Sector 6',NULL),
('F0000000-0000-0000-0000-000000000004','ROUTE','CRITICAL','Route R-GHY-SH06 blocked','Flood hazard intersects the route to Sector 6.','ROUTE','80000000-0000-0000-0000-000000000008','ACKNOWLEDGED','Sector 6',NULL),
('F0000000-0000-0000-0000-000000000005','HAZARD','ACTION_REQUIRED','Bridge B-14 damaged','Heavy vehicles must not use Bridge B-14.','HAZARD','71000000-0000-0000-0000-000000000003','UNREAD','Central',NULL),
('F0000000-0000-0000-0000-000000000006','SUPPLY_SWAP','ACTION_REQUIRED','Insulin transfer approval required','Critical insulin transfer from WH-GHY-01 requires manager review.','SUPPLY_SWAP','B0000000-0000-0000-0000-000000000001','UNREAD','Hillside','20000000-0000-0000-0000-000000000001'),
('F0000000-0000-0000-0000-000000000007','ROUTE','ADVISORY','South route caution','Water level rising near South Junction.','ROUTE','80000000-0000-0000-0000-000000000007','UNREAD','South Village',NULL),
('F0000000-0000-0000-0000-000000000008','CONVOY','ACTION_REQUIRED','Convoy CNV-002 rerouting','New safer path required after debris-flow verification.','CONVOY','C0000000-0000-0000-0000-000000000002','UNREAD','Hillside',NULL),
('F0000000-0000-0000-0000-000000000009','HAZARD','ACTION_REQUIRED','New flood report','East Bank water depth is increasing.','HAZARD','71000000-0000-0000-0000-000000000010','UNREAD','East Bank',NULL),
('F0000000-0000-0000-0000-000000000010','SHELTER','ACTION_REQUIRED','Infant nutrition shortage','SH-05 has less than 10 hours of infant nutrition coverage.','SHELTER','60000000-0000-0000-0000-000000000005','UNREAD','South Village',NULL),
('F0000000-0000-0000-0000-000000000011','INVENTORY','ADVISORY','Water stock at risk','Part of Riverside water stock is at risk due to warehouse access conditions.','INVENTORY','50000000-0000-0000-0000-000000000010','ACKNOWLEDGED','East Bank','20000000-0000-0000-0000-000000000002'),
('F0000000-0000-0000-0000-000000000012','ROUTE','ADVISORY','Hillside route restricted','Light vehicles only on R-HIL-SH07.','ROUTE','80000000-0000-0000-0000-000000000006','UNREAD','West Ridge',NULL),
('F0000000-0000-0000-0000-000000000013','CONVOY','INFORMATION','Convoy CNV-001 location update','Convoy is moving on the open northern route.','CONVOY','C0000000-0000-0000-0000-000000000001','RESOLVED','North River',NULL),
('F0000000-0000-0000-0000-000000000014','SUPPLY_SWAP','ACTION_REQUIRED','Transfer paused','Blood transfer to SH-06 paused because route risk increased.','SUPPLY_SWAP','B0000000-0000-0000-0000-000000000007','UNREAD','Sector 6','20000000-0000-0000-0000-000000000002'),
('F0000000-0000-0000-0000-000000000015','HAZARD','CRITICAL','Medical approach flooded','Sector 6 Medical Approach is critically flooded.','HAZARD','71000000-0000-0000-0000-000000000015','UNREAD','Sector 6',NULL);

-- Notification preferences
INSERT INTO notification_preferences
(id,user_id,critical_alerts,route_alerts,inventory_alerts,convoy_alerts,shelter_alerts,supply_swap_alerts)
SELECT CONCAT('FF000000-0000-0000-0000-',LPAD(ROW_NUMBER() OVER (ORDER BY id),12,'0')),
       id,TRUE,TRUE,TRUE,TRUE,TRUE,TRUE
FROM users;

-- A few representative audit logs
INSERT INTO audit_logs
(id,user_id,action,entity_type,entity_id,old_value,new_value,ip_address,user_agent)
VALUES
('AB000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','SUPPLY_SWAP_CREATED','SUPPLY_SWAP','B0000000-0000-0000-0000-000000000001',NULL,'{"status":"UNDER_REVIEW","quantity":40}', '127.0.0.1','demo-seed'),
('AB000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','SUPPLY_SWAP_APPROVED','SUPPLY_SWAP','B0000000-0000-0000-0000-000000000003','{"status":"UNDER_REVIEW"}','{"status":"APPROVED"}','127.0.0.1','demo-seed'),
('AB000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','HAZARD_VERIFIED','HAZARD','71000000-0000-0000-0000-000000000003','{"status":"UNDER_REVIEW"}','{"status":"VERIFIED"}','127.0.0.1','demo-seed'),
('AB000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000002','CONVOY_DISPATCHED','CONVOY','C0000000-0000-0000-0000-000000000001','{"status":"LOADED"}','{"status":"ON_ROUTE"}','127.0.0.1','demo-seed'),
('AB000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','CONVOY_REROUTED','CONVOY','C0000000-0000-0000-0000-000000000002','{"route":"R-GHY-SH03"}','{"reason":"debris flow","status":"REROUTING"}','127.0.0.1','demo-seed');

-- System events
INSERT INTO system_events
(id,event_type,entity_type,entity_id,payload,processed)
VALUES
('AC000000-0000-0000-0000-000000000001','hazard.verified','HAZARD','71000000-0000-0000-0000-000000000003','{"severity":"CRITICAL","type":"BRIDGE_DAMAGE"}',1),
('AC000000-0000-0000-0000-000000000002','route.blocked','ROUTE','80000000-0000-0000-0000-000000000008','{"reason":"flood hazard"}',1),
('AC000000-0000-0000-0000-000000000003','convoy.stranded','CONVOY','C0000000-0000-0000-0000-000000000004','{"location":"Sector 6"}',0),
('AC000000-0000-0000-0000-000000000004','supply_swap.created','SUPPLY_SWAP','B0000000-0000-0000-0000-000000000001','{"quantity":40,"supply":"INSULIN"}',0),
('AC000000-0000-0000-0000-000000000005','shelter.isolated','SHELTER','60000000-0000-0000-0000-000000000006','{"reason":"no_safe_path"}',0);

-- ================================================================
-- 12. BASIC DATABASE PROCEDURES
-- ================================================================

DELIMITER $$

CREATE PROCEDURE sp_get_warehouse_inventory(IN p_warehouse_id CHAR(36))
BEGIN
    SELECT *
    FROM vw_inventory_availability
    WHERE warehouse_id = p_warehouse_id
    ORDER BY status DESC, supply_type;
END$$

CREATE PROCEDURE sp_get_open_critical_requests()
BEGIN
    SELECT
        sr.id,
        s.code AS shelter_code,
        s.name AS shelter,
        st.code AS supply_code,
        st.name AS supply_type,
        sr.quantity_requested,
        sr.quantity_fulfilled,
        sr.priority,
        sr.priority_score,
        sr.time_to_shortage_hours
    FROM supply_requests sr
    JOIN shelters s ON s.id=sr.shelter_id
    JOIN supply_types st ON st.id=sr.supply_type_id
    WHERE sr.status IN ('OPEN','PARTIALLY_FULFILLED')
      AND sr.priority='CRITICAL'
    ORDER BY sr.priority_score DESC, sr.time_to_shortage_hours ASC;
END$$

DELIMITER ;

-- ================================================================
-- 13. VALIDATION / DEMO QUERIES
-- ================================================================

-- Expected: WH-GHY-01 insulin transferable = 60.
SELECT warehouse, supply_type, sku, quantity_on_hand, quantity_reserved,
       quantity_transferable, quantity_at_risk, status
FROM vw_inventory_availability
WHERE sku='INS-GHY-001';

-- Expected: SH-06 insulin coverage = 4 hours.
SELECT shelter, supply, current_quantity, required_quantity,
       coverage_hours, priority, shelter_status, isolation_risk
FROM vw_shelter_supply_status
WHERE shelter_code='SH-06';

-- Critical operations for dashboard.
SELECT * FROM vw_critical_operations;

-- Active convoys for live map/dispatch.
SELECT * FROM vw_active_convoys;

-- Hazard/route spatial relationship example.
-- This checks whether route segments intersect active hazards.
SELECT
    rs.id AS route_segment_id,
    rs.route_id,
    h.id AS hazard_id,
    h.type,
    h.severity,
    h.status
FROM route_segments rs
JOIN hazards h
  ON ST_Intersects(rs.geometry, h.geometry)
WHERE h.status IN ('REPORTED','UNDER_REVIEW','VERIFIED');

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- 14. DATA-INTEGRITY SUMMARY
-- ================================================================
SELECT 'roles' AS table_name, COUNT(*) AS row_count FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'warehouses', COUNT(*) FROM warehouses
UNION ALL SELECT 'supply_types', COUNT(*) FROM supply_types
UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
UNION ALL SELECT 'shelters', COUNT(*) FROM shelters
UNION ALL SELECT 'shelter_demands', COUNT(*) FROM shelter_demands
UNION ALL SELECT 'supply_requests', COUNT(*) FROM supply_requests
UNION ALL SELECT 'supply_offers', COUNT(*) FROM supply_offers
UNION ALL SELECT 'supply_swaps', COUNT(*) FROM supply_swaps
UNION ALL SELECT 'routes', COUNT(*) FROM routes
UNION ALL SELECT 'route_segments', COUNT(*) FROM route_segments
UNION ALL SELECT 'hazard_sources', COUNT(*) FROM hazard_sources
UNION ALL SELECT 'hazards', COUNT(*) FROM hazards
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'convoys', COUNT(*) FROM convoys
UNION ALL SELECT 'convoy_cargo', COUNT(*) FROM convoy_cargo
UNION ALL SELECT 'convoy_locations', COUNT(*) FROM convoy_locations
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL SELECT 'notification_preferences', COUNT(*) FROM notification_preferences
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'system_events', COUNT(*) FROM system_events;

-- ================================================================
-- END
-- ================================================================
