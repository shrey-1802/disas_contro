/**
 * Calculates the great-circle distance between two points on the Earth's surface in kilometers
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks if a point is within a given radius in kilometers from a center point.
 */
export function isPointWithinRadiusKm(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number,
): boolean {
  return calculateHaversineDistanceKm(centerLat, centerLon, pointLat, pointLon) <= radiusKm;
}

/**
 * Estimates travel duration in minutes based on distance and average speed.
 */
export function estimateTravelMinutes(
  distanceKm: number,
  averageSpeedKmh: number = 40,
  penaltyMultiplier: number = 1.0,
): number {
  if (distanceKm <= 0) return 0;
  const effectiveSpeed = Math.max(5, averageSpeedKmh / penaltyMultiplier);
  const hours = distanceKm / effectiveSpeed;
  return Math.round(hours * 60);
}
