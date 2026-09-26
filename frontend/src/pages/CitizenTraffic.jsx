import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  MapPin,
  TrendingUp,
  Gauge,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  Car,
  Wind,
  Zap,
  Clock,
  Search,
  Navigation,
  CheckCircle,
  AlertCircle,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CITIES } from '../config/cities.js';
import { getLiveTraffic } from '../services/liveTrafficService';
import {
  searchLocationSuggestions,
  geocodeLocation,
} from '../services/geocodingService';

const API_BASE = 'http://localhost:8000/api';

// 16 validated arterial corridors in CITYFLOW ML model
const VALIDATED_ML_ROADS = [
  { road: '100 Feet Road', area: 'Indiranagar', keywords: ['100 feet', 'indiranagar', 'cmh'] },
  { road: 'Anil Kumble Circle', area: 'MG Road', keywords: ['anil kumble', 'm.g. road', 'mg road', 'brigade'] },
  { road: 'Ballari Road', area: 'Hebbal', keywords: ['ballari', 'bellary', 'airport road'] },
  { road: 'CMH Road', area: 'Indiranagar', keywords: ['cmh', 'chinmaya mission'] },
  { road: 'Hebbal Flyover', area: 'Hebbal', keywords: ['hebbal', 'hebbal flyover'] },
  { road: 'Hosur Road', area: 'Electronic City', keywords: ['hosur', 'bommanahalli', 'electronic city'] },
  { road: 'ITPL Main Road', area: 'Whitefield', keywords: ['itpl', 'whitefield', 'kadugodi'] },
  { road: 'Jayanagar 4th Block', area: 'Jayanagar', keywords: ['jayanagar', '4th block'] },
  { road: 'Marathahalli Bridge', area: 'Marathahalli', keywords: ['marathahalli', 'bridge'] },
  { road: 'Sarjapur Road', area: 'Koramangala', keywords: ['sarjapur', 'haralur'] },
  { road: 'Silk Board Junction', area: 'Electronic City', keywords: ['silk board', 'central silk board'] },
  { road: 'Sony World Junction', area: 'Koramangala', keywords: ['sony world', 'koramangala'] },
  { road: 'South End Circle', area: 'Jayanagar', keywords: ['south end', 'netkallappa'] },
  { road: 'Trinity Circle', area: 'MG Road', keywords: ['trinity', 'halasuru'] },
  { road: 'Tumkur Road', area: 'Yeshwanthpur', keywords: ['tumkur', 'peenya', 'goraguntepalya'] },
  { road: 'Yeshwanthpur Circle', area: 'Yeshwanthpur', keywords: ['yeshwanthpur', 'yesvantpur'] },
];

/**
 * Match a searched address string or place name against validated corridors
 */
function matchValidatedRoad(query) {
  if (!query) return null;
  const norm = query.toLowerCase();

  for (const item of VALIDATED_ML_ROADS) {
    if (norm.includes(item.road.toLowerCase())) return item;
    for (const kw of item.keywords) {
      if (norm.includes(kw)) return item;
    }
  }
  return null;
}

