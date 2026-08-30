import { Injectable, Logger } from '@nestjs/common';
import {
  IMapsProvider,
  LatLng,
  GeocodeResult,
  ComputeRouteResult,
  RouteMatrixElement,
} from './maps.interface';

@Injectable()
export class GraphHopperProvider implements IMapsProvider {
  private readonly logger = new Logger(GraphHopperProvider.name);
  private readonly baseUrl = 'https://graphhopper.com/api/1';

  constructor(private readonly apiKey: string) {}

  /**
   * GraphHopper Geocoding API
   */
  async geocode(address: string): Promise<GeocodeResult[]> {
    const url = `${this.baseUrl}/geocode?q=${encodeURIComponent(address)}&locale=en&key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.hits || data.hits.length === 0) {
        this.logger.warn(`GraphHopper Geocoding API returned no results for "${address}"`);
        return [];
      }

      return data.hits.map((h: any) => ({
        formattedAddress: [h.name, h.street, h.city, h.state, h.country].filter(Boolean).join(', ') || h.name,
        location: {
          latitude: h.point.lat,
          longitude: h.point.lng,
        },
        placeId: h.osm_id ? `osm_${h.osm_id}` : undefined,
        types: [h.osm_value, h.osm_key].filter(Boolean),
      }));
    } catch (err) {
      this.logger.error(`GraphHopper Geocoding failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * GraphHopper Reverse Geocoding API
   */
  async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult[]> {
    const url = `${this.baseUrl}/geocode?reverse=true&point=${lat},${lon}&locale=en&key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.hits || data.hits.length === 0) {
        return [
          {
            formattedAddress: `Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`,
            location: { latitude: lat, longitude: lon },
          },
        ];
      }

      return data.hits.map((h: any) => ({
        formattedAddress: [h.name, h.street, h.city, h.state, h.country].filter(Boolean).join(', ') || h.name,
        location: {
          latitude: h.point.lat,
          longitude: h.point.lng,
        },
        placeId: h.osm_id ? `osm_${h.osm_id}` : undefined,
        types: [h.osm_value, h.osm_key].filter(Boolean),
      }));
    } catch (err) {
      this.logger.error(`GraphHopper Reverse Geocoding failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * GraphHopper Routing API
   */
  async computeRoute(
    origin: LatLng,
    destination: LatLng,
    intermediates?: LatLng[],
  ): Promise<ComputeRouteResult> {
    const pointsParam = [
      `point=${origin.latitude},${origin.longitude}`,
      ...(intermediates || []).map((p) => `point=${p.latitude},${p.longitude}`),
      `point=${destination.latitude},${destination.longitude}`,
    ].join('&');

    const url = `${this.baseUrl}/route?${pointsParam}&profile=car&locale=en&instructions=true&points_encoded=false&calc_points=true&key=${this.apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.paths || data.paths.length === 0) {
        throw new Error(data.message || 'No route found by GraphHopper API');
      }

      const path = data.paths[0];
      const distanceMeters = Math.round(path.distance || 0);
      const durationSeconds = Math.round((path.time || 0) / 1000);
      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const durationMinutes = Math.round(durationSeconds / 60);

      const steps = (path.instructions || []).map((ins: any) => ({
        instruction: ins.text,
        distanceMeters: Math.round(ins.distance || 0),
        durationSeconds: Math.round((ins.time || 0) / 1000),
      }));

      return {
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMinutes,
        routeGeoJson: path.points,
        steps,
      };
    } catch (err) {
      this.logger.error(`GraphHopper computeRoute failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * GraphHopper Matrix API (with fallback to parallel point route calls)
   */
  async computeDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
  ): Promise<RouteMatrixElement[]> {
    const matrixUrl = `${this.baseUrl}/matrix?key=${this.apiKey}`;

    const body = {
      from_points: origins.map((o) => [o.longitude, o.latitude]),
      to_points: destinations.map((d) => [d.longitude, d.latitude]),
      out_arrays: ['distances', 'times'],
      profile: 'car',
    };

    try {
      const res = await fetch(matrixUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.distances && data.times) {
        const elements: RouteMatrixElement[] = [];

        origins.forEach((orig, oIdx) => {
          destinations.forEach((dest, dIdx) => {
            const distMeters = Math.round(data.distances[oIdx][dIdx] || 0);
            const timeMs = data.times[oIdx][dIdx] || 0;
            const durSec = Math.round(timeMs / 1000);

            elements.push({
              originIndex: oIdx,
              destinationIndex: dIdx,
              status: distMeters > 0 ? 'OK' : 'ZERO_RESULTS',
              distanceMeters: distMeters,
              distanceKm: Math.round((distMeters / 1000) * 10) / 10,
              durationSeconds: durSec,
              durationMinutes: Math.round(durSec / 60),
            });
          });
        });

        return elements;
      }
    } catch (err) {
      this.logger.warn(`GraphHopper Matrix API endpoint failed (${err.message}). Computing pairwise.`);
    }

    // Pairwise fallback
    const elements: RouteMatrixElement[] = [];
    for (let o = 0; o < origins.length; o++) {
      for (let d = 0; d < destinations.length; d++) {
        try {
          const route = await this.computeRoute(origins[o], destinations[d]);
          elements.push({
            originIndex: o,
            destinationIndex: d,
            status: 'OK',
            distanceMeters: route.distanceMeters,
            distanceKm: route.distanceKm,
            durationSeconds: route.durationSeconds,
            durationMinutes: route.durationMinutes,
          });
        } catch (e) {
          elements.push({
            originIndex: o,
            destinationIndex: d,
            status: 'ERROR',
            distanceMeters: 0,
            distanceKm: 0,
            durationSeconds: 0,
            durationMinutes: 0,
          });
        }
      }
    }

    return elements;
  }
}
