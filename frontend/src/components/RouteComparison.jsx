import React from 'react';
import { Clock, TrendingDown, ArrowRight } from 'lucide-react';

export default function RouteComparison({ routes = [] }) {
  if (!routes || routes.length < 2) return null;

  const fastest = [...routes].sort((a, b) => a.predictedMinutes - b.predictedMinutes)[0];
  const slowest = [...routes].sort((a, b) => b.predictedMinutes - a.predictedMinutes)[0];
  const savedMinutes = slowest.predictedMinutes - fastest.predictedMinutes;

  return (
    <div className="bg-surface/90 border border-surface-border rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block mb-0.5">
            AI Corridor Intelligence
          </span>
          <h3 className="text-base font-semibold text-white">Route Efficiency Differential</h3>
        </div>

        {savedMinutes > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Estimated {savedMinutes} min saved vs congested corridors</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
        {routes.map((route, i) => (
          <div
            key={route.id || i}
            className="p-3.5 rounded-lg bg-surface-elevated/50 border border-surface-border/60 text-xs font-mono"
          >
            <div className="text-slate-400 truncate mb-1">{route.name}</div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-bold text-white">{route.predictedMinutes} min</span>
              <span className="text-slate-400">{route.distanceKm} km</span>
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-2">
              {route.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
