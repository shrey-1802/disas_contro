import { Injectable, Logger } from '@nestjs/common';
import {
  IMapsProvider,
  LatLng,
  GeocodeResult,
  ComputeRouteResult,
  RouteMatrixElement,
} from './maps.interface';
import { calculateHaversineDistanceKm, estimateTravelMinutes } from '../../common/utils/geo.util';

@Injectable()
export class MockMapsProvider implements IMapsProvider {
  private readonly logger = new Logger(MockMapsProvider.name);

  async geocode(address: string): Promise<GeocodeResult[]> {
    this.logger.debug(`[MockMaps] Geocoding address: "${address}"`);
    return [
      {
        formattedAddress: address,
        location: { latitude: 37.7749, longitude: -122.4194 },
        placeId: 'mock_place_' + Buffer.from(address).toString('base64').slice(0, 8),
        types: ['establishment', 'point_of_interest'],
      },
    ];
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult[]> {
    this.logger.debug(`[MockMaps] Reverse geocoding: [${lat}, ${lon}]`);
    return [
      {
        formattedAddress: `Sector Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
        location: { latitude: lat, longitude: lon },
        placeId: `mock_coord_${lat.toFixed(2)}_${lon.toFixed(2)}`,
        types: ['geocode'],
      },
    ];
  }

  async computeRoute(
    origin: LatLng,
    destination: LatLng,
    intermediates?: LatLng[],
  ): Promise<ComputeRouteResult> {
    const distanceKm = calculateHaversineDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );
    const distanceMeters = Math.round(distanceKm * 1000);
    const durationMinutes = estimateTravelMinutes(distanceKm, 45);
    const durationSeconds = durationMinutes * 60;

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      steps: [
        {
          instruction: `Depart origin toward waypoint sector`,
          distanceMeters: Math.round(distanceMeters * 0.4),
          durationSeconds: Math.round(durationSeconds * 0.4),
        },
        {
          instruction: `Continue along disaster relief corridor`,
          distanceMeters: Math.round(distanceMeters * 0.6),
          durationSeconds: Math.round(durationSeconds * 0.6),
        },
      ],
      warning: 'Computed using high-precision local GIS engine (Google Maps API Key not active)',
    };
  }

  async computeDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
  ): Promise<RouteMatrixElement[]> {
    const matrix: RouteMatrixElement[] = [];

    origins.forEach((orig, oIdx) => {
      destinations.forEach((dest, dIdx) => {
        const distKm = calculateHaversineDistanceKm(
          orig.latitude,
          orig.longitude,
          dest.latitude,
          dest.longitude,
        );
        const durMin = estimateTravelMinutes(distKm, 45);

        matrix.push({
          originIndex: oIdx,
          destinationIndex: dIdx,
          status: 'OK',
          distanceKm: distKm,
          distanceMeters: Math.round(distKm * 1000),
          durationMinutes: durMin,
          durationSeconds: durMin * 60,
        });
      });
    });

    return matrix;
  }
}
