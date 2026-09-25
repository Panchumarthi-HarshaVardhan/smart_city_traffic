/**
 * CITYFLOW AI - Congestion Hotspots
 * Ranked strictly by predicted congestion level descending from validated ML model
 */

export const BENGALURU_HOTSPOTS = [
  {
    rank: 1,
    road: 'Sarjapur Road',
    area: 'Koramangala',
    coordinates: [12.9242, 77.6543],
    predictedCongestion: 95.7,
    predictedSpeed: 34.7,
    predictedTrafficVolume: 43489,
    congestionCategory: 'SEVERE',
    trend: 'Worsening (+4.2%)',
    corridorType: 'Arterial Radial Highway',
    capacityUtilization: '98.5%',
    incidentHistory: 'Moderate (1.8/day)',
    contributingFactors: [
      '7-day rolling traffic volume persistence (0.432 feature importance)',
      'Heavy corridor capacity saturation during IT shift hours',
      'Construction and reduced lane widths near Bellandur junction',
      'High vehicle dwell time at signalized bottlenecks'
    ]
  },
  {
    rank: 2,
    road: 'Sony World Junction',
    area: 'Koramangala',
    coordinates: [12.9348, 77.6271],
    predictedCongestion: 93.6,
    predictedSpeed: 34.8,
    predictedTrafficVolume: 40094,
    congestionCategory: 'SEVERE',
    trend: 'Stable High',
    corridorType: '4-Way Major Intersection',
    capacityUtilization: '97.0%',
    incidentHistory: 'High (2.4/day)',
    contributingFactors: [
      'Multi-directional turning movement queueing',
      'Area-level Koramangala commercial density',
      'Signal cycle staging delays at 80 Feet Road junction',
      'Public transport bus stop dwell friction'
    ]
  },
  {
    rank: 3,
    road: 'Anil Kumble Circle',
    area: 'M.G. Road',
    coordinates: [12.9756, 77.6067],
    predictedCongestion: 93.1,
    predictedSpeed: 37.8,
    predictedTrafficVolume: 38427,
    congestionCategory: 'SEVERE',
    trend: 'Worsening (+2.8%)',
    corridorType: 'CBD Commercial Hub',
    capacityUtilization: '95.2%',
    incidentHistory: 'Low (0.9/day)',
    contributingFactors: [
      'Central Business District convergence traffic',
      'High pedestrian crossing volume and zebra dwell',
      'Metro feeder traffic and taxi drop-off clustering'
    ]
  },
  {
    rank: 4,
    road: 'Trinity Circle',
    area: 'M.G. Road',
    coordinates: [12.9729, 77.6198],
    predictedCongestion: 92.1,
    predictedSpeed: 38.2,
    predictedTrafficVolume: 36977,
    congestionCategory: 'SEVERE',
    trend: 'Stable High',
    corridorType: 'Arterial Convergence Point',
    capacityUtilization: '94.8%',
    incidentHistory: 'Moderate (1.2/day)',
    contributingFactors: [
      'Heavy ingress from Old Airport Road and Halasuru',
      'Elevated environmental impact / vehicle idle emissions proxy',
      'Multi-lane merge constriction at M.G. Road entry'
    ]
  },
  {
    rank: 5,
    road: '100 Feet Road',
    area: 'Indiranagar',
    coordinates: [12.9784, 77.6408],
    predictedCongestion: 85.5,
    predictedSpeed: 38.2,
    predictedTrafficVolume: 30724,
    congestionCategory: 'HIGH',
    trend: 'Fluctuating',
    corridorType: 'Mixed Commercial / Retail Corridor',
    capacityUtilization: '89.1%',
    incidentHistory: 'Low (0.7/day)',
    contributingFactors: [
      'Curbside customer parking and valet operations',
      'High evening dining and retail circulation',
      'Intermediate signal timing friction'
    ]
  },
  {
    rank: 6,
    road: 'CMH Road',
    area: 'Indiranagar',
    coordinates: [12.9788, 77.6385],
    predictedCongestion: 82.1,
    predictedSpeed: 38.5,
    predictedTrafficVolume: 31591,
    congestionCategory: 'HIGH',
    trend: 'Stable',
    corridorType: 'Urban Transit Corridor (Metro)',
    capacityUtilization: '86.4%',
    incidentHistory: 'Moderate (1.1/day)',
    contributingFactors: [
      'Metro station drop-off queues and auto stands',
      'Narrow carriageway compared to corridor demand'
    ]
  },
  {
    rank: 7,
    road: 'South End Circle',
    area: 'Jayanagar',
    coordinates: [12.9352, 77.5802],
    predictedCongestion: 80.6,
    predictedSpeed: 39.7,
    predictedTrafficVolume: 24344,
    congestionCategory: 'HIGH',
    trend: 'Improving (-1.4%)',
    corridorType: 'Multi-Leg Rotary',
    capacityUtilization: '84.0%',
    incidentHistory: 'Low (0.6/day)',
    contributingFactors: [
      'Rotary merge weave delays during peak hours',
      'South Bengaluru residential feeder convergence'
    ]
  },
  {
    rank: 8,
    road: 'Jayanagar 4th Block',
    area: 'Jayanagar',
    coordinates: [12.9299, 77.5828],
    predictedCongestion: 80.4,
    predictedSpeed: 40.6,
    predictedTrafficVolume: 24330,
    congestionCategory: 'HIGH',
    trend: 'Stable',
    corridorType: 'Civic & Market Center',
    capacityUtilization: '83.5%',
    incidentHistory: 'Low (0.5/day)',
    contributingFactors: [
      'Shopping complex & bus terminal cross-circulation',
      'Moderate vehicle dwell times'
    ]
  },
  {
    rank: 9,
    road: 'Ballari Road',
    area: 'Hebbal',
    coordinates: [13.0358, 77.5970],
    predictedCongestion: 76.9,
    predictedSpeed: 37.8,
    predictedTrafficVolume: 26802,
    congestionCategory: 'HIGH',
    trend: 'Worsening (+3.1%)',
    corridorType: 'Airport Arterial Highway',
    capacityUtilization: '82.0%',
    incidentHistory: 'High (2.0/day)',
    contributingFactors: [
      'Airport highway ingress volume spikes',
      'Heavy freight transition from peripheral ring roads'
    ]
  },
  {
    rank: 10,
    road: 'Hebbal Flyover',
    area: 'Hebbal',
    coordinates: [13.0382, 77.5919],
    predictedCongestion: 75.4,
    predictedSpeed: 38.1,
    predictedTrafficVolume: 22844,
    congestionCategory: 'HIGH',
    trend: 'High Volatility',
    corridorType: 'Multi-Level Grade Separator',
    capacityUtilization: '81.2%',
    incidentHistory: 'High (2.2/day)',
    contributingFactors: [
      'Severe bottlenecking at Outer Ring Road merge ramps',
      'Elevated expressway deceleration queues'
    ]
  }
];
