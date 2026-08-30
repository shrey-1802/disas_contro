export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
  types?: string[];
}

export interface RouteMatrixElement {
  originIndex: number;
  destinationIndex: number;
  status: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
}

export interface ComputeRouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  encodedPolyline?: string;
  routeGeoJson?: any;
  steps?: {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
  }[];
  warning?: string;
}

export interface IMapsProvider {
  geocode(address: string): Promise<GeocodeResult[]>;
  reverseGeocode(lat: number, lon: number): Promise<GeocodeResult[]>;
  computeRoute(
    origin: LatLng,
    destination: LatLng,
    intermediates?: LatLng[],
    avoidHazardPoints?: LatLng[],
  ): Promise<ComputeRouteResult>;
  computeDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
  ): Promise<RouteMatrixElement[]>;
}
