/**
 * CITYFLOW AI - Predictions Data Store
 * Grounded in validated ML model outputs (Random Forest / Linear Regression)
 */

export const CORRIDOR_PREDICTIONS = {
  'Sarjapur Road': {
    road: 'Sarjapur Road',
    area: 'Koramangala',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 95.7,
    congestionCategory: 'SEVERE',
    predictedTrafficVolume: 43489,
    predictedAverageSpeed: 34.7,
    confidenceNote: 'High confidence based on 7-day rolling volume trend and signal compliance data',
    topFactors: [
      { name: '7-Day Rolling Volume', impact: 'High (+42%)', description: 'Sustained peak volume corridor' },
      { name: 'Road Capacity Saturation', impact: 'Critical (98%)', description: 'Exceeding physical design threshold' },
      { name: 'Area Bottleneck Index', impact: 'Moderate', description: 'Heavy residential-to-IT corridor traffic' }
    ]
  },
  'Sony World Junction': {
    road: 'Sony World Junction',
    area: 'Koramangala',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 93.6,
    congestionCategory: 'SEVERE',
    predictedTrafficVolume: 40094,
    predictedAverageSpeed: 34.8,
    confidenceNote: 'High confidence based on historical multi-directional junction inertia',
    topFactors: [
      { name: 'Intersection Queueing', impact: 'High', description: 'Peak 4-way turn delays' },
      { name: 'Recent Speed Depression', impact: 'High', description: 'Lingering slowdown from day D-1' },
      { name: 'Public Transport Friction', impact: 'Low', description: 'Bus stop dwell time impact' }
    ]
  },
  'Anil Kumble Circle': {
    road: 'Anil Kumble Circle',
    area: 'M.G. Road',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 93.1,
    congestionCategory: 'SEVERE',
    predictedTrafficVolume: 38427,
    predictedAverageSpeed: 37.8,
    confidenceNote: 'Medium-high confidence based on Central Business District weekday commute rhythms',
    topFactors: [
      { name: 'CBD Commercial Flow', impact: 'High', description: 'Central hub converging traffic' },
      { name: 'Traffic Signal Compliance', impact: 'Moderate', description: 'Intersection staging delays' },
      { name: 'Pedestrian Density', impact: 'Moderate', description: 'High crossing friction' }
    ]
  },
  'Trinity Circle': {
    road: 'Trinity Circle',
    area: 'M.G. Road',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 92.1,
    congestionCategory: 'SEVERE',
    predictedTrafficVolume: 36977,
    predictedAverageSpeed: 38.2,
    confidenceNote: 'High confidence based on arterial M.G. Road connector data',
    topFactors: [
      { name: 'Corridor Volume Lag', impact: 'High', description: 'Heavy ingress from Old Airport Road' },
      { name: 'Environmental Impact Index', impact: 'Moderate', description: 'Elevated idle dwell indicators' }
    ]
  },
  '100 Feet Road': {
    road: '100 Feet Road',
    area: 'Indiranagar',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 85.5,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 30724,
    predictedAverageSpeed: 38.2,
    confidenceNote: 'Moderate confidence driven by retail dining and weekend recreational traffic surges',
    topFactors: [
      { name: 'Parking Usage Demand', impact: 'High', description: 'Curbside parking obstruction' },
      { name: 'Rolling 3-Day Volume', impact: 'Moderate', description: 'Consistent weekday density' }
    ]
  },
  'CMH Road': {
    road: 'CMH Road',
    area: 'Indiranagar',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 82.1,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 31591,
    predictedAverageSpeed: 38.5,
    confidenceNote: 'High confidence matching Indiranagar commercial grid movement',
    topFactors: [
      { name: 'Retail Corridor Friction', impact: 'High', description: 'High pedestrian and localized delivery stops' },
      { name: 'Narrow Carriageway Capacity', impact: 'Moderate', description: 'Capacity saturation at peak hours' }
    ]
  },
  'South End Circle': {
    road: 'South End Circle',
    area: 'Jayanagar',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 80.6,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 24344,
    predictedAverageSpeed: 39.7,
    confidenceNote: 'High confidence based on south Bengaluru arterial patterns',
    topFactors: [
      { name: 'Rotary Merge Delay', impact: 'Moderate', description: 'Multiple road junction merge friction' },
      { name: 'Signal Compliance Pattern', impact: 'Low', description: 'Normal cycle adherence' }
    ]
  },
  'Jayanagar 4th Block': {
    road: 'Jayanagar 4th Block',
    area: 'Jayanagar',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 80.4,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 24330,
    predictedAverageSpeed: 40.6,
    confidenceNote: 'Moderate confidence tied to commercial market density',
    topFactors: [
      { name: 'Market Zone Activity', impact: 'Moderate', description: 'High internal shopping zone circulation' }
    ]
  },
  'Ballari Road': {
    road: 'Ballari Road',
    area: 'Hebbal',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 76.9,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 26802,
    predictedAverageSpeed: 37.8,
    confidenceNote: 'High confidence based on North corridor airport highway volume',
    topFactors: [
      { name: 'Highway Ingress Surge', impact: 'High', description: 'Heavy airport and inter-city flow' },
      { name: 'Speed Volatility', impact: 'Moderate', description: 'Rapid deceleration near Hebbal merge' }
    ]
  },
  'Hebbal Flyover': {
    road: 'Hebbal Flyover',
    area: 'Hebbal',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 75.4,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 22844,
    predictedAverageSpeed: 38.1,
    confidenceNote: 'Moderate confidence; high daily speed variance on outer expressway',
    topFactors: [
      { name: 'Flyover Ramp Merge', impact: 'High', description: 'Severe bottle-necking at ramp junction' },
      { name: 'Weather / Wind Visibility', impact: 'Low', description: 'Elevated structure sensitivity' }
    ]
  },
  'Marathahalli Bridge': {
    road: 'Marathahalli Bridge',
    area: 'Whitefield',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 70.7,
    congestionCategory: 'HIGH',
    predictedTrafficVolume: 20181,
    predictedAverageSpeed: 38.0,
    confidenceNote: 'Moderate confidence; Outer Ring Road tech park traffic',
    topFactors: [
      { name: 'ORR Crossflow', impact: 'High', description: 'Tech worker commuting waves' },
      { name: 'Roadwork Impact', impact: 'Moderate', description: 'Occasional lane restrictions' }
    ]
  },
  'ITPL Main Road': {
    road: 'ITPL Main Road',
    area: 'Whitefield',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 68.4,
    congestionCategory: 'MODERATE',
    predictedTrafficVolume: 21950,
    predictedAverageSpeed: 39.2,
    confidenceNote: 'Moderate confidence; tech park shift-time clustering',
    topFactors: [
      { name: 'Tech Park Shift Cycles', impact: 'High', description: 'Morning and evening concentrated peaks' }
    ]
  },
  'Silk Board Junction': {
    road: 'Silk Board Junction',
    area: 'Electronic City',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 60.0,
    congestionCategory: 'MODERATE',
    predictedTrafficVolume: 20270,
    predictedAverageSpeed: 41.3,
    confidenceNote: 'Medium confidence; elevated flyover dispersal impact',
    topFactors: [
      { name: 'Elevated Expressway Bypass', impact: 'High', description: 'Diversion of through-traffic to tollway' },
      { name: 'Metro Construction Zone', impact: 'Moderate', description: 'Lane narrowing near BTM transition' }
    ]
  },
  'Hosur Road': {
    road: 'Hosur Road',
    area: 'Electronic City',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 58.2,
    congestionCategory: 'MODERATE',
    predictedTrafficVolume: 22100,
    predictedAverageSpeed: 43.5,
    confidenceNote: 'High confidence on arterial Electronic City dual carriage system',
    topFactors: [
      { name: 'Dual Carriageway Flow', impact: 'Moderate', description: 'Good lane capacity on surface highway' }
    ]
  },
  'Tumkur Road': {
    road: 'Tumkur Road',
    area: 'Yeshwanthpur',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 56.4,
    congestionCategory: 'MODERATE',
    predictedTrafficVolume: 21400,
    predictedAverageSpeed: 42.8,
    confidenceNote: 'High confidence on Peenya industrial highway corridor',
    topFactors: [
      { name: 'Industrial Freight Flow', impact: 'Moderate', description: 'Night & early morning commercial freight' }
    ]
  },
  'Yeshwanthpur Circle': {
    road: 'Yeshwanthpur Circle',
    area: 'Yeshwanthpur',
    predictionDate: 'Next-Day Forecast',
    predictedCongestionLevel: 54.8,
    congestionCategory: 'MODERATE',
    predictedTrafficVolume: 20800,
    predictedAverageSpeed: 44.1,
    confidenceNote: 'High confidence on railway station and market connector',
    topFactors: [
      { name: 'Railway Terminal Drop-offs', impact: 'Moderate', description: 'Intermittent station ingress queues' }
    ]
  }
};
