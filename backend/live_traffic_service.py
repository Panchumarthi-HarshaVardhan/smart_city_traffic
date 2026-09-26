"""
CITYFLOW AI - Live Traffic Service (TomTom Integration)

Fetches current road speeds, free-flow speeds, travel times, and traffic incidents
from the TomTom Traffic API without exposing API keys to the frontend.
"""

import os
import math
import logging
from typing import Optional, Dict, Any, List
import requests
from dotenv import load_dotenv

logger = logging.getLogger("cityflow.live_traffic")

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

BENGALURU_CORRIDORS = [
    {"name": "Sarjapur Road", "lat": 12.9242, "lng": 77.6543},
    {"name": "Sony World Junction", "lat": 12.9348, "lng": 77.6271},
    {"name": "Anil Kumble Circle", "lat": 12.9756, "lng": 77.6067},
    {"name": "Trinity Circle", "lat": 12.9729, "lng": 77.6199},
    {"name": "Corporation Circle", "lat": 12.9669, "lng": 77.5873},
    {"name": "M.G. Road", "lat": 12.9740, "lng": 77.6094},
    {"name": "Hosur Road", "lat": 12.9166, "lng": 77.6231},
    {"name": "Silk Board Junction", "lat": 12.9176, "lng": 77.6238},
    {"name": "Brigade Road", "lat": 12.9719, "lng": 77.6070},
    {"name": "Richmond Road", "lat": 12.9663, "lng": 77.6033},
    {"name": "Indiranagar 100 Feet Road", "lat": 12.9719, "lng": 77.6412},
    {"name": "Old Airport Road", "lat": 12.9592, "lng": 77.6560},
    {"name": "Outer Ring Road", "lat": 12.9260, "lng": 77.6762},
    {"name": "Marathahalli Bridge", "lat": 12.9591, "lng": 77.6974},
    {"name": "Whitefield Main Road", "lat": 12.9698, "lng": 77.7499},
    {"name": "Electronic City Flyover", "lat": 12.8452, "lng": 77.6602},
]


def _find_nearest_corridor(lat: float, lng: float, max_dist_km: float = 3.5) -> Optional[str]:
    best_corridor = None
    best_dist = float("inf")
    for c in BENGALURU_CORRIDORS:
        d_lat = (lat - c["lat"]) * 111.0
        d_lng = (lng - c["lng"]) * 111.0 * math.cos(math.radians(lat))
        dist = math.hypot(d_lat, d_lng)
        if dist < best_dist and dist <= max_dist_km:
            best_dist = dist
            best_corridor = c["name"]
    return best_corridor


def check_tomtom_health() -> Dict[str, Any]:
    """Check if TomTom API key is present and service is reachable."""
    if not TOMTOM_API_KEY:
        return {
            "status": "unconfigured",
            "provider": "TomTom",
            "available": False,
            "message": "TomTom API key not configured.",
        }
    try:
        # Probe flow segment for Bengaluru center
        test_url = (
            f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
            f"?point=12.9716,77.5946&key={TOMTOM_API_KEY}"
        )
        res = requests.get(test_url, timeout=5)
        if res.status_code == 200:
            return {
                "status": "connected",
                "provider": "TomTom Traffic API",
                "available": True,
            }
        else:
            return {
                "status": "degraded",
                "provider": "TomTom Traffic API",
                "available": False,
                "code": res.status_code,
            }
    except Exception as exc:
        logger.warning("TomTom health check probe failed: %s", exc)
        return {
            "status": "error",
            "provider": "TomTom Traffic API",
            "available": False,
            "error": "Unable to communicate with TomTom API",
        }


