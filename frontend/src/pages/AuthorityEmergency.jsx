import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Siren,
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Navigation,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Radio,
  Sparkles,
  Zap,
  Loader2,
  Flame,
  RotateCcw,
  Building2,
  Filter,
  Info,
} from 'lucide-react';
import AuthorityNav from '../components/AuthorityNav';
import IndiaMap from '../components/IndiaMap';
import { searchLocationSuggestions, reverseGeocodeLocation } from '../services/geocodingService';
import { calculateJourneyRoutes } from '../services/trafficRouteService';
import { getTrafficIncidents } from '../services/liveTrafficService';
import {
  recommendHospital,
  getNearbyHospitals,
  analyzeCorridorCongestion,
} from '../services/emergencyService';

// Prototype Emergency Fleet Units
const EMERGENCY_FLEET_UNITS = [
  { id: 'A104', name: 'Ambulance A104', type: 'AMBULANCE', label: 'Ambulance A104 (ALS Critical)', role: 'Advanced Life Support' },
  { id: 'A107', name: 'Ambulance A107', type: 'AMBULANCE', label: 'Ambulance A107 (BLS Rapid)', role: 'Basic Life Support' },
  { id: 'A112', name: 'Ambulance A112', type: 'AMBULANCE', label: 'Ambulance A112 (Medic Unit)', role: 'Trauma Transport' },
  { id: 'F201', name: 'Fire Engine F201', type: 'FIRE_ENGINE', label: 'Fire Engine F201 (Heavy Rescue)', role: 'Heavy Extrication & Rescue' },
  { id: 'F205', name: 'Fire Engine F205', type: 'FIRE_ENGINE', label: 'Fire Engine F205 (Rapid Pumper)', role: 'Rapid Pumper Engine' },
];

const POPULAR_ORIGINS = [
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Electronic City, Bengaluru', lat: 12.8452, lng: 77.6602 },
  { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408 },
  { name: 'Hebbal Flyover, Bengaluru', lat: 13.0358, lng: 77.5970 },
  { name: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7499 },
];

