/**
 * CITYFLOW AI - OSRM Routing Service
 * Connects to public OpenStreetMap OSRM routing engine
 * Computes road-network driving routes, alternative geometries, distances, and base durations.
 */

/**
 * Format duration in minutes into a clean human-readable string (e.g. "58 min", "1 hr 14 min")
 */
export function formatDuration(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes)) return '0 min';
  const mins = Math.round(totalMinutes);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs} hr ${remMins} min` : `${hrs} hr`;
}

/**
 * Request driving routes and alternatives from OSRM.
 * 
 * @param {number} startLat Origin latitude
 * @param {number} startLng Origin longitude
 * @param {number} endLat Destination latitude
 * @param {number} endLng Destination longitude
 * @returns {Promise<Array<Object>>} Parsed routes list
 */
export async function getOsrmRoutes(startLat, startLng, endLat, endLng) {
  const lon1 = startLng.toFixed(6);
  const lat1 = startLat.toFixed(6);
  const lon2 = endLng.toFixed(6);
  const lat2 = endLat.toFixed(6);

  const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?alternatives=true&overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM routing service failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(data.message || 'No driving route found between these locations.');
  }

  // Parse and format each route
  return data.routes.map((route, index) => {
    // GeoJSON coordinates are [lon, lat] -> convert to Leaflet [lat, lon]
    const leafletCoords = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);

    const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
    const durationMinutes = Math.round(route.duration / 60);

    // Extract road names from legs/steps if available
    const streetNames = new Set();
    if (route.legs) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const step of leg.steps) {
            if (step.name && step.name.trim() && !step.name.includes('{')) {
              streetNames.add(step.name.trim());
            }
          }
        }
      }
    }

    return {
      id: `route-${index + 1}`,
      name: index === 0 ? 'OSRM Recommended Route' : `Alternative Route ${index}`,
      isPrimary: index === 0,
      distanceKm,
      durationMinutes,
      formattedDuration: formatDuration(durationMinutes),
      coordinates: leafletCoords,
      viaRoads: Array.from(streetNames).slice(0, 4),
      rawRoute: route,
    };
  });
}