def get_live_traffic_flow(lat: float, lng: float, zoom: int = 10) -> Dict[str, Any]:
    """
    Query TomTom Flow Segment Data v4 for a coordinate point.
    Returns current speed, free-flow speed, congestion ratio, condition, and road geometry.
    """
    if not TOMTOM_API_KEY:
        return {
            "available": False,
            "source": "TomTom",
            "message": "Live traffic is temporarily unavailable (unconfigured key).",
        }

    try:
        url = (
            f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/{zoom}/json"
            f"?point={lat},{lng}&unit=KMPH&key={TOMTOM_API_KEY}"
        )
        res = requests.get(url, timeout=6)
        if res.status_code != 200:
            logger.warning("TomTom flow failed with status %d: %s", res.status_code, res.text[:150])
            return {
                "available": False,
                "source": "TomTom",
                "message": "Live traffic is temporarily unavailable.",
            }

        data = res.json()
        flow = data.get("flowSegmentData", {})
        if not flow:
            return {
                "available": False,
                "source": "TomTom",
                "message": "No live traffic data for this segment.",
            }

        current_speed = flow.get("currentSpeed", 0)
        free_flow_speed = flow.get("freeFlowSpeed", 0)
        current_travel_time = flow.get("currentTravelTime", 0)
        free_flow_travel_time = flow.get("freeFlowTravelTime", 0)
        confidence = flow.get("confidence", 1.0)
        road_closure = flow.get("roadClosure", False)

        # Categorize live traffic condition based on speed ratio
        if road_closure:
            condition = "Closed"
            condition_color = "#EF4444"
            congestion_level = "Severe"
        elif free_flow_speed > 0:
            ratio = current_speed / free_flow_speed
            if ratio < 0.4:
                condition = "Heavy Traffic"
                condition_color = "#EF4444"
                congestion_level = "Heavy"
            elif ratio < 0.75:
                condition = "Moderate Traffic"
                condition_color = "#F59E0B"
                congestion_level = "Moderate"
            else:
                condition = "Flowing Normally"
                condition_color = "#10B981"
                congestion_level = "Light"
        else:
            condition = "Unknown"
            condition_color = "#64748B"
            congestion_level = "Moderate"

        # Delay in seconds
        delay_seconds = max(0, current_travel_time - free_flow_travel_time)

        # Extract coordinates if provided
        raw_coords = flow.get("coordinates", {}).get("coordinate", [])
        segment_coords = [[c["latitude"], c["longitude"]] for c in raw_coords if "latitude" in c and "longitude" in c]

        return {
            "available": True,
            "source": "TomTom Traffic",
            "current_speed_kmh": round(current_speed, 1),
            "free_flow_speed_kmh": round(free_flow_speed, 1),
            "current_travel_time_sec": current_travel_time,
            "free_flow_travel_time_sec": free_flow_travel_time,
            "delay_seconds": delay_seconds,
            "delay_minutes": round(delay_seconds / 60, 1),
            "traffic_condition": condition,
            "congestion_level": congestion_level,
            "condition_color": condition_color,
            "road_closure": road_closure,
            "confidence": confidence,
            "segment_coordinates": segment_coords,
            "timestamp": "Just now",
        }

    except Exception as exc:
        logger.error("Error retrieving TomTom traffic flow: %s", exc)
        return {
            "available": False,
            "source": "TomTom",
            "message": "Live traffic is temporarily unavailable.",
        }


