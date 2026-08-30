import { ConvoyRiskIndexService } from './risk-index.service';

describe('ConvoyRiskIndexService', () => {
  let service: ConvoyRiskIndexService;

  beforeEach(() => {
    service = new ConvoyRiskIndexService();
  });

  it('should calculate safe risk for high-priority cargo on clear route with recent checkin', () => {
    const result = service.calculateRiskIndex('Insulin/Blood', 'SAFE', 5, 0);
    expect(result.riskIndex).toBe('Safe');
    expect(result.riskScore).toBeLessThan(40);
  });

  it('should calculate Caution risk for route with caution status and adjacent hazards', () => {
    const result = service.calculateRiskIndex('General', 'CAUTION', 10, 2);
    expect(result.riskIndex).toBe('Caution');
    expect(result.riskScore).toBeGreaterThanOrEqual(35);
  });

  it('should calculate Blocked risk when route is blocked', () => {
    const result = service.calculateRiskIndex('Infant Nutrition', 'BLOCKED', 10, 3);
    expect(result.riskIndex).toBe('Blocked');
    expect(result.riskScore).toBeGreaterThanOrEqual(75);
  });

  it('should penalize silent convoys that miss check-ins for over 45 minutes', () => {
    const fresh = service.calculateRiskIndex('General', 'SAFE', 5, 0);
    const silent = service.calculateRiskIndex('General', 'SAFE', 60, 0);
    expect(silent.riskScore).toBeGreaterThan(fresh.riskScore);
  });
});
