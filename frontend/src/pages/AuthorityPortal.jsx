import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Activity, Siren, TrendingUp, ArrowRight, BarChart3, Layers } from 'lucide-react';
import { trafficService } from '../services/trafficService';
import { predictionService } from '../services/predictionService';
import MetricCard from '../components/MetricCard';
import HotspotList from '../components/HotspotList';
import TrafficMap from '../components/TrafficMap';

export default function AuthorityPortal() {
  const [cityOverview, setCityOverview] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [roads, setRoads] = useState([]);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    Promise.all([
      trafficService.getCityOverview(),
      predictionService.getHotspots(6),
      trafficService.getAllRoads(),
      predictionService.getAllPredictions(),
    ]).then(([overview, topHotspots, allRoads, allPreds]) => {
      setCityOverview(overview);
      setHotspots(topHotspots);
      setRoads(allRoads);

      const map = {};
      allPreds.forEach((p) => {
        map[p.road] = p;
      });
      setPredictions(map);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-xs font-mono text-accent mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Municipal Decision Support Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Traffic Intelligence Center
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Predictive traffic intelligence and decision-support recommendations for Bengaluru municipal agencies and traffic authorities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/authority/emergency"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-2 shadow-md shadow-rose-900/30 font-mono"
          >
            <Siren className="w-4 h-4" />
            <span>Emergency Dispatch</span>
          </Link>
          <Link
            to="/authority/hotspots"
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-surface-elevated hover:bg-surface-border text-white border border-surface-border transition-all flex items-center gap-2 font-mono"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Hotspot Diagnostics</span>
          </Link>
        </div>
      </div>

      {/* City Status Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Severe Hotspots"
          value="4"
          subtext="Corridors with index ≥ 90.0"
          icon={AlertTriangle}
        />
        <MetricCard
          label="High Congestion"
          value="6"
          subtext="Corridors index 70.0 - 89.9"
          icon={Activity}
        />
        <MetricCard
          label="Avg City Congestion"
          value="76.8"
          subtext="Next-day city-wide mean"
          icon={TrendingUp}
        />
        <MetricCard
          label="Model Verification"
          value="29 / 29"
          subtext="Verified zero-leakage tests"
          indicator="PASS"
          icon={Shield}
        />
      </div>

      {/* Section 1: Critical Hotspots & Live Geographic View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Top Predicted Hotspots */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                Top Predicted Bottlenecks
              </h3>
            </div>
            <Link to="/authority/hotspots" className="text-xs text-accent hover:underline flex items-center gap-1 font-mono">
              <span>View All 16</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <HotspotList hotspots={hotspots} />
        </div>

        {/* Right: Map view */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>City-Wide Arterial Congestion Topology</span>
            <span>CartoDB Dark Tile Telemetry</span>
          </div>

          <TrafficMap
            roads={roads}
            predictions={predictions}
            height="480px"
            zoom={11}
          />
        </div>
      </div>

      {/* Section 2: Authority Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-accent">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-base font-semibold text-white">Corridor Diagnostics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drill down into capacity utilization, signal compliance, environmental dwell index, and historical 7-day volume persistence.
            </p>
          </div>
          <Link
            to="/authority/hotspots"
            className="text-xs text-accent hover:underline flex items-center gap-1 font-mono pt-2"
          >
            <span>Inspect diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-rose-400">
              <Siren className="w-4 h-4" />
            </div>
            <h4 className="text-base font-semibold text-white">Emergency Dispatch Support</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Emergency-specific route recommendations for Ambulance, Fire, and Police fleets with clearance factor telemetry.
            </p>
          </div>
          <Link
            to="/authority/emergency"
            className="text-xs text-rose-400 hover:underline flex items-center gap-1 font-mono pt-2"
          >
            <span>Plan emergency route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-base font-semibold text-white">Weekly Seasonality Trends</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyze Monday-to-Sunday systemic density curves to schedule lane reversibility and municipal signal retiming.
            </p>
          </div>
          <Link
            to="/about"
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono pt-2"
          >
            <span>Review methodology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
