import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, MapPin, ArrowRight, Clock, Navigation, AlertCircle } from 'lucide-react';
import { BENGALURU_AREAS } from '../data/roads';
import { routeService } from '../services/routeService';
import { trafficService } from '../services/trafficService';
import { predictionService } from '../services/predictionService';
import RouteCard from '../components/RouteCard';
import RouteComparison from '../components/RouteComparison';
import TrafficMap from '../components/TrafficMap';

export default function CitizenPortal() {
  const [fromArea, setFromArea] = useState('Electronic City');
  const [toArea, setToArea] = useState('Hebbal');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [roads, setRoads] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load road nodes & predictions for the map
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

    // Initial search
    handleSearch('Electronic City', 'Hebbal');
  }, []);

  const handleSearch = async (from = fromArea, to = toArea) => {
    if (from === to) return;
    setLoading(true);
    const results = await routeService.findRoutes(from, to);
    setRoutes(results);
    setSelectedRoute(results[0] || null);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-accent">
          <Compass className="w-3.5 h-3.5" />
          <span>Citizen Route Navigation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Plan your journey with predicted traffic intelligence.
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          CITYFLOW AI evaluates corridor congestion trends to forecast travel delays, recommending routes based on predicted congestion rather than static free-flow assumptions.
        </p>
      </div>

      {/* Query Bar */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400 font-medium">Origin (From)</label>
            <div className="relative">
              <select
                value={fromArea}
                onChange={(e) => setFromArea(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent font-medium appearance-none"
              >
                {BENGALURU_AREAS.map((area) => (
                  <option key={area} value={area} disabled={area === toArea}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-mono uppercase text-slate-400 font-medium">Destination (To)</label>
            <div className="relative">
              <select
                value={toArea}
                onChange={(e) => setToArea(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-accent font-medium appearance-none"
              >
                {BENGALURU_AREAS.map((area) => (
                  <option key={area} value={area} disabled={area === fromArea}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={() => handleSearch(fromArea, toArea)}
              disabled={loading || fromArea === toArea}
              className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-accent/20 disabled:opacity-50"
            >
              {loading ? <span>Analyzing...</span> : <span>Find Routes</span>}
            </button>
          </div>
        </div>

        {/* Quick query presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-400">
          <span className="font-mono text-slate-400">Popular Commutes:</span>
          {[
            ['Electronic City', 'Hebbal'],
            ['Koramangala', 'Whitefield'],
            ['Indiranagar', 'Yeshwanthpur'],
            ['Jayanagar', 'M.G. Road'],
          ].map(([f, t], idx) => (
            <button
              key={idx}
              onClick={() => {
                setFromArea(f);
                setToArea(t);
                handleSearch(f, t);
              }}
              className="px-2.5 py-1 rounded-md bg-surface-elevated hover:bg-surface-border text-slate-300 font-mono text-[11px] transition-colors"
            >
              {f} → {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Routes List & Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Route Alternatives */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Route Alternatives ({routes.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Sorted by Predicted Delay</span>
          </div>

          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute && selectedRoute.id === route.id}
              onSelect={() => setSelectedRoute(route)}
            />
          ))}

          {/* Quick links to deeper explorer */}
          <div className="p-4 rounded-xl bg-surface/50 border border-surface-border text-xs flex items-center justify-between text-slate-400">
            <span>Want to inspect all 16 city corridors?</span>
            <Link to="/citizen/traffic" className="text-accent hover:underline flex items-center gap-1 font-medium">
              <span>View Traffic Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Map & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <RouteComparison routes={routes} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {selectedRoute ? `Route Visualization: ${selectedRoute.name}` : 'Corridor Overview'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">Live OSRM Geometry + AI Forecast Overlay</span>
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
    </div>
  );
}
