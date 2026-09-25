import React, { useState, useEffect } from 'react';
import { Compass, Clock, MapPin, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { BENGALURU_AREAS } from '../data/roads';
import { routeService } from '../services/routeService';
import { trafficService } from '../services/trafficService';
import { predictionService } from '../services/predictionService';
import RouteCard from '../components/RouteCard';
import RouteComparison from '../components/RouteComparison';
import TrafficMap from '../components/TrafficMap';

export default function CitizenRoute() {
  const [fromArea, setFromArea] = useState('Koramangala');
  const [toArea, setToArea] = useState('Whitefield');
  const [departureWindow, setDepartureWindow] = useState('Morning Peak (08:30 - 10:30)');
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

    executeSearch('Koramangala', 'Whitefield');
  }, []);

  const executeSearch = async (from = fromArea, to = toArea) => {
    setLoading(true);
    const results = await routeService.findRoutes(from, to);
    setRoutes(results);
    setSelectedRoute(results[0] || null);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-accent">
          <Compass className="w-3.5 h-3.5" />
          <span>Intelligent Route Recommendation</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Bengaluru Route Optimizer
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Combines OSRM highway pathing with Random Forest congestion predictions to suggest the route least prone to heavy bottleneck delays.
        </p>
      </div>

      {/* Query Selector Grid */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border grid grid-cols-1 sm:grid-cols-12 gap-4 items-end shadow-xl">
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-mono uppercase text-slate-400">Origin</label>
          <select
            value={fromArea}
            onChange={(e) => setFromArea(e.target.value)}
            className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
          >
            {BENGALURU_AREAS.map((a) => (
              <option key={a} value={a} disabled={a === toArea}>{a}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-mono uppercase text-slate-400">Destination</label>
          <select
            value={toArea}
            onChange={(e) => setToArea(e.target.value)}
            className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
          >
            {BENGALURU_AREAS.map((a) => (
              <option key={a} value={a} disabled={a === fromArea}>{a}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-4">
          <button
            onClick={() => executeSearch(fromArea, toArea)}
            disabled={loading || fromArea === toArea}
            className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all shadow-sm shadow-accent/20"
          >
            {loading ? 'Evaluating Corridors...' : 'Compare AI Routes'}
          </button>
        </div>
      </div>

      {/* Comparison and Routes Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider pb-2 border-b border-surface-border">
            Generated AI Recommendations
          </div>

          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute && selectedRoute.id === route.id}
              onSelect={() => setSelectedRoute(route)}
            />
          ))}

          {/* Technical Note */}
          <div className="p-4 rounded-xl bg-surface/40 border border-surface-border text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold font-mono">
              <Info className="w-3.5 h-3.5 text-accent" />
              <span>How Predictions Are Derived</span>
            </div>
            <p className="leading-relaxed">
              Base duration is provided by Open Source Routing Machine (OSRM). Predicted duration applies corridor-specific Random Forest speed and congestion multipliers trained on 952 historical dates.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <RouteComparison routes={routes} />
          <TrafficMap
            roads={roads}
            predictions={predictions}
            activeRoute={selectedRoute}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
}
