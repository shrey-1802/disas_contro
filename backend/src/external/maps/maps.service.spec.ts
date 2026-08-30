import { MapsService } from './maps.service';
import { MockMapsProvider } from './mock-maps.provider';
import { ConfigService } from '@nestjs/config';

describe('MapsService', () => {
  let service: MapsService;
  let configService: ConfigService;
  let mockProvider: MockMapsProvider;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue(''),
    } as any;

    mockProvider = new MockMapsProvider();
    service = new MapsService(configService, mockProvider);
  });

  it('should initialize in fallback mode when no external API key is configured', () => {
    expect(service.isGraphHopperActive).toBe(false);
    expect(service.currentProviderName).toBe('Local GIS Spatial Engine');
  });

  it('should initialize GraphHopper when GRAPHHOPPER_API_KEY is configured', () => {
    const ghConfig = {
      get: jest.fn((key: string) => {
        if (key === 'maps.graphhopperApiKey') return 'test_gh_key_123';
        return '';
      }),
    } as any;

    const ghService = new MapsService(ghConfig, mockProvider);
    expect(ghService.isGraphHopperActive).toBe(true);
    expect(ghService.currentProviderName).toBe('GraphHopper API');
  });

  it('should geocode address using GIS provider', async () => {
    const results = await service.geocode('100 Central Logistics Pkwy');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].location.latitude).toBeDefined();
    expect(results[0].location.longitude).toBeDefined();
  });

  it('should reverse geocode coordinates to location description', async () => {
    const results = await service.reverseGeocode(37.7749, -122.4194);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].formattedAddress).toContain('37.7749');
  });

  it('should compute route distance and travel duration between two coordinates', async () => {
    const route = await service.computeRoute(
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.8044, longitude: -122.2711 },
    );
    expect(route.distanceKm).toBeGreaterThan(0);
    expect(route.durationMinutes).toBeGreaterThan(0);
  });

  it('should compute distance matrix across multiple coordinates', async () => {
    const matrix = await service.computeDistanceMatrix(
      [{ latitude: 37.7749, longitude: -122.4194 }],
      [{ latitude: 37.8044, longitude: -122.2711 }],
    );
    expect(matrix.length).toBe(1);
    expect(matrix[0].distanceKm).toBeGreaterThan(0);
    expect(matrix[0].status).toBe('OK');
  });
});
