import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Fix Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// MapTiler tile configuration
const MAPTILER_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPTILER_API_KEY) || '';

const TILE_ATTRIBUTION = MAPTILER_KEY
  ? '&copy; <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Custom Pin Markers (A = Sky Blue, B = Teal)
const createPinIcon = (color, label) =>
  L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="
        background: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); font-weight: 800; font-size: 13px; font-family: sans-serif;">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const originIcon = createPinIcon('#0284C7', 'A');
const destIcon = createPinIcon('#0D9488', 'B');

const ambulanceIcon = L.divIcon({
  className: 'ambulance-map-marker',
  html: `
    <div style="
      background: #E11D48;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(225, 29, 72, 0.45);
      border: 2px solid white;
      font-size: 18px;
    ">
      🚑
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const hospitalIcon = L.divIcon({
  className: 'hospital-map-marker',
  html: `
    <div style="
      background: #0284C7;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
      border: 2px solid white;
      font-size: 18px;
    ">
      🏥
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

const fireEngineIcon = L.divIcon({
  className: 'fire-engine-map-icon',
  html: `
    <div style="
      background: #DC2626;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
      border: 2.5px solid white;
      font-size: 18px;
    ">
      🚒
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

const fireSceneIcon = L.divIcon({
  className: 'fire-scene-map-icon',
  html: `
    <div style="
      background: #EA580C;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45);
      border: 2px solid white;
      font-size: 18px;
    ">
      🔥
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});


const createHotspotIcon = (category) => {
  const color =
    category === 'SEVERE'
      ? '#EF4444'
      : category === 'HIGH'
      ? '#F97316'
      : category === 'MODERATE'
      ? '#F59E0B'
      : '#10B981';
  return L.divIcon({
    className: 'hotspot-map-pin',
    html: `
      <div style="
        background: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
};

function MapBoundsController({
  origin,
  destination,
  routes,
  center,
  zoom,
  liveSegment,
  ambulanceMarker,
  hospitalMarker,
  focusPosition,
}) {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  const lastFocusRef = useRef(null);
  const lastRouteSigRef = useRef(null);
  const lastSegmentSigRef = useRef(null);

  // 1. Explicit Focus Position (User clicked a hotspot, corridor, or incident)
  useEffect(() => {
    if (focusPosition && focusPosition.lat && focusPosition.lng) {
      const prev = lastFocusRef.current;
      const isNewFocus =
        !prev ||
        Math.abs(prev.lat - focusPosition.lat) > 0.0001 ||
        Math.abs(prev.lng - focusPosition.lng) > 0.0001 ||
        prev.zoom !== (focusPosition.zoom || 14);

      if (isNewFocus) {
        lastFocusRef.current = {
          lat: focusPosition.lat,
          lng: focusPosition.lng,
          zoom: focusPosition.zoom || 14,
        };
        map.flyTo([focusPosition.lat, focusPosition.lng], focusPosition.zoom || 14, {
          duration: 0.6,
        });
      }
    }
  }, [focusPosition, map]);

  // 2. Route & Marker Bounds Changes (Only when route coordinates or endpoints change)
  useEffect(() => {
    // If user has focused on a specific hotspot/corridor, do not stomp on their view
    if (focusPosition && focusPosition.lat && focusPosition.lng) {
      return;
    }

    if (routes && routes.length > 0 && routes[0].coordinates?.length > 0) {
      const firstCoord = routes[0].coordinates[0];
      const lastCoord = routes[0].coordinates[routes[0].coordinates.length - 1];
      const routeSig = `${firstCoord?.[0]}-${firstCoord?.[1]}-${lastCoord?.[0]}-${lastCoord?.[1]}-${routes[0].coordinates.length}`;

      if (routeSig !== lastRouteSigRef.current) {
        lastRouteSigRef.current = routeSig;
        const bounds = L.latLngBounds(routes[0].coordinates);
        if (origin?.latitude) bounds.extend([origin.latitude, origin.longitude]);
        if (destination?.latitude) bounds.extend([destination.latitude, destination.longitude]);
        if (ambulanceMarker?.lat) bounds.extend([ambulanceMarker.lat, ambulanceMarker.lng]);
        if (hospitalMarker?.lat) bounds.extend([hospitalMarker.lat, hospitalMarker.lng]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } else if (liveSegment && liveSegment.length > 0) {
      const segSig = `${liveSegment[0]?.[0]}-${liveSegment[0]?.[1]}-${liveSegment.length}`;
      if (segSig !== lastSegmentSigRef.current) {
        lastSegmentSigRef.current = segSig;
        const bounds = L.latLngBounds(liveSegment);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else if (origin?.latitude && destination?.latitude) {
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else if (ambulanceMarker?.lat && hospitalMarker?.lat) {
      const bounds = L.latLngBounds([
        [ambulanceMarker.lat, ambulanceMarker.lng],
        [hospitalMarker.lat, hospitalMarker.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [origin, destination, routes, liveSegment, ambulanceMarker, hospitalMarker, focusPosition, map]);

  // 3. Initial Map Viewport Setup (Only executed on initial mount)
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (focusPosition && focusPosition.lat && focusPosition.lng) {
        map.setView([focusPosition.lat, focusPosition.lng], focusPosition.zoom || 14);
      } else if (center) {
        map.setView(center, zoom || 11);
      }
    }
  }, [center, zoom, focusPosition, map]);

  return null;
}

// Map Click Listener Component
function MapClickInterceptor({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

export default function IndiaMap({
  origin = null,
  destination = null,
  routes = [],
  selectedRouteIndex = 0,
  onSelectRoute = null,
  corridors = [],
  liveSegment = null,
  liveTraffic = null,
  incidents = [],
  pinSelectionMode = null, // 'origin' | 'destination' | null
  onPinSelect = null, // callback({ type, lat, lng })
  onCancelPinMode = null,
  center = [20.5937, 78.9629], // Geographic center of India
  zoom = 5,
  height = '560px',
  ambulanceMarker = null, // { lat, lng, name, status, details }
  hospitalMarker = null, // { lat, lng, name, address }
  hotspots = [], // [{ road, name, area, coordinates: [lat, lng], congestion_category, predicted_congestion, predicted_speed }]
  onSelectHotspot = null,
  onSelectIncident = null,
  onEmergencyRoute = null,
  focusPosition = null, // { lat, lng, zoom }
  showLegend = false,
  showIncidents = true,
  showHotspots = true,
  showEmergency = true,
  trafficViewMode = 'CURRENT',
}) {
  const { isDark } = useTheme();
  const [clickedLatLng, setClickedLatLng] = useState(null);

  const tileUrl = MAPTILER_KEY
    ? isDark
      ? `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    : isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const activeRoute = routes[selectedRouteIndex] || null;
  const activeRouteColor = activeRoute?.conditionColor || '#0284C7';

  const handleMapClick = (latlng) => {
    if (pinSelectionMode && onPinSelect) {
      // Direct pin assignment in selection mode
      onPinSelect(pinSelectionMode, latlng.lat, latlng.lng);
      setClickedLatLng(null);
    } else {
      // General map click: offer contextual choice
      setClickedLatLng(latlng);
    }
  };

  return (
    <div
      style={{ height }}
      className={`w-full rounded-2xl overflow-hidden border border-surface-border dark:border-slate-800 relative z-0 shadow-soft bg-sky-50 dark:bg-slate-950 ${
        pinSelectionMode ? 'cursor-crosshair ring-2 ring-accent' : ''
      }`}
    >
      {/* Active Pin Selection Mode Banner */}
      {pinSelectionMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 dark:bg-slate-800/95 text-white px-4 py-2 rounded-2xl shadow-xl backdrop-blur-sm flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <MapPin className="w-4 h-4 text-accent animate-bounce" />
          <span>
            Click anywhere on the map to place{' '}
            <strong className="text-accent underline">
              {pinSelectionMode === 'origin' ? 'Starting Point (A)' : 'Destination (B)'}
            </strong>
          </span>
          {onCancelPinMode && (
            <button
              type="button"
              onClick={onCancelPinMode}
              className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-surface-border dark:border-slate-800 rounded-2xl p-3 shadow-lg text-[11px] space-y-2 pointer-events-auto text-slate-800 dark:text-slate-200">
          <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold">Map Legend</span>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Traffic Conditions</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Light / Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Heavy</span>
            </div>
          </div>
          <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Markers</div>
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">⚠️</span>
              <span className="text-slate-700 dark:text-slate-300">Traffic Incident</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-slate-900 shadow-xs shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Congestion Hotspot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">🚑</span>
              <span className="text-slate-700 dark:text-slate-300">Emergency Unit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">🏥</span>
              <span className="text-slate-700 dark:text-slate-300">Hospital</span>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Map Tile Layer with theme support */}
        <TileLayer
          key={isDark ? 'dark-tiles' : 'light-tiles'}
          attribution={TILE_ATTRIBUTION}
          url={tileUrl}
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
        />

        <MapBoundsController
          origin={origin}
          destination={destination}
          routes={routes}
          center={center}
          zoom={zoom}
          liveSegment={liveSegment}
          ambulanceMarker={ambulanceMarker}
          hospitalMarker={hospitalMarker}
          focusPosition={focusPosition}
        />

        <MapClickInterceptor onMapClick={handleMapClick} />

        {/* General Clicked Location Contextual Popup */}
        {clickedLatLng && !pinSelectionMode && (
          <Popup
            position={clickedLatLng}
            onClose={() => setClickedLatLng(null)}
          >
            <div className="p-1 space-y-2 text-xs min-w-[160px]">
              <div className="font-bold text-slate-900">Map Location Selected</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {clickedLatLng.lat.toFixed(4)}, {clickedLatLng.lng.toFixed(4)}
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onPinSelect) onPinSelect('origin', clickedLatLng.lat, clickedLatLng.lng);
                    setClickedLatLng(null);
                  }}
                  className="w-full py-1 px-2.5 rounded-lg bg-accent text-white font-bold text-[11px] hover:bg-accent-hover transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">A</span>
                  <span>Set as Starting Point</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onPinSelect) onPinSelect('destination', clickedLatLng.lat, clickedLatLng.lng);
                    setClickedLatLng(null);
                  }}
                  className="w-full py-1 px-2.5 rounded-lg bg-teal-600 text-white font-bold text-[11px] hover:bg-teal-700 transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">B</span>
                  <span>Set as Destination</span>
                </button>
              </div>
            </div>
          </Popup>
        )}

        {/* Alternative Routes (Secondary subtle polylines) */}
        {showEmergency &&
          routes.map((route, idx) => {
            if (idx === selectedRouteIndex) return null;
            return (
              <Polyline
                key={`alt-route-${idx}`}
                positions={route.coordinates}
                pathOptions={{
                  color: '#64748B',
                  weight: 4,
                  opacity: 0.6,
                  dashArray: '6, 8',
                }}
                eventHandlers={{
                  click: () => onSelectRoute && onSelectRoute(idx),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <div className="font-bold text-slate-900">{route.name}</div>
                    <div className="text-slate-500 mt-0.5">
                      {route.distanceKm} km • {route.formattedDuration}
                    </div>
                    {route.trafficDelayMinutes > 0 && (
                      <div className="text-amber-600 font-semibold mt-0.5">
                        Delay: +{route.trafficDelayMinutes} min ({route.trafficCondition || 'Moderate'})
                      </div>
                    )}
                    <button
                      onClick={() => onSelectRoute && onSelectRoute(idx)}
                      className="mt-2 text-accent font-bold text-xs underline block"
                    >
                      Select this route
                    </button>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

        {/* Selected / Primary Route (Vibrant Sky Blue / Traffic Condition Color) */}
        {showEmergency && activeRoute && activeRoute.coordinates?.length > 0 && (
          <Polyline
            key={`selected-route-${selectedRouteIndex}-${activeRoute.id}`}
            positions={activeRoute.coordinates}
            pathOptions={{
              color: activeRouteColor,
              weight: 6,
              opacity: 0.95,
            }}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {activeRoute.name}
                </div>
                <div className="text-slate-600">
                  Distance: <span className="font-bold text-slate-900">{activeRoute.distanceKm} km</span>
                </div>
                <div className="text-slate-600">
                  ETA: <span className="font-bold text-slate-900">{activeRoute.formattedDuration}</span>
                </div>
                {activeRoute.trafficDelayMinutes !== undefined && (
                  <div className="text-slate-600">
                    Traffic delay:{' '}
                    <span className="font-bold text-slate-900">
                      +{activeRoute.trafficDelayMinutes} min
                    </span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  Status: {activeRoute.trafficCondition || 'Flowing Normally'}
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Live Traffic Flow Segment Overlay (from TomTom where surveyed) */}
        {liveSegment && liveSegment.length > 0 && (
          <Polyline
            positions={liveSegment}
            pathOptions={{
              color: liveTraffic?.condition_color || '#EF4444',
              weight: 8,
              opacity: 0.85,
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <div className="font-bold text-slate-900">Live Traffic Flow (TomTom)</div>
                <div className="text-slate-600 mt-0.5">
                  Current speed: <span className="font-bold text-slate-900">{liveTraffic?.current_speed_kmh} km/h</span>
                </div>
                <div className="text-slate-600">
                  Free-flow speed: <span className="font-bold text-slate-900">{liveTraffic?.free_flow_speed_kmh} km/h</span>
                </div>
                <div className="text-slate-600">
                  Status: <span className="font-bold text-slate-900">{liveTraffic?.traffic_condition}</span>
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Origin Marker (A) */}
        {origin && origin.latitude && origin.longitude && (
          <Marker position={[origin.latitude, origin.longitude]} icon={originIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <span className="text-accent text-[10px] uppercase tracking-wider block font-bold">Starting Point (A)</span>
                <span className="font-bold text-slate-900 block mt-0.5">{origin.displayName}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (B) */}
        {destination && destination.latitude && destination.longitude && (
          <Marker position={[destination.latitude, destination.longitude]} icon={destIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <span className="text-teal-600 text-[10px] uppercase tracking-wider block font-bold">Destination (B)</span>
                <span className="font-bold text-slate-900 block mt-0.5">{destination.displayName}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Traffic Incidents Markers */}
        {showIncidents &&
          incidents.map((inc, idx) => {
            if (!inc.point) return null;
            return (
              <CircleMarker
                key={`incident-${idx}`}
                center={inc.point}
                radius={7}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onSelectIncident && onSelectIncident(inc),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <div className="font-bold text-rose-600 flex items-center gap-1">
                      <span>⚠️ Traffic Incident</span>
                    </div>
                    <div className="text-slate-900 font-semibold">{inc.description || 'Roadway Delay'}</div>
                    {inc.delay_seconds > 0 && (
                      <div className="text-amber-700 font-bold text-[11px]">
                        Delay: ~{Math.round(inc.delay_seconds / 60)} min
                      </div>
                    )}
                    <div className="pt-1 flex flex-col gap-1">
                      {onSelectIncident && (
                        <button
                          type="button"
                          onClick={() => onSelectIncident(inc)}
                          className="text-accent font-bold text-[11px] underline text-left"
                        >
                          View Incident Details
                        </button>
                      )}
                      {onEmergencyRoute && (
                        <button
                          type="button"
                          onClick={() =>
                            onEmergencyRoute({
                              name: inc.description || 'Incident Site',
                              lat: inc.point[0],
                              lng: inc.point[1],
                            })
                          }
                          className="text-rose-600 font-bold text-[11px] underline text-left"
                        >
                          Find Emergency Route
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Congestion Hotspot Markers */}
        {showHotspots &&
          hotspots.map((spot, idx) => {
            const lat = spot.coordinates ? spot.coordinates[0] : spot.latitude;
            const lng = spot.coordinates ? spot.coordinates[1] : spot.longitude;
            if (!lat || !lng) return null;
            const category = spot.congestion_category || spot.congestionCategory || spot.category || 'HIGH';

            return (
              <Marker
                key={`hotspot-${spot.id || idx}`}
                position={[lat, lng]}
                icon={createHotspotIcon(category)}
                eventHandlers={{
                  click: () => onSelectHotspot && onSelectHotspot(spot),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{spot.road || spot.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          category === 'SEVERE'
                            ? 'bg-rose-100 text-rose-700'
                            : category === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {category}
                      </span>
                    </div>
                    {spot.area && <div className="text-slate-500 text-[10px]">{spot.area}</div>}
                    {spot.predicted_congestion !== undefined && (
                      <div className="text-slate-600 text-[11px]">
                        Predicted Congestion: <strong>{spot.predicted_congestion}%</strong>
                      </div>
                    )}
                    <div className="pt-1 flex flex-col gap-1">
                      {onSelectHotspot && (
                        <button
                          type="button"
                          onClick={() => onSelectHotspot(spot)}
                          className="text-accent font-bold text-[11px] underline text-left"
                        >
                          Inspect Corridor Hotspot
                        </button>
                      )}
                      {onEmergencyRoute && (
                        <button
                          type="button"
                          onClick={() =>
                            onEmergencyRoute({
                              name: spot.road || spot.name,
                              lat: lat,
                              lng: lng,
                            })
                          }
                          className="text-rose-600 font-bold text-[11px] underline text-left"
                        >
                          Find Emergency Route
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Emergency Vehicle Marker (Ambulance or Fire Engine) */}
        {showEmergency && ambulanceMarker && ambulanceMarker.lat && ambulanceMarker.lng && (
          <Marker
            position={[ambulanceMarker.lat, ambulanceMarker.lng]}
            icon={
              ambulanceMarker.isFireEngine ||
              (ambulanceMarker.name && ambulanceMarker.name.toLowerCase().includes('fire'))
                ? fireEngineIcon
                : ambulanceIcon
            }
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-rose-600 flex items-center gap-1 text-sm">
                  <span>
                    {ambulanceMarker.isFireEngine ||
                    (ambulanceMarker.name && ambulanceMarker.name.toLowerCase().includes('fire'))
                      ? '🚒 '
                      : '🚑 '}
                    {ambulanceMarker.name || 'Emergency Unit'}
                  </span>
                </div>
                <div className="text-slate-700 font-medium">
                  Status: <span className="font-bold text-slate-900">{ambulanceMarker.status || 'Active Dispatch'}</span>
                </div>
                {ambulanceMarker.details && (
                  <div className="text-slate-500 text-[11px]">{ambulanceMarker.details}</div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (Hospital or Fire Scene) */}
        {showEmergency && hospitalMarker && hospitalMarker.lat && hospitalMarker.lng && (
          <Marker
            position={[hospitalMarker.lat, hospitalMarker.lng]}
            icon={hospitalMarker.isFireScene ? fireSceneIcon : hospitalIcon}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-sky-700 flex items-center gap-1 text-sm">
                  <span>{hospitalMarker.isFireScene ? '🔥 ' : '🏥 '} {hospitalMarker.name || 'Destination'}</span>
                </div>
                {hospitalMarker.address && (
                  <div className="text-slate-600 text-[11px]">{hospitalMarker.address}</div>
                )}
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  {hospitalMarker.isFireScene ? 'Emergency Incident Scene' : 'Emergency Receiving Center'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
