import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PredictionBadge from './PredictionBadge';

// Helper to get color code
const getMarkerColor = (category) => {
  switch (category?.toUpperCase()) {
    case 'LOW':
      return '#10B981';
    case 'MODERATE':
      return '#F59E0B';
    case 'HIGH':
      return '#F97316';
    case 'SEVERE':
      return '#EF4444';
    default:
      return '#3B82F6';
  }
};

export default function TrafficMap({
  roads = [],
  predictions = {},
  selectedRoad = null,
  onSelectRoad = null,
  activeRoute = null,
  height = '500px',
  center = [12.9716, 77.5946], // Bengaluru center
  zoom = 12,
}) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-surface-border relative z-0"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Minimal Dark Tiles (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Active Route Polyline if present */}
        {activeRoute && activeRoute.coordinates && (
          <Polyline
            positions={activeRoute.coordinates}
            color={activeRoute.color || '#3B82F6'}
            weight={5}
            opacity={0.85}
            dashArray={activeRoute.isEmergencyOptimized ? undefined : undefined}
          />
        )}

        {/* Road Telemetry Markers */}
        {roads.map((road) => {
          const pred = predictions[road.name] || {};
          const category = pred.congestionCategory || road.congestionProfile || 'MODERATE';
          const score = pred.predictedCongestionLevel;
          const isSelected = selectedRoad && selectedRoad.name === road.name;
          const color = getMarkerColor(category);

          return (
            <CircleMarker
              key={road.id}
              center={road.coordinates}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? '#FFFFFF' : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : 0.75,
                weight: isSelected ? 2.5 : 1.5,
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectRoad) onSelectRoad(road);
                },
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    {road.area}
                  </div>
                  <div className="text-sm font-semibold text-white mb-2">
                    {road.name}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">AI Congestion:</span>
                    <PredictionBadge category={category} score={score} size="small" />
                  </div>
                  {pred.predictedAverageSpeed && (
                    <div className="flex items-center justify-between text-xs text-slate-300 py-0.5 border-t border-surface-border">
                      <span className="text-slate-400">Predicted Speed:</span>
                      <span className="font-mono">{pred.predictedAverageSpeed} km/h</span>
                    </div>
                  )}
                  {pred.predictedTrafficVolume && (
                    <div className="flex items-center justify-between text-xs text-slate-300 py-0.5">
                      <span className="text-slate-400">Predicted Volume:</span>
                      <span className="font-mono">{pred.predictedTrafficVolume.toLocaleString()} veh</span>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] font-mono text-accent">
                    Click to view detailed diagnostics
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-md border border-surface-border rounded-lg p-2.5 z-[1000] text-[11px] font-mono shadow-lg">
        <div className="text-slate-400 mb-1.5 font-semibold text-[10px] uppercase tracking-wider">AI Forecast Severity</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Low (&lt;40)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-300">Moderate (40–70)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-slate-300">High (70–90)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300">Severe (≥90)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
