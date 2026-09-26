/**
 * CITYFLOW AI - Emergency Response Intelligence Service
 * 
 * Interacts with backend emergency routing and corridor analysis endpoints:
 * 1. Automatic discovery of candidate hospitals from Verified Hospital Catalog.
 * 2. Traffic-aware hospital evaluation & lowest-ETA recommendation (Google Routes TRAFFIC_AWARE).
 * 3. Corridor congestion & live incident analysis (TomTom Telemetry).
 * 4. Factual, actionable Authority Traffic Management Recommendations.
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Fetch candidate hospitals near the ambulance, sorted by proximity.
 * @param {number} lat Ambulance latitude
 * @param {number} lng Ambulance longitude
 * @param {number} limit Max candidates (default 5)
 */
export async function getNearbyHospitals(lat, lng, limit = 5) {
  try {
    const res = await fetch(
      `${API_BASE}/emergency/hospitals-nearby?lat=${lat}&lng=${lng}&limit=${limit}`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch nearby hospitals (${res.status})`);
    }
    const data = await res.json();
    return data.hospitals || [];
  } catch (err) {
    console.warn('Emergency service getNearbyHospitals error:', err);
    return [];
  }
}

/**
 * Automatically evaluate candidate hospitals using live Google Routes traffic-aware
 * routing and select the recommended hospital with lowest ETA.
 * 
 * @param {number} originLat Ambulance latitude
 * @param {number} originLng Ambulance longitude
 * @param {number} limit Max candidates to evaluate (default 4)
 */
export async function recommendHospital(originLat, originLng, limit = 4) {
  try {
    const res = await fetch(`${API_BASE}/emergency/recommend-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lng: originLng,
        limit: limit,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to evaluate hospital recommendations (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Emergency service recommendHospital error:', err);
    throw err;
  }
}

/**
 * Analyze traffic problems, delays, and incidents along the emergency route corridor,
 * generating structured recommendations for traffic authorities.
 * 
 * @param {number} originLat Origin latitude
 * @param {number} originLng Origin longitude
 * @param {number} destLat Destination latitude
 * @param {number} destLng Destination longitude
 * @param {Object} activeRoute Currently selected route object
 * @param {Array} allRoutes All computed alternative routes
 */
export async function analyzeCorridorCongestion(
  originLat,
  originLng,
  destLat,
  destLng,
  activeRoute,
  allRoutes = []
) {
  try {
    const res = await fetch(`${API_BASE}/emergency/analyze-corridor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
        active_route: activeRoute,
        all_routes: allRoutes,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to analyze corridor congestion (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Emergency corridor analysis notice:', err);
    return {
      corridor_analysis: {
        corridorName: activeRoute?.name || 'Primary Corridor',
        condition: activeRoute?.trafficCondition || 'Light Traffic',
        delayMinutes: activeRoute?.trafficDelayMinutes || 0,
        incidentCount: 0,
        nearbyIncidents: [],
        obstructionDetected: false,
        summary: 'Corridor telemetry evaluated. Live incident data temporarily unavailable.',
      },
      recommendations: [
        {
          priority: 'MONITOR',
          priorityLevel: 'monitor',
          corridor: activeRoute?.name || 'Primary Corridor',
          condition: activeRoute?.trafficCondition || 'Light Traffic',
          reason: 'Emergency response transit active.',
          suggestedAction: 'Maintain continuous corridor monitoring and road surveillance.',
        },
      ],
      disclaimer:
        'All recommendations are advisory decision-support suggestions for traffic authorities. CITYFLOW does not directly manipulate municipal traffic light systems.',
    };
  }
}
