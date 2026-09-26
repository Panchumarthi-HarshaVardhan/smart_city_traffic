import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Siren,
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ArrowLeft,
  Navigation2,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import IndiaMap from '../components/IndiaMap';
import { useTheme } from '../context/ThemeContext';

export default function AmbulanceView() {
  const navigate = useNavigate();
  const [dispatchData, setDispatchData] = useState(null);
  const [transitState, setTransitState] = useState('EN_ROUTE'); // 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED'
  const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cityflow_active_emergency');
      if (stored) {
        setDispatchData(JSON.parse(stored));
      } else {
        // Fallback default dispatch data if user directly navigates here
        setDispatchData({
          vehicle: 'Ambulance A104',
          priority: 'Critical (Code Red)',
          hospital: {
            name: 'Manipal Hospital, Old Airport Road',
            address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru',
            latitude: 12.9587,
            longitude: 77.6493,
            emergencyPhone: '080 2502 4444',
          },
          origin: {
            displayName: 'Koramangala, Bengaluru',
            latitude: 12.9352,
            longitude: 77.6245,
          },
          eta: 19,
          distance: 6.2,
          trafficCondition: 'Light Traffic',
          activeRoute: {
            name: '100 Feet Rd',
            durationMinutes: 19,
            distanceKm: 6.2,
            coordinates: [
              [12.9352, 77.6245],
              [12.9450, 77.6350],
              [12.9587, 77.6493],
            ],
          },
        });
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, []);

  if (!dispatchData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-surface-border shadow-soft">
          <Siren className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
          <div className="text-sm font-bold text-slate-900">No active ambulance dispatch found.</div>
          <Link
            to="/authority/emergency"
            className="text-xs text-accent underline font-bold"
          >
            Return to Authority Dispatch
          </Link>
        </div>
      </div>
    );
  }

  const isFireEngine =
    dispatchData.unitType === 'FIRE_ENGINE' ||
    dispatchData.vehicle?.toLowerCase().includes('fire');

  const destination =
    dispatchData.destination ||
    dispatchData.hospital ||
    dispatchData.fireIncident || {
      displayName: 'Receiving Emergency Destination',
      name: 'Receiving Emergency Destination',
      address: 'Bengaluru Medical Center',
      latitude: 12.9587,
      longitude: 77.6493,
    };

  const hospital = dispatchData.hospital || (!isFireEngine ? destination : null);

  const origin = dispatchData.origin || {
    displayName: 'Emergency Base',
    latitude: 12.9352,
    longitude: 77.6245,
  };

  const activeRoute = dispatchData.activeRoute;
  const isHeavy = dispatchData.trafficCondition?.toLowerCase().includes('heavy');

  return (
    <div
      className={`min-h-screen transition-colors duration-200 pb-16 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-background text-slate-900'
      }`}
    >
      {/* ── HIGH VISIBILITY TOP EMERGENCY HUD ── */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-800 shadow-md'
            : 'bg-white/95 border-surface-border shadow-xs'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/authority/routes"
              className={`p-1.5 rounded-xl border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Back to Authority Emergency Routes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 group"
              title="Return to Public Landing Page"
            >
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span
                className={`font-black text-xs tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                } group-hover:text-accent transition-colors hidden sm:inline`}
              >
                CITYFLOW
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xl">{isFireEngine ? '🚒' : '🚑'}</span>
              <div>
                <div className="font-black text-sm tracking-wide flex items-center gap-2">
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                    {dispatchData.vehicle || (isFireEngine ? 'FIRE ENGINE F201' : 'AMBULANCE A104')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono uppercase font-black">
                    {dispatchData.priority || 'CRITICAL'}
                  </span>
                </div>
                <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Priority In-Cab Driver Interface
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Status, Preview Arrival Simulation, & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Day / Night Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{isDarkMode ? 'Day' : 'Night'}</span>
            </button>

            {/* Preview Arrival Simulation Button */}
            <button
              type="button"
              onClick={() => setTransitState(transitState === 'ARRIVED' ? 'EN_ROUTE' : 'ARRIVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                transitState === 'ARRIVED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/25'
              }`}
              title="Toggle Arrival State for Prototype Simulation"
            >
              {transitState === 'ARRIVED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Arrived (Reset)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview Arrival</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── DRIVER WORKSPACE ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── ARRIVAL PROTOCOL CONFIRMATION BANNER (PROTOTYPE SIMULATION) ── */}
        {transitState === 'ARRIVED' && (
          <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-soft-lg space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>PROTOTYPE SIMULATION • WORKFLOW COMPLETE</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  AMBULANCE ARRIVED: Emergency response workflow complete.
                </h2>
                <p className="text-emerald-200 text-xs sm:text-sm">
                  Patient transfer protocol initiated at <strong>{hospital.name}</strong>. Corridor cleared.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setTransitState('EN_ROUTE')}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all border border-emerald-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset En Route</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('cityflow_active_emergency');
                    } catch (e) {}
                    navigate('/authority');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Complete & Clear Response</span>
                </button>
                <Link
                  to="/authority/emergency"
                  className="px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 text-xs font-bold transition-all border border-emerald-700 flex items-center gap-1.5"
                >
                  <span>Authority Coordination</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Corridor transit telemetry logged</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hospital triage team notified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unit {dispatchData.vehicle} standing by for next call</span>
              </div>
            </div>
          </div>
        )}

        {/* Destination & Action Banner */}
        <div
          className={`border rounded-3xl p-6 shadow-soft space-y-5 transition-colors ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-surface-border'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5 font-mono">
                <span className="text-base">{isFireEngine ? '🔥' : '🏥'}</span>
                <span>
                  {isFireEngine ? 'Active Emergency Incident Scene' : 'Active Destination Hospital (Auto-Recommended)'}
                </span>
              </div>
              <h1
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {destination.displayName || destination.name}
              </h1>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {destination.address || destination.displayName}
              </p>
            </div>

            {hospital?.emergencyPhone && (
              <a
                href={`tel:${hospital.emergencyPhone}`}
                className="px-4 py-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-200 text-xs font-bold flex items-center gap-2 self-start sm:self-center transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Call ER: {hospital.emergencyPhone}</span>
              </a>
            )}
          </div>

          {/* Key In-Cab Metric Cards */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div
              className={`rounded-2xl p-4 border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700/60'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Estimated ETA
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black mt-1 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {transitState === 'ARRIVED' ? 0 : (dispatchData.eta || activeRoute?.durationMinutes || 19)}{' '}
                <span className="text-xs font-bold text-slate-500">min</span>
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700/60'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Distance
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black mt-1 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {transitState === 'ARRIVED' ? 0.0 : (dispatchData.distance || activeRoute?.distanceKm || 6.2)}{' '}
                <span className="text-xs font-bold text-slate-500">km</span>
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border transition-colors ${
                isDarkMode
                  ? 'bg-slate-800/80 border-slate-700/60'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Transit Status
              </div>
              <div
                className={`text-sm sm:text-base font-black mt-2 ${
                  transitState === 'ARRIVED'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {transitState === 'ARRIVED' ? 'Arrived at ER' : (dispatchData.trafficCondition || 'En Route')}
              </div>
            </div>
          </div>

          {/* Next Navigation Action Instruction */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
              isDarkMode
                ? 'bg-slate-800/90 border-slate-700'
                : 'bg-sky-50/70 border-sky-100'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Navigation2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent font-mono">
                Driver Navigation Instruction
              </div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {transitState === 'ARRIVED'
                  ? 'Arrived at Hospital Emergency Bay. Hand off patient to triage team.'
                  : `Proceed on assigned corridor via ${activeRoute?.name || 'Primary Corridor'}`}
              </div>
            </div>
          </div>

          {/* Traffic Warning (Only when real delays or incidents detected) */}
          {isHeavy && transitState !== 'ARRIVED' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Corridor Advisory:</strong> Heavy traffic detected ahead along segment. Priority clearance requested.
              </span>
            </div>
          )}
        </div>

        {/* ── DRIVER ROUTE MAP ── */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Navigation Corridor Map</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Vehicle Base: {origin.latitude?.toFixed(3)}, {origin.longitude?.toFixed(3)}
            </span>
          </div>

          <div
            className={`relative rounded-3xl overflow-hidden border shadow-soft transition-colors ${
              isDarkMode ? 'border-slate-800' : 'border-surface-border'
            }`}
          >
            <IndiaMap
              origin={origin}
              destination={{
                displayName: destination.displayName || destination.name,
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              ambulanceMarker={{
                lat: transitState === 'ARRIVED' ? destination.latitude : origin.latitude,
                lng: transitState === 'ARRIVED' ? destination.longitude : origin.longitude,
                name: dispatchData.vehicle,
                isFireEngine: isFireEngine,
                status: transitState,
              }}
              hospitalMarker={{
                lat: destination.latitude,
                lng: destination.longitude,
                name: destination.displayName || destination.name,
                address: destination.address,
                isFireScene: isFireEngine,
              }}
              routes={activeRoute ? [activeRoute] : []}
              selectedRouteIndex={0}
              height="450px"
              showLegend={false}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-400">
          Prototype In-Cab Emergency Driver Interface • Connected to CITYFLOW Authority Operations Center
        </div>
      </main>
    </div>
  );
}
