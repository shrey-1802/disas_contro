import { Injectable } from '@nestjs/common';

export interface SourceReport {
  source: string; // 'Sensor', 'Satellite Radar', 'Field Driver', 'Public Citizen'
  timestamp: Date;
  reportedConfidence: number;
}

@Injectable()
export class HazardFusionService {
  /**
   * Resolves fused confidence from multi-source observations
   */
  calculateFusedConfidence(reports: SourceReport[]): number {
    if (!reports || reports.length === 0) return 50;

    let totalWeight = 0;
    let weightedConfidenceSum = 0;

    for (const rep of reports) {
      // 1. Source reliability weighting
      let sourceWeight = 1.0;
      const lowerSource = rep.source.toLowerCase();
      if (lowerSource.includes('satellite') || lowerSource.includes('radar')) {
        sourceWeight = 1.5;
      } else if (lowerSource.includes('sensor') || lowerSource.includes('gauge')) {
        sourceWeight = 1.4;
      } else if (lowerSource.includes('driver') || lowerSource.includes('field')) {
        sourceWeight = 1.3;
      } else {
        sourceWeight = 0.8;
      }

      // 2. Recency decay (half-life of 60 mins)
      const ageMinutes = (Date.now() - new Date(rep.timestamp).getTime()) / (1000 * 60);
      const recencyFactor = Math.max(0.3, Math.exp(-ageMinutes / 60));

      const combinedWeight = sourceWeight * recencyFactor;
      totalWeight += combinedWeight;
      weightedConfidenceSum += rep.reportedConfidence * combinedWeight;
    }

    // 3. Multi-source corroboration bonus (up to +15%)
    const distinctSources = new Set(reports.map((r) => r.source.toLowerCase())).size;
    const corroborationBonus = distinctSources > 1 ? (distinctSources - 1) * 7.5 : 0;

    const baseFused = weightedConfidenceSum / (totalWeight || 1);
    return Math.min(100, Math.max(10, Math.round(baseFused + corroborationBonus)));
  }
}
