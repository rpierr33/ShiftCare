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
 * Returns null if geocoding fails — non-blocking so shift creation always succeeds.
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    // Nominatim requires a User-Agent header per their usage policy
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
    // No results found for the address
    if (!data || data.length === 0) return null;

    // Nominatim returns lat/lon as strings — must parseFloat
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    // Guard against invalid parse results
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
 * Formula: a = sin²(dlat/2) + cos(lat1) * cos(lat2) * sin²(dlng/2)
 *          c = 2 * atan2(sqrt(a), sqrt(1-a))
 *          distance = R * c
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

// Converts degrees to radians for trigonometric calculations
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a worker's location is within a geofence radius of a shift location.
 * Returns both the boolean result and the actual distance for display purposes.
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
    // Round to 2 decimal places for clean display
    distanceMiles: Math.round(distance * 100) / 100,
  };
}
