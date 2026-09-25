/**
 * CITYFLOW AI - Historical Traffic Trends & City Aggregates
 * Sourced directly from Banglore_traffic_Dataset.csv & ML model reports
 */

export const CITY_TRAFFIC_OVERVIEW = {
  city: 'Bengaluru',
  totalObservations: 8936,
  uniqueDatesTracked: 952,
  corridorsMonitored: 16,
  urbanZones: 8,
  dateRange: '2022-01-01 to 2024-08-09',
  overallAverageCongestion: 76.8,
  currentPredictedCongestionMean: 76.8,
  severeHotspotsCount: 4,
  highCongestionCount: 6,
  moderateCongestionCount: 6,
  freeFlowCount: 0,
  mlModelsValidated: 'Random Forest (Congestion & Volume), Linear Regression (Speed)',
  testsPassing: '29 / 29 (100%)',
};

export const HISTORICAL_WEEK_TRENDS = [
  { day: 'Mon', historicalCongestion: 84.2, predictedCongestion: 83.5, volume: 32100, speed: 37.2 },
  { day: 'Tue', historicalCongestion: 82.8, predictedCongestion: 82.1, volume: 31400, speed: 38.1 },
  { day: 'Wed', historicalCongestion: 85.1, predictedCongestion: 84.7, volume: 32900, speed: 36.9 },
  { day: 'Thu', historicalCongestion: 86.4, predictedCongestion: 85.9, volume: 33400, speed: 36.4 },
  { day: 'Fri', historicalCongestion: 89.2, predictedCongestion: 88.6, volume: 35800, speed: 34.8 },
  { day: 'Sat', historicalCongestion: 71.4, predictedCongestion: 72.0, volume: 27200, speed: 41.5 },
  { day: 'Sun', historicalCongestion: 63.8, predictedCongestion: 64.2, volume: 22800, speed: 44.2 },
];

export const CORRIDOR_TREND_HISTORY = {
  'Sarjapur Road': [
    { date: 'Aug 03', congestion: 92.4, volume: 41800, speed: 35.1 },
    { date: 'Aug 04', congestion: 78.2, volume: 31200, speed: 40.5 },
    { date: 'Aug 05', congestion: 94.6, volume: 42900, speed: 34.2 },
    { date: 'Aug 06', congestion: 95.1, volume: 43100, speed: 34.0 },
    { date: 'Aug 07', congestion: 95.8, volume: 43500, speed: 33.8 },
    { date: 'Aug 08', congestion: 96.2, volume: 43800, speed: 33.5 },
    { date: 'Forecast', congestion: 95.7, volume: 43489, speed: 34.7, isForecast: true },
  ],
  'Hebbal Flyover': [
    { date: 'Aug 03', congestion: 72.1, volume: 22100, speed: 39.4 },
    { date: 'Aug 04', congestion: 64.0, volume: 18900, speed: 43.1 },
    { date: 'Aug 05', congestion: 76.5, volume: 23200, speed: 37.8 },
    { date: 'Aug 06', congestion: 77.1, volume: 23400, speed: 37.5 },
    { date: 'Aug 07', congestion: 78.0, volume: 23800, speed: 37.1 },
    { date: 'Aug 08', congestion: 76.2, volume: 23100, speed: 37.9 },
    { date: 'Forecast', congestion: 75.4, volume: 22844, speed: 38.1, isForecast: true },
  ],
  'Silk Board Junction': [
    { date: 'Aug 03', congestion: 58.4, volume: 19800, speed: 42.1 },
    { date: 'Aug 04', congestion: 48.0, volume: 16500, speed: 46.2 },
    { date: 'Aug 05', congestion: 61.2, volume: 20600, speed: 41.0 },
    { date: 'Aug 06', congestion: 62.0, volume: 20900, speed: 40.7 },
    { date: 'Aug 07', congestion: 60.8, volume: 20400, speed: 41.1 },
    { date: 'Aug 08', congestion: 59.5, volume: 20100, speed: 41.5 },
    { date: 'Forecast', congestion: 60.0, volume: 20270, speed: 41.3, isForecast: true },
  ],
};