export default function CitizenTraffic() {
  // ─── 1. LIVE TRAFFIC (TomTom) States ───
  const [liveQuery, setLiveQuery] = useState('');
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [showLiveSuggestions, setShowLiveSuggestions] = useState(false);
  const [liveLocation, setLiveLocation] = useState({
    name: 'Bengaluru Center',
    lat: 12.9716,
    lng: 77.5946,
  });
  const [liveTrafficData, setLiveTrafficData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const liveDebounceRef = useRef(null);

  // ─── 2. CITYFLOW ML FORECAST States ───
  const [forecastQuery, setForecastQuery] = useState('100 Feet Road');
  const [forecastSuggestions, setForecastSuggestions] = useState([]);
  const [showForecastSuggestions, setShowForecastSuggestions] = useState(false);
  const [selectedForecastPlace, setSelectedForecastPlace] = useState({
    placeName: '100 Feet Road, Indiranagar',
    displayName: '100 Feet Road, Indiranagar, Bengaluru, Karnataka, India',
    city: 'Bengaluru',
  });
  const [matchedCorridor, setMatchedCorridor] = useState(VALIDATED_ML_ROADS[0]);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [forecastError, setForecastError] = useState(null);
  const forecastDebounceRef = useRef(null);

  // 1. Fetch live traffic whenever liveLocation changes
  useEffect(() => {
    fetchLiveTraffic(liveLocation.lat, liveLocation.lng);
  }, [liveLocation]);

  const fetchLiveTraffic = async (lat, lng) => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = await getLiveTraffic(lat, lng);
      if (data && data.available) {
        setLiveTrafficData(data);
      } else {
        setLiveTrafficData(null);
        setLiveError(data?.message || 'Live traffic is temporarily unavailable.');
      }
    } catch {
      setLiveTrafficData(null);
      setLiveError('Live traffic is temporarily unavailable.');
    } finally {
      setLiveLoading(false);
    }
  };

  const handleLiveQueryChange = (val) => {
    setLiveQuery(val);
    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current);
    if (!val || val.trim().length < 2) {
      setLiveSuggestions([]);
      setShowLiveSuggestions(false);
      return;
    }

    liveDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchLocationSuggestions(val, 5);
        setLiveSuggestions(res);
        setShowLiveSuggestions(true);
      } catch {
        setLiveSuggestions([]);
      }
    }, 220);
  };

  const handleSelectLiveLocation = (item) => {
    setLiveQuery(item.displayName);
    setShowLiveSuggestions(false);
    setLiveLocation({
      name: item.placeName || item.city,
      lat: item.latitude,
      lng: item.longitude,
    });
  };

  const handleLiveGeolocation = () => {
    if (!navigator.geolocation) {
      setLiveError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        setLiveLocation({
          name: 'My Current Location',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLiveQuery('Current Location');
      },
      (err) => {
        setGeoLocating(false);
        setLiveError(
          err.code === 1
            ? 'Location permission was denied by browser.'
            : 'Unable to retrieve location.'
        );
      },
      { timeout: 8000 }
    );
  };

  // 2. Fetch ML prediction whenever matchedCorridor changes
  useEffect(() => {
    if (matchedCorridor) {
      fetchMLPrediction(matchedCorridor.road);
    } else {
      setPredictionResult(null);
      setHistoryData([]);
    }
  }, [matchedCorridor]);

  const fetchMLPrediction = async (roadName) => {
    setPredicting(true);
    setForecastError(null);
    try {
      const predRes = await fetch(`${API_BASE}/predictions/${encodeURIComponent(roadName)}`);
      if (!predRes.ok) throw new Error(`HTTP ${predRes.status}`);
      const pred = await predRes.json();
      setPredictionResult(pred);

      // Fetch history for chart
      try {
        const histRes = await fetch(`${API_BASE}/traffic/road/${encodeURIComponent(roadName)}?days=14`);
        if (histRes.ok) {
          const hist = await histRes.json();
          if (hist.dates && hist.congestion_level) {
            const chartPoints = hist.dates.map((d, i) => ({
              date: d.slice(5),
              historical: Math.round(hist.congestion_level[i]),
            }));
            chartPoints.push({
              date: 'Forecast',
              historical: Math.round(hist.congestion_level[hist.congestion_level.length - 1]),
              predicted: Math.round(pred.predicted_congestion_level),
            });
            setHistoryData(chartPoints);
          }
        }
      } catch (histErr) {
        console.warn('History chart fetch notice:', histErr);
      }
    } catch (err) {
      console.error('Prediction request error:', err);
      setForecastError("We couldn't generate a traffic forecast for this road right now.");
    } finally {
      setPredicting(false);
    }
  };

  const handleForecastQueryChange = (val) => {
    setForecastQuery(val);
    if (forecastDebounceRef.current) clearTimeout(forecastDebounceRef.current);
    if (!val || val.trim().length < 2) {
      setForecastSuggestions([]);
      setShowForecastSuggestions(false);
      return;
    }

    forecastDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchLocationSuggestions(val, 5);
        setForecastSuggestions(res);
        setShowForecastSuggestions(true);
      } catch {
        setForecastSuggestions([]);
      }
    }, 220);
  };

  const handleSelectForecastPlace = (place) => {
    setForecastQuery(place.displayName);
    setSelectedForecastPlace(place);
    setShowForecastSuggestions(false);

    // Evaluate whether place touches a validated corridor
    const matched = matchValidatedRoad(place.displayName + ' ' + place.placeName);
    setMatchedCorridor(matched);
  };

  const category = predictionResult?.congestion_category || 'MODERATE';

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Page Hero Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Traffic Intelligence
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Compare real-time road speeds via TomTom with validated CITYFLOW ML congestion forecasts.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. SECTION: LIVE TRAFFIC (TomTom Traffic API)                              */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                LIVE TRAFFIC
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Near-live road speed telemetry across any city or highway in India
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Source: TomTom
          </span>
        </div>

        {/* Live Search & Autocomplete */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={liveQuery}
                onChange={(e) => handleLiveQueryChange(e.target.value)}
                onFocus={() => liveSuggestions.length > 0 && setShowLiveSuggestions(true)}
                placeholder="Search any Indian city, road, or intersection (e.g. Hitech City, Hyderabad)"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              {showLiveSuggestions && liveSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-surface-border dark:border-slate-700 py-1 divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100 max-h-56 overflow-y-auto">
                  {liveSuggestions.map((s, idx) => (
                    <button
                      key={`live-sugg-${idx}`}
                      type="button"
                      onClick={() => handleSelectLiveLocation(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-start gap-2.5"
                    >
                      <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{s.placeName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{s.displayName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLiveGeolocation}
              disabled={geoLocating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-accent dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-bold text-xs border border-sky-100 dark:border-sky-800 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating...' : 'My Location'}</span>
            </button>
          </div>

          {/* Quick Hub Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold mr-1">Quick Hubs:</span>
            {CITIES.slice(0, 7).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setLiveLocation({
                    name: c.name,
                    lat: c.latitude,
                    lng: c.longitude,
                  });
                  setLiveQuery(`${c.name}, ${c.state}`);
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  liveLocation.name === c.name
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Traffic Results Display */}
        {liveTrafficData ? (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-surface-border dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="font-bold text-slate-900 dark:text-white text-sm">{liveLocation.name}</span>
              </div>
              <span
                className="text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: `${liveTrafficData.condition_color}15`,
                  color: liveTrafficData.condition_color,
                  border: `1px solid ${liveTrafficData.condition_color}30`,
                }}
              >
                {liveTrafficData.traffic_condition}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Current Speed</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {liveTrafficData.current_speed_kmh} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">km/h</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Normal Speed</div>
                <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">
                  {liveTrafficData.free_flow_speed_kmh} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">km/h</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Current Traffic</div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                  {liveTrafficData.congestion_level || 'Moderate'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Updated</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{liveTrafficData.timestamp}</span>
                </div>
              </div>
            </div>

            {liveTrafficData.delay_minutes > 0 ? (
              <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Corridor travel time is currently delayed by <strong>+{liveTrafficData.delay_minutes} min</strong> compared to normal speed.
                </span>
              </div>
            ) : (
              <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Road corridor is flowing smoothly at free-flow speed.</span>
              </div>
            )}
          </div>
        ) : liveError ? (
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{liveError}</span>
          </div>
        ) : null}
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION: CITYFLOW ML FORECAST (Search-Based with Honest Coverage)        */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                CITYFLOW ML FORECAST
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historical multi-signal ML congestion forecasting for calibrated urban corridors
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-accent-light dark:bg-sky-950/60 text-accent dark:text-sky-300">
            Source: CITYFLOW ML
          </span>
        </div>

        {/* Real Location Search Bar with Autocomplete */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Enter a city, area, or road across India
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={forecastQuery}
              onChange={(e) => handleForecastQueryChange(e.target.value)}
              onFocus={() => forecastSuggestions.length > 0 && setShowForecastSuggestions(true)}
              placeholder="Search e.g. 100 Feet Road, Koramangala, Hyderabad, or Bandra..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />

            {showForecastSuggestions && forecastSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-surface-border dark:border-slate-700 py-1 divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100 max-h-56 overflow-y-auto">
                {forecastSuggestions.map((s, idx) => (
                  <button
                    key={`fc-sugg-${idx}`}
                    type="button"
                    onClick={() => handleSelectForecastPlace(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{s.placeName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{s.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Validated Corridor Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            <span className="text-slate-400 font-semibold mr-1">Validated Corridors:</span>
            {VALIDATED_ML_ROADS.slice(0, 6).map((item) => (
              <button
                key={item.road}
                type="button"
                onClick={() => {
                  setForecastQuery(`${item.road}, ${item.area}`);
                  setMatchedCorridor(item);
                  setSelectedForecastPlace({
                    placeName: item.road,
                    displayName: `${item.road}, ${item.area}, Bengaluru, Karnataka`,
                    city: 'Bengaluru',
                  });
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  matchedCorridor?.road === item.road
                    ? 'bg-accent text-white border-accent'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-surface-border dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.road}
              </button>
            ))}
          </div>
        </div>

        {/* ─── CASE A: ML VALIDATED CORRIDOR DISPLAY ─── */}
        {matchedCorridor && predictionResult ? (
          <div className="space-y-6 pt-2 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
                  VALIDATED CORRIDOR FORECAST
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {predictionResult.road_name}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{predictionResult.area_name}, Bengaluru</span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">Predicted Condition</span>
                <span
                  className={`text-sm font-extrabold px-3.5 py-1.5 rounded-xl tracking-wider uppercase inline-block ${
                    category === 'SEVERE'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60'
                      : category === 'HIGH'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60'
                      : category === 'MODERATE'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                  }`}
                >
                  {category}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Predicted Congestion</div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {Math.round(predictionResult.predicted_congestion_level)}
                  <span className="text-sm font-normal text-slate-400 ml-1">/ 100</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Average Speed</div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {Math.round(predictionResult.predicted_average_speed)}
                  <span className="text-sm font-normal text-slate-400 ml-1">km/h</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Traffic Volume</div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {Math.round(predictionResult.predicted_traffic_volume).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Historical + Forecast Chart */}
            {historyData.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recent 14-Day Congestion Profile + 1-Day Forecast
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">0-100 Scale</span>
                </div>

                <div className="h-48 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <ReferenceLine y={70} stroke="#F97316" strokeDasharray="3 3" label={{ value: 'High (70)', fill: '#F97316', fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        name="Congestion Level"
                        stroke="#0284C7"
                        strokeWidth={2.5}
                        dot={{ fill: '#0284C7', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── CASE B: HONEST GRACEFUL STATE (NO FAKE PREDICTIONS) ─── */
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-surface-border dark:border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center space-y-3 animate-in fade-in transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-accent dark:text-sky-300 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Forecast unavailable for this location
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs max-w-md mx-auto leading-relaxed">
              Live traffic and traffic-aware routing are available for supported locations across India.
              CITYFLOW ML forecasting models are currently validated for selected Bengaluru arterial corridors.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-surface-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors shadow-2xs"
              >
                View Live Traffic
              </button>

              <Link
                to={`/citizen/route?to=${encodeURIComponent(selectedForecastPlace.placeName || forecastQuery)}`}
                className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Plan a Journey</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
