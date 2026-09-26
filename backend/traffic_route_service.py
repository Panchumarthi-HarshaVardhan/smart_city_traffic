"""
CITYFLOW AI - Traffic-Aware Routing Service (Google Routes API Integration)

Queries the Google Routes API with routingPreference=TRAFFIC_AWARE to compute
traffic-aware routes, ETAs, delays against free-flow conditions, and decoded polylines.
"""

import os
import re
import logging
from typing import Optional, Dict, Any, List
import requests
from dotenv import load_dotenv

logger = logging.getLogger("cityflow.google_routes")

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def decode_polyline(encoded: str) -> List[List[float]]:
    """
    Decodes a Google encoded polyline string into [[lat, lng], [lat, lng], ...]
    coordinates suitable for Leaflet / React-Leaflet.
    """
    if not encoded:
        return []

    coordinates = []
    index = 0
    lat = 0
    lng = 0
    length = len(encoded)

    while index < length:
        # Decode Latitude
        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += delta_lat

        # Decode Longitude
        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        delta_lng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += delta_lng

        coordinates.append([round(lat * 1e-5, 6), round(lng * 1e-5, 6)])

    return coordinates


def format_duration(total_minutes: float) -> str:
    """Format minutes into human-friendly string (e.g. '34 min' or '1 hr 12 min')."""
    if not total_minutes or total_minutes <= 0:
        return "1 min"
    mins = int(round(total_minutes))
    if mins < 60:
        return f"{mins} min"
    hrs = mins // 60
    rem = mins % 60
    return f"{hrs} hr {rem} min" if rem > 0 else f"{hrs} hr"


def parse_duration_seconds(duration_str: Any) -> int:
    """Parse '2336s' or seconds integer into int."""
    if isinstance(duration_str, (int, float)):
        return int(duration_str)
    if isinstance(duration_str, str):
        cleaned = re.sub(r"[^\d]", "", duration_str)
        if cleaned:
            return int(cleaned)
    return 0


def check_google_routes_health() -> Dict[str, Any]:
    """Check if Google Routes API key is configured and can compute a lightweight route."""
    if not GOOGLE_MAPS_API_KEY:
        return {
            "status": "unconfigured",
            "provider": "Google Routes API",
            "available": False,
            "message": "Google Maps API key not configured.",
        }
    try:
        url = "https://routes.googleapis.com/directions/v2:computeRoutes"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "routes.distanceMeters",
        }
        body = {
            "origin": {"location": {"latLng": {"latitude": 12.9716, "longitude": 77.5946}}},
            "destination": {"location": {"latLng": {"latitude": 12.9348, "longitude": 77.6271}}},
            "travelMode": "DRIVE",
        }
        res = requests.post(url, headers=headers, json=body, timeout=5)
        if res.status_code == 200:
            return {
                "status": "connected",
                "provider": "Google Routes API",
                "available": True,
            }
        else:
            return {
                "status": "degraded",
                "provider": "Google Routes API",
                "available": False,
                "code": res.status_code,
            }
    except Exception as exc:
        logger.warning("Google Routes health check failed: %s", exc)
        return {
            "status": "error",
            "provider": "Google Routes API",
            "available": False,
            "error": "Unable to communicate with Google Routes API",
        }


