export enum RoleType {
  WAREHOUSE_MANAGER = 'warehouse_manager',
  CONTROL_ROOM = 'control_room',
  DISTRICT_ADMIN = 'district_admin',
  FIELD_DRIVER = 'field_driver',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum PermissionType {
  DASHBOARD_READ = 'dashboard.read',
  WAREHOUSE_READ = 'warehouse.read',
  WAREHOUSE_UPDATE = 'warehouse.update',
  INVENTORY_READ = 'inventory.read',
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_RESERVE = 'inventory.reserve',
  INVENTORY_RELEASE = 'inventory.release',
  SHELTER_READ = 'shelter.read',
  SHELTER_REQUEST_READ = 'shelter.request.read',
  SUPPLY_REQUEST_READ = 'supply_request.read',
  SUPPLY_OFFER_CREATE = 'supply_offer.create',
  SUPPLY_SWAP_READ = 'supply_swap.read',
  SUPPLY_SWAP_CREATE = 'supply_swap.create',
  SUPPLY_SWAP_APPROVE = 'supply_swap.approve',
  SUPPLY_SWAP_REJECT = 'supply_swap.reject',
  ROUTE_READ = 'route.read',
  ROUTE_RISK_READ = 'route.risk.read',
  HAZARD_READ = 'hazard.read',
  HAZARD_CREATE = 'hazard.create',
  HAZARD_VERIFY = 'hazard.verify',
  HAZARD_RESOLVE = 'hazard.resolve',
  VEHICLE_READ = 'vehicle.read',
  CONVOY_READ = 'convoy.read',
  CONVOY_CREATE = 'convoy.create',
  CONVOY_DISPATCH = 'convoy.dispatch',
  CONVOY_PAUSE = 'convoy.pause',
  CONVOY_REROUTE = 'convoy.reroute',
  CONVOY_TRACK = 'convoy.track',
  ALERT_READ = 'alert.read',
  ALERT_ACKNOWLEDGE = 'alert.acknowledge',
  ALERT_RESOLVE = 'alert.resolve',
  SETTINGS_READ = 'settings.read',
  SETTINGS_UPDATE = 'settings.update',
}

export enum CriticalityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum HazardType {
  FLOOD = 'FLOOD',
  LANDSLIDE = 'LANDSLIDE',
  DEBRIS_FLOW = 'DEBRIS_FLOW',
  DAMAGED_BRIDGE = 'DAMAGED_BRIDGE',
  SUBMERGED_ROAD = 'SUBMERGED_ROAD',
  ROAD_BLOCKAGE = 'ROAD_BLOCKAGE',
  STRUCTURAL_DAMAGE = 'STRUCTURAL_DAMAGE',
  OTHER = 'OTHER',
}

export enum HazardSeverity {
  INFO = 'INFO',
  CAUTION = 'CAUTION',
  HAZARDOUS = 'HAZARDOUS',
  IMPASSABLE = 'IMPASSABLE',
}

export enum RouteOperationalStatus {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  RESTRICTED = 'RESTRICTED',
  BLOCKED = 'BLOCKED',
  UNKNOWN = 'UNKNOWN',
}

export enum ConvoyStatus {
  PLANNED = 'PLANNED',
  READY = 'READY',
  DISPATCHED = 'DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELAYED = 'DELAYED',
  AT_RISK = 'AT_RISK',
  STRANDED = 'STRANDED',
  REROUTING = 'REROUTING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum AlertSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AlertType {
  CRITICAL_INVENTORY = 'CRITICAL_INVENTORY',
  SHELTER_SHORTAGE = 'SHELTER_SHORTAGE',
  ISOLATED_SHELTER = 'ISOLATED_SHELTER',
  NEW_HAZARD = 'NEW_HAZARD',
  ROUTE_BLOCKED = 'ROUTE_BLOCKED',
  CONVOY_AT_RISK = 'CONVOY_AT_RISK',
  CONVOY_STRANDED = 'CONVOY_STRANDED',
  SUPPLY_SWAP_REQUEST = 'SUPPLY_SWAP_REQUEST',
  SUPPLY_SWAP_APPROVAL = 'SUPPLY_SWAP_APPROVAL',
  DELIVERY_DELAY = 'DELIVERY_DELAY',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum InventoryTransactionType {
  RECEIPT = 'RECEIPT',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
  TRANSFER = 'TRANSFER',
  DISPATCH = 'DISPATCH',
  DELIVERY = 'DELIVERY',
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
}

export enum SupplySwapStatus {
  PROPOSED = 'PROPOSED',
  MATCHED = 'MATCHED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VehicleType {
  HEAVY_TRUCK = 'HEAVY_TRUCK',
  MEDIUM_TRUCK = 'MEDIUM_TRUCK',
  OFFROAD_4X4 = 'OFFROAD_4X4',
  LIGHT_VAN = 'LIGHT_VAN',
  BOAT = 'BOAT',
}