export default function AuthorityEmergency() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Fleet controls
  const [selectedVehicleId, setSelectedVehicleId] = useState('A104');
  const [priorityLevel, setPriorityLevel] = useState('Critical (Code Red)');

  // Selected vehicle object & unit type
  const selectedVehicle =
    EMERGENCY_FLEET_UNITS.find((u) => u.id === selectedVehicleId) || EMERGENCY_FLEET_UNITS[0];
  const isFireEngine = selectedVehicle.type === 'FIRE_ENGINE';

  // Origin location state & source tracking
  const [locationSource, setLocationSource] = useState('Configured ambulance base');
  const [originQuery, setOriginQuery] = useState(
    searchParams.get('from') || 'Koramangala, Bengaluru'
  );
  const [originLocation, setOriginLocation] = useState({
    displayName: searchParams.get('from') || 'Koramangala, Bengaluru',
    latitude: parseFloat(searchParams.get('lat')) || 12.9352,
    longitude: parseFloat(searchParams.get('lng')) || 77.6245,
  });
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Hospital Evaluation & Recommendation State (for AMBULANCE)
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [recommendedHospital, setRecommendedHospital] = useState(null);
  const [hospitalCandidates, setHospitalCandidates] = useState([]);
  const [recommendationReason, setRecommendationReason] = useState('');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Manual override toggle (secondary workflow only)
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [overrideQuery, setOverrideQuery] = useState('');
  const [overrideSuggestions, setOverrideSuggestions] = useState([]);

  // Fire Incident Selection State (for FIRE_ENGINE)
  const [fireSceneLocation, setFireSceneLocation] = useState(null);
  const [availableIncidents, setAvailableIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);

  // Map pin selection mode
  const [pinMode, setPinMode] = useState(null); // 'origin' | 'destination' | null

  // Route calculation & state machine
  // States: 'IDLE' | 'ANALYZING' | 'ROUTES_EVALUATED' | 'DISPATCHED'
  const [workflowState, setWorkflowState] = useState('IDLE');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routingSource, setRoutingSource] = useState('');
  const [calculationError, setCalculationError] = useState(null);

  // Corridor Analysis & Authority Recommendations
  const [corridorAnalysis, setCorridorAnalysis] = useState(null);
  const [authorityRecommendations, setAuthorityRecommendations] = useState([]);
  const [corridorLoading, setCorridorLoading] = useState(false);

  // Handle URL params prefill
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (fromParam && latParam && lngParam) {
      setOriginQuery(fromParam);
      setOriginLocation({
        displayName: fromParam,
        latitude: parseFloat(latParam),
        longitude: parseFloat(lngParam),
      });
      setLocationSource('Map-selected location');
    }
  }, [searchParams]);

  // Autocomplete for Origin
  useEffect(() => {
    if (!originQuery || originQuery.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(originQuery, 4);
        setOriginSuggestions(results);
      } catch (err) {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originQuery]);

  // Autocomplete for Secondary Manual Override
  useEffect(() => {
    if (!overrideQuery || overrideQuery.length < 2) {
      setOverrideSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocationSuggestions(`${overrideQuery} hospital`, 4);
        setOverrideSuggestions(results);
      } catch (err) {
        setOverrideSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [overrideQuery]);

  // Load nearby incidents for Fire Engine workflow
  useEffect(() => {
    if (isFireEngine) {
      setIncidentsLoading(true);
      getTrafficIncidents(originLocation.latitude, originLocation.longitude, 20)
        .then((res) => {
          const list = res || [];
          setAvailableIncidents(list);
          if (list.length > 0 && !fireSceneLocation) {
            const firstInc = list[0];
            setFireSceneLocation({
              name: firstInc.description || 'Active Incident Site',
              address: firstInc.road_name || 'Reported Roadway Delay',
              latitude: firstInc.lat || firstInc.point?.[0],
              longitude: firstInc.lng || firstInc.point?.[1],
              incidentData: firstInc,
            });
          }
        })
        .catch((e) => console.warn('Incident load notice:', e))
        .finally(() => setIncidentsLoading(false));
    }
  }, [isFireEngine, originLocation.latitude, originLocation.longitude]);

  // ---------------------------------------------------------------------------
  // HOSPITAL DISCOVERY & TRAFFIC-AWARE RECOMMENDATION (Automatic Workflow)
  // ---------------------------------------------------------------------------
  const discoverAndRecommendHospital = useCallback(async (lat, lng) => {
    setHospitalLoading(true);
    setCalculationError(null);
    try {
      const data = await recommendHospital(lat, lng, 4);
      if (data && data.success && data.candidates?.length > 0) {
        const rec = data.recommended_hospital || data.candidates[0];
        setRecommendedHospital(rec);
        setSelectedHospital(rec);
        setHospitalCandidates(data.candidates);
        setRecommendationReason(
          data.recommendation_reason ||
            'Recommended based on the lowest available traffic-aware ETA.'
        );

        // Pre-populate routes if candidate already contains traffic-aware routes
        if (rec.routes && rec.routes.length > 0) {
          setRoutes(rec.routes);
          setSelectedRouteIndex(0);
          setRoutingSource('Google Routes (Traffic-Aware)');
          setWorkflowState('ROUTES_EVALUATED');
          // Trigger corridor analysis
          triggerCorridorAnalysis(lat, lng, rec.latitude, rec.longitude, rec.routes[0], rec.routes);
        }
      } else {
        throw new Error('No candidate hospitals found in verified catalog.');
      }
    } catch (err) {
      console.warn('Automatic hospital recommendation notice:', err);
      // Fallback: fetch nearby from catalog and calculate routes
      const staticNearby = await getNearbyHospitals(lat, lng, 4);
      if (staticNearby.length > 0) {
        const first = staticNearby[0];
        const fallbackCand = {
          ...first,
          distanceKm: round(first.straightLineDistanceKm * 1.3, 1),
          durationMinutes: Math.max(5, Math.round(first.straightLineDistanceKm * 2.5)),
          trafficDelayMinutes: 0,
          trafficCondition: 'Light Traffic',
          conditionColor: '#10B981',
          routeAvailable: false,
          routes: [],
        };
        setRecommendedHospital(fallbackCand);
        setSelectedHospital(fallbackCand);
        setHospitalCandidates(
          staticNearby.map((h) => ({
            ...h,
            distanceKm: round(h.straightLineDistanceKm * 1.3, 1),
            durationMinutes: Math.max(5, Math.round(h.straightLineDistanceKm * 2.5)),
            trafficDelayMinutes: 0,
            trafficCondition: 'Light Traffic',
            conditionColor: '#10B981',
          }))
        );
        setRecommendationReason('Selected using closest proximity from verified hospital catalog.');
      }
    } finally {
      setHospitalLoading(false);
    }
  }, []);

  // Trigger hospital discovery whenever ambulance location changes
  useEffect(() => {
    if (!isFireEngine && originLocation?.latitude && originLocation?.longitude) {
      discoverAndRecommendHospital(originLocation.latitude, originLocation.longitude);
    }
  }, [isFireEngine, originLocation.latitude, originLocation.longitude, discoverAndRecommendHospital]);

  // Browser Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const geo = await reverseGeocodeLocation(lat, lng);
          const loc = {
            displayName: geo.displayName || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            placeName: geo.placeName || 'Current Location',
            latitude: lat,
            longitude: lng,
          };
          setOriginLocation(loc);
          setOriginQuery(loc.displayName);
          setLocationSource('GPS location');
        } catch (err) {
          console.warn('Reverse geocode error:', err);
          const loc = {
            displayName: `Current GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setOriginLocation(loc);
          setOriginQuery(loc.displayName);
          setLocationSource('GPS location');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          'GPS permission denied or unavailable. Gracefully retaining configured ambulance base.'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Map Pin Selection Handler
  const handlePinSelect = async (type, lat, lng) => {
    try {
      const geo = await reverseGeocodeLocation(lat, lng);
      const loc = {
        displayName: geo.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        latitude: lat,
        longitude: lng,
      };
      if (type === 'origin') {
        setOriginLocation(loc);
        setOriginQuery(loc.displayName);
        setLocationSource('Map-selected location');
      } else {
        if (isFireEngine) {
          setFireSceneLocation({
            name: `Emergency Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            address: loc.displayName,
            latitude: lat,
            longitude: lng,
          });
        } else {
          // Manual destination override
          const overrideHospitalObj = {
            id: `manual-${Date.now()}`,
            name: loc.displayName,
            shortName: geo.placeName || 'Custom Location',
            address: loc.displayName,
            latitude: lat,
            longitude: lng,
            traumaLevel: 'Medical Facility',
          };
          setSelectedHospital(overrideHospitalObj);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode failure:', e);
    }
    setPinMode(null);
  };

  // Switch hospital to an alternative candidate
  const handleSelectAlternativeHospital = async (candidate) => {
    setSelectedHospital(candidate);
    setShowAlternatives(false);
    if (candidate.routes && candidate.routes.length > 0) {
      setRoutes(candidate.routes);
      setSelectedRouteIndex(0);
      setWorkflowState('ROUTES_EVALUATED');
      triggerCorridorAnalysis(
        originLocation.latitude,
        originLocation.longitude,
        candidate.latitude,
        candidate.longitude,
        candidate.routes[0],
        candidate.routes
      );
    } else {
      calculateRoutesForDestination({
        name: candidate.name,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      });
    }
  };

  // Route calculation
  const calculateRoutesForDestination = async (dest) => {
    if (!originLocation || !dest) return;

    setWorkflowState('ANALYZING');
    setAnalysisStep(0);
    setCalculationError(null);

    const t1 = setTimeout(() => setAnalysisStep(1), 300);
    const t2 = setTimeout(() => setAnalysisStep(2), 650);
    const t3 = setTimeout(() => setAnalysisStep(3), 1000);

    try {
      const routeResult = await calculateJourneyRoutes(originLocation, dest);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAnalysisStep(3);

      if (routeResult.routes && routeResult.routes.length > 0) {
        const sorted = [...routeResult.routes].sort(
          (a, b) => a.durationMinutes - b.durationMinutes
        );
        setRoutes(sorted);
        setSelectedRouteIndex(0);
        setRoutingSource(routeResult.routingSource || 'Google Routes (Traffic-Aware)');
        setWorkflowState('ROUTES_EVALUATED');

        // Corridor analysis
        triggerCorridorAnalysis(
          originLocation.latitude,
          originLocation.longitude,
          dest.latitude,
          dest.longitude,
          sorted[0],
          sorted
        );
      } else {
        throw new Error('No driving route could be calculated between these coordinates.');
      }
    } catch (err) {
      console.error('Route calculation failure:', err);
      setCalculationError(err.message || 'Failed to calculate emergency routes.');
      setWorkflowState('IDLE');
    }
  };

  // Trigger Corridor Congestion Analysis & Authority Recommendations
  const triggerCorridorAnalysis = async (oLat, oLng, dLat, dLng, activeR, allR) => {
    setCorridorLoading(true);
    try {
      const analysisData = await analyzeCorridorCongestion(oLat, oLng, dLat, dLng, activeR, allR);
      setCorridorAnalysis(analysisData.corridor_analysis || null);
      setAuthorityRecommendations(analysisData.recommendations || []);
    } catch (err) {
      console.warn('Corridor analysis warning:', err);
    } finally {
      setCorridorLoading(false);
    }
  };

  // Active route
  const activeRoute = routes[selectedRouteIndex] || routes[0] || null;

  // Active destination
  const activeDestination = isFireEngine
    ? fireSceneLocation
    : selectedHospital || recommendedHospital;

  // Handoff to Driver HUD
  const handleSendRouteToDriver = () => {
    if (!activeDestination || !activeRoute) return;

    const dispatchPayload = {
      id: `dispatch-${Date.now()}`,
      vehicle: selectedVehicle.name,
      unitType: selectedVehicle.type,
      priority: priorityLevel,
      origin: originLocation,
      destination: {
        displayName: activeDestination.name,
        latitude: activeDestination.latitude,
        longitude: activeDestination.longitude,
        address: activeDestination.address,
      },
      hospital: !isFireEngine ? activeDestination : null,
      fireIncident: isFireEngine ? activeDestination : null,
      routes: routes,
      selectedRouteIndex: selectedRouteIndex,
      activeRoute: activeRoute,
      eta: activeRoute?.durationMinutes || 20,
      distance: activeRoute?.distanceKm || 8,
      trafficCondition: activeRoute?.trafficCondition || 'Moderate Traffic',
      corridorAnalysis: corridorAnalysis,
      authorityRecommendations: authorityRecommendations,
      status: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('cityflow_active_emergency', JSON.stringify(dispatchPayload));
    } catch (e) {
      console.warn('Storage error:', e);
    }

    setWorkflowState('DISPATCHED');
  };

  // Dynamic Rationale for recommended corridor
  const getRecommendationRationale = (route, allRoutes) => {
    if (!route || allRoutes.length === 0) return '';
    const otherRoutes = allRoutes.filter((r) => r.id !== route.id);
    if (otherRoutes.length === 0) {
      return `Recommended based on direct traffic-aware routing (${route.durationMinutes} min ETA).`;
    }
    const slowest = otherRoutes[otherRoutes.length - 1];
    const delta = Math.round(slowest.durationMinutes - route.durationMinutes);
    if (delta > 0) {
      return `Recommended based on the shortest computed traffic-aware ETA (${route.durationMinutes} min). Alternative corridors experience up to +${delta} min longer transit under current road conditions.`;
    }
    return `Recommended based on optimal corridor travel-time (${route.durationMinutes} min ETA).`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Authority Nav */}
      <AuthorityNav activeEmergencyCount={workflowState === 'DISPATCHED' ? 1 : 0} />

      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-1.5">
            <Siren className="w-3.5 h-3.5 animate-bounce" />
            <span>Emergency Services Priority Routing • Decision Support</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Emergency Route Recommendations
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Find traffic-aware routes for emergency units and identify corridor constraints.
          </p>
        </div>

        {/* Workflow State Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-bold">
          <span className="text-slate-400">Status:</span>
          <span
            className={`px-3 py-1 rounded-full uppercase tracking-wider text-[11px] font-mono ${
              workflowState === 'DISPATCHED'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : workflowState === 'ROUTES_EVALUATED'
                ? 'bg-sky-50 text-accent border border-sky-200'
                : workflowState === 'ANALYZING'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {workflowState === 'DISPATCHED'
              ? '● Corridor Dispatched'
              : workflowState === 'ROUTES_EVALUATED'
              ? '● Routes & Destination Evaluated'
              : workflowState === 'ANALYZING'
              ? '● Evaluating Traffic-Aware Corridors...'
              : '● Ready for Request'}
          </span>
        </div>
      </div>

      {/* ── 5-STAGE VISUAL WORKFLOW TIMELINE ── */}
      <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Emergency Response Protocol Stages
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {workflowState === 'DISPATCHED'
              ? 'Stage 4 of 5 Active'
              : workflowState === 'ROUTES_EVALUATED'
              ? 'Stage 3 of 5 Active'
              : workflowState === 'ANALYZING'
              ? 'Stage 2 of 5 Active'
              : 'Stage 1 of 5 Ready'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Stage 1 */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              originLocation && activeDestination
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="font-bold font-mono text-[10px] w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center shrink-0">
              1
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[11px] truncate">
                {isFireEngine ? 'Unit & Fire Site' : 'Unit & Nearest Hospital'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {isFireEngine ? 'Incident Location' : 'Auto-Discovered'}
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              workflowState === 'ANALYZING' || hospitalLoading
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 animate-pulse ring-1 ring-amber-300'
                : workflowState === 'ROUTES_EVALUATED' || workflowState === 'DISPATCHED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="font-bold font-mono text-[10px] w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center shrink-0">
              2
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[11px] truncate">Traffic Evaluation</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Google + TomTom</div>
            </div>
          </div>

          {/* Stage 3 */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              workflowState === 'ROUTES_EVALUATED'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-accent font-bold ring-1 ring-sky-300'
                : workflowState === 'DISPATCHED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="font-bold font-mono text-[10px] w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center shrink-0">
              3
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[11px] truncate">Corridor & Mitigations</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Advisory Recommendations</div>
            </div>
          </div>

          {/* Stage 4 */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              workflowState === 'DISPATCHED'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="font-bold font-mono text-[10px] w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 flex items-center justify-center shrink-0">
              4
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[11px] truncate">Route Dispatched</div>
              <div
                className={`text-[10px] truncate ${
                  workflowState === 'DISPATCHED' ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Unit Transmitted
              </div>
            </div>
          </div>

          {/* Stage 5 */}
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              workflowState === 'DISPATCHED'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-bold'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
            }`}
          >
            <span className="font-bold font-mono text-[10px] w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-current flex items-center justify-center shrink-0">
              5
            </span>
            <div className="min-w-0">
              <div className="font-bold text-[11px] truncate">In-Cab HUD</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Driver Navigation</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FLEET CONTROLS & LOCATION BAR ── */}
      <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-soft space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* 1. Fleet Vehicle Selector (Explicit Prototype Units) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {isFireEngine ? (
                <Flame className="w-3.5 h-3.5 text-orange-600" />
              ) : (
                <Siren className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>Emergency Unit (Prototype Fleet)</span>
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                setSelectedVehicleId(e.target.value);
                setWorkflowState('IDLE');
                setRoutes([]);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800"
            >
              {EMERGENCY_FLEET_UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Role: {selectedVehicle.role} • Mode:{' '}
              {isFireEngine ? 'Fire/Hazard Incident Dispatch' : 'Hospital Medical Dispatch'}
            </div>
          </div>

          {/* 2. Priority Level */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Priority Level</span>
            </label>
            <select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800"
            >
              <option value="Critical (Code Red)">Critical (Code Red - Golden Hour)</option>
              <option value="Urgent (Code Yellow)">Urgent (Code Yellow - Trauma Response)</option>
              <option value="Standard Priority">Standard Priority Transfer</option>
            </select>
          </div>

          {/* 3. Re-evaluate / Refresh Corridors Button */}
          <div className="md:col-span-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isFireEngine) {
                  if (fireSceneLocation) {
                    calculateRoutesForDestination(fireSceneLocation);
                  }
                } else {
                  discoverAndRecommendHospital(originLocation.latitude, originLocation.longitude);
                }
              }}
              disabled={workflowState === 'ANALYZING' || hospitalLoading}
              className="w-full py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-all shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {workflowState === 'ANALYZING' || hospitalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Live Corridors...</span>
                </>
              ) : (
                <>
                  <Siren className="w-4 h-4" />
                  <span>
                    {isFireEngine ? 'Calculate Fire Response Route' : 'Re-Evaluate Emergency Corridors'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── UNIT CURRENT LOCATION ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>
                  {isFireEngine ? 'Fire Station / Engine Location' : 'Ambulance Current Location'}
                </span>
              </label>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Source: {locationSource}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Browser Current Location Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-surface-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                title="Detect GPS Current Location"
              >
                {geoLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-sky-600 dark:text-sky-400" />
                ) : (
                  <Navigation className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                )}
                <span>{geoLoading ? 'Detecting GPS...' : 'Use Current Location'}</span>
              </button>

              {/* Map Pin Pick Button */}
              <button
                type="button"
                onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                  pinMode === 'origin'
                    ? 'bg-accent text-white border-accent'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-surface-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {pinMode === 'origin' ? 'Cancel Click' : 'Pick on Map'}
              </button>
            </div>
          </div>

          {geoError && (
            <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                setShowOriginSuggestions(true);
              }}
              onFocus={() => setShowOriginSuggestions(true)}
              placeholder="Search ambulance or base location..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />

            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                {originSuggestions.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setOriginLocation(item);
                      setOriginQuery(item.displayName);
                      setLocationSource('Search-selected location');
                      setShowOriginSuggestions(false);
                    }}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">{item.placeName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.displayName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Origin Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 dark:text-slate-500 font-semibold">Bases:</span>
            {POPULAR_ORIGINS.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOriginQuery(p.name);
                  setOriginLocation({ displayName: p.name, latitude: p.lat, longitude: p.lng });
                  setLocationSource('Configured ambulance base');
                }}
                className={`px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 transition-colors ${
                  originLocation.displayName === p.name
                    ? 'bg-sky-100 dark:bg-sky-950/60 text-accent font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESTINATION SELECTION SECTION (AUTOMATED HOSPITAL OR FIRE INCIDENT) ── */}
        {!isFireEngine ? (
          /* AMBULANCE WORKFLOW: AUTOMATIC HOSPITAL DISCOVERY & RECOMMENDATION */
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Nearest Suitable Hospital (Automated Discovery)</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluated using live Google Routes traffic-aware ETAs from Verified Hospital Catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowManualOverride(!showManualOverride)}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
              >
                {showManualOverride ? 'Hide Override' : 'Override Destination'}
              </button>
            </div>

            {/* Loading Skeleton */}
            {hospitalLoading && (
              <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    Finding hospitals near the ambulance...
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400">
                    Querying verified catalog and calculating traffic-aware travel times.
                  </div>
                </div>
              </div>
            )}

            {/* RECOMMENDED HOSPITAL CARD */}
            {!hospitalLoading && recommendedHospital && (
              <div className="bg-gradient-to-br from-teal-50/80 via-white to-sky-50/50 dark:from-teal-950/40 dark:via-slate-900 dark:to-sky-950/40 border-2 border-teal-500 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                      <span>RECOMMENDED DESTINATION</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      {selectedHospital?.name || recommendedHospital.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedHospital?.address || recommendedHospital.address}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-2xl font-black text-teal-900 dark:text-teal-300">
                      {selectedHospital?.durationMinutes || recommendedHospital.durationMinutes}{' '}
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">min</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Traffic-aware ETA •{' '}
                      {selectedHospital?.distanceKm || recommendedHospital.distanceKm} km
                    </div>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900/60 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">
                      Traffic Delay
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{selectedHospital?.trafficDelayMinutes || recommendedHospital.trafficDelayMinutes || 0} min
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">
                      Road Condition
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedHospital?.trafficCondition || recommendedHospital.trafficCondition || 'Light Traffic'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">
                      Emergency Desk
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedHospital?.emergencyPhone || recommendedHospital.emergencyPhone || 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">
                      Trauma Facility
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300 truncate block">
                      {selectedHospital?.traumaLevel || recommendedHospital.traumaLevel || 'Level 1'}
                    </span>
                  </div>
                </div>

                {/* Recommendation Rationale */}
                <div className="p-3 rounded-2xl bg-teal-100/60 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Selection Rationale: </strong>
                    <span>{recommendationReason}</span>
                  </div>
                </div>

                {/* Toggle Alternatives Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAlternatives(!showAlternatives)}
                    className="text-xs font-bold text-teal-800 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {showAlternatives
                        ? 'Hide Hospital Alternatives'
                        : `View Hospital Alternatives (${hospitalCandidates.length})`}
                    </span>
                    {showAlternatives ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Source: Verified Hospital Catalog (Bengaluru)
                  </span>
                </div>

                {/* ── ALTERNATIVE HOSPITALS COMPARISON LIST ── */}
                {showAlternatives && (
                  <div className="space-y-2 pt-2 border-t border-teal-200/60 dark:border-teal-800/60 animate-in fade-in">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      OTHER NEARBY HOSPITALS (Factual Comparison)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {hospitalCandidates.map((cand, idx) => {
                        const isCurrentSelected =
                          selectedHospital?.name === cand.name ||
                          (!selectedHospital && recommendedHospital?.name === cand.name);

                        return (
                          <div
                            key={cand.id || idx}
                            onClick={() => handleSelectAlternativeHospital(cand)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                              isCurrentSelected
                                ? 'bg-teal-100/90 dark:bg-teal-950/80 border-teal-400 dark:border-teal-500 ring-1 ring-teal-400'
                                : 'bg-white dark:bg-slate-800/60 border-surface-border dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {cand.shortName || cand.name}
                              </div>
                              <span className="font-bold text-teal-900 dark:text-teal-300 font-mono shrink-0">
                                {cand.durationMinutes} min
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                              <span>
                                {cand.distanceKm} km • Delay: +{cand.trafficDelayMinutes || 0}m
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  cand.trafficCondition?.toLowerCase().includes('heavy')
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : cand.trafficCondition?.toLowerCase().includes('moderate')
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {cand.trafficCondition || 'Light'}
                              </span>
                            </div>

                            {isCurrentSelected ? (
                              <div className="text-[10px] text-teal-800 dark:text-teal-300 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                                <span>Active Destination</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-accent dark:text-sky-400 font-bold underline">
                                Select Destination
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Secondary Manual Override Input (Only if user wants to override) */}
            {showManualOverride && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Secondary Destination Override (Manual Search / Map Pick)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                      pinMode === 'destination'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pinMode === 'destination' ? 'Cancel Click' : 'Pick on Map'}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={overrideQuery}
                    onChange={(e) => {
                      setOverrideQuery(e.target.value);
                    }}
                    placeholder="Search specific hospital name..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-600"
                  />
                  {overrideSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                      {overrideSuggestions.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            const customH = {
                              name: item.displayName,
                              shortName: item.placeName,
                              address: item.displayName,
                              latitude: item.latitude,
                              longitude: item.longitude,
                            };
                            setSelectedHospital(customH);
                            setOverrideSuggestions([]);
                            calculateRoutesForDestination(customH);
                          }}
                          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div className="font-bold text-slate-900 dark:text-white">{item.placeName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.displayName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FIRE ENGINE WORKFLOW: FIRE / INCIDENT LOCATION SELECTION */
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  <span>Incident / Fire Location (Destination)</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Select an active reported emergency incident or pinpoint the fire location on the map.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                className={`text-[11px] font-bold px-3 py-1 rounded-xl border transition-colors ${
                  pinMode === 'destination'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pinMode === 'destination' ? 'Cancel Click' : 'Pick Incident on Map'}
              </button>
            </div>

            {/* Selected Fire Scene Card */}
            {fireSceneLocation && (
              <div className="p-4 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase text-orange-800 dark:text-orange-300 tracking-wider">
                      ACTIVE EMERGENCY DESTINATION
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{fireSceneLocation.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">{fireSceneLocation.address}</div>
                  </div>
                  <span className="text-2xl">🔥</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => calculateRoutesForDestination(fireSceneLocation)}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>Compute Fire Engine Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Nearby Active Incidents for Quick Selection */}
            {availableIncidents.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  REPORTED INCIDENTS IN SECTOR ({availableIncidents.length})
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableIncidents.slice(0, 4).map((inc, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        const scene = {
                          name: inc.description || 'Active Incident Site',
                          address: inc.road_name || 'Reported Roadway Delay',
                          latitude: inc.lat || inc.point?.[0],
                          longitude: inc.lng || inc.point?.[1],
                          incidentData: inc,
                        };
                        setFireSceneLocation(scene);
                        calculateRoutesForDestination(scene);
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 cursor-pointer text-xs space-y-1 transition-colors"
                    >
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {inc.description || 'Road Delay'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {inc.road_name || 'Corridor'} • Delay: ~{Math.round((inc.delay_seconds || 0) / 60)}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STATE TRANSITION / ANALYZING PROGRESS HUD ── */}
      {workflowState === 'ANALYZING' && (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
              Emergency Corridor Telemetry Analysis
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${analysisStep >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
              <span className={analysisStep >= 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                Querying Live Flow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${analysisStep >= 1 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
              <span className={analysisStep >= 1 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                Scanning Incidents
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${analysisStep >= 2 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
              <span className={analysisStep >= 2 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                Traffic-Aware Routes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${analysisStep >= 3 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}
              />
              <span className={analysisStep >= 3 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
                Generating Mitigations
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR MESSAGE ── */}
      {calculationError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{calculationError}</span>
        </div>
      )}

      {/* ── DISPATCHED CONFIRMATION BANNER ── */}
      {workflowState === 'DISPATCHED' && activeRoute && activeDestination && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-7 shadow-soft space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ROUTE DISPATCHED • NAVIGATION PREPARED</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Corridor Dispatched to {selectedVehicle.name}
              </h2>
              <p className="text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                Destination: <strong>{activeDestination.name}</strong> • ETA:{' '}
                <strong>{activeRoute.durationMinutes} mins</strong> ({activeRoute.distanceKm} km)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                to="/emergency/ambulance"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-white dark:hover:bg-emerald-50 dark:text-emerald-950 text-xs font-black transition-all shadow-md flex items-center gap-2"
              >
                <Siren className="w-4 h-4 text-white dark:text-rose-600" />
                <span>Open Driver View (HUD)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
            <span>Prototype emergency communication workflow and route handoff preview.</span>
            <span className="font-mono">Route ID: {activeRoute.id}</span>
          </div>
        </div>
      )}

      {/* ── MAIN WORKSPACE: MAP (7 Cols) + ROUTE COMPARISON (5 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map View */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-accent" />
              <span>Emergency Corridors Map</span>
            </div>
            {routingSource && (
              <span className="text-xs text-slate-400 font-mono">
                Engine: {routingSource}
              </span>
            )}
          </div>

          <div className="relative">
            <IndiaMap
              origin={originLocation}
              destination={
                activeDestination
                  ? {
                      displayName: activeDestination.name,
                      latitude: activeDestination.latitude,
                      longitude: activeDestination.longitude,
                    }
                  : null
              }
              ambulanceMarker={{
                lat: originLocation.latitude,
                lng: originLocation.longitude,
                name: selectedVehicle.name,
                isFireEngine: isFireEngine,
                status: workflowState === 'DISPATCHED' ? 'Dispatched' : 'Standing By',
              }}
              hospitalMarker={
                activeDestination
                  ? {
                      lat: activeDestination.latitude,
                      lng: activeDestination.longitude,
                      name: activeDestination.name,
                      address: activeDestination.address,
                      isFireScene: isFireEngine,
                    }
                  : null
              }
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={(idx) => setSelectedRouteIndex(idx)}
              pinSelectionMode={pinMode}
              onPinSelect={handlePinSelect}
              onCancelPinMode={() => setPinMode(null)}
              height="600px"
              showLegend={true}
            />
          </div>
        </div>

        {/* Route Comparison & Alternative Corridors */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Siren className="w-4 h-4 text-rose-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Route Comparison & Corridors
              </h2>
            </div>
            {routes.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {routes.length} options evaluated
              </span>
            )}
          </div>

          {routes.length === 0 ? (
            /* Pre-calculation State Card */
            <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Siren className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {isFireEngine
                    ? 'Fire Incident Route Ready'
                    : 'Emergency Destination Ready'}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mt-1">
                  {isFireEngine
                    ? 'Select an active fire incident or pick on the map to evaluate emergency transit.'
                    : 'Hospital automatically identified with lowest traffic-aware travel time. Click below to analyze corridors.'}
                </p>
              </div>

              {activeDestination && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Assigned Unit:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedVehicle.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Destination:</span>
                    <span className="font-bold text-teal-800 dark:text-teal-400 truncate ml-2 max-w-[200px]">
                      {activeDestination.name}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (activeDestination) {
                    calculateRoutesForDestination(activeDestination);
                  }
                }}
                disabled={workflowState === 'ANALYZING' || !activeDestination}
                className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Siren className="w-4 h-4" />
                <span>Calculate Emergency Corridors</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dynamic Route Comparison Delta Box */}
              {routes.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold">Corridor Advantage: </span>
                      <span>
                        Estimated{' '}
                        <strong>
                          {Math.max(
                            1,
                            Math.round(routes[1].durationMinutes - routes[0].durationMinutes)
                          )}{' '}
                          min shorter
                        </strong>{' '}
                        than alternative corridor ({routes[1].name || 'Alternative route'}).
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                    -
                    {Math.max(
                      1,
                      Math.round(routes[1].durationMinutes - routes[0].durationMinutes)
                    )}
                    m
                  </span>
                </div>
              )}

              {/* Recommended Route Card */}
              {activeRoute && (
                <div className="bg-white dark:bg-slate-900 border-2 border-accent rounded-3xl p-5 shadow-soft space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-light dark:bg-accent/20 text-accent dark:text-accent-light">
                        RECOMMENDED EMERGENCY CORRIDOR
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {activeRoute.name || 'Primary Corridor'}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {activeRoute.durationMinutes}{' '}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">min</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{activeRoute.distanceKm} km</div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Traffic Delay:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-1">
                        +{activeRoute.trafficDelayMinutes || 0} min
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Condition:</span>
                      <span className="font-bold text-slate-900 dark:text-white ml-1">
                        {activeRoute.trafficCondition || 'Moderate Traffic'}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Explanation Rationale */}
                  <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 leading-relaxed font-normal">
                    <strong>Why Recommended?</strong>{' '}
                    {getRecommendationRationale(activeRoute, routes)}
                  </div>

                  {/* Dispatch Action Button */}
                  {workflowState !== 'DISPATCHED' ? (
                    <button
                      type="button"
                      onClick={handleSendRouteToDriver}
                      className="w-full py-3.5 px-4 rounded-2xl bg-accent hover:bg-accent-hover text-white font-black text-xs transition-all shadow-md shadow-accent/20 flex items-center justify-center gap-2"
                    >
                      <Siren className="w-4 h-4" />
                      <span>
                        {isFireEngine
                          ? 'Send Route to Fire Engine HUD'
                          : 'Send Route to Ambulance HUD'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/emergency/ambulance"
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Driver Interface (In-Cab HUD)</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Alternative Corridors */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Alternative Corridors ({routes.length > 1 ? routes.length - 1 : 0})
                </div>

                {routes.length <= 1 ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                    Alternative traffic-aware routes unavailable for this segment.
                  </div>
                ) : (
                  routes.map((route, idx) => {
                    if (idx === selectedRouteIndex) return null;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedRouteIndex(idx);
                          triggerCorridorAnalysis(
                            originLocation.latitude,
                            originLocation.longitude,
                            activeDestination.latitude,
                            activeDestination.longitude,
                            route,
                            routes
                          );
                        }}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {route.name || `Alternative ${idx}`}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {route.distanceKm} km • Delay: +{route.trafficDelayMinutes || 0} min (
                            {route.trafficCondition || 'Moderate'})
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            {route.durationMinutes} min
                          </div>
                          <span className="text-[10px] text-accent dark:text-accent-light font-bold underline">
                            Switch Corridor
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 8. EMERGENCY CORRIDOR ANALYSIS & 9. AUTHORITY TRAFFIC MITIGATION RECOMMENDATIONS ── */}
      {activeRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
          {/* Corridor Analysis (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Emergency Corridor Analysis
              </h3>
            </div>

            {corridorLoading ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                Analyzing live corridor conditions...
              </div>
            ) : corridorAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Current Corridor:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {corridorAnalysis.corridorName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Flow Condition:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        corridorAnalysis.condition.toLowerCase().includes('heavy')
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                          : corridorAnalysis.condition.toLowerCase().includes('moderate')
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {corridorAnalysis.condition}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Traffic Delay:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{corridorAnalysis.delayMinutes} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Corridor Incidents:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {corridorAnalysis.incidentCount} detected
                    </span>
                  </div>
                </div>

                <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-sky-50/50 dark:bg-sky-950/30 p-3 rounded-2xl border border-sky-100 dark:border-sky-800/60">
                  {corridorAnalysis.summary}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">Corridor telemetry ready for inspection.</div>
            )}
          </div>

          {/* Authority Mitigation Recommendations (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-3xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Traffic Management Recommendations
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Decision-Support Advisory</span>
            </div>

            <div className="space-y-3">
              {authorityRecommendations.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs">
                  No active traffic interventions required. Current emergency corridor has standard flow.
                </div>
              ) : (
                authorityRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      rec.priorityLevel === 'high'
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                        : rec.priorityLevel === 'medium'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          rec.priorityLevel === 'high'
                            ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
                            : rec.priorityLevel === 'medium'
                            ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{rec.corridor}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Reason: </strong>
                      {rec.reason}
                    </p>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-slate-900 dark:text-white font-medium">
                      <strong>Recommended Authority Action: </strong>
                      {rec.suggestedAction}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Strict Transparency Disclaimer */}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
              ⚠️ <em>Disclaimer:</em> All recommendations are advisory decision-support suggestions for traffic authorities. CITYFLOW does not directly manipulate municipal traffic light systems.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
