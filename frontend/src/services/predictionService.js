/**
 * CITYFLOW AI - Prediction Service Abstraction
 * Correlates corridor predictions, rankings, and hotspot telemetry.
 */

import { CORRIDOR_PREDICTIONS } from '../data/predictions';
import { BENGALURU_HOTSPOTS } from '../data/hotspots';

export const predictionService = {
  async getPredictionForRoad(roadName) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return CORRIDOR_PREDICTIONS[roadName] || null;
  },

  async getAllPredictions() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Object.values(CORRIDOR_PREDICTIONS);
  },

  async getHotspots(topN = 10) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (topN) {
      return BENGALURU_HOTSPOTS.slice(0, topN);
    }
    return BENGALURU_HOTSPOTS;
  }
};
