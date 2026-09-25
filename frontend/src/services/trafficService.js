/**
 * CITYFLOW AI - Traffic Service Abstraction
 * Currently serves validated local mock data; easily swapped for FastAPI/Supabase endpoints.
 */

import { CITY_TRAFFIC_OVERVIEW, HISTORICAL_WEEK_TRENDS, CORRIDOR_TREND_HISTORY } from '../data/traffic';
import { BENGALURU_ROADS } from '../data/roads';

export const trafficService = {
  async getCityOverview() {
    // Simulating async network delay
    await new Promise((resolve) => setTimeout(resolve, 80));
    return CITY_TRAFFIC_OVERVIEW;
  },

  async getAllRoads() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return BENGALURU_ROADS;
  },

  async getCorridorHistory(roadName) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return CORRIDOR_TREND_HISTORY[roadName] || CORRIDOR_TREND_HISTORY['Sarjapur Road'];
  },

  async getWeeklyTrends() {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return HISTORICAL_WEEK_TRENDS;
  }
};
