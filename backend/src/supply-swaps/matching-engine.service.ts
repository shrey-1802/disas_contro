import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { calculateHaversineDistanceKm } from '../common/utils/geo.util';

export interface SwapRecommendation {
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  targetShelterId?: string;
  targetWarehouseId?: string;
  itemName: string;
  requestedQuantity: number;
  availableQuantity: number;
  matchScore: number;
  reasons: string[];
  routeRisk: string;
  distanceKm: number;
  estimatedTravelTimeMinutes: number;
  impactPreview: {
    sourceStockBefore: number;
    sourceStockAfter: number;
    sourceDaysOfCoverBefore: number;
    sourceDaysOfCoverAfter: number;
    belowSafetyThreshold: boolean;
    recommendedQuantity: number;
  };
}

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates candidate donor warehouses and generates explainable match recommendations
   */
  async findRecommendations(
    itemName: string,
    requiredQuantity: number,
    targetShelterId?: string,
    targetWarehouseId?: string,
  ): Promise<SwapRecommendation[]> {
    let targetLat = 37.7749;
    let targetLon = -122.4194;

    if (targetShelterId) {
      const shelter = await this.prisma.shelter.findUnique({
        where: { id: targetShelterId },
      });
      if (shelter) {
        targetLat = shelter.latitude;
        targetLon = shelter.longitude;
      }
    } else if (targetWarehouseId) {
      const wh = await this.prisma.warehouse.findUnique({
        where: { id: targetWarehouseId },
      });
      if (wh) {
        targetLat = wh.latitude;
        targetLon = wh.longitude;
      }
    }

    // Find all warehouses holding matching inventory items with stock > 0
    const candidateItems = await this.prisma.inventoryItem.findMany({
      where: {
        name: { contains: itemName },
        availableQuantity: { gt: 0 },
        ...(targetWarehouseId ? { warehouseId: { not: targetWarehouseId } } : {}),
      },
      include: {
        warehouse: true,
      },
    });

    const recommendations: SwapRecommendation[] = [];

    for (const item of candidateItems) {
      const wh = item.warehouse;
      const distanceKm = calculateHaversineDistanceKm(
        wh.latitude,
        wh.longitude,
        targetLat,
        targetLon,
      );

      // Evaluate active hazards along route corridor
      const nearbyHazards = await this.prisma.hazard.count({
        where: {
          status: 'ACTIVE',
          severity: { in: ['HAZARDOUS', 'IMPASSABLE'] },
          latitude: { gte: Math.min(wh.latitude, targetLat) - 0.05, lte: Math.max(wh.latitude, targetLat) + 0.05 },
          longitude: { gte: Math.min(wh.longitude, targetLon) - 0.05, lte: Math.max(wh.longitude, targetLon) + 0.05 },
        },
      });

      let routeRisk = 'Safe';
      let routeRiskPenalty = 0;
      if (nearbyHazards > 2) {
        routeRisk = 'Blocked';
        routeRiskPenalty = 40;
      } else if (nearbyHazards > 0) {
        routeRisk = 'Caution';
        routeRiskPenalty = 15;
      }

      // Calculate Rule-Based Match Score (0 to 100)
      const reasons: string[] = [];

      // 1. Availability component (up to 40 pts)
      let availabilityScore = 0;
      if (item.availableQuantity >= requiredQuantity) {
        availabilityScore = 40;
        reasons.push(`Sufficient available inventory (${item.availableQuantity} ${item.unit} on hand)`);
      } else {
        availabilityScore = (item.availableQuantity / requiredQuantity) * 30;
        reasons.push(`Partial supply available (${item.availableQuantity} of ${requiredQuantity} ${item.unit})`);
      }

      // 2. Distance & Travel Time component (up to 30 pts)
      let distanceScore = Math.max(5, 30 - distanceKm * 0.8);
      const estMinutes = Math.round((distanceKm / 35) * 60);
      if (distanceKm < 20) {
        reasons.push(`Proximity advantage: ${distanceKm.toFixed(1)} km (~${estMinutes} mins transit)`);
      } else {
        reasons.push(`Transit distance: ${distanceKm.toFixed(1)} km (~${estMinutes} mins transit)`);
      }

      // 3. Route Safety component (up to 20 pts)
      let safetyScore = 20 - routeRiskPenalty;
      if (routeRisk === 'Safe') {
        safetyScore = 20;
        reasons.push('Low route risk: corridor is clear of active critical blockages');
      } else if (routeRisk === 'Caution') {
        reasons.push('Caution: Corridor has adjacent active hazard warnings');
      } else {
        reasons.push('Warning: Critical route obstructions detected near corridor');
      }

      // 4. Criticality weighting (up to 10 pts)
      let criticalityBonus = item.criticality === 'CRITICAL' ? 10 : 5;
      if (item.criticality === 'CRITICAL') {
        reasons.push('Lifesaving critical cargo priority');
      }

      const matchScore = Math.min(
        100,
        Math.max(10, Math.round(availabilityScore + distanceScore + safetyScore + criticalityBonus)),
      );

      // Impact Preview (Days of cover calculation)
      const dailyConsumptionRate = Math.max(10, item.quantity / 10);
      const sourceDaysBefore = Math.round((item.availableQuantity / dailyConsumptionRate) * 10) / 10;
      const transferQty = Math.min(item.availableQuantity, requiredQuantity);
      const sourceStockAfter = item.availableQuantity - transferQty;
      const sourceDaysAfter = Math.round((sourceStockAfter / dailyConsumptionRate) * 10) / 10;

      const belowSafetyThreshold = sourceDaysAfter < 2.0;
      let recommendedQuantity = transferQty;
      if (belowSafetyThreshold) {
        // Recommend safe partial quantity preserving 2 days of cover
        const safeStockToRetain = 2.0 * dailyConsumptionRate;
        recommendedQuantity = Math.max(0, Math.floor(item.availableQuantity - safeStockToRetain));
        reasons.push(
          `⚠ Full transfer would drop source below 2-day buffer. Recommended safe quota: ${recommendedQuantity} ${item.unit}`,
        );
      }

      recommendations.push({
        sourceWarehouseId: wh.id,
        sourceWarehouseName: wh.name,
        targetShelterId,
        targetWarehouseId,
        itemName: item.name,
        requestedQuantity: requiredQuantity,
        availableQuantity: item.availableQuantity,
        matchScore,
        reasons,
        routeRisk,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedTravelTimeMinutes: estMinutes,
        impactPreview: {
          sourceStockBefore: item.availableQuantity,
          sourceStockAfter,
          sourceDaysOfCoverBefore: sourceDaysBefore,
          sourceDaysOfCoverAfter: sourceDaysAfter,
          belowSafetyThreshold,
          recommendedQuantity,
        },
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}
