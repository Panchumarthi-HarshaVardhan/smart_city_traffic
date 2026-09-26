import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Radio,
  TrendingUp,
  Info,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Siren,
  Sparkles,
  Zap,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';
import AuthorityNav from '../components/AuthorityNav';
import IndiaMap from '../components/IndiaMap';
import { BENGALURU_ROADS } from '../data/roads';
import { getLiveTraffic } from '../services/liveTrafficService';

const API_BASE = 'http://localhost:8000/api';

export default function AuthorityHotspots() {
  const navigate = useNavigate();

  // Traffic view mode toggle: 'CURRENT' (TomTom Near-Live) vs 'FORECAST' (CITYFLOW ML Next-Day)
  const [trafficView, setTrafficView] = useState('CURRENT');

  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live traffic telemetry state for selected corridor
  const [liveTrafficData, setLiveTrafficData] = useState(null);
  const [loadingTraffic, setLoadingTraffic] = useState(false);

  // Map focus coordinate
  const [focusedLocation, setFocusedLocation] = useState(null);

  // Load corridors and ML predictions
  useEffect(() => {
    async function loadCorridorHotspots() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/hotspots?top_n=16`);
        if (res.ok) {
          const mlHotspots = await res.json();
          // Merge exact road coordinates and baseline free-flow speeds from BENGALURU_ROADS
          const enriched = mlHotspots.map((item, idx) => {
            const roadInfo = BENGALURU_ROADS.find(
              (r) => r.name.toLowerCase() === item.road.toLowerCase()
            );
            return {
              ...item,
              id: `hotspot-${idx}`,
              coordinates: roadInfo ? roadInfo.coordinates : [12.9716, 77.5946],
              lengthKm: roadInfo ? roadInfo.lengthKm : 3.5,
              baseFreeFlowSpeed: roadInfo ? roadInfo.baseFreeFlowSpeed : 45,
            };
          });

          setHotspots(enriched);
          if (enriched.length > 0) {
            handleSelectCorridor(enriched[0]);
          }
        }
      } catch (err) {
        console.warn('Backend hotspots fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCorridorHotspots();
  }, []);

  // Handle Corridor Selection
  const handleSelectCorridor = async (corridor) => {
    setSelectedHotspot(corridor);
    const coords = corridor.coordinates || [12.9716, 77.5946];
    setFocusedLocation({
      lat: coords[0],
      lng: coords[1],
      zoom: 14,
    });

    // Query real-time TomTom flow for this corridor
    setLoadingTraffic(true);
    try {
      const live = await getLiveTraffic(coords[0], coords[1]);
      setLiveTrafficData(live);
    } catch (err) {
      setLiveTrafficData(null);
    } finally {
      setLoadingTraffic(false);
    }
  };

  const handlePlanEmergencyRoute = (corridor) => {
    const coords = corridor.coordinates || [12.9716, 77.5946];
    navigate(
      `/authority/routes?from=${encodeURIComponent(corridor.road)}&lat=${coords[0]}&lng=${coords[1]}`
    );
  };

  // Derive Current Traffic status from TomTom response
  const currentSpeed = liveTrafficData?.current_speed_kmh;
  const freeFlowSpeed = liveTrafficData?.free_flow_speed_kmh || selectedHotspot?.baseFreeFlowSpeed;
  const delayMinutes = liveTrafficData?.delay_minutes || 0;

  let currentConditionLabel = 'FLOWING NORMALLY';
  let currentConditionBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  let currentDotColor = 'bg-emerald-500';

  if (liveTrafficData && liveTrafficData.available) {
    if (liveTrafficData.road_closure || liveTrafficData.congestion_level === 'Severe') {
      currentConditionLabel = 'HEAVY / SEVERE';
      currentConditionBadge = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      currentDotColor = 'bg-rose-500';
    } else if (liveTrafficData.traffic_condition?.toLowerCase().includes('heavy')) {
      currentConditionLabel = 'HEAVY TRAFFIC';
      currentConditionBadge = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      currentDotColor = 'bg-rose-500';
    } else if (liveTrafficData.traffic_condition?.toLowerCase().includes('moderate')) {
      currentConditionLabel = 'MODERATE';
      currentConditionBadge = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      currentDotColor = 'bg-amber-500';
    } else {
      currentConditionLabel = 'NORMAL / LIGHT';
      currentConditionBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      currentDotColor = 'bg-emerald-500';
    }
  }

  // Derive CITYFLOW Next-Day ML Forecast status
  const forecastCategory =
    selectedHotspot?.congestion_category || selectedHotspot?.congestionCategory || 'HIGH';
  let forecastConditionLabel = forecastCategory;
  let forecastConditionBadge = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  let forecastDotColor = 'bg-amber-500';

  if (forecastCategory === 'SEVERE') {
    forecastConditionBadge = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    forecastDotColor = 'bg-rose-500';
  } else if (forecastCategory === 'HIGH') {
    forecastConditionBadge = 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    forecastDotColor = 'bg-orange-500';
  } else if (forecastCategory === 'MODERATE') {
    forecastConditionBadge = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    forecastDotColor = 'bg-amber-500';
  } else {
    forecastConditionBadge = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    forecastDotColor = 'bg-emerald-500';
  }

  // Combined Authority Insight Generator
  const getCombinedInsight = () => {
    const isCurrentHeavy = currentConditionLabel.includes('HEAVY');
    const isCurrentModerate = currentConditionLabel.includes('MODERATE');
    const isForecastSevere = forecastCategory === 'SEVERE' || forecastCategory === 'HIGH';

    if (!isCurrentHeavy && !isCurrentModerate && isForecastSevere) {
      return {
        tag: 'WATCHLIST',
        tagColor: 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        title: 'Elevated Upcoming Congestion Alert',
        message:
          'Current traffic conditions are normal, but CITYFLOW forecasts elevated congestion for the upcoming day. Pre-trip corridor monitoring recommended.',
      };
    } else if (isCurrentHeavy && isForecastSevere) {
      return {
        tag: 'CRITICAL CORRIDOR',
        tagColor: 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800',
        title: 'Persistent High Bottleneck',
        message:
          'Heavy traffic is currently observed and elevated congestion is also forecast for the upcoming day. Consider active traffic dispersal.',
      };
    } else if (isCurrentHeavy && !isForecastSevere) {
      return {
        tag: 'TRANSIENT CONGESTION',
        tagColor: 'bg-sky-100 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800',
        title: 'Current Delay with Normalizing Forecast',
        message:
          'Current traffic is heavy, while the next-day forecast indicates lower congestion levels as peak demand subsides.',
      };
    } else if (isCurrentModerate && isForecastSevere) {
      return {
        tag: 'WATCHLIST',
        tagColor: 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        title: 'Corridor Building Demand',
        message:
          'Moderate traffic is currently observed, with elevated congestion forecast for tomorrow.',
      };
    } else {
      return {
        tag: 'NORMAL FLOW',
        tagColor: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        title: 'Stable Arterial Conditions',
        message:
          'Conditions are currently normal and the next-day forecast indicates low-to-moderate congestion levels.',
      };
    }
  };

  const combinedInsight = getCombinedInsight();

  // Prepare map hotspots color-coded by the active view
  const mapHotspots = hotspots.map((spot) => {
    if (trafficView === 'CURRENT') {
      // Current mode: color by TomTom flow or base profile
      return {
        ...spot,
        congestion_category:
          spot.road === selectedHotspot?.road && liveTrafficData?.available
            ? currentConditionLabel.includes('HEAVY')
              ? 'SEVERE'
              : currentConditionLabel.includes('MODERATE')
              ? 'MODERATE'
              : 'LOW'
            : spot.congestion_category,
      };
    }
    // Forecast mode: color by ML predicted category
    return {
      ...spot,
      congestion_category: spot.congestion_category || spot.congestionCategory,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Authority Nav */}
      <AuthorityNav />

      {/* Top Header & View Toggle Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Corridor Intelligence & Diagnostics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Real-time TomTom telemetry separated from validated CITYFLOW next-day machine learning forecasts.
          </p>
        </div>

        {/* Clean View Mode Toggle: CURRENT vs FORECAST */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">
            Traffic View:
          </span>
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTrafficView('CURRENT')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                trafficView === 'CURRENT'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-accent" />
              <span>Current Traffic (TomTom)</span>
            </button>
            <button
              type="button"
              onClick={() => setTrafficView('FORECAST')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                trafficView === 'FORECAST'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Next-Day Forecast (ML)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/authority/congestion')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Congestion Recommendations</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Temporal Distinction Callout */}
      <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-950 dark:text-sky-200">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Temporal Traffic Distinction:</strong> Current traffic reflects present road conditions via near-live sensors. CITYFLOW forecast estimates the upcoming day's congestion using historical patterns and weather models.
        </div>
      </div>

      {/* Main Grid: Interactive Map (7 Cols) + Diagnostics & Two-Layer Telemetry (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Spatial Hotspot Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent" />
              <span>
                {trafficView === 'CURRENT'
                  ? 'Spatial Map — Current Sensor Speeds'
                  : 'Spatial Map — Next-Day Forecast Risk'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              Active Layer: {trafficView === 'CURRENT' ? 'TomTom Flow' : 'CITYFLOW ML'}
            </span>
          </div>

          <div className="relative">
            <IndiaMap
              hotspots={mapHotspots}
              center={[12.9716, 77.5946]}
              zoom={11}
              height="600px"
              focusPosition={focusedLocation}
              onSelectHotspot={handleSelectCorridor}
              showLegend={true}
            />
          </div>
        </div>

        {/* Right Column: Two-Layer Diagnostic Panel */}
        <div className="lg:col-span-5 space-y-4">
          {selectedHotspot ? (
            <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-5">
              {/* Header with TWO Distinct Badges */}
              <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedHotspot.road}
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sector: {selectedHotspot.area || 'Bengaluru Corridor'} • {selectedHotspot.lengthKm} km arterial
                    </div>
                  </div>
                </div>

                {/* Two Distinct Badges: CURRENT and NEXT-DAY FORECAST */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Badge 1: Current Traffic */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${currentConditionBadge}`}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-75">CURRENT:</span>
                    <span className={`w-2 h-2 rounded-full ${currentDotColor}`} />
                    <span>{currentConditionLabel}</span>
                  </div>

                  {/* Badge 2: Next-Day Forecast */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${forecastConditionBadge}`}
                  >
                    <span className="text-[10px] uppercase tracking-wider opacity-75">FORECAST:</span>
                    <span className={`w-2 h-2 rounded-full ${forecastDotColor}`} />
                    <span>{forecastConditionLabel}</span>
                  </div>
                </div>
              </div>

              {/* Combined Authority Insight Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold">
                    Operational Correlation
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${combinedInsight.tagColor}`}>
                    {combinedInsight.tag}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{combinedInsight.title}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {combinedInsight.message}
                </p>
              </div>

              {/* LAYER 1: CURRENT TRAFFIC (TomTom) */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  trafficView === 'CURRENT'
                    ? 'bg-sky-50/50 dark:bg-sky-950/30 border-accent shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-surface-border dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      CURRENT TRAFFIC
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Source: TomTom Traffic</span>
                </div>

                {loadingTraffic ? (
                  <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                    Querying live flow telemetry...
                  </div>
                ) : liveTrafficData && liveTrafficData.available ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">Current Speed</div>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        {liveTrafficData.current_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                      </div>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">Free-Flow Speed</div>
                      <div className="text-lg font-black text-slate-700 dark:text-slate-200 mt-0.5">
                        {liveTrafficData.free_flow_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400">
                        Current Delay: <strong className="text-amber-700 dark:text-amber-400">+{delayMinutes} min</strong>
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {liveTrafficData.traffic_condition || 'Flowing Normally'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-slate-500 dark:text-slate-400">
                    Live road speed temporarily unavailable for this exact coordinate.
                  </div>
                )}
              </div>

              {/* LAYER 2: CITYFLOW NEXT-DAY FORECAST (ML) */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  trafficView === 'FORECAST'
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-surface-border dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      CITYFLOW NEXT-DAY FORECAST
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">Source: CITYFLOW ML</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Congestion</div>
                    <div className="text-lg font-black text-accent mt-0.5">
                      {selectedHotspot.predicted_congestion}%
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Expected Speed</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {selectedHotspot.predicted_speed} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Exp. Volume</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {Math.round(selectedHotspot.predicted_traffic_volume || 36000)}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
                  <span>Forecast Horizon: 1-Day-Ahead</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Condition: {forecastCategory}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/authority/congestion?corridor=${encodeURIComponent(selectedHotspot.road)}`
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Inspect Corridor & Recommendations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handlePlanEmergencyRoute(selectedHotspot)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  <Siren className="w-4 h-4" />
                  <span>Dispatch Emergency Route to this Corridor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 text-xs">
              Select a corridor from the map or list to inspect current telemetry and next-day forecasts.
            </div>
          )}

          {/* Ranked Corridor Bottlenecks List */}
          <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {trafficView === 'CURRENT'
                  ? 'Ranked by Current Telemetry (TomTom)'
                  : 'Ranked by Next-Day Forecast (CITYFLOW ML)'}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {hotspots.length} Arterials
              </span>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {hotspots.map((spot, idx) => {
                const isSelected = selectedHotspot && selectedHotspot.road === spot.road;
                const cat = spot.congestion_category || spot.congestionCategory || 'HIGH';

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectCorridor(spot)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-accent text-white border-slate-900 dark:border-accent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{spot.road}</div>
                      <div
                        className={`text-[10px] ${
                          isSelected ? 'text-slate-300 dark:text-sky-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {spot.area} • Speed: {spot.predicted_speed} km/h
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          cat === 'SEVERE'
                            ? 'bg-rose-500 text-white'
                            : cat === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {spot.predicted_congestion}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
