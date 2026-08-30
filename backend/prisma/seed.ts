import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Disaster Relief database seeding...');

  // 1. Roles & Permissions
  const roles = [
    { name: 'warehouse_manager', description: 'Logistics Hub: Local inventory control, convoy dispatch, and Supply Swap execution' },
    { name: 'control_room', description: 'HQ Operations: Full network oversight, hazard report verification, and system-wide reroute approvals' },
    { name: 'district_admin', description: 'District HQ: Regional oversight of convoys, shelters, and prioritized emergency alerts' },
    { name: 'field_driver', description: 'Field Ops: Submits hazard observations, views personal route status, and acknowledges reroutes' },
    { name: 'admin', description: 'System Administrator with full access' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'manager@relief.org',
      username: 'warehouse_manager',
      role: 'warehouse_manager',
      firstName: 'Marcus',
      lastName: 'Vance',
      district: 'District 4 (Northern Rift)',
    },
    {
      email: 'control@relief.org',
      username: 'control_room',
      role: 'control_room',
      firstName: 'Elena',
      lastName: 'Rostova',
      district: 'HQ Sector',
    },
    {
      email: 'admin@relief.org',
      username: 'district_admin',
      role: 'district_admin',
      firstName: 'David',
      lastName: 'Chen',
      district: 'District 4 (Northern Rift)',
    },
    {
      email: 'driver4@relief.org',
      username: 'field_driver',
      role: 'field_driver',
      firstName: 'Sam',
      lastName: 'Rodriguez',
      district: 'Sector 4 Field',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash,
        settings: {
          create: {
            notificationPreferences: JSON.stringify({ email: true, sms: true, push: true, criticalOnly: false }),
            dashboardPreferences: JSON.stringify({ defaultSector: 'Sector 4', refreshIntervalSec: 15 }),
            timezone: 'UTC',
          },
        },
      },
    });
  }

  // 3. Warehouses
  const warehouses = [
    {
      id: 'wh-alpha',
      code: 'WH-001',
      name: 'Hub Alpha (Central Depot)',
      sector: 'Sector 1',
      latitude: 37.7749,
      longitude: -122.4194,
      address: '100 Central Logistics Pkwy, Sector 1',
      totalCapacity: 50000,
    },
    {
      id: 'wh-bravo',
      code: 'WH-002',
      name: 'Hub Bravo (Northern Rift)',
      sector: 'Sector 4',
      latitude: 37.8044,
      longitude: -122.2711,
      address: '400 Northern Ridge Rd, Sector 4',
      totalCapacity: 30000,
    },
    {
      id: 'wh-charlie',
      code: 'WH-003',
      name: 'Hub Charlie (Coastal Base)',
      sector: 'Sector 8',
      latitude: 37.6879,
      longitude: -122.4702,
      address: '800 Coastal Way, Sector 8',
      totalCapacity: 40000,
    },
  ];

  for (const wh of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {},
      create: wh,
    });
  }

  // 4. Inventory Items (with Critical Lifesaving Materials)
  const items = [
    // Hub Alpha Items
    {
      warehouseId: 'wh-alpha',
      name: 'Insulin (Human & Analog)',
      sku: 'MED-INS-001',
      category: 'Medical',
      quantity: 5000,
      availableQuantity: 4500,
      reservedQuantity: 500,
      unit: 'vials',
      criticality: 'CRITICAL',
      isColdChain: true,
      batchNumber: 'B-INS-2026-A',
    },
    {
      warehouseId: 'wh-alpha',
      name: 'Blood Bags O-Negative',
      sku: 'MED-BLD-001',
      category: 'Medical',
      quantity: 2000,
      availableQuantity: 1500,
      reservedQuantity: 500,
      unit: 'units',
      criticality: 'CRITICAL',
      isColdChain: true,
      batchNumber: 'B-BLD-2026-09',
    },
    {
      warehouseId: 'wh-alpha',
      name: 'Infant Nutrition Formula',
      sku: 'NUT-INF-001',
      category: 'Nutrition',
      quantity: 4000,
      availableQuantity: 3500,
      reservedQuantity: 500,
      unit: 'cases',
      criticality: 'HIGH',
      isColdChain: false,
      batchNumber: 'B-NUT-883',
    },
    {
      warehouseId: 'wh-alpha',
      name: 'Potable Water Packs (10L)',
      sku: 'WTR-POT-001',
      category: 'Water',
      quantity: 3000,
      availableQuantity: 2500,
      reservedQuantity: 500,
      unit: 'packs',
      criticality: 'HIGH',
      isColdChain: false,
      batchNumber: 'B-WTR-441',
    },
    // Hub Bravo Items
    {
      warehouseId: 'wh-bravo',
      name: 'Infant Nutrition Formula',
      sku: 'NUT-INF-002',
      category: 'Nutrition',
      quantity: 3200,
      availableQuantity: 2700,
      reservedQuantity: 500,
      unit: 'cases',
      criticality: 'HIGH',
      isColdChain: false,
      batchNumber: 'B-NUT-884',
    },
    {
      warehouseId: 'wh-bravo',
      name: 'Potable Water Packs (10L)',
      sku: 'WTR-POT-002',
      category: 'Water',
      quantity: 3000,
      availableQuantity: 2000,
      reservedQuantity: 1000,
      unit: 'packs',
      criticality: 'HIGH',
      isColdChain: false,
      batchNumber: 'B-WTR-442',
    },
    // Hub Charlie Items
    {
      warehouseId: 'wh-charlie',
      name: 'General Emergency Aid Kits',
      sku: 'AID-GEN-001',
      category: 'General',
      quantity: 9800,
      availableQuantity: 9000,
      reservedQuantity: 800,
      unit: 'kits',
      criticality: 'MEDIUM',
      isColdChain: false,
      batchNumber: 'B-GEN-101',
    },
  ];

  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }

  // 5. Shelters
  const shelters = [
    {
      id: 'shelter-12',
      code: 'SH-012',
      name: 'Shelter 12 (North Community)',
      sector: 'Sector 4',
      latitude: 37.8200,
      longitude: -122.2500,
      population: 1450,
      capacity: 2000,
      status: 'ACTIVE',
      accessibility: 'CAUTION',
      priority: 'HIGH',
      isIsolated: false,
      daysOfSupply: 1.5,
    },
    {
      id: 'shelter-04',
      code: 'SH-004',
      name: 'Shelter 04 (Rift Valley High)',
      sector: 'Sector 4',
      latitude: 37.7950,
      longitude: -122.2200,
      population: 920,
      capacity: 1200,
      status: 'ACTIVE',
      accessibility: 'SAFE',
      priority: 'MEDIUM',
      isIsolated: false,
      daysOfSupply: 3.2,
    },
    {
      id: 'shelter-19',
      code: 'SH-019',
      name: 'Shelter 19 (Island Reach)',
      sector: 'Sector 8',
      latitude: 37.8100,
      longitude: -122.3600,
      population: 2100,
      capacity: 2500,
      status: 'ACTIVE',
      accessibility: 'BLOCKED',
      priority: 'CRITICAL',
      isIsolated: true,
      daysOfSupply: 0.5,
    },
  ];

  for (const sh of shelters) {
    await prisma.shelter.upsert({
      where: { code: sh.code },
      update: {},
      create: sh,
    });
  }

  // 6. Shelter Requirements
  const reqs = [
    {
      shelterId: 'shelter-12',
      itemName: 'Insulin (Human & Analog)',
      category: 'Medical',
      requiredQuantity: 600,
      deliveredQuantity: 100,
      unit: 'vials',
      priority: 'CRITICAL',
      criticality: 'CRITICAL',
      urgencyTier: 'critical',
      isColdChain: true,
    },
    {
      shelterId: 'shelter-19',
      itemName: 'Potable Water Packs (10L)',
      category: 'Water',
      requiredQuantity: 1500,
      deliveredQuantity: 200,
      unit: 'packs',
      priority: 'CRITICAL',
      criticality: 'CRITICAL',
      urgencyTier: 'critical',
      isColdChain: false,
    },
  ];

  for (const r of reqs) {
    await prisma.shelterSupplyRequirement.create({ data: r });
  }

  // 7. Hazards
  const hazards = [
    {
      id: 'rep-101',
      hazardCode: 'HAZ-2026-001',
      type: 'FLOOD',
      severity: 'HAZARDOUS',
      title: 'Flash Flood on Route 4',
      description: 'Rapidly rising water across low-lying highway segment Mile 12.',
      latitude: 37.7900,
      longitude: -122.3100,
      radiusMeters: 800,
      confidence: 85,
      source: 'Field Driver (Unit 4)',
      isConfirmed: false,
      status: 'ACTIVE',
    },
    {
      id: 'rep-102',
      hazardCode: 'HAZ-2026-002',
      type: 'DAMAGED_BRIDGE',
      severity: 'IMPASSABLE',
      title: 'Bridge Structural Fail - Bridge B14',
      description: 'Support pillar sheared from seismic shift; bridge declared completely impassable.',
      latitude: 37.8000,
      longitude: -122.3400,
      radiusMeters: 400,
      confidence: 98,
      source: 'Satellite Radar',
      isConfirmed: true,
      status: 'ACTIVE',
    },
  ];

  for (const h of hazards) {
    await prisma.hazard.upsert({
      where: { hazardCode: h.hazardCode },
      update: {},
      create: h,
    });
  }

  // 8. Vehicles
  const vehicles = [
    {
      id: 'veh-01',
      code: 'VEH-RT-01',
      plateNumber: 'RLF-9941',
      type: 'HEAVY_TRUCK',
      capacityKg: 10000,
      isRefrigerated: true,
      status: 'IN_TRANSIT',
      currentLatitude: 37.7850,
      currentLongitude: -122.3800,
    },
    {
      id: 'veh-02',
      code: 'VEH-MT-02',
      plateNumber: 'RLF-5520',
      type: 'MEDIUM_TRUCK',
      capacityKg: 5000,
      isRefrigerated: false,
      status: 'IN_TRANSIT',
      currentLatitude: 37.8000,
      currentLongitude: -122.2600,
    },
    {
      id: 'veh-03',
      code: 'VEH-4X-03',
      plateNumber: 'RLF-1102',
      type: 'OFFROAD_4X4',
      capacityKg: 2000,
      isRefrigerated: false,
      status: 'AVAILABLE',
      currentLatitude: 37.6879,
      currentLongitude: -122.4702,
    },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { code: v.code },
      update: {},
      create: v,
    });
  }

  // 9. Routes
  const routes = [
    {
      id: 'route-01',
      code: 'RT-ALPHA-SH12',
      name: 'Central Depot to Shelter 12 Primary',
      originWarehouseId: 'wh-alpha',
      destinationShelterId: 'shelter-12',
      totalDistanceKm: 18.5,
      estimatedDurationMin: 35,
      operationalStatus: 'CAUTION',
      riskScore: 45,
    },
    {
      id: 'route-02',
      code: 'RT-BRAVO-SH04',
      name: 'Northern Ridge to Shelter 04',
      originWarehouseId: 'wh-bravo',
      destinationShelterId: 'shelter-04',
      totalDistanceKm: 12.0,
      estimatedDurationMin: 25,
      operationalStatus: 'SAFE',
      riskScore: 15,
    },
    {
      id: 'route-03',
      code: 'RT-CHARLIE-SH19',
      name: 'Coastal Base to Shelter 19',
      originWarehouseId: 'wh-charlie',
      destinationShelterId: 'shelter-19',
      totalDistanceKm: 28.0,
      estimatedDurationMin: 60,
      operationalStatus: 'BLOCKED',
      riskScore: 95,
    },
  ];

  for (const r of routes) {
    await prisma.route.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  // 10. Convoys
  const convoys = [
    {
      id: 'convoy-14',
      convoyCode: 'CNV-2026-014',
      warehouseId: 'wh-alpha',
      destinationShelterId: 'shelter-12',
      vehicleId: 'veh-01',
      status: 'IN_TRANSIT',
      priority: 'CRITICAL',
      cargoDescription: 'Insulin & Blood Products',
      cargoPriority: 'Insulin/Blood',
      requiresColdChain: true,
      routeId: 'route-01',
      riskIndex: 'Caution',
      riskScore: 45,
      departureTime: new Date(Date.now() - 30 * 60 * 1000),
      estimatedArrival: new Date(Date.now() + 20 * 60 * 1000),
    },
    {
      id: 'convoy-22',
      convoyCode: 'CNV-2026-022',
      warehouseId: 'wh-bravo',
      destinationShelterId: 'shelter-04',
      vehicleId: 'veh-02',
      status: 'REROUTING',
      priority: 'HIGH',
      cargoDescription: 'Infant Nutrition & Clean Water',
      cargoPriority: 'Infant Nutrition',
      requiresColdChain: false,
      routeId: 'route-02',
      riskIndex: 'Caution',
      riskScore: 50,
      departureTime: new Date(Date.now() - 45 * 60 * 1000),
      estimatedArrival: new Date(Date.now() + 35 * 60 * 1000),
    },
    {
      id: 'convoy-09',
      convoyCode: 'CNV-2026-009',
      warehouseId: 'wh-charlie',
      destinationShelterId: 'shelter-19',
      vehicleId: 'veh-03',
      status: 'STRANDED',
      priority: 'CRITICAL',
      cargoDescription: 'General Aid Supplies',
      cargoPriority: 'General',
      requiresColdChain: false,
      routeId: 'route-03',
      riskIndex: 'Blocked',
      riskScore: 95,
      departureTime: new Date(Date.now() - 90 * 60 * 1000),
      estimatedArrival: new Date(Date.now() + 180 * 60 * 1000),
    },
  ];

  for (const c of convoys) {
    await prisma.convoy.upsert({
      where: { convoyCode: c.convoyCode },
      update: {},
      create: c,
    });
  }

  // 11. Alerts
  const alerts = [
    {
      id: 'alt-501',
      title: 'Isolated Shelter Detected: Shelter 19',
      description: 'Shelter 19 has 0.5 days supply remaining with no available road path due to Bridge B14 collapse.',
      type: 'ISOLATED_SHELTER',
      severity: 'CRITICAL',
      entityType: 'SHELTER',
      entityId: 'shelter-19',
      isAcknowledged: false,
      isResolved: false,
    },
    {
      id: 'alt-502',
      title: 'Convoy 09 Stranded near Sector 8',
      description: 'Convoy 09 has encountered an impassable flooded bridge approach and cannot reach destination without reroute.',
      type: 'CONVOY_STRANDED',
      severity: 'CRITICAL',
      entityType: 'CONVOY',
      entityId: 'convoy-09',
      isAcknowledged: true,
      isResolved: false,
    },
  ];

  for (const a of alerts) {
    await prisma.alert.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

  console.log('✅ Disaster Relief database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
