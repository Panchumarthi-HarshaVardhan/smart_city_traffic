import React, { useState, useEffect } from 'react';
import { Siren, Shield, AlertTriangle, Info, Navigation, ArrowRight } from 'lucide-react';
import { BENGALURU_AREAS } from '../data/roads';
import { routeService } from '../services/routeService';
import { trafficService } from '../services/trafficService';
import { predictionService } from '../services/predictionService';
import EmergencyRouteCard from '../components/EmergencyRouteCard';
import TrafficMap from '../components/TrafficMap';

export default function AuthorityEmergency() {
  const [emergencyType, setEmergencyType] = useState('Ambulance');
  const [fromArea, setFromArea] = useState('Electronic City');
  const [toArea, setToArea] = useState('Hebbal');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [roads, setRoads] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([trafficService.getAllRoads(), predictionService.getAllPredictions()]).then(
      ([allRoads, allPreds]) => {
        setRoads(allRoads);
        const map = {};
        allPreds.forEach((p) => {
          map[p.road] = p;
        });
        setPredictions(map);
      }
    );

    executeSearch('Ambulance', 'Electronic City', 'Hebbal');
  }, []);

  const executeSearch = async (type = emergencyType, from = fromArea, to = toArea) => {
    if (from === to) return;
    setLoading(true);
    const results = await routeService.planEmergencyRoute(type, from, to);
    setRoutes(results);
    setSelectedRoute(results[0] || null);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-mono text-rose-400">
          <Siren className="w-3.5 h-3.5" />
          <span>Emergency Services Priority Routing</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Emergency Route Planning
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Compare route options using CITYFLOW AI traffic predictions. Provides decision support for rapid municipal vehicle deployment based on forecasted corridor bottlenecks.
        </p>
      </div>

      {/* Query Bar with Emergency Type Selector */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl space-y-5">
        <div>
          <label className="text-xs font-mono uppercase text-slate-400 block mb-2 font-medium">
            Emergency Fleet Dispatch Type
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {['Ambulance', 'Police', 'Fire'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setEmergencyType(type);
                  executeSearch(type, fromArea, toArea);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 border ${
                  emergencyType === type
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950'
                    : 'bg-surface-elevated text-slate-300 border-surface-border hover:bg-surface-border'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                <span>{type}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-2 border-t border-surface-border/50">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400">Dispatch Origin</label>
            <select
              value={fromArea}
              onChange={(e) => setFromArea(e.target.value)}
              className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              {BENGALURU_AREAS.map((a) => (
                <option key={a} value={a} disabled={a === toArea}>{a}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400">Emergency Target</label>
            <select
              value={toArea}
              onChange={(e) => setToArea(e.target.value)}
              className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            >
              {BENGALURU_AREAS.map((a) => (
                <option key={a} value={a} disabled={a === fromArea}>{a}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={() => executeSearch(emergencyType, fromArea, toArea)}
              disabled={loading || fromArea === toArea}
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all shadow-md shadow-rose-950 font-mono disabled:opacity-50"
            >
              {loading ? 'Evaluating...' : 'Plan Route'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Routes & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Emergency Route Alternatives */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border text-xs font-mono text-slate-400">
            <span>AI-Predicted Emergency Routes</span>
            <span>{routes.length} Evaluated</span>
          </div>

          {routes.map((route) => (
            <EmergencyRouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute && selectedRoute.id === route.id}
              onSelect={() => setSelectedRoute(route)}
              emergencyType={emergencyType}
            />
          ))}

          {/* Mandatory Safety Notice */}
          <div className="p-4 rounded-xl bg-surface/50 border border-surface-border text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-rose-400 font-mono font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Decision Support Advisory</span>
            </div>
            <p className="leading-relaxed">
              CITYFLOW AI recommendations are decision-support heuristics derived from historical corridor volume and congestion models. Emergency drivers must observe actual on-ground traffic signals and priority right-of-way protocols.
            </p>
          </div>
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Priority Clearance Corridor Geometry</span>
            <span>OSRM Pathing + AI Forecast Overlay</span>
          </div>

          <TrafficMap
            roads={roads}
            predictions={predictions}
            activeRoute={selectedRoute}
            height="540px"
            zoom={11}
          />
        </div>
      </div>
    </div>
  );
}
