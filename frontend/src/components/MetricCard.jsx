import React from 'react';

export default function MetricCard({ label, value, subtext, indicator, icon: Icon }) {
  return (
    <div className="bg-surface/70 border border-surface-border rounded-xl p-5 hover:border-surface-border/80 transition-all hover:bg-surface/90">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 font-mono tracking-wider uppercase">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-mono">
          {value}
        </span>
        {indicator && (
          <span className="text-xs font-mono text-emerald-400 font-medium">
            {indicator}
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-slate-400 leading-normal">
          {subtext}
        </p>
      )}
    </div>
  );
}
