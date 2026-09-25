import React from 'react';
import PredictionBadge from './PredictionBadge';
import { Siren, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function EmergencyRouteCard({ route, isSelected, onSelect, emergencyType = 'Ambulance' }) {
  const isOptimized = route.isEmergencyOptimized;

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl p-5 border cursor-pointer transition-all ${
        isSelected
          ? 'bg-surface-elevated border-rose-500/80 ring-1 ring-rose-500/50 shadow-lg shadow-rose-500/5'
          : 'bg-surface/80 border-surface-border hover:bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-white tracking-tight">{route.name}</h4>
          </div>
          <span
            className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded ${
              isOptimized
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-surface-border text-slate-300'
            }`}
          >
            {isOptimized ? `Recommended for ${emergencyType}` : 'Secondary Fallback'}
          </span>
        </div>
        <PredictionBadge category={route.congestionCategory} score={route.predictedCongestion} />
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 my-4 py-3 px-3 rounded-lg bg-background/60 border border-surface-border/50 text-center font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase">Distance</span>
          <span className="text-sm font-semibold text-white">{route.distanceKm} km</span>
        </div>
        <div className="border-x border-surface-border/50">
          <span className="text-[10px] text-slate-400 block uppercase">Base Transit</span>
          <span className="text-sm text-slate-300">{route.baseMinutes} min</span>
        </div>
        <div>
          <span className="text-[10px] text-rose-400 block uppercase font-medium">AI Predicted</span>
          <span className="text-sm font-bold text-rose-400">{route.predictedMinutes} min</span>
        </div>
      </div>

      {/* Decision Support Recommendation */}
      <div className="space-y-2 text-xs">
        <div className="p-3 rounded-lg bg-surface-border/40 border border-surface-border/70 text-slate-200">
          <span className="text-[11px] font-mono text-slate-400 block mb-1 uppercase font-semibold">
            Decision-Support Analysis:
          </span>
          <p className="leading-relaxed">
            {route.dispatchRecommendation}
          </p>
        </div>

        {route.emergencyClearanceFactor && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
            <span className="text-slate-400">Clearance Factor:</span>
            <span className="text-slate-200">{route.emergencyClearanceFactor}</span>
          </div>
        )}
      </div>

      {/* Corridors Traversed */}
      {route.corridors && (
        <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-surface-border/40 text-[11px] text-slate-400">
          <span className="font-mono text-slate-400">Traversing:</span>
          {route.corridors.map((c, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-surface-border text-slate-300 font-mono">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
