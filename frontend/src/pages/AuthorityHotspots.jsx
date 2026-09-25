import React, { useState, useEffect } from 'react';
import { AlertTriangle, Filter, Layers, Info } from 'lucide-react';
import { predictionService } from '../services/predictionService';
import { trafficService } from '../services/trafficService';
import HotspotList from '../components/HotspotList';
import HotspotDetail from '../components/HotspotDetail';
import TrafficMap from '../components/TrafficMap';

export default function AuthorityHotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [roads, setRoads] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    Promise.all([
      predictionService.getHotspots(16),
      trafficService.getAllRoads(),
      predictionService.getAllPredictions(),
    ]).then(([allHotspots, allRoads, allPreds]) => {
      setHotspots(allHotspots);
      if (allHotspots.length > 0) {
        setSelectedHotspot(allHotspots[0]);
      }
      setRoads(allRoads);

      const map = {};
      allPreds.forEach((p) => {
        map[p.road] = p;
      });
      setPredictions(map);
    });
  }, []);

  const filteredHotspots = hotspots.filter((h) => {
    if (filterCategory === 'ALL') return true;
    return h.congestionCategory === filterCategory;
  });

  const handleSelectFromMap = (road) => {
    const spot = hotspots.find((h) => h.road === road.name);
    if (spot) {
      setSelectedHotspot(spot);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-xs font-mono text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Decision Support Diagnostics</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Corridor Hotspot Intelligence
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Detailed diagnostic evaluation of Bengaluru's predicted bottlenecks. Click any corridor to review capacity saturation, signal compliance indices, and machine learning feature importances.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-surface-border">
        <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Severity:</span>
        </span>
        {['ALL', 'SEVERE', 'HIGH', 'MODERATE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
              filterCategory === cat
                ? 'bg-accent text-white font-semibold'
                : 'bg-surface text-slate-400 hover:text-white hover:bg-surface-elevated border border-surface-border'
            }`}
          >
            {cat} {cat === 'ALL' ? `(${hotspots.length})` : ''}
          </button>
        ))}
      </div>

      {/* Main Grid: List (4 cols) & Detail + Map (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Ranked Hotspot List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
            <span>Ranked by Predicted Congestion Level</span>
            <span>{filteredHotspots.length} Corridors</span>
          </div>

          <HotspotList
            hotspots={filteredHotspots}
            selectedHotspot={selectedHotspot}
            onSelect={setSelectedHotspot}
          />
        </div>

        {/* Right: Selected Detail & Map */}
        <div className="lg:col-span-7 space-y-6">
          <HotspotDetail hotspot={selectedHotspot} />

          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>Geographical Location in Bengaluru</span>
              <span>Selected Corridor Highlighted</span>
            </div>
            <TrafficMap
              roads={roads}
              predictions={predictions}
              selectedRoad={selectedHotspot ? { name: selectedHotspot.road } : null}
              onSelectRoad={handleSelectFromMap}
              height="380px"
              zoom={11}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
