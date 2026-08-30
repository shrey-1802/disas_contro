import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(sector?: string) {
    // 1. Inventory aggregations
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      select: {
        quantity: true,
        availableQuantity: true,
        reservedQuantity: true,
        criticality: true,
        isColdChain: true,
      },
    });

    const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const availableInventory = inventoryItems.reduce((sum, item) => sum + item.availableQuantity, 0);
    const reservedInventory = inventoryItems.reduce((sum, item) => sum + item.reservedQuantity, 0);
    const criticalInventory = inventoryItems
      .filter((i) => i.criticality === 'CRITICAL')
      .reduce((sum, item) => sum + item.quantity, 0);

    // 2. Shelter metrics
    const [totalShelters, criticalShelters, isolatedShelters] = await Promise.all([
      this.prisma.shelter.count(),
      this.prisma.shelter.count({ where: { daysOfSupply: { lte: 1.5 } } }),
      this.prisma.shelter.count({ where: { isIsolated: true } }),
    ]);

    // 3. Convoy metrics
    const [totalConvoys, activeConvoys, atRiskConvoys, strandedConvoys] = await Promise.all([
      this.prisma.convoy.count(),
      this.prisma.convoy.count({ where: { status: { in: ['IN_TRANSIT', 'DISPATCHED', 'REROUTING'] } } }),
      this.prisma.convoy.count({ where: { status: 'AT_RISK' } }),
      this.prisma.convoy.count({ where: { status: 'STRANDED' } }),
    ]);

    // 4. Hazard metrics
    const [activeHazards, criticalHazards, unconfirmedHazards] = await Promise.all([
      this.prisma.hazard.count({ where: { status: 'ACTIVE' } }),
      this.prisma.hazard.count({ where: { status: 'ACTIVE', severity: { in: ['HAZARDOUS', 'IMPASSABLE'] } } }),
      this.prisma.hazard.count({ where: { status: 'ACTIVE', isConfirmed: false } }),
    ]);

    // 5. Supply Swaps & Alerts
    const [pendingSupplySwaps, unacknowledgedAlerts] = await Promise.all([
      this.prisma.supplySwap.count({ where: { status: 'PROPOSED' } }),
      this.prisma.alert.count({ where: { isAcknowledged: false } }),
    ]);

    return {
      inventory: {
        total: totalInventory,
        available: availableInventory,
        reserved: reservedInventory,
        critical: criticalInventory,
      },
      shelters: {
        total: totalShelters,
        active: totalShelters,
        critical: criticalShelters,
        isolated: isolatedShelters,
      },
      convoys: {
        total: totalConvoys,
        active: activeConvoys,
        atRisk: atRiskConvoys,
        stranded: strandedConvoys,
      },
      hazards: {
        active: activeHazards,
        critical: criticalHazards,
        unconfirmed: unconfirmedHazards,
      },
      operations: {
        pendingSupplySwaps,
        unacknowledgedAlerts,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
