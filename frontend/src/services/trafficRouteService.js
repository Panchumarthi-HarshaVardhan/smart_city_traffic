/**
 * CITYFLOW AI - Intelligent Unified Route Planning Service
 * Integrates:
 * 1. Google Routes API (via backend): Traffic-aware routes, ETAs, delays, and polylines.
 * 2. OSRM (fallback): Reliable open-source routing when Google API is unreachable.
 * 3. TomTom Traffic API (via backend): Real-time road flow speeds and delay analysis.
 * 4. CITYFLOW ML Engine: Scientifically validated multi-corridor congestion forecasts.
 */

import { getOsrmRoutes } from './osrmService.js';
import { analyzeRouteTraffic } from './routeTrafficService.js';
import { getLiveTraffic } from './liveTrafficService.js';

const API_BASE = 'http://localhost:8000/api';

/**
 * Canonical CITYFLOW Route Recommendation Engine
 * Single source of truth for route ranking and recommendation.
 *
 * Requirements:
 * 1. Filter invalid/empty routes.
 * 2. Sort by:
 *    - traffic-aware duration ASC (traffic-aware ETA is primary criterion)
 *    - traffic delay ASC (secondary tie-breaker)
 *    - route distance ASC (tertiary tie-breaker)
 * 3. Assign deterministic isPrimary, recommendationRank, and roleLabel.
 * 4. Return sorted array with the recommended route at index 0.
 */
export function recommendRoute(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return [];

  // Filter invalid routes
  const valid = routes.filter(
    (r) => r && (r.durationSeconds !== undefined || r.durationMinutes !== undefined)
  );
  if (valid.length === 0) return [];

  // Deterministic sorting
  const sorted = [...valid].sort((a, b) => {
    // 1. Primary: traffic-aware duration ASC
    const durA = a.durationSeconds ?? ((a.durationMinutes || 0) * 60);
    const durB = b.durationSeconds ?? ((b.durationMinutes || 0) * 60);
    if (durA !== durB) return durA - durB;

    // 2. Secondary: traffic delay ASC
    const delayA = a.trafficDelaySeconds ?? ((a.trafficDelayMinutes || 0) * 60);
    const delayB = b.trafficDelaySeconds ?? ((b.trafficDelayMinutes || 0) * 60);
    if (delayA !== delayB) return delayA - delayB;

    // 3. Tertiary: distance ASC
    const distA = a.distanceMeters ?? ((a.distanceKm || 0) * 1000);
    const distB = b.distanceMeters ?? ((b.distanceKm || 0) * 1000);
    return distA - distB;
  });

  return sorted.map((r, idx) => {
    const isPrimary = (idx === 0);
    const roleLabel = isPrimary ? 'Recommended Route' : `Alternative Route ${idx}`;
    return {
      ...r,
      isPrimary,
      recommendationRank: idx + 1,
      roleLabel,
      name: (r.name && !r.name.startsWith('Route ') && !r.name.startsWith('google-route')) ? r.name : roleLabel,
    };
  });
}

/**
 * Factual "Why this route?" explanation generator.
 * Strictly compares the active route against alternatives without inventing reasons.
 */
