import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Search,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Car,
  ChevronRight,
  TrendingUp,
  Home,
  Zap,
  Activity,
  Compass,
  Info,
  Layers,
  X,
} from 'lucide-react';
import IndiaMap from '../components/IndiaMap';
import {
  geocodeLocation,
  searchLocationSuggestions,
  reverseGeocodeLocation,
} from '../services/geocodingService';
import {
  calculateJourneyRoutes,
  getRouteRecommendationExplanation,
} from '../services/trafficRouteService';
import { getTrafficIncidents } from '../services/liveTrafficService';
import { useAuth } from '../context/AuthContext';

export default function CitizenRoute() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  // Input queries and selected coordinates
  const [fromQuery, setFromQuery] = useState(searchParams.get('from') || '');
  const [toQuery, setToQuery] = useState(searchParams.get('to') || '');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [showCoverageModal, setShowCoverageModal] = useState(false);

  // Autocomplete states
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const fromDebounceRef = useRef(null);
  const toDebounceRef = useRef(null);

  // Map pin selection mode ('origin' | 'destination' | null)
  const [pinSelectionMode, setPinSelectionMode] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);

  // Route results
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routingSource, setRoutingSource] = useState('Traffic-aware routing');
  const [liveTraffic, setLiveTraffic] = useState(null);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState(null);

  // Auto-execute if query params were passed
  useEffect(() => {
    const fromP = searchParams.get('from');
    const toP = searchParams.get('to');
    if (fromP && toP) {
      executeRouting(fromP, toP);
    }
  }, [searchParams]);

  // Autocomplete handler for FROM
  const handleFromChange = (val) => {
    setFromQuery(val);
    setOrigin(null); // Clear previous coords if typing
    setRoutes([]); // Clear stale routes

    if (fromDebounceRef.current) clearTimeout(fromDebounceRef.current);
    if (!val || val.trim().length < 2) {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
      return;
    }

    fromDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(val, 5);
        setFromSuggestions(results);
        setShowFromSuggestions(true);
      } catch (err) {
        setFromSuggestions([]);
      }
    }, 220);
  };

  // Autocomplete handler for TO
  const handleToChange = (val) => {
    setToQuery(val);
    setDestination(null); // Clear previous coords if typing
    setRoutes([]); // Clear stale routes

    if (toDebounceRef.current) clearTimeout(toDebounceRef.current);
    if (!val || val.trim().length < 2) {
      setToSuggestions([]);
      setShowToSuggestions(false);
      return;
    }

    toDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(val, 5);
        setToSuggestions(results);
        setShowToSuggestions(true);
      } catch (err) {
        setToSuggestions([]);
      }
    }, 220);
  };

  // Select suggestion for FROM
  const handleSelectFrom = (suggestion) => {
    setFromQuery(suggestion.displayName || suggestion.placeName);
    setOrigin(suggestion);
    setShowFromSuggestions(false);
    setRoutes([]);
  };

  // Select suggestion for TO
  const handleSelectTo = (suggestion) => {
    setToQuery(suggestion.displayName || suggestion.placeName);
    setDestination(suggestion);
    setShowToSuggestions(false);
    setRoutes([]);
  };

  // Map pin selection callback
  const handlePinSelect = async (type, lat, lng) => {
    setPinSelectionMode(null);
    setLoadingText('Identifying location...');
    try {
      const locationData = await reverseGeocodeLocation(lat, lng);
      if (type === 'origin') {
        setOrigin(locationData);
        setFromQuery(locationData.displayName || locationData.placeName);
      } else {
        setDestination(locationData);
        setToQuery(locationData.displayName || locationData.placeName);
      }
      setRoutes([]); // Reset stale routes
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      const fallback = {
        displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      };
      if (type === 'origin') {
        setOrigin(fallback);
        setFromQuery(fallback.displayName);
      } else {
        setDestination(fallback);
        setToQuery(fallback.displayName);
      }
      setRoutes([]);
    } finally {
      setLoadingText('');
    }
  };

  // Browser Geolocation on explicit user click
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const loc = await reverseGeocodeLocation(latitude, longitude);
          setOrigin(loc);
          setFromQuery(loc.displayName || 'Current Location');
          setRoutes([]);
        } catch {
          const fallback = {
            displayName: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            latitude,
            longitude,
          };
          setOrigin(fallback);
          setFromQuery(fallback.displayName);
          setRoutes([]);
        } finally {
          setGeoLocating(false);
        }
      },
      (err) => {
        setGeoLocating(false);
        setError(
          err.code === 1
            ? 'Location access was denied. Please select a city or search manually.'
            : 'Unable to retrieve current location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Execute routing calculation
  const executeRouting = async (overrideFrom = null, overrideTo = null) => {
    const startStr = overrideFrom || fromQuery;
    const endStr = overrideTo || toQuery;

    if (!startStr.trim() || !endStr.trim()) {
      setError('Please select both a starting point and destination.');
      return;
    }

    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRouteIndex(0);
    setLiveTraffic(null);
    setIncidents([]);

    try {
      // 1. Resolve coordinates if not already present
      let startPoint = origin;
      if (!startPoint || !startPoint.latitude) {
        setLoadingText('Finding starting location...');
        startPoint = await geocodeLocation(startStr);
        setOrigin(startPoint);
      }

      let endPoint = destination;
      if (!endPoint || !endPoint.latitude) {
        setLoadingText('Finding destination...');
        endPoint = await geocodeLocation(endStr);
        setDestination(endPoint);
      }

      setLoadingText('Calculating traffic-aware routes...');
      const result = await calculateJourneyRoutes(startPoint, endPoint);

      setRoutes(result.routes);
      setRoutingSource(
        result.routingSource.includes('Google')
          ? 'Traffic-aware routing'
          : 'Standard routing engine'
      );
      setLiveTraffic(result.liveTraffic);

      // Query incidents in area
      try {
        const incs = await getTrafficIncidents(startPoint.latitude, startPoint.longitude);
        setIncidents(incs);
      } catch (incErr) {
        console.warn('Incident fetch notice:', incErr);
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      if (err.message && err.message.includes('locate')) {
        setError("Couldn't find that location. Please select from the search suggestions or pick a pin on the map.");
      } else {
        setError("We couldn't find a driving route between these locations.");
      }
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeRouting();
  };

  const activeRoute = routes[selectedRouteIndex] || null;
  const activeML = activeRoute?.mlForecast || null;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Plan your journey
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Search any Indian location or click the map to select source and destination points.
          </p>
        </div>

        {/* Quick Example Triggers */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Quick routes:</span>
          <button
            type="button"
            onClick={() => {
              setFromQuery('Hyderabad');
              setToQuery('Bengaluru');
              executeRouting('Hyderabad', 'Bengaluru');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-surface-border dark:border-slate-700 hover:border-accent text-slate-700 dark:text-slate-300 hover:text-accent font-medium shadow-xs transition-colors"
          >
            Hyderabad → Bengaluru
          </button>
          <button
            type="button"
            onClick={() => {
              setFromQuery('Mumbai');
              setToQuery('Pune');
              executeRouting('Mumbai', 'Pune');
            }}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-surface-border dark:border-slate-700 hover:border-accent text-slate-700 dark:text-slate-300 hover:text-accent font-medium shadow-xs transition-colors"
          >
            Mumbai → Pune
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Location Search & Route Analysis */}
        <div className="lg:col-span-5 space-y-6">
          {/* Journey Search Form */}
          <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-4 transition-colors">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* FROM INPUT WITH AUTOCOMPLETE & MAP PICKER */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                      A
                    </span>
                    <span>Starting Point (FROM)</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPinSelectionMode(pinSelectionMode === 'origin' ? null : 'origin')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                        pinSelectionMode === 'origin'
                          ? 'bg-accent text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-accent" />
                      <span>{pinSelectionMode === 'origin' ? 'Click Map...' : 'Pick on Map'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={geoLocating}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                    >
                      <Navigation className={`w-3 h-3 text-accent ${geoLocating ? 'animate-spin' : ''}`} />
                      <span>{geoLocating ? 'Locating...' : 'Current Location'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={fromQuery}
                    onChange={(e) => handleFromChange(e.target.value)}
                    onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                    placeholder="Search starting city, area, or landmark"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {origin && (
                    <span className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-emerald-500" title="Coordinates locked" />
                  )}
                </div>

                {/* FROM Autocomplete Dropdown */}
                {showFromSuggestions && fromSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-surface-border dark:border-slate-700 py-1 divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100 max-h-60 overflow-y-auto">
                    {fromSuggestions.map((s, idx) => (
                      <button
                        key={`from-${idx}`}
                        type="button"
                        onClick={() => handleSelectFrom(s)}
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

              {/* TO INPUT WITH AUTOCOMPLETE & MAP PICKER */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                      B
                    </span>
                    <span>Destination (TO)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPinSelectionMode(pinSelectionMode === 'destination' ? null : 'destination')}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                      pinSelectionMode === 'destination'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <MapPin className="w-3 h-3 text-teal-600" />
                    <span>{pinSelectionMode === 'destination' ? 'Click Map...' : 'Pick on Map'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={toQuery}
                    onChange={(e) => handleToChange(e.target.value)}
                    onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
                    placeholder="Search destination city or landmark"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {destination && (
                    <span className="absolute right-3 top-3.5 w-2 h-2 rounded-full bg-teal-500" title="Coordinates locked" />
                  )}
                </div>

                {/* TO Autocomplete Dropdown */}
                {showToSuggestions && toSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-surface-border dark:border-slate-700 py-1 divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-100 max-h-60 overflow-y-auto">
                    {toSuggestions.map((s, idx) => (
                      <button
                        key={`to-${idx}`}
                        type="button"
                        onClick={() => handleSelectTo(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-start gap-2.5"
                      >
                        <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{s.placeName}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{s.displayName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !fromQuery.trim() || !toQuery.trim()}
                className="w-full py-3.5 px-6 rounded-2xl bg-accent hover:bg-accent-hover text-white font-bold text-sm transition-all shadow-md shadow-accent/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{loadingText || 'Calculating route...'}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Traffic-Aware Routes</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Current Live Traffic Telemetry (TomTom) */}
          {liveTraffic && liveTraffic.available && (
            <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    LIVE TRAFFIC
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Selected road segment
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                  Source: TomTom
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Current telemetry sampled at departure corridor. Conditions across the wider journey are analyzed in Route Options below.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Current Speed</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {liveTraffic.current_speed_kmh} <span className="text-xs font-normal">km/h</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Normal Speed</div>
                  <div className="text-base font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
                    {liveTraffic.free_flow_speed_kmh} <span className="text-xs font-normal">km/h</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Current Flow</div>
                  <div
                    className="text-xs font-extrabold mt-1 truncate"
                    style={{ color: liveTraffic.condition_color }}
                  >
                    {liveTraffic.traffic_condition}
                  </div>
                </div>
              </div>

              {liveTraffic.delay_minutes > 0 && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Current delay on surveyed corridor: <strong>+{liveTraffic.delay_minutes} min</strong> compared to normal speed.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Route Options Cards */}
          {routes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <span>Route Options</span>
                  <span className="text-[10px] font-normal normal-case px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-accent dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                    Traffic impact across this route
                  </span>
                </div>
                <span className="text-[11px] font-mono lowercase font-normal text-slate-400 dark:text-slate-500">
                  {routingSource}
                </span>
              </div>

              {routes.map((route, idx) => {
                const isSelected = idx === selectedRouteIndex;

                return (
                  <div
                    key={route.id || idx}
                    onClick={() => setSelectedRouteIndex(idx)}
                    className={`cursor-pointer rounded-3xl p-5 border transition-all ${
                      isSelected
                        ? 'bg-sky-50/50 dark:bg-sky-950/40 border-accent shadow-md ring-2 ring-accent/20'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-surface-border dark:border-slate-800 shadow-soft'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          route.isPrimary
                            ? 'bg-accent-light dark:bg-sky-950/60 text-accent dark:text-sky-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {route.roleLabel || (route.isPrimary ? 'Recommended Route' : `Alternative Route ${idx}`)}
                      </span>

                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {route.distanceKm} km
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2">
                      <div className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
                        {route.formattedDuration}
                      </div>

                      {route.isTrafficAware === false ? (
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          Standard routing
                        </div>
                      ) : route.trafficDelayMinutes > 0 ? (
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          +{route.trafficDelayMinutes} min delay
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          Free flow
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      <div className="truncate max-w-[200px] font-medium text-slate-800 dark:text-slate-200">
                        {route.name}
                      </div>
                      <div className="font-bold flex items-center gap-1.5" style={{ color: route.conditionColor }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: route.conditionColor }} />
                        <span>{route.trafficCondition || 'Normal Traffic Impact'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Why Recommended Explanation Card */}
              {activeRoute && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-surface-border dark:border-slate-800 text-xs space-y-1.5 animate-in fade-in">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-accent" />
                    <span>Why this route?</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {getRouteRecommendationExplanation(activeRoute, routes)}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 italic">
                    {activeRoute.isTrafficAware === false
                      ? 'Standard driving route based on road network geometry.'
                      : 'Evaluated across total route duration and traffic delay.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CITYFLOW AI Prediction Section (ML Corridor Intelligence) */}
          {activeRoute && (
            <div className="space-y-4">
              {activeML && activeML.hasMLCoverage ? (
                <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      <span>CITYFLOW FORECAST</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                      Source: CITYFLOW ML
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Model Forecast:</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {activeML.category} Congestion
                        </div>
                      </div>

                      {activeML.congestionScore !== null && (
                        <div className="text-right">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Congestion Index:</div>
                          <div className="text-base font-extrabold text-accent mt-0.5">
                            {activeML.congestionScore}%
                          </div>
                        </div>
                      )}
                    </div>

                    {activeML.matchedCorridors?.length > 0 && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Validated Corridors: </span>
                        <span>{activeML.matchedCorridors.join(', ')}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      {activeML.coverageNotice}
                    </div>
                  </div>
                </div>
              ) : (
                /* Compact Non-Intrusive Coverage Notice when outside Bengaluru ML corridors */
                <div className="bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                      <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>CITYFLOW FORECAST</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Coverage limitation
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Unavailable for this location.</span> Next-day CITYFLOW ML forecasts are currently validated for Bengaluru arterial corridors. Live traffic telemetry and traffic-aware routing remain active across India.
                  </div>

                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowCoverageModal(true)}
                      className="text-[11px] font-semibold text-accent hover:text-accent-hover underline flex items-center gap-1"
                    >
                      <span>View validated ML corridors (16 corridors)</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: MapTiler Interactive Leaflet Map */}
        <div className="lg:col-span-7 sticky top-24">
          <IndiaMap
            origin={origin}
            destination={destination}
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={(idx) => setSelectedRouteIndex(idx)}
            liveSegment={liveTraffic?.segment_coordinates}
            liveTraffic={liveTraffic}
            incidents={incidents}
            pinSelectionMode={pinSelectionMode}
            onPinSelect={handlePinSelect}
            onCancelPinMode={() => setPinSelectionMode(null)}
            height="620px"
          />

          {/* Map Attribution and Engine Info */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Map view active</span>
              <span>•</span>
              <span>Click map to place or adjust pins</span>
            </div>
            {incidents.length > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ {incidents.length} active incident(s) reported
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Validated ML Coverage Modal */}
      {showCoverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Validated CITYFLOW ML Corridors
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverageModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              CITYFLOW AI next-day machine learning models are rigorously calibrated on multi-day historical detector telemetry for 16 primary arterial corridors in Bengaluru. Live traffic and traffic-aware routing remain fully active across all of India.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 text-xs">
              {[
                { name: 'Sarjapur Road', area: 'Koramangala' },
                { name: 'Sony World Junction', area: 'Koramangala' },
                { name: 'Anil Kumble Circle', area: 'M.G. Road' },
                { name: 'Trinity Circle', area: 'M.G. Road' },
                { name: '100 Feet Road', area: 'Indiranagar' },
                { name: 'CMH Road', area: 'Indiranagar' },
                { name: 'South End Circle', area: 'Jayanagar' },
                { name: 'Jayanagar 4th Block', area: 'Jayanagar' },
                { name: 'Ballari Road', area: 'Hebbal' },
                { name: 'Hebbal Flyover', area: 'Hebbal' },
                { name: 'Marathahalli Bridge', area: 'Whitefield' },
                { name: 'ITPL Main Road', area: 'Whitefield' },
                { name: 'Hosur Road', area: 'Electronic City' },
                { name: 'Silk Board Junction', area: 'BTM / HSR' },
                { name: 'Tumkur Road', area: 'Yeshwanthpur' },
                { name: 'Yeshwanthpur Circle', area: 'Yeshwanthpur' },
              ].map((corridor, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">{corridor.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{corridor.area}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCoverageModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
