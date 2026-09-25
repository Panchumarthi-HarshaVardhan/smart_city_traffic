/**
 * CITYFLOW AI - Route Planning Service Abstraction
 * Computes multi-route comparisons with AI-predicted travel times and reasons.
 */

import { MOCK_ROUTES_BY_PAIR } from '../data/routes';

export const routeService = {
  async findRoutes(from, to) {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const key = `${from}_${to}`;
    if (MOCK_ROUTES_BY_PAIR[key]) {
      return MOCK_ROUTES_BY_PAIR[key];
    }

    // Default fallback route comparison generator based on real roads
    return [
      {
        id: 'route-gen-rec',
        name: `Primary AI Corridor via Outer Ring Arterial`,
        tag: 'Recommended (Lowest Predicted Congestion)',
        distanceKm: 18.5,
        baseMinutes: 35,
        predictedMinutes: 42,
        delayMinutes: 7,
        predictedCongestion: 62.1,
        congestionCategory: 'MODERATE',
        summary: `Connects ${from} to ${to} while minimizing transit through severe bottleneck sectors.`,
        corridors: ['Hosur Road', '100 Feet Road'],
        reason: 'Recommended: Model predicts consistent moderate speed without severe signal stagnation.',
        coordinates: [
          [12.9242, 77.6543],
          [12.9784, 77.6408],
        ],
        color: '#3B82F6',
      },
      {
        id: 'route-gen-alt',
        name: `Direct Central Cut via Urban Core`,
        tag: 'Alternative Core Route',
        distanceKm: 15.2,
        baseMinutes: 30,
        predictedMinutes: 54,
        delayMinutes: 24,
        predictedCongestion: 84.3,
        congestionCategory: 'HIGH',
        summary: `Shorter physical distance but traverses heavy commercial intersections.`,
        corridors: ['Sony World Junction', 'Anil Kumble Circle'],
        reason: 'Caution: Model predicts high congestion and +24 min delay through core urban intersections.',
        coordinates: [
          [12.9348, 77.6271],
          [12.9756, 77.6067],
        ],
        color: '#F97316',
      }
    ];
  },

  async planEmergencyRoute(type, from, to) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const standardRoutes = await this.findRoutes(from, to);
    return standardRoutes.map((r, idx) => ({
      ...r,
      isEmergencyOptimized: idx === 0,
      emergencyClearanceFactor: idx === 0 ? 'Optimal (Wide median, 4-lane carriage)' : 'Constrained (Narrow junction pinch)',
      dispatchRecommendation: idx === 0
        ? `Decision Support: Recommended for ${type} dispatch. AI models project minimum congestion variance and wide road clearance.`
        : `Secondary fallback. Slower clearance predicted due to retail parked vehicles and tight turning radii.`,
    }));
  }
};
