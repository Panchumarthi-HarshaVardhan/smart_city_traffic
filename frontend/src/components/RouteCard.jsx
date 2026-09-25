import React from 'react';
import { Clock, Navigation, AlertCircle, Check } from 'lucide-react';
import PredictionBadge from './PredictionBadge';

export default function RouteCard({ route, isSelected, onSelect }) {
  const isRecommended = route.tag?.includes('Recommended');

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl p-5 border cursor-pointer transition-all ${
        isSelected
          ? 'bg-surface-elevated border-accent shadow-md shadow-accent/5 ring-1 ring-accent'
          : 'bg-surface/80 border-surface-border hover:border-surface-border/90 hover:bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-white tracking-tight">{route.name}</h4>
          </div>
          {route.tag && (
            <span
              className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded ${
                isRecommended
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'bg-surface-border text-slate-300'
              }`}
            >
              {route.tag}
            </span>
          )}
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
          <span className="text-[10px] text-slate-400 block uppercase">Base OSRM</span>
          <span className="text-sm text-slate-300">{route.baseMinutes} min</span>
        </div>
        <div>
          <span className="text-[10px] text-accent block uppercase font-medium">AI Predicted</span>
          <span className="text-sm font-bold text-accent">{route.predictedMinutes} min</span>
          {route.delayMinutes > 0 && (
            <span className="text-[10px] text-orange-400 block">+{route.delayMinutes}m delay</span>
          )}
        </div>
      </div>

      {/* Rationale & Corridors */}
      <div className="space-y-2 text-xs">
        <p className="text-slate-300 leading-relaxed">
          {route.reason}
        </p>

        {route.corridors && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
            <span className="font-mono text-slate-400">Via:</span>
            {route.corridors.map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-surface-border text-slate-300 font-mono">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          {isSelected ? 'Currently displayed on map' : 'Click to inspect on map'}
        </span>
        <div
          className={`flex items-center gap-1 font-medium ${
            isSelected ? 'text-accent' : 'text-slate-400'
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5" />}
          <span>{isSelected ? 'Active Route' : 'Select'}</span>
        </div>
      </div>
    </div>
  );
}
