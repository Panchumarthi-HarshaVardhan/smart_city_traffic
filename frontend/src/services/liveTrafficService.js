/**
 * CITYFLOW AI - Live Traffic Client Service (TomTom Integration)
 * Calls the FastAPI backend to retrieve real-time road speeds, free-flow speeds,
 * delay metrics, and incidents. Never calls TomTom directly or exposes API keys.
 */

const API_BASE = 'http://localhost:8000/api';

// Cache to prevent rapid identical queries within 15 seconds
const cache = new Map();
const CACHE_TTL_MS = 15000;

/**
 * Fetch live traffic flow for a given coordinate.
 * 
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {number} zoom Zoom level (default 10)
 * @returns {Promise<Object>} Live traffic status object
 */
export async function getLiveTraffic(lat, lng, zoom = 10) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return {
      available: false,
      message: 'Invalid coordinates provided for live traffic.',
    };
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const now = Date.now();
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const res = await fetch(`${API_BASE}/live-traffic?lat=${lat}&lng=${lng}&zoom=${zoom}`);
    if (!res.ok) {
      return {
        available: false,
        message: 'Live traffic is temporarily unavailable.',
      };
    }

    const data = await res.json();
    if (data.available) {
      cache.set(cacheKey, { data, timestamp: now });
    }
    return data;
  } catch (err) {
    console.warn('Live traffic API network failure:', err);
    return {
      available: false,
      message: 'Live traffic is temporarily unavailable.',
    };
  }
}

/**
 * Fetch active traffic incidents around a location.
 * 
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @param {number} radiusKm Search radius in km
 * @returns {Promise<Array>} List of incidents
 */
export async function getTrafficIncidents(lat, lng, radiusKm = 12) {
  try {
    const res = await fetch(`${API_BASE}/traffic-incidents?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.incidents || [];
  } catch (err) {
    console.warn('Traffic incidents fetch failure:', err);
    return [];
  }
}
