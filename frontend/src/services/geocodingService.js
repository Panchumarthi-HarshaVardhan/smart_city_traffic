/**
 * CITYFLOW AI - Enhanced Geocoding & Location Autocomplete Service
 * Supports MapTiler Geocoding API with Nominatim fallback and in-memory caching.
 */

import { CITIES } from '../config/cities.js';

const MAPTILER_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPTILER_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_MAPTILER_API_KEY) ||
  '';

// In-memory cache for fast responsive typing and rate limit prevention
const cache = new Map();

/**
 * Format raw place feature from MapTiler or Nominatim into a clean suggestion object
 */
function formatFeature(item) {
  if (item.place_name) {
    // MapTiler format
    const parts = item.place_name.split(',').map((p) => p.trim());
    const placeName = item.text || parts[0] || 'Location';
    const city = parts.length > 2 ? parts[parts.length - 3] : (parts[1] || placeName);
    const state = parts.length > 1 ? parts[parts.length - 2] : '';
    const [lon, lat] = item.geometry?.coordinates || [0, 0];

    return {
      placeName,
      city,
      state,
      displayName: item.place_name,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    };
  } else {
    // Nominatim format
    const addr = item.address || {};
    const placeName = item.name || item.display_name.split(',')[0] || 'Location';
    const city = addr.city || addr.town || addr.county || addr.state_district || placeName;
    const state = addr.state || '';

    return {
      placeName,
      city,
      state,
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
  }
}

/**
 * Search autocomplete suggestions for Indian locations.
 * 
 * @param {string} query Search input string
 * @param {number} limit Maximum suggestions to return (default 5)
 * @returns {Promise<Array<Object>>} Formatted location suggestions
 */
export async function searchLocationSuggestions(query, limit = 5) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();
  const cacheKey = `suggest_${cleanQuery.toLowerCase()}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // 1. Try MapTiler Geocoding API
  if (MAPTILER_KEY) {
    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(cleanQuery)}.json?key=${MAPTILER_KEY}&country=in&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const features = data.features || [];
        if (features.length > 0) {
          const formatted = features.map(formatFeature);
          cache.set(cacheKey, formatted);
          return formatted;
        }
      }
    } catch (maptilerErr) {
      console.warn('MapTiler geocoding request notice, using fallback:', maptilerErr);
    }
  }

  // 2. Fallback: Query OpenStreetMap Nominatim with India countrycode
  try {
    const encoded = encodeURIComponent(`${cleanQuery}`);
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&countrycodes=in&limit=${limit}&addressdetails=1`;
    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CityFlowAI-UrbanTrafficPlanner/1.0',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(formatFeature);
        cache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (nomErr) {
    console.warn('Nominatim autocomplete fallback notice:', nomErr);
  }

  // 3. Last fallback: search against known local Indian cities
  const matchedCities = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(cleanQuery.toLowerCase())
  ).slice(0, limit);

  return matchedCities.map((c) => ({
    placeName: c.name,
    city: c.name,
    state: c.state,
    displayName: `${c.name}, ${c.state}, India`,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
}

/**
 * Reverse geocode latitude and longitude to a readable Indian address.
 * 
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{displayName: string, city: string, state: string, latitude: number, longitude: number}>}
 */
export async function reverseGeocodeLocation(latitude, longitude) {
  const cacheKey = `rev_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // 1. Try MapTiler Reverse Geocoding
  if (MAPTILER_KEY) {
    try {
      const url = `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const features = data.features || [];
        if (features.length > 0) {
          const item = features[0];
          const parts = (item.place_name || '').split(',').map((p) => p.trim());
          const placeName = item.text || parts[0] || 'Selected Point';
          const city = parts.length > 2 ? parts[parts.length - 3] : (parts[1] || placeName);
          const state = parts.length > 1 ? parts[parts.length - 2] : 'India';

          const result = {
            placeName,
            city,
            state,
            displayName: item.place_name,
            latitude,
            longitude,
          };
          cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      console.warn('MapTiler reverse geocode notice:', err);
    }
  }

  // 2. Fallback to Nominatim Reverse
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CityFlowAI-UrbanTrafficPlanner/1.0',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Selected Point';
      const state = addr.state || 'India';
      const displayName = data.display_name || `${city}, ${state}`;

      const result = {
        placeName: city,
        city,
        state,
        displayName,
        latitude,
        longitude,
      };
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Nominatim reverse notice:', err);
  }

  return {
    placeName: 'Map Location',
    city: 'India',
    state: 'India',
    displayName: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    latitude,
    longitude,
  };
}

/**
 * Standard forward geocode for single query
 */
export async function geocodeLocation(query) {
  const suggestions = await searchLocationSuggestions(query, 1);
  if (suggestions && suggestions.length > 0) {
    return suggestions[0];
  }
  throw new Error(`Unable to locate "${query}" in India. Please check the spelling or try a major city name.`);
}
