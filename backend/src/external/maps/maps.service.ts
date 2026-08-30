import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IMapsProvider,
  LatLng,
  GeocodeResult,
  ComputeRouteResult,
  RouteMatrixElement,
} from './maps.interface';
import { GraphHopperProvider } from './graphhopper.provider';
import { MockMapsProvider } from './mock-maps.provider';

@Injectable()
export class MapsService implements IMapsProvider {
  private readonly logger = new Logger(MapsService.name);
  private provider: IMapsProvider;
  private readonly activeProviderName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockMapsProvider,
  ) {
    const graphhopperKey = this.configService.get<string>('maps.graphhopperApiKey');

    if (graphhopperKey && graphhopperKey.trim() !== '' && graphhopperKey !== 'YOUR_GRAPHHOPPER_API_KEY') {
      this.logger.log('🗺️ GraphHopper Routing & Geocoding Provider ACTIVE');
      this.provider = new GraphHopperProvider(graphhopperKey);
      this.activeProviderName = 'GraphHopper API';
    } else {
      this.logger.log('🗺️ Local GIS Fallback Engine ACTIVE (Set GRAPHHOPPER_API_KEY in .env to enable live GraphHopper Routing & Geocoding)');
      this.provider = mockProvider;
      this.activeProviderName = 'Local GIS Spatial Engine';
    }
  }

  get currentProviderName(): string {
    return this.activeProviderName;
  }

  get isGraphHopperActive(): boolean {
    return this.activeProviderName === 'GraphHopper API';
  }

  async geocode(address: string): Promise<GeocodeResult[]> {
    try {
      return await this.provider.geocode(address);
    } catch (err) {
      this.logger.warn(`Primary maps provider failed for geocode("${address}"). Falling back to local GIS engine.`, err.message);
      return this.mockProvider.geocode(address);
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult[]> {
    try {
      return await this.provider.reverseGeocode(lat, lon);
    } catch (err) {
      this.logger.warn(`Primary maps provider failed for reverseGeocode([${lat}, ${lon}]). Falling back to local GIS engine.`, err.message);
      return this.mockProvider.reverseGeocode(lat, lon);
    }
  }

  async computeRoute(
    origin: LatLng,
    destination: LatLng,
    intermediates?: LatLng[],
  ): Promise<ComputeRouteResult> {
    try {
      return await this.provider.computeRoute(origin, destination, intermediates);
    } catch (err) {
      this.logger.warn(`Primary maps provider failed for computeRoute. Falling back to local GIS engine.`, err.message);
      return this.mockProvider.computeRoute(origin, destination, intermediates);
    }
  }

  async computeDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
  ): Promise<RouteMatrixElement[]> {
    try {
      return await this.provider.computeDistanceMatrix(origins, destinations);
    } catch (err) {
      this.logger.warn(`Primary maps provider failed for computeDistanceMatrix. Falling back to local GIS engine.`, err.message);
      return this.mockProvider.computeDistanceMatrix(origins, destinations);
    }
  }
}
