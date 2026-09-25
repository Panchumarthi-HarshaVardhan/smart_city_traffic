import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function TrafficChart({
  data = [],
  dataKey = 'congestion',
  label = 'Congestion Index',
  unit = '',
  color = '#3B82F6',
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
        No telemetry series available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label: xLabel }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-surface border border-surface-border p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-400 mb-1 flex items-center gap-1.5">
            <span>{xLabel}</span>
            {point.isForecast && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-accent/20 text-accent border border-accent/30">
                AI Forecast
              </span>
            )}
          </div>
          <div className="text-white font-bold text-sm">
            {payload[0].value} {unit}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1E293B' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