def get_traffic_incidents(
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
) -> Dict[str, Any]:
    """
    Query TomTom Incident Details v5 within a geographic bounding box.
    """
    if not TOMTOM_API_KEY:
        return {"available": False, "incidents": []}

    try:
        bbox_str = f"{min_lng},{min_lat},{max_lng},{max_lat}"
        url = (
            f"https://api.tomtom.com/traffic/services/5/incidentDetails"
            f"?bbox={bbox_str}&language=en-GB&timeValidityFilter=present&key={TOMTOM_API_KEY}"
        )
        res = requests.get(url, timeout=7)
        if res.status_code != 200:
            return {"available": False, "incidents": []}

        data = res.json()
        raw_incidents = data.get("incidents", [])

        incidents: List[Dict[str, Any]] = []
        for inc in raw_incidents[:30]:  # Cap at 30 for performance
            props = inc.get("properties", {})
            geom = inc.get("geometry", {})
            coords = geom.get("coordinates", [])

            # Extract point coordinates
            point = None
            if geom.get("type") == "Point" and len(coords) >= 2:
                point = [coords[1], coords[0]]  # [lat, lon]
            elif geom.get("type") == "LineString" and len(coords) > 0 and len(coords[0]) >= 2:
                point = [coords[0][1], coords[0][0]]

            events = props.get("events", [])
            desc = events[0].get("description") if events and events[0].get("description") else None
            icon_cat = props.get("iconCategory", 0)

            # Map TomTom iconCategory if description is missing or generic
            ICON_DESC_MAP = {
                1: "Accident reported",
                2: "Fog / Reduced visibility",
                3: "Hazardous road conditions",
                4: "Heavy rain / Wet pavement",
                5: "Ice on road",
                6: "Traffic congestion / Jam",
                7: "Lane closed",
                8: "Road closed",
                9: "Road maintenance / Construction",
                10: "High wind warning",
                11: "Flooding on roadway",
                14: "Broken down vehicle",
            }
            if not desc or desc.strip() == "Traffic Incident":
                desc = ICON_DESC_MAP.get(icon_cat, "Traffic Incident")

            delay_sec = props.get("delay", 0) or 0
            lat_val = point[0] if point and len(point) >= 2 else None
            lng_val = point[1] if point and len(point) >= 2 else None

            # Determine road name from TomTom properties or spatial matching
            raw_from = props.get("from")
            raw_to = props.get("to")
            road_numbers = props.get("roadNumbers")
            road_numbers_str = ", ".join(road_numbers) if isinstance(road_numbers, list) and road_numbers else None
            
            nearest_corridor = _find_nearest_corridor(lat_val, lng_val) if lat_val and lng_val else None

            if raw_from and raw_from.strip():
                road_name = raw_from.strip()
            elif raw_to and raw_to.strip():
                road_name = raw_to.strip()
            elif road_numbers_str:
                road_name = road_numbers_str
            elif nearest_corridor:
                road_name = f"Near {nearest_corridor}"
            else:
                road_name = "Arterial Corridor"

            # Determine cause
            CAUSE_MAP = {
                1: "Accident reported",
                2: "Fog / Low Visibility",
                3: "Hazardous Road Condition",
                4: "Heavy Rain / Flooding",
                5: "Ice / Slippery Road",
                6: "Traffic Congestion / Volume Surge",
                7: "Lane Closure",
                8: "Road Closure",
                9: "Roadworks / Construction",
                10: "Severe Weather / High Wind",
                11: "Waterlogging / Flooding",
                14: "Broken Down Vehicle",
            }
            cause = CAUSE_MAP.get(icon_cat, "Cause not confirmed by connected traffic feed")

            magnitude_val = props.get("magnitudeOfDelay", 0)
            if delay_sec >= 480 or magnitude_val >= 3:
                severity = "Heavy"
            elif delay_sec >= 180 or magnitude_val == 2:
                severity = "Moderate"
            else:
                severity = "Minor"

            incidents.append({
                "id": inc.get("id"),
                "road_name": road_name,
                "corridor_name": nearest_corridor or road_name,
                "description": desc,
                "cause": cause,
                "delay_seconds": delay_sec,
                "delay_minutes": round(delay_sec / 60, 1),
                "magnitude": magnitude_val,
                "severity": severity,
                "icon_category": icon_cat,
                "point": point,
                "lat": lat_val,
                "lng": lng_val,
            })

        return {
            "available": True,
            "count": len(incidents),
            "incidents": incidents,
        }

    except Exception as exc:
        logger.error("Error fetching TomTom incidents: %s", exc)
        return {"available": False, "incidents": []}
