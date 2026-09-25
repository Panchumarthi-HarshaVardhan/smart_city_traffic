import React from 'react';

export default function PredictionBadge({ category, score, size = 'default' }) {
  const getBadgeStyle = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'SEVERE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const isSmall = size === 'small';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${getBadgeStyle(
        category
      )} ${isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{category}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-70">({typeof score === 'number' ? score.toFixed(1) : score})</span>
      )}
    </span>
  );
}
