import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  Siren,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import AuthorityNav from '../components/AuthorityNav';
import IndiaMap from '../components/IndiaMap';
import { getTrafficIncidents } from '../services/liveTrafficService';

export default function AuthorityIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Track time since last refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Load active emergency dispatch if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cityflow_active_emergency');
      if (stored) {
        setActiveEmergency(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      // Query TomTom traffic incidents around Bengaluru center with 25km radius
      const data = await getTrafficIncidents(12.9716, 77.5946, 25);
      setIncidents(data || []);
      setLastUpdated(Date.now());
      setSecondsAgo(0);
      if (data && data.length > 0) {
        setSelectedIncident(data[0]);
      }
    } catch (err) {
      console.warn('Failed to load incidents:', err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    if (inc.point && inc.point.length === 2) {
      setFocusedLocation({
        lat: inc.point[0],
        lng: inc.point[1],
        zoom: 15,
      });
    }
  };

  const handlePlanEmergencyRoute = (inc) => {
    const lat = inc.point ? inc.point[0] : 12.9716;
    const lng = inc.point ? inc.point[1] : 77.5946;
    const locName = inc.description || 'Incident Site';
    navigate(`/authority/routes?from=${encodeURIComponent(locName)}&lat=${lat}&lng=${lng}`);
  };

  const handleAnalyzeCorridor = (inc) => {
    const rawCorridor = inc.corridor_name || inc.road_name || '';
    const corridorName = rawCorridor.replace(/^Near\s+/i, '').trim();
    if (corridorName) {
      navigate(`/authority/congestion?corridor=${encodeURIComponent(corridorName)}`);
    } else {
      navigate('/authority/congestion');
    }
  };

  // Filter logic based on actual delay seconds returned by provider
  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === 'ALL') return true;
    const delayMin = inc.delay_seconds ? Math.round(inc.delay_seconds / 60) : 0;
    if (filterSeverity === 'HEAVY') return delayMin >= 8;
    if (filterSeverity === 'MODERATE') return delayMin >= 3 && delayMin < 8;
    if (filterSeverity === 'MINOR') return delayMin < 3;
    return true;
  });

  const heavyCount = incidents.filter((i) => (i.delay_seconds || 0) >= 480).length;
  const moderateCount = incidents.filter((i) => (i.delay_seconds || 0) >= 180 && (i.delay_seconds || 0) < 480).length;

  // Incident Proximity to Active Emergency Route
  const incidentNearRoute = activeEmergency && incidents.find((inc) => {
    if (!inc.point || !activeEmergency.origin) return false;
    const dOrigin = Math.hypot(inc.point[0] - activeEmergency.origin.latitude, inc.point[1] - activeEmergency.origin.longitude);
    const dDest = activeEmergency.destination
      ? Math.hypot(inc.point[0] - activeEmergency.destination.latitude, inc.point[1] - activeEmergency.destination.longitude)
      : 1;
    return dOrigin < 0.04 || dDest < 0.04;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Reusable Authority Header & Nav */}
      <AuthorityNav activeEmergencyCount={activeEmergency ? 1 : 0} />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold mb-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-Time Incident Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Spatial Incident Monitoring
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Near-live roadway bottlenecks, delays, and obstructions reported via TomTom Traffic Feeds.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            {secondsAgo < 5 ? 'Updated just now' : `Updated ${secondsAgo}s ago`}
          </div>
          <button
            type="button"
            onClick={fetchIncidents}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Incident Near Emergency Route Banner (if active) */}
      {incidentNearRoute && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                <span>⚠️ INCIDENT NEAR ROUTE</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-mono font-bold">
                  TomTom Real-Time
                </span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                An active traffic incident was detected near the selected emergency corridor for {activeEmergency.vehicle} ({incidentNearRoute.description || 'Road obstruction'}).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectIncident(incidentNearRoute)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-bold transition-colors"
            >
              View Incident
            </button>
            <Link
              to="/authority/emergency"
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <span>View Alternative Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Top Incident Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reported Incidents</span>
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {loading ? '...' : incidents.length}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">TomTom Traffic Feed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Heavy Bottlenecks</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {loading ? '...' : heavyCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Delay &ge; 8 minutes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moderate Delays</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {loading ? '...' : moderateCount}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Delay 3–8 minutes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monitoring Radius</span>
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white mt-2">Bengaluru</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">25 km Radius Active</div>
        </div>
      </div>

      {/* Main Map + Incident List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Incidents Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Spatial Incident Telemetry
              </h2>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Provider: TomTom Traffic Incidents
            </span>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-surface-border dark:border-slate-800 shadow-soft">
            <IndiaMap
              incidents={incidents}
              center={[12.9716, 77.5946]}
              zoom={11}
              height="580px"
              focusPosition={focusedLocation}
              onSelectIncident={handleSelectIncident}
              onEmergencyRoute={(target) =>
                navigate(`/authority/emergency?from=${encodeURIComponent(target.name)}&lat=${target.lat}&lng=${target.lng}`)
              }
              showLegend={true}
            />
          </div>
        </div>

        {/* Right Column: Incident Feed & Action Drawer */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Incident Detail Inspector */}
          {selectedIncident && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-700/80 shadow-soft space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                    ⚠️ INCIDENT DETAILS
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white mt-0.5">
                    {selectedIncident.description || 'Roadway Delay'}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400">TomTom Real-Time Incident Telemetry</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-xs space-y-1.5 text-rose-950 dark:text-rose-200">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Location:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedIncident.point
                      ? `${selectedIncident.point[0].toFixed(4)}, ${selectedIncident.point[1].toFixed(4)}`
                      : 'Bengaluru'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Estimated Delay:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    ~{Math.round((selectedIncident.delay_seconds || 0) / 60)} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Provider Source:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-300">TomTom Live API</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectIncident(selectedIncident)}
                  className="w-1/2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition-colors"
                >
                  View Incident
                </button>
                <button
                  type="button"
                  onClick={() => handlePlanEmergencyRoute(selectedIncident)}
                  className="w-1/2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Siren className="w-3.5 h-3.5" />
                  <span>Find Emergency Route</span>
                </button>
              </div>
            </div>
          )}

          {/* Incident Filter & Feed Header */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Active Roadway Incidents
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {filteredIncidents.length} of {incidents.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'HEAVY', label: 'Heavy Delay' },
              { id: 'MODERATE', label: 'Moderate' },
              { id: 'MINOR', label: 'Minor' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterSeverity(f.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterSeverity === f.id
                    ? 'bg-slate-900 dark:bg-accent text-white'
                    : 'bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Incident Scroll List */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 text-xs">
                Querying TomTom Traffic Incidents API...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                <div className="font-bold text-slate-800 dark:text-slate-200">No incidents matching this criteria</div>
                <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                  Corridors are flowing normally or live incident data is clear for this radius.
                </p>
              </div>
            ) : (
              filteredIncidents.map((inc, idx) => {
                const isSelected =
                  selectedIncident &&
                  selectedIncident.description === inc.description &&
                  selectedIncident.point?.[0] === inc.point?.[0];
                const delayMin = inc.delay_seconds ? Math.round(inc.delay_seconds / 60) : 0;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                      isSelected
                        ? 'border-accent shadow-md ring-1 ring-accent'
                        : 'border-surface-border dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {inc.description || 'Roadway Delay'}
                        </div>
                      </div>
                      {delayMin > 0 && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            delayMin >= 8
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          +{delayMin} min
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {inc.point && (
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                          {inc.point[0].toFixed(3)}, {inc.point[1].toFixed(3)}
                        </span>
                      )}
                      <span>•</span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        Provider: TomTom Live Feed
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectIncident(inc);
                        }}
                        className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View Incident</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeCorridor(inc);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <span>Analyze Corridor</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanEmergencyRoute(inc);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Siren className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Emergency Route</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
