import React, { useState, useEffect } from 'react';
import { MapPin, Activity, Calendar, Gauge, Car, AlertCircle } from 'lucide-react';
import TrafficMap from '../components/TrafficMap';
import PredictionBadge from '../components/PredictionBadge';
import TrafficChart from '../components/TrafficChart';
import { trafficService } from '../services/trafficService';
import { predictionService } from '../services/predictionService';

export default function CitizenTraffic() {
  const [roads, setRoads] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [corridorHistory, setCorridorHistory] = useState([]);
  const [cityOverview, setCityOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      trafficService.getAllRoads(),
      predictionService.getAllPredictions(),
      trafficService.getCityOverview(),
    ]).then(([allRoads, allPreds, overview]) => {
      setRoads(allRoads);
      setCityOverview(overview);

      const map = {};
      allPreds.forEach((p) => {
        map[p.road] = p;
      });
      setPredictions(map);

      // Default selected road
      if (allRoads.length > 0) {
        handleRoadClick(allRoads[0]);
      }
    });
  }, []);

  const handleRoadClick = async (road) => {
    setSelectedRoad(road);
    const history = await trafficService.getCorridorHistory(road.name);
    setCorridorHistory(history);
  };

  const currentPred = selectedRoad ? predictions[selectedRoad.name] || {} : {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono text-accent">
          <MapPin className="w-3.5 h-3.5" />
          <span>Bengaluru Corridor Telemetry</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Arterial Corridor Traffic & Congestion Map
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Interactive geographical view of Bengaluru's 16 arterial road segments. Click any node to inspect predicted congestion levels, historical 7-day volume patterns, and corridor baselines.
        </p>
      </div>

      {/* Main Layout: Map (Left 7 cols) & Selected Corridor Inspection (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Click corridor pin to inspect details</span>
            <span>16 Corridors Monitored</span>
          </div>

          <TrafficMap
            roads={roads}
            predictions={predictions}
            selectedRoad={selectedRoad}
            onSelectRoad={handleRoadClick}
            height="580px"
            zoom={11}
          />
        </div>

        {/* Right: Selected Road Details & Chart */}
        <div className="lg:col-span-5 space-y-6">
          {selectedRoad ? (
            <div className="bg-surface border border-surface-border rounded-2xl p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-surface-border">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    {selectedRoad.area} Urban Zone
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedRoad.name}</h3>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    Length: {selectedRoad.lengthKm} km • Speed limit: {selectedRoad.speedLimit} km/h
                  </span>
                </div>
                <PredictionBadge
                  category={currentPred.congestionCategory || selectedRoad.congestionProfile}
                  score={currentPred.predictedCongestionLevel}
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border">
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Predicted Speed</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {currentPred.predictedAverageSpeed || selectedRoad.baseFreeFlowSpeed}
                  </span>
                  <span className="text-[10px] text-slate-400 block">km/h</span>
                </div>

                <div className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border">
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] uppercase mb-1">
                    <Car className="w-3.5 h-3.5" />
                    <span>Predicted Flow</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {(currentPred.predictedTrafficVolume || selectedRoad.historicalVolumeMean).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">veh / day</span>
                </div>
              </div>

              {/* Historical vs Forecast Chart */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-semibold uppercase text-slate-200">
                    7-Day Congestion Profile vs Forecast
                  </span>
                  <span className="text-[10px] font-mono text-accent">AI Forecast</span>
                </div>
                <TrafficChart
                  data={corridorHistory}
                  dataKey="congestion"
                  label="Congestion"
                  color="#3B82F6"
                />
              </div>

              {/* Factors */}
              {currentPred.topFactors && (
                <div className="pt-2 border-t border-surface-border">
                  <span className="text-xs font-mono uppercase text-slate-400 block mb-2 font-medium">
                    Primary Predictive Indicators:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {currentPred.topFactors.map((f, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 p-2 rounded bg-surface-elevated/30">
                        <span className="text-slate-300">{f.name}</span>
                        <span className="font-mono text-accent text-[11px] shrink-0">{f.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-surface rounded-2xl border border-surface-border">
              Select a corridor on the map to view data.
            </div>
          )}

          {/* Quick list of all 16 roads */}
          <div className="p-4 rounded-xl bg-surface/40 border border-surface-border space-y-2">
            <span className="text-xs font-mono uppercase text-slate-400 block font-medium">
              Quick Corridor Selector:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {roads.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoadClick(r)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    selectedRoad && selectedRoad.name === r.name
                      ? 'bg-accent text-white font-medium'
                      : 'bg-surface-elevated text-slate-300 hover:bg-surface-border'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
