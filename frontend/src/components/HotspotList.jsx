import React from 'react';
import PredictionBadge from './PredictionBadge';
import { ChevronRight, AlertTriangle } from 'lucide-react';

export default function HotspotList({ hotspots = [], selectedHotspot = null, onSelect = null }) {
  return (
    <div className="space-y-2">
      {hotspots.map((spot) => {
        const isSelected = selectedHotspot && selectedHotspot.road === spot.road;

        return (
          <div
            key={spot.road}
            onClick={() => onSelect && onSelect(spot)}
            className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
              isSelected
                ? 'bg-surface-elevated border-accent ring-1 ring-accent'
                : 'bg-surface/70 border-surface-border hover:bg-surface hover:border-surface-border/80'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 h-6 rounded-md bg-surface-elevated border border-surface-border flex items-center justify-center font-mono text-xs text-slate-300 font-semibold shrink-0">
                {spot.rank}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                    {spot.road}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-surface-border shrink-0">
                    {spot.area}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                  <span>Speed: {spot.predictedSpeed} km/h</span>
                  <span>•</span>
                  <span>Vol: {spot.predictedTrafficVolume.toLocaleString()} veh</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <PredictionBadge category={spot.congestionCategory} score={spot.predictedCongestion} />
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