export function getRouteRecommendationExplanation(activeRoute, allRoutes) {
  if (!activeRoute || !allRoutes || allRoutes.length === 0) return '';

  // Single route edge case
  if (allRoutes.length === 1) {
    if (activeRoute.isTrafficAware === false) {
      return 'Standard driving route calculated from road network geometry.';
    }
    return 'Primary recommended driving route based on current traffic-aware road data.';
  }

  const recRoute = allRoutes.find((r) => r.isPrimary) || allRoutes[0];
  const isRecommended = activeRoute.id === recRoute.id || activeRoute.isPrimary;

  if (isRecommended) {
    const otherRoutes = allRoutes.filter((r) => r.id !== activeRoute.id);
    const slowerBy = otherRoutes
      .map((r) => (r.durationMinutes ?? 0) - (activeRoute.durationMinutes ?? 0))
      .filter((diff) => diff > 0);

    if (slowerBy.length > 0) {
      const maxSavings = Math.max(...slowerBy);
      return `Recommended based on lowest traffic-aware ETA (saves ${maxSavings} min compared to alternative corridors).`;
    }

    // If ETA is tied, check delay savings
    const higherDelay = otherRoutes
      .map((r) => (r.trafficDelayMinutes ?? 0) - (activeRoute.trafficDelayMinutes ?? 0))
      .filter((diff) => diff > 0);

    if (higherDelay.length > 0) {
      return 'Recommended based on comparable ETA and lower traffic delay.';
    }

    return 'Recommended based on lowest available traffic-aware ETA.';
  }

  // Active route is an alternative corridor
  const extraMinutes = (activeRoute.durationMinutes ?? 0) - (recRoute.durationMinutes ?? 0);
  const corridorName = activeRoute.name || 'alternative corridor';

  if (extraMinutes > 0) {
    return `Alternative corridor via ${corridorName} (+${extraMinutes} min longer travel time).`;
  } else if (extraMinutes === 0) {
    const extraDelay = (activeRoute.trafficDelayMinutes ?? 0) - (recRoute.trafficDelayMinutes ?? 0);
    if (extraDelay > 0) {
      return `Alternative corridor via ${corridorName} (same overall travel time, but +${extraDelay} min additional traffic delay).`;
    }
    return `Alternative corridor via ${corridorName} with comparable travel time.`;
  }

  return `Alternative corridor via ${corridorName}.`;
}

/**
 * Calculate routes between two geocoded locations with real traffic data.
 * 
 * @param {Object} origin { latitude, longitude, displayName }
 * @param {Object} destination { latitude, longitude, displayName }
 * @returns {Promise<{routes: Array, routingSource: string, liveTraffic: Object|null}>}
 */
export async function calculateJourneyRoutes(origin, destination) {
  let computedRoutes = [];
  let routingSource = 'Google Routes (Traffic-Aware)';
  let isTrafficAware = true;

  // 1. Try Google Routes API via CITYFLOW backend
  try {
    const res = await fetch(`${API_BASE}/traffic-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_lat: origin.latitude,
        origin_lng: origin.longitude,
        dest_lat: destination.latitude,
        dest_lng: destination.longitude,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.available && data.routes && data.routes.length > 0) {
        computedRoutes = data.routes;
        isTrafficAware = true;
      }
    }
  } catch (err) {
    console.warn('Backend traffic-route request failed, falling back to OSRM:', err);
  }

  // 2. Fallback to OSRM if Google Routes is unavailable
  if (computedRoutes.length === 0) {
    console.info('Using OSRM engine for route calculation...');
    routingSource = 'Standard routing fallback (OSRM)';
    isTrafficAware = false;
    try {
      computedRoutes = await getOsrmRoutes(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
    } catch (osrmErr) {
      throw new Error("We couldn't find a driving route between these locations.");
    }
  }

  // 3. Query TomTom live traffic flow for the starting corridor
  let liveTraffic = null;
  try {
    liveTraffic = await getLiveTraffic(origin.latitude, origin.longitude);
  } catch (liveErr) {
    console.warn('Live traffic segment fetch notice:', liveErr);
  }

  // 4. Attach CITYFLOW ML prediction overlay for each route
  const enrichedRoutes = await Promise.all(
    computedRoutes.map(async (route) => {
      let mlAnalysis = null;
      try {
        mlAnalysis = await analyzeRouteTraffic(route, origin, destination);
      } catch (mlErr) {
        console.warn('ML route analysis notice:', mlErr);
      }

      if (isTrafficAware) {
        // Keep Google Routes traffic-aware parameters intact
        return {
          ...route,
          isTrafficAware: true,
          mlForecast: mlAnalysis,
        };
      } else {
        // OSRM fallback: Do NOT fabricate traffic delay or live traffic claims
        return {
          ...route,
          isTrafficAware: false,
          trafficDelayMinutes: null,
          trafficDelaySeconds: 0,
          trafficImpactRatio: 0,
          trafficImpact: 'Standard',
          trafficCondition: 'Standard routing',
          conditionColor: '#64748B',
          mlForecast: mlAnalysis,
        };
      }
    })
  );

  // 5. Rank and Recommend using canonical recommendation engine
  const finalRoutes = recommendRoute(enrichedRoutes);

  return {
    routes: finalRoutes,
    routingSource,
    liveTraffic,
  };
}