def compute_traffic_aware_routes(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> Dict[str, Any]:
    """
    Compute traffic-aware routes between origin and destination using Google Routes API.
    Returns structured routes with real-time ETA, free-flow comparison, traffic delay,
    and decoded polylines.
    """
    if not GOOGLE_MAPS_API_KEY:
        return {
            "available": False,
            "provider": "Google Routes",
            "error": "Traffic-aware routing is temporarily unavailable (unconfigured key).",
            "routes": [],
        }

    try:
        url = "https://routes.googleapis.com/directions/v2:computeRoutes"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": (
                "routes.duration,routes.staticDuration,routes.distanceMeters,"
                "routes.polyline.encodedPolyline,routes.description,routes.warnings"
            ),
        }
        body = {
            "origin": {
                "location": {
                    "latLng": {"latitude": float(origin_lat), "longitude": float(origin_lng)}
                }
            },
            "destination": {
                "location": {
                    "latLng": {"latitude": float(dest_lat), "longitude": float(dest_lng)}
                }
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": True,
        }

        res = requests.post(url, headers=headers, json=body, timeout=9)
        if res.status_code != 200:
            logger.warning("Google Routes API failed with %d: %s", res.status_code, res.text[:200])
            return {
                "available": False,
                "provider": "Google Routes",
                "error": "Traffic-aware routing is temporarily unavailable.",
                "routes": [],
            }

        data = res.json()
        raw_routes = data.get("routes", [])
        if not raw_routes:
            return {
                "available": False,
                "provider": "Google Routes",
                "error": "No driving route found between these locations.",
                "routes": [],
            }

        formatted_routes = []
        for idx, r in enumerate(raw_routes):
            duration_sec = parse_duration_seconds(r.get("duration", 0))
            static_duration_sec = parse_duration_seconds(r.get("staticDuration", duration_sec))
            distance_meters = r.get("distanceMeters", 0)

            duration_min = round(duration_sec / 60)
            static_duration_min = round(static_duration_sec / 60)
            traffic_delay_sec = max(0, duration_sec - static_duration_sec)
            traffic_delay_min = max(0, round(traffic_delay_sec / 60))
            distance_km = round(distance_meters / 1000, 1)

            # CITYFLOW UI Traffic Impact Classification
            # Derived deterministically from delay ratio (delay / staticDuration):
            # - <= 5% (0.05): Normal Traffic Impact (free flow or minor fluctuations)
            # - > 5% and <= 15%: Moderate Traffic Impact
            # - > 15%: High Traffic Impact
            delay_ratio = (traffic_delay_sec / static_duration_sec) if static_duration_sec > 0 else 0.0

            if delay_ratio <= 0.05:
                traffic_impact = "Normal"
                traffic_condition = "Normal Traffic Impact"
                condition_color = "#10B981"
            elif delay_ratio <= 0.15:
                traffic_impact = "Moderate"
                traffic_condition = "Moderate Traffic Impact"
                condition_color = "#F59E0B"
            else:
                traffic_impact = "High"
                traffic_condition = "High Traffic Impact"
                condition_color = "#EF4444"

            # Decode encoded polyline to [[lat, lon], ...]
            encoded = r.get("polyline", {}).get("encodedPolyline", "")
            coordinates = decode_polyline(encoded)
            description = r.get("description", "")

            formatted_routes.append({
                "id": f"google-route-{idx + 1}",
                "name": description or f"Route {idx + 1}",
                "description": description,
                "distanceMeters": distance_meters,
                "distanceKm": distance_km,
                "durationSeconds": duration_sec,
                "durationMinutes": duration_min,
                "staticDurationSeconds": static_duration_sec,
                "staticDurationMinutes": static_duration_min,
                "formattedDuration": format_duration(duration_min),
                "trafficDelaySeconds": traffic_delay_sec,
                "trafficDelayMinutes": traffic_delay_min,
                "trafficImpactRatio": round(delay_ratio, 4),
                "trafficImpact": traffic_impact,
                "trafficCondition": traffic_condition,
                "conditionColor": condition_color,
                "coordinates": coordinates,
                "source": "Google Routes (Traffic-Aware)",
                "isTrafficAware": True,
                "warnings": r.get("warnings", []),
            })

        # Canonical Route Recommendation Ordering:
        # 1. Traffic-aware duration ASC (lowest ETA is primary criterion)
        # 2. Traffic delay ASC (tie breaker)
        # 3. Distance ASC (tie breaker)
        formatted_routes.sort(key=lambda x: (
            x["durationSeconds"],
            x["trafficDelaySeconds"],
            x["distanceMeters"]
        ))

        # Assign recommendation flags and clean display labels
        for idx, route in enumerate(formatted_routes):
            is_rec = (idx == 0)
            route["isPrimary"] = is_rec
            route["recommendationRank"] = idx + 1
            route["roleLabel"] = "Recommended Route" if is_rec else f"Alternative Route {idx}"
            if not route["name"] or route["name"].startswith("Route"):
                route["name"] = route["roleLabel"]

        return {
            "available": True,
            "provider": "Google Routes",
            "routingPreference": "TRAFFIC_AWARE",
            "count": len(formatted_routes),
            "routes": formatted_routes,
        }

    except Exception as exc:
        logger.error("Error computing Google Routes: %s", exc)
        return {
            "available": False,
            "provider": "Google Routes",
            "error": "Traffic-aware routing is temporarily unavailable.",
            "routes": [],
        }
