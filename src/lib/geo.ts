/**
 * Geocoding and geofence utilities.
 * Uses OpenStreetMap Nominatim (free, no API key required).
 */

interface GeoResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address string to lat/lng using Nominatim.
 * Returns null if geocoding fails (non-blocking — shift still saves).
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=us`,
      {
        headers: {
          "User-Agent": "ShiftCare/1.0 (healthcare staffing platform)",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { latitude: lat, longitude: lng };
  } catch {
    // Geocoding failure should never block shift creation
    return null;
  }
}

/**
 * Calculate distance between two points using the Haversine formula.
 * Returns distance in miles.
 */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a point is within a geofence radius of a target.
 */
export function isWithinGeofence(
  workerLat: number,
  workerLng: number,
  shiftLat: number,
  shiftLng: number,
  radiusMiles: number
): { withinFence: boolean; distanceMiles: number } {
  const distance = haversineDistanceMiles(workerLat, workerLng, shiftLat, shiftLng);
  return {
    withinFence: distance <= radiusMiles,
    distanceMiles: Math.round(distance * 100) / 100,
  };
}
