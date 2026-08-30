import { Injectable } from '@nestjs/common';

@Injectable()
export class ConvoyRiskIndexService {
  /**
   * Computes composite convoy risk score (0 - 100) and risk tier ('Safe', 'Caution', 'Blocked')
   */
  calculateRiskIndex(
    cargoPriority: string,
    routeStatus: string,
    minutesSinceLastLocationUpdate: number,
    nearHazardCount: number,
  ): { riskIndex: string; riskScore: number } {
    let score = 10;

    // 1. Cargo priority weighting
    if (cargoPriority === 'Insulin/Blood' || cargoPriority === 'CRITICAL') {
      score += 25;
    } else if (cargoPriority === 'Infant Nutrition' || cargoPriority === 'HIGH') {
      score += 15;
    }

    // 2. Route status impact
    if (routeStatus === 'BLOCKED') {
      score += 55;
    } else if (routeStatus === 'RESTRICTED') {
      score += 35;
    } else if (routeStatus === 'CAUTION') {
      score += 20;
    }

    // 3. Hazard proximity
    score += Math.min(20, nearHazardCount * 10);

    // 4. Communication/Check-in silence penalty
    if (minutesSinceLastLocationUpdate > 45) {
      score += 20;
    } else if (minutesSinceLastLocationUpdate > 20) {
      score += 10;
    }

    const finalScore = Math.min(100, Math.max(5, score));

    let riskIndex = 'Safe';
    if (finalScore >= 75 || routeStatus === 'BLOCKED') {
      riskIndex = 'Blocked';
    } else if (finalScore >= 40 || routeStatus === 'CAUTION' || routeStatus === 'RESTRICTED') {
      riskIndex = 'Caution';
    }

    return { riskIndex, riskScore: finalScore };
  }
}
