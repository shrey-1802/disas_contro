import { RouteGraphService } from './route-graph.service';

describe('RouteGraphService', () => {
  let service: RouteGraphService;

  beforeEach(() => {
    service = new RouteGraphService();
  });

  it('should calculate safe direct path when no hazards are present', () => {
    const origin = { lat: 37.7749, lon: -122.4194 };
    const destination = { lat: 37.8044, lon: -122.2711 };
    const result = service.calculateSafePath(origin, destination, []);

    expect(result.routeFound).toBe(true);
    expect(result.operationalStatus).toBe('SAFE');
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThan(30);
  });

  it('should compute detour route and caution status when an impassable hazard blocks the corridor', () => {
    const origin = { lat: 37.7749, lon: -122.4194 };
    const destination = { lat: 37.8044, lon: -122.2711 };
    const hazards = [
      {
        lat: 37.7896,
        lon: -122.3452,
        severity: 'IMPASSABLE',
        radiusMeters: 500,
      },
    ];

    const result = service.calculateSafePath(origin, destination, hazards);

    expect(result.routeFound).toBe(true);
    expect(result.reason).toContain('Detour path routed around structural failure');
    expect(result.operationalStatus).toBe('CAUTION');
  });
});
