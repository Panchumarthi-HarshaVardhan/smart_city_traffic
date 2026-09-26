/**
 * CITYFLOW AI - Route Traffic Overlay Service
 * Inspects OSRM routes against CITYFLOW AI's validated ML prediction coverage.
 * 
 * Rules:
 * - If route is in/around Bengaluru and touches validated corridors, query FastAPI backend.
 * - If route is outside Bengaluru ML coverage, gracefully state coverage is expanding.
 * - Never fabricate ML predictions for unsupported cities.
 */

const API_BASE = 'http://localhost:8000/api';

// Bounding box for Bengaluru metropolitan coverage area
const BENGALURU_BBOX = {
  minLat: 12.75,
  maxLat: 13.25,
  minLng: 77.40,
  maxLng: 77.85,
};

const BENGALURU_CORRIDORS = [
  'Sarjapur Road', 'Sony World Junction', 'Anil Kumble Circle', 'Trinity Circle',
  '100 Feet Road', 'CMH Road', 'South End Circle', 'Jayanagar 4th Block',
  'Ballari Road', 'Hebbal Flyover', 'Marathahalli Bridge', 'ITPL Main Road',
  'Hosur Road', 'Silk Board Junction', 'Tumkur Road', 'Yeshwanthpur Circle',
];

/**
 * Check if a coordinate pair falls within Bengaluru bounds
 */
function isNearBengaluru(lat, lng) {
  return (
    lat >= BENGALURU_BBOX.minLat &&
    lat <= BENGALURU_BBOX.maxLat &&
    lng >= BENGALURU_BBOX.minLng &&
    lng <= BENGALURU_BBOX.maxLng
  );
}

/**
 * Analyze an OSRM route and attach CITYFLOW AI prediction overlay if within coverage.
 * 
 * @param {Object} route Route object from osrmService
 * @param {Object} origin { latitude, longitude, displayName }
 * @param {Object} destination { latitude, longitude, displayName }
 * @returns {Promise<Object>} Enriched route traffic metadata
 */
export async function analyzeRouteTraffic(route, origin, destination) {
  const originInBlr = isNearBengaluru(origin.latitude, origin.longitude);
  const destInBlr = isNearBengaluru(destination.latitude, destination.longitude);

  // If entirely outside Bengaluru metropolitan area:
  if (!originInBlr && !destInBlr) {
    return {
      hasMLCoverage: false,
      coverageNotice:
        'Routing is available for this location. CITYFLOW AI traffic prediction coverage is currently available for selected roads in Bengaluru and is actively being expanded.',
      category: null,
      congestionScore: null,
      delayMinutes: 0,
      matchedCorridors: [],
    };
  }

  // Detect which known corridors the route touches
  const matchedCorridors = [];
  const viaRoads = route.viaRoads || [];
  const routeText = `${route.name || ''} ${route.description || ''} ${viaRoads.join(' ')} ${origin.displayName || ''} ${destination.displayName || ''}`.toLowerCase();

  for (const corridor of BENGALURU_CORRIDORS) {
    const normCorridor = corridor.toLowerCase();
    if (routeText.includes(normCorridor)) {
      matchedCorridors.push(corridor);
    }
  }

  // If no validated Bengaluru arterial corridors match, forecast is honest and unavailable
  if (matchedCorridors.length === 0) {
    return {
      hasMLCoverage: false,
      coverageNotice:
        'Next-day CITYFLOW ML forecasts are currently validated for Bengaluru arterial corridors. Live traffic and traffic-aware routing remain active across India.',
      category: null,
      congestionScore: null,
      delayMinutes: 0,
      matchedCorridors: [],
    };
  }

  try {
    // Call FastAPI route summary or predictions endpoint for genuine matched corridors
    const res = await fetch(`${API_BASE}/routes/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ road_names: matchedCorridors }),
    });

    if (res.ok) {
      const data = await res.json();
      const avgCongestion = data.average_congestion;

      if (avgCongestion !== null && avgCongestion !== undefined) {
        let category = 'MODERATE';
        if (avgCongestion >= 90) {
          category = 'SEVERE';
        } else if (avgCongestion >= 70) {
          category = 'HIGH';
        } else if (avgCongestion >= 40) {
          category = 'MODERATE';
        } else {
          category = 'LOW';
        }

        return {
          hasMLCoverage: true,
          category,
          congestionScore: avgCongestion,
          matchedCorridors,
          recommendedDeparture: data.recommended_departure,
          coverageNotice:
            'CITYFLOW AI forecast derived from validated Bengaluru arterial corridor models.',
        };
      }
    }
  } catch (err) {
    console.warn('Backend traffic analysis request error:', err);
  }

  return {
    hasMLCoverage: false,
    coverageNotice:
      'Next-day CITYFLOW ML forecasts are currently validated for Bengaluru arterial corridors. Live traffic and traffic-aware routing remain active across India.',
    category: null,
    congestionScore: null,
    delayMinutes: 0,
    matchedCorridors: [],
  };
}
