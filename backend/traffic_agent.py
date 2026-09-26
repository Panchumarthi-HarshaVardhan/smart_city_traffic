"""
CITYFLOW AI - Traffic Intelligence Agent Orchestrator

Coordinates deterministic backend tools (TomTom Live Flow & Incidents,
Google Routes Traffic-Aware Routing, CITYFLOW ML Next-Day Forecasts)
and uses Groq LLM for grounded natural language synthesis.
"""

import os
import re
import math
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

from backend.groq_service import generate_chat_completion, is_groq_available
from backend.live_traffic_service import get_live_traffic_flow, get_traffic_incidents
from backend.traffic_route_service import compute_traffic_aware_routes
from backend.ml_service import model_service
from backend.emergency_service import (
    analyze_corridor_and_recommend,
    evaluate_and_recommend_hospital,
    VERIFIED_HOSPITALS,
)

logger = logging.getLogger("cityflow.traffic_agent")

# ---------------------------------------------------------------------------
# India Major Cities & Hubs Catalog
# Fast deterministic coordinate resolution for common Indian cities
# ---------------------------------------------------------------------------
INDIAN_CITIES_CATALOG = {
    "bengaluru": {"name": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946, "hasMLCoverage": True},
    "bangalore": {"name": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lng": 77.5946, "hasMLCoverage": True},
    "hyderabad": {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867, "hasMLCoverage": False},
    "mumbai": {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lng": 72.8777, "hasMLCoverage": False},
    "delhi": {"name": "Delhi NCR", "state": "Delhi", "lat": 28.6139, "lng": 77.2090, "hasMLCoverage": False},
    "new delhi": {"name": "Delhi NCR", "state": "Delhi", "lat": 28.6139, "lng": 77.2090, "hasMLCoverage": False},
    "pune": {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567, "hasMLCoverage": False},
    "chennai": {"name": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lng": 80.2707, "hasMLCoverage": False},
    "kolkata": {"name": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lng": 88.3639, "hasMLCoverage": False},
    "ahmedabad": {"name": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lng": 72.5714, "hasMLCoverage": False},
    "jaipur": {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873, "hasMLCoverage": False},
    "surat": {"name": "Surat", "state": "Gujarat", "lat": 21.1702, "lng": 72.8311, "hasMLCoverage": False},
    "lucknow": {"name": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lng": 80.9462, "hasMLCoverage": False},
    "chandigarh": {"name": "Chandigarh", "state": "Punjab", "lat": 30.7333, "lng": 76.7794, "hasMLCoverage": False},
    "kochi": {"name": "Kochi", "state": "Kerala", "lat": 9.9312, "lng": 76.2673, "hasMLCoverage": False},
    "indore": {"name": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577, "hasMLCoverage": False},
    "nagpur": {"name": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lng": 79.0882, "hasMLCoverage": False},
    "visakhapatnam": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185, "hasMLCoverage": False},
    "vizag": {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lng": 83.2185, "hasMLCoverage": False},
    "vijayawada": {"name": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lng": 80.6480, "hasMLCoverage": False},
    "coimbatore": {"name": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lng": 76.9558, "hasMLCoverage": False},
    "bhopal": {"name": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lng": 77.4126, "hasMLCoverage": False},
    "patna": {"name": "Patna", "state": "Bihar", "lat": 25.5941, "lng": 85.1376, "hasMLCoverage": False},
    "kurnool": {"name": "Kurnool", "state": "Andhra Pradesh", "lat": 15.8281, "lng": 78.0373, "hasMLCoverage": False},
    "mysore": {"name": "Mysore", "state": "Karnataka", "lat": 12.2958, "lng": 76.6394, "hasMLCoverage": False},
    "mysuru": {"name": "Mysore", "state": "Karnataka", "lat": 12.2958, "lng": 76.6394, "hasMLCoverage": False},
    "hitech city": {"name": "Hitech City, Hyderabad", "state": "Telangana", "lat": 17.4435, "lng": 78.3772, "hasMLCoverage": False},
    "gachibowli": {"name": "Gachibowli, Hyderabad", "state": "Telangana", "lat": 17.4401, "lng": 78.3489, "hasMLCoverage": False},
}

# Validated Bengaluru ML Corridors
BENGALURU_ML_CORRIDORS = {
    "100 feet road": {"road": "100 Feet Road", "area": "Indiranagar", "lat": 12.9784, "lng": 77.6408},
    "anil kumble circle": {"road": "Anil Kumble Circle", "area": "MG Road", "lat": 12.9754, "lng": 77.6066},
    "ballari road": {"road": "Ballari Road", "area": "Hebbal", "lat": 13.0358, "lng": 77.5970},
    "bellary road": {"road": "Ballari Road", "area": "Hebbal", "lat": 13.0358, "lng": 77.5970},
    "cmh road": {"road": "CMH Road", "area": "Indiranagar", "lat": 12.9792, "lng": 77.6432},
    "hebbal flyover": {"road": "Hebbal Flyover", "area": "Hebbal", "lat": 13.0358, "lng": 77.5970},
    "hebbal": {"road": "Hebbal Flyover", "area": "Hebbal", "lat": 13.0358, "lng": 77.5970},
    "hosur road": {"road": "Hosur Road", "area": "Electronic City", "lat": 12.8942, "lng": 77.6433},
    "itpl main road": {"road": "ITPL Main Road", "area": "Whitefield", "lat": 12.9865, "lng": 77.7314},
    "whitefield": {"road": "ITPL Main Road", "area": "Whitefield", "lat": 12.9865, "lng": 77.7314},
    "jayanagar 4th block": {"road": "Jayanagar 4th Block", "area": "Jayanagar", "lat": 12.9298, "lng": 77.5833},
    "jayanagar": {"road": "Jayanagar 4th Block", "area": "Jayanagar", "lat": 12.9298, "lng": 77.5833},
    "marathahalli bridge": {"road": "Marathahalli Bridge", "area": "Marathahalli", "lat": 12.9591, "lng": 77.6974},
    "marathahalli": {"road": "Marathahalli Bridge", "area": "Marathahalli", "lat": 12.9591, "lng": 77.6974},
    "sarjapur road": {"road": "Sarjapur Road", "area": "Koramangala", "lat": 12.9165, "lng": 77.6744},
    "silk board junction": {"road": "Silk Board Junction", "area": "Electronic City", "lat": 12.9176, "lng": 77.6234},
    "silk board": {"road": "Silk Board Junction", "area": "Electronic City", "lat": 12.9176, "lng": 77.6234},
    "central silk board": {"road": "Silk Board Junction", "area": "Electronic City", "lat": 12.9176, "lng": 77.6234},
    "sony world junction": {"road": "Sony World Junction", "area": "Koramangala", "lat": 12.9344, "lng": 77.6271},
    "koramangala": {"road": "Sony World Junction", "area": "Koramangala", "lat": 12.9344, "lng": 77.6271},
    "south end circle": {"road": "South End Circle", "area": "Jayanagar", "lat": 12.9298, "lng": 77.5833},
    "trinity circle": {"road": "Trinity Circle", "area": "MG Road", "lat": 12.9726, "lng": 77.6200},
    "mg road": {"road": "Trinity Circle", "area": "MG Road", "lat": 12.9754, "lng": 77.6066},
    "tumkur road": {"road": "Tumkur Road", "area": "Yeshwanthpur", "lat": 13.0238, "lng": 77.5505},
    "yeshwanthpur circle": {"road": "Yeshwanthpur Circle", "area": "Yeshwanthpur", "lat": 13.0238, "lng": 77.5505},
    "yeshwanthpur": {"road": "Yeshwanthpur Circle", "area": "Yeshwanthpur", "lat": 13.0238, "lng": 77.5505},
}

# In-memory bounded session context storage (keyed by conversation_id)
# Keeps up to 8 recent message pairs per session
_CONVERSATION_MEMORY: Dict[str, List[Dict[str, Any]]] = {}
_SESSION_LAST_ACTIVE: Dict[str, float] = {}
SESSION_TTL_SECONDS = 3600  # 1 hour expiration


def _cleanup_old_sessions():
    now = time.time()
    expired = [cid for cid, last in _SESSION_LAST_ACTIVE.items() if now - last > SESSION_TTL_SECONDS]
    for cid in expired:
        _CONVERSATION_MEMORY.pop(cid, None)
        _SESSION_LAST_ACTIVE.pop(cid, None)


def get_session_history(conversation_id: str) -> List[Dict[str, Any]]:
    _cleanup_old_sessions()
    return _CONVERSATION_MEMORY.get(conversation_id, [])


def save_session_turn(conversation_id: str, user_msg: str, assistant_res: Dict[str, Any]):
    if not conversation_id:
        return
    _cleanup_old_sessions()
    history = _CONVERSATION_MEMORY.setdefault(conversation_id, [])
    history.append({
        "role": "user",
        "content": user_msg,
        "timestamp": datetime.now().isoformat(),
    })
    history.append({
        "role": "assistant",
        "content": assistant_res.get("answer", ""),
        "sources": assistant_res.get("sources", []),
        "data": assistant_res.get("data", {}),
        "timestamp": datetime.now().isoformat(),
    })
    # Keep last 8 turns (16 messages)
    if len(history) > 16:
        _CONVERSATION_MEMORY[conversation_id] = history[-16:]
    _SESSION_LAST_ACTIVE[conversation_id] = time.time()


def clear_session(conversation_id: str):
    _CONVERSATION_MEMORY.pop(conversation_id, None)
    _SESSION_LAST_ACTIVE.pop(conversation_id, None)


# ---------------------------------------------------------------------------
# Entity Extraction Helpers
# ---------------------------------------------------------------------------

def extract_locations(query: str, session_history: List[Dict[str, Any]] = None) -> Tuple[Optional[str], Optional[str], Optional[Dict[str, Any]]]:
    """
    Extract primary location and optional destination from query text.
    Uses conversational context if current query is elliptical (e.g. "What about tomorrow?").
    """
    q = query.lower()

    # Check for route pattern: "from X to Y" or "X to Y"
    route_match = re.search(r'(?:from\s+)?([a-z\s]+?)\s+to\s+([a-z\s]+)', q)
    if route_match:
        cand_orig = route_match.group(1).strip()
        cand_dest = route_match.group(2).strip()
        # Clean common filler words
        cand_orig = re.sub(r'^(find|get|route|best route|fastest route|how do i get)\s+', '', cand_orig).strip()
        cand_dest = re.sub(r'\s+(route|direction|directions|fastest)$', '', cand_dest).strip()
        if cand_orig and cand_dest:
            return cand_orig, cand_dest, None

    # Check for specific Bengaluru ML corridor
    for kw, item in BENGALURU_ML_CORRIDORS.items():
        if kw in q:
            return item["road"], None, {**item, "hasMLCoverage": True, "isCorridor": True}

    # Check for Indian city
    for kw, item in INDIAN_CITIES_CATALOG.items():
        if re.search(rf'\b{re.escape(kw)}\b', q):
            return item["name"], None, item

    # If no location in current turn, check session history (context carry-forward)
    if session_history:
        for turn in reversed(session_history):
            if turn.get("role") == "user":
                prev_loc, prev_dest, prev_meta = extract_locations(turn["content"], None)
                if prev_loc:
                    return prev_loc, prev_dest, prev_meta

    return None, None, None


def detect_intent(query: str) -> str:
    """
    Classify query into one of:
    - 'route': Route planning between two points
    - 'incident': Inquiries about causes of congestion, accidents, closures
    - 'forecast': Inquiries about tomorrow or upcoming days
    - 'hotspots': Questions about worst traffic / bottlenecks / hotspots
    - 'emergency': Emergency vehicle or ambulance routing questions
    - 'nationwide': Inquiries about entire India traffic or all cities
    - 'general': General CITYFLOW capability or architectural questions
    - 'current_traffic': Live/current traffic conditions
    """
    q = query.lower()

    if any(k in q for k in ["how to get from", "route from", "best route", "fastest route", "directions from", " to "]):
        return "route"

    if any(k in q for k in ["ambulance", "fire engine", "hospital emergency", "emergency clearance", "emergency route"]):
        return "emergency"

    if any(k in q for k in ["why is traffic", "why is it congested", "cause of", "what is causing", "accident", "incident", "obstruction", "blocked"]):
        return "incident"

    if any(k in q for k in ["tomorrow", "next day", "forecast", "will traffic be", "predicted congestion", "upcoming"]):
        return "forecast"

    if any(k in q for k in ["hotspot", "bottleneck", "worst traffic", "most congested", "top congestion"]):
        return "hotspots"

    if any(k in q for k in ["which areas", "what areas", "areas do you cover", "areas you cover", "which cities do you cover", "what cities do you cover", "coverage", "where do you work", "where does cityflow operate", "where do you operate", "cities supported", "supported cities", "what cities do you support", "which cities do you support"]):
        return "coverage"

    if any(k in q for k in ["across india", "in india", "entire country", "nationwide", "all cities", "which cities"]):
        return "nationwide"

    if any(k in q for k in ["what is cityflow", "how does cityflow", "how do you work", "how does your ai", "what data do you use", "who built", "what can you do"]):
        return "general"

    return "current_traffic"


# ---------------------------------------------------------------------------
# Deterministic Backend Tool Handlers
# ---------------------------------------------------------------------------

def tool_get_live_traffic(lat: float, lng: float, location_name: str = None) -> Dict[str, Any]:
    """Execute TomTom Live Traffic Flow retrieval."""
    flow = get_live_traffic_flow(lat=lat, lng=lng)
    return {
        "tool": "get_live_traffic",
        "location_name": location_name or f"{lat:.4f}, {lng:.4f}",
        "data": flow,
        "source": "TomTom Traffic",
    }


def tool_get_traffic_incidents(lat: float, lng: float, radius_km: float = 12.0) -> Dict[str, Any]:
    """Execute TomTom Incidents retrieval."""
    delta_lat = radius_km / 111.0
    delta_lng = radius_km / (111.0 * 0.9)
    inc_resp = get_traffic_incidents(
        min_lat=lat - delta_lat,
        min_lng=lng - delta_lng,
        max_lat=lat + delta_lat,
        max_lng=lng + delta_lng,
    )
    return {
        "tool": "get_traffic_incidents",
        "data": inc_resp,
        "source": "TomTom Traffic",
    }


def tool_get_cityflow_forecast(road_name: str, prediction_date: Optional[str] = None) -> Dict[str, Any]:
    """Execute CITYFLOW ML prediction with strict coverage enforcement."""
    # Check if road matches validated Bengaluru ML corridors
    matched_road = None
    for kw, item in BENGALURU_ML_CORRIDORS.items():
        if kw in road_name.lower() or item["road"].lower() == road_name.lower():
            matched_road = item["road"]
            break

    if not matched_road:
        # Check known available roads from ML service
        avail = model_service.get_available_roads()
        if isinstance(avail, list) and not isinstance(avail[0], dict) if avail else False:
            for r in avail:
                if r.lower() == road_name.lower():
                    matched_road = r
                    break

    if not matched_road:
        return {
            "tool": "get_cityflow_forecast",
            "hasMLCoverage": False,
            "road": road_name,
            "message": (
                "CITYFLOW's next-day ML forecast is currently validated for Bengaluru arterial corridors. "
                "I can still help with available current traffic information or traffic-aware routing for this location."
            ),
            "source": "CITYFLOW ML",
        }

    pred = model_service.predict_road(road_name=matched_road, prediction_date=prediction_date)
    if "error" in pred:
        return {
            "tool": "get_cityflow_forecast",
            "hasMLCoverage": True,
            "road": matched_road,
            "error": pred["error"],
            "source": "CITYFLOW ML",
        }

    return {
        "tool": "get_cityflow_forecast",
        "hasMLCoverage": True,
        "road": matched_road,
        "data": pred,
        "source": "CITYFLOW ML",
    }


def tool_get_hotspots(top_n: int = 5) -> Dict[str, Any]:
    """Execute CITYFLOW ML Hotspots retrieval."""
    hotspots = model_service.get_hotspots(top_n=top_n)
    return {
        "tool": "get_hotspots",
        "data": hotspots,
        "source": "CITYFLOW ML (Next-Day Forecast)",
    }


def tool_get_traffic_aware_route(origin_query: str, dest_query: str) -> Dict[str, Any]:
    """Execute Google Routes TRAFFIC_AWARE routing."""
    # Resolve origin coordinates
    o_lat, o_lng = None, None
    d_lat, d_lng = None, None

    for kw, item in {**INDIAN_CITIES_CATALOG, **BENGALURU_ML_CORRIDORS}.items():
        if kw in origin_query.lower():
            o_lat, o_lng = item["lat"], item["lng"]
            break

    for kw, item in {**INDIAN_CITIES_CATALOG, **BENGALURU_ML_CORRIDORS}.items():
        if kw in dest_query.lower():
            d_lat, d_lng = item["lat"], item["lng"]
            break

    if o_lat is None or d_lat is None:
        return {
            "tool": "get_traffic_aware_route",
            "available": False,
            "error": f"Could not resolve GPS coordinates for '{origin_query}' or '{dest_query}'. Please provide standard city names.",
            "source": "Google Routes",
        }

    route_res = compute_traffic_aware_routes(
        origin_lat=o_lat,
        origin_lng=o_lng,
        dest_lat=d_lat,
        dest_lng=d_lng,
    )
    return {
        "tool": "get_traffic_aware_route",
        "origin": origin_query,
        "destination": dest_query,
        "data": route_res,
        "source": "Google Routes (Traffic-Aware)",
    }


def tool_get_corridor_incident_context(lat: float, lng: float, radius_km: float = 6.0) -> Dict[str, Any]:
    """Analyze nearby incidents along a transit corridor."""
    return tool_get_traffic_incidents(lat=lat, lng=lng, radius_km=radius_km)


# ---------------------------------------------------------------------------
# Agent Orchestrator & Grounded Synthesis
# ---------------------------------------------------------------------------

AGENT_SYSTEM_PROMPT = """You are CITYFLOW AI, an authoritative urban mobility intelligence agent for India.

Your job is to provide accurate, concise, and helpful answers regarding current road traffic, traffic-aware routes, active road incidents, and CITYFLOW next-day congestion forecasts.

CRITICAL RULES:
1. Ground ALL traffic metrics (speed, delay, condition, duration, congestion %) STRICTLY in the provided tool data. NEVER fabricate, estimate, or hallucinate traffic figures.
2. STRICT DATA SEMANTICS:
   - TomTom = CURRENT / NEAR-LIVE TRAFFIC and active incident telemetry.
   - Google Routes = CURRENT TRAFFIC-AWARE ROUTING and ETA comparison.
   - CITYFLOW ML = VALIDATED NEXT-DAY FORECAST based on historical machine learning and weather patterns.
   - OSRM = STANDARD ROUTING FALLBACK without live traffic.
   Never confuse these sources. Never say TomTom predicts tomorrow. Never say CITYFLOW ML is real-time sensor speed.
3. PLATFORM & ML FORECAST COVERAGE CLARITY (CRITICAL - NEVER CONFLATE):
   - CITYFLOW IS AN INDIA-WIDE TRAFFIC INTELLIGENCE PLATFORM:
     • Location search and map coverage: India-wide.
     • Traffic-aware route planning: India-wide for supported routes (Google Routes with OSRM fallback).
     • Current/near-live traffic flow & active road incidents: Available for queried and supported cities and locations across India through connected traffic services (TomTom).
     • Next-day ML congestion forecasts: Validated exclusively for Bengaluru arterial corridors (expanding city-by-city).
   - NEVER SAY OR IMPLY THAT CITYFLOW IS BENGALURU-ONLY.
   - NEVER say "Bengaluru is the only city covered by CITYFLOW."
   - NEVER say "We only operate in Bengaluru."
   - NEVER say "We have no nationwide coverage."
   - "India-wide platform" does not mean continuous highway sensor monitoring of every road simultaneously from a single feed. When asked about any specific Indian city (e.g. Hyderabad, Mumbai, Delhi, Chennai, Pune), look up actual near-live traffic flow and incidents for that city using connected services.
4. "WHICH AREAS DO YOU COVER?" / COVERAGE QUESTIONS:
   - When asked "Which areas do you cover?" or about coverage in general:
     Do NOT produce a response that says Bengaluru is the only city covered.
     Instead respond concisely with wording similar to:
     "CITYFLOW is designed for cities and routes across India. You can search locations, plan routes and check available current traffic and incident information through our connected traffic services.

For CITYFLOW's next-day ML traffic forecasts, the currently validated coverage is Bengaluru's arterial corridors. (ML forecast coverage is being expanded city-by-city as models are validated.)"
     Keep this concise, clean, and friendly. Do not generate large negative tables claiming other cities have no service.
5. FORECAST COVERAGE BOUNDARIES (OUTSIDE BENGALURU):
   - When asked for next-day ML forecasts outside Bengaluru (e.g. "What's tomorrow's traffic in Hyderabad?"):
     Do NOT fabricate an ML forecast.
     State politely and clearly:
     "CITYFLOW's next-day ML forecast is currently validated for Bengaluru arterial corridors. I can still help with available current traffic information or traffic-aware routing for this location."
6. "WHY IS TRAFFIC BAD?" / INCIDENT INVESTIGATIONS:
   - Carefully distinguish OBSERVED EVIDENCE (e.g. "TomTom currently reports a road closure +12 min delay near...") from POSSIBLE EXPLANATION.
   - If TomTom reports no active incident near the congested spot, state honestly: "TomTom does not report an active accident or closure on this corridor. Elevated delay is present, but the specific obstruction cannot be confirmed from available feeds."
7. NATIONWIDE TRAFFIC QUESTIONS:
   - When asked about traffic across the entire country or all cities at once, summarize current telemetry across key monitored metropolitan hubs (e.g. Bengaluru, Hyderabad, Mumbai, Delhi).
8. ADVISORY NATURE:
   - Authority and emergency recommendations are advisory decision-support. CITYFLOW does not claim automated traffic-light manipulation.
9. FORMATTING:
   - Structure responses cleanly, factually, and concisely. Keep answers readable and professional. Never dump raw JSON or expose internal developer implementation details.
"""


def _clean_tool_data_for_prompt(tool_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize tool payloads to remove massive coordinate polylines before feeding to Groq.
    Prevents TPM (Tokens Per Minute) and Context Length rate limits.
    """
    tool_name = tool_item.get("tool")
    source = tool_item.get("source")

    if tool_name == "get_traffic_aware_route":
        r_data = tool_item.get("data", {})
        routes_summary = []
        for r in r_data.get("routes", [])[:3]:
            routes_summary.append({
                "name": r.get("name"),
                "distanceKm": r.get("distanceKm"),
                "formattedDuration": r.get("formattedDuration"),
                "trafficDelayMinutes": r.get("trafficDelayMinutes"),
                "trafficCondition": r.get("trafficCondition"),
                "isPrimary": r.get("isPrimary", False),
            })
        return {
            "tool": tool_name,
            "source": source,
            "available": r_data.get("available", False),
            "origin": tool_item.get("origin"),
            "destination": tool_item.get("destination"),
            "routes": routes_summary,
        }

    if tool_name == "get_live_traffic":
        flow = tool_item.get("data", {})
        return {
            "tool": tool_name,
            "source": source,
            "location": tool_item.get("location_name"),
            "available": flow.get("available", False),
            "current_speed_kmh": flow.get("current_speed_kmh"),
            "free_flow_speed_kmh": flow.get("free_flow_speed_kmh"),
            "delay_minutes": flow.get("delay_minutes"),
            "traffic_condition": flow.get("traffic_condition"),
            "congestion_level": flow.get("congestion_level"),
            "road_closure": flow.get("road_closure", False),
        }

    if tool_name == "get_traffic_incidents":
        inc_data = tool_item.get("data", {})
        incidents = []
        for inc in inc_data.get("incidents", [])[:4]:
            incidents.append({
                "description": inc.get("description"),
                "delay_minutes": inc.get("delay_minutes", 0),
            })
        return {
            "tool": tool_name,
            "source": source,
            "available": inc_data.get("available", False),
            "incident_count": inc_data.get("count", 0),
            "top_incidents": incidents,
        }

    if tool_name == "platform_coverage":
        return {
            "tool": tool_name,
            "source": source,
            "data": tool_item.get("data", {}),
        }

    if tool_name == "get_cityflow_forecast":
        if not tool_item.get("hasMLCoverage"):
            return {
                "tool": tool_name,
                "source": source,
                "hasMLCoverage": False,
                "road": tool_item.get("road"),
                "message": tool_item.get("message"),
            }
        p_data = tool_item.get("data", {})
        return {
            "tool": tool_name,
            "source": source,
            "hasMLCoverage": True,
            "road": tool_item.get("road"),
            "predicted_congestion_level": p_data.get("predicted_congestion_level"),
            "congestion_category": p_data.get("congestion_category"),
            "predicted_average_speed": p_data.get("predicted_average_speed"),
            "predicted_traffic_volume": p_data.get("predicted_traffic_volume"),
            "prediction_date": p_data.get("prediction_date"),
        }

    if tool_name == "get_hotspots":
        h_data = tool_item.get("data", [])
        return {
            "tool": tool_name,
            "source": source,
            "hotspots": [
                {
                    "road": h.get("road"),
                    "area": h.get("area"),
                    "predicted_congestion": h.get("predicted_congestion"),
                    "predicted_speed": h.get("predicted_speed"),
                    "congestion_category": h.get("congestion_category"),
                }
                for h in h_data[:5]
            ],
        }

    if tool_name == "evaluate_and_recommend_hospital":
        e_data = tool_item.get("data", {})
        rec = e_data.get("recommended_hospital", {})
        return {
            "tool": tool_name,
            "source": source,
            "recommended_hospital": {
                "name": rec.get("name"),
                "shortName": rec.get("shortName"),
                "durationMinutes": rec.get("durationMinutes"),
                "distanceKm": rec.get("distanceKm"),
                "trafficCondition": rec.get("trafficCondition"),
            } if rec else None,
            "candidates_count": len(e_data.get("candidates", [])),
            "recommendation_reason": e_data.get("recommendation_reason"),
        }

    if tool_name == "get_nationwide_sample":
        cities_summary = []
        for c in tool_item.get("cities", []):
            tf = c.get("traffic", {})
            cities_summary.append({
                "city": c.get("city"),
                "available": tf.get("available", False),
                "current_speed_kmh": tf.get("current_speed_kmh"),
                "free_flow_speed_kmh": tf.get("free_flow_speed_kmh"),
                "traffic_condition": tf.get("traffic_condition", "Flowing Normally"),
                "delay_minutes": tf.get("delay_minutes", 0),
            })
        return {
            "tool": tool_name,
            "source": source,
            "disclaimer": tool_item.get("disclaimer"),
            "sampled_cities": cities_summary,
        }

    return tool_item


def orchestrate_traffic_agent(
    message: str,
    conversation_id: str = "default",
    user_location: Optional[Dict[str, float]] = None,
    user_role: str = "citizen",
) -> Dict[str, Any]:
    """
    Main agent execution pipeline:
    1. Parse intent & extract location entities
    2. Execute deterministic backend tools
    3. Construct grounded facts context
    4. Call Groq LLM for grounded synthesis (or deterministic fallback)
    5. Save conversation turn and return structured response
    """
    clean_msg = message.strip()
    session_history = get_session_history(conversation_id)

    intent = detect_intent(clean_msg)

    # For general, nationwide, or coverage queries, do not carry over previous specific location
    history_for_extraction = None if intent in ["general", "nationwide", "coverage"] else session_history
    loc_primary, loc_dest, loc_meta = extract_locations(clean_msg, history_for_extraction)

    # Use explicit user browser location if available and no city specified
    if not loc_primary and user_location and "latitude" in user_location and "longitude" in user_location and intent not in ["general", "nationwide", "coverage"]:
        u_lat = float(user_location["latitude"])
        u_lng = float(user_location["longitude"])
        loc_primary = "My Current Location"
        loc_meta = {"name": "Current Location", "lat": u_lat, "lng": u_lng, "hasMLCoverage": False}

    collected_tools: List[Dict[str, Any]] = []
    sources: List[str] = []
    structured_data: Dict[str, Any] = {}

    # -----------------------------------------------------------------------
    # Step 1: Execute Targeted Tools Based on Intent & Location
    # -----------------------------------------------------------------------

    if intent == "general":
        # General system query — no live traffic API required
        sources.append("CITYFLOW AI Architecture")
        structured_data["query_type"] = "general"

    elif intent == "coverage":
        cov_info = {
            "platform_scope": "India-wide",
            "location_map_coverage": "India",
            "traffic_aware_routing": "India / supported routes",
            "current_traffic_incidents": "Available locations through connected traffic services",
            "ml_forecast": "Bengaluru arterial corridors (Currently validated)",
            "expansion_note": "ML forecast coverage is being expanded city-by-city as models are validated.",
        }
        collected_tools.append({
            "tool": "platform_coverage",
            "source": "CITYFLOW Platform Architecture",
            "data": cov_info,
        })
        sources.append("CITYFLOW Platform Architecture")
        structured_data["coverage"] = cov_info

    elif intent == "nationwide":
        # Sample key hubs across India without claiming total coverage
        hubs_data = []
        for city_key in ["bengaluru", "hyderabad", "mumbai", "delhi"]:
            c_info = INDIAN_CITIES_CATALOG[city_key]
            flow_res = tool_get_live_traffic(c_info["lat"], c_info["lng"], c_info["name"])
            hubs_data.append({
                "city": c_info["name"],
                "traffic": flow_res["data"],
            })
        collected_tools.append({
            "tool": "get_nationwide_sample",
            "cities": hubs_data,
            "disclaimer": "Sampled from major monitored hubs; nationwide complete telemetry is not claimed.",
            "source": "TomTom Traffic",
        })
        sources.append("TomTom Traffic")
        structured_data["nationwide_sample"] = hubs_data

    elif intent == "route":
        orig = loc_primary or "Hyderabad"
        dest = loc_dest or "Bengaluru"
        route_tool = tool_get_traffic_aware_route(orig, dest)
        collected_tools.append(route_tool)
        sources.append("Google Routes (Traffic-Aware)")
        structured_data["routing"] = route_tool["data"]

        # Check incidents near origin and destination
        if route_tool.get("data", {}).get("available"):
            routes = route_tool["data"].get("routes", [])
            if routes:
                p_route = routes[0]
                structured_data["recommended_route"] = {
                    "name": p_route.get("name"),
                    "duration": p_route.get("formattedDuration"),
                    "delay": p_route.get("trafficDelayMinutes"),
                    "trafficImpact": p_route.get("trafficImpact"),
                    "distanceKm": p_route.get("distanceKm"),
                }

    elif intent == "emergency":
        # Emergency route support
        e_lat = loc_meta["lat"] if loc_meta else (user_location.get("latitude", 12.9344) if user_location else 12.9344)
        e_lng = loc_meta["lng"] if loc_meta else (user_location.get("longitude", 77.6101) if user_location else 77.6101)
        hosp_eval = evaluate_and_recommend_hospital(origin_lat=e_lat, origin_lng=e_lng, limit=3)
        collected_tools.append({
            "tool": "evaluate_and_recommend_hospital",
            "data": hosp_eval,
            "source": "Google Routes & Verified Hospital Catalog",
        })
        sources.append("Google Routes (Traffic-Aware)")
        sources.append("Verified Hospital Catalog")
        structured_data["emergency_evaluation"] = hosp_eval

    elif intent == "hotspots":
        hotspots_tool = tool_get_hotspots(top_n=6)
        collected_tools.append(hotspots_tool)
        sources.append("CITYFLOW ML (Next-Day Forecast)")
        structured_data["hotspots"] = hotspots_tool["data"]

    elif intent == "forecast":
        target_road = loc_primary or "Silk Board Junction"
        forecast_tool = tool_get_cityflow_forecast(target_road)
        collected_tools.append(forecast_tool)
        sources.append("CITYFLOW ML")
        structured_data["forecast"] = forecast_tool

    elif intent == "incident":
        # Investigate causes of congestion: TomTom Flow + TomTom Incidents
        ref_lat = loc_meta["lat"] if loc_meta else 12.9176
        ref_lng = loc_meta["lng"] if loc_meta else 77.6234
        loc_label = loc_primary or "Surveyed Location"

        flow_tool = tool_get_live_traffic(ref_lat, ref_lng, loc_label)
        inc_tool = tool_get_traffic_incidents(ref_lat, ref_lng, radius_km=10.0)
        collected_tools.append(flow_tool)
        collected_tools.append(inc_tool)
        sources.append("TomTom Traffic")
        structured_data["live_flow"] = flow_tool["data"]
        structured_data["incidents"] = inc_tool["data"]

        # If it's a Bengaluru corridor, also include historical/forecast context
        if loc_meta and loc_meta.get("hasMLCoverage"):
            fc = tool_get_cityflow_forecast(loc_label)
            if fc.get("hasMLCoverage"):
                collected_tools.append(fc)
                sources.append("CITYFLOW ML")
                structured_data["forecast"] = fc

    else:  # intent == "current_traffic"
        ref_lat = loc_meta["lat"] if loc_meta else (user_location.get("latitude", 12.9716) if user_location else 12.9716)
        ref_lng = loc_meta["lng"] if loc_meta else (user_location.get("longitude", 77.5946) if user_location else 77.5946)
        loc_label = loc_primary or "Bengaluru"

        flow_tool = tool_get_live_traffic(ref_lat, ref_lng, loc_label)
        collected_tools.append(flow_tool)
        sources.append("TomTom Traffic")
        structured_data["live_flow"] = flow_tool["data"]

        # Also get active incidents nearby
        inc_tool = tool_get_traffic_incidents(ref_lat, ref_lng, radius_km=8.0)
        collected_tools.append(inc_tool)
        structured_data["incidents"] = inc_tool["data"]

    # -----------------------------------------------------------------------
    # Step 2: Assemble Grounded Context for LLM Synthesis
    # -----------------------------------------------------------------------

    context_prompt = f"USER QUERY: {clean_msg}\n"
    context_prompt += f"USER ROLE: {user_role.upper()}\n"
    if loc_primary:
        context_prompt += f"IDENTIFIED LOCATION: {loc_primary}\n"

    context_prompt += "\nFACTUAL DATA RETRIEVED FROM BACKEND TOOLS:\n"
    if collected_tools:
        import json
        for t in collected_tools:
            cleaned_tool = _clean_tool_data_for_prompt(t)
            context_prompt += f"\n--- TOOL: {t.get('tool')} (Source: {t.get('source')}) ---\n"
            context_prompt += f"{json.dumps(cleaned_tool, indent=2)}\n"
    else:
        context_prompt += "No external sensor tools required for this query. Rely strictly on verified CITYFLOW architectural facts.\n"

    # Build prompt messages including bounded session context
    llm_messages = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]

    # Include last 2 turns of conversation history for conversational context
    for turn in session_history[-4:]:
        role = "user" if turn.get("role") == "user" else "assistant"
        llm_messages.append({"role": role, "content": turn.get("content", "")})

    llm_messages.append({"role": "user", "content": context_prompt})

    # -----------------------------------------------------------------------
    # Step 3: Invoke Groq for Grounded Natural Language Synthesis
    # -----------------------------------------------------------------------

    answer_text = ""
    llm_result = generate_chat_completion(llm_messages, temperature=0.2, max_tokens=700)

    if llm_result.get("success") and llm_result.get("content"):
        answer_text = llm_result["content"]
    else:
        # Fallback to deterministic template synthesis if Groq is unavailable
        logger.warning("Groq unavailable; generating deterministic fallback response.")
        answer_text = _generate_deterministic_fallback(
            query=clean_msg,
            intent=intent,
            loc_name=loc_primary,
            tools=collected_tools,
            user_role=user_role,
        )

    # -----------------------------------------------------------------------
    # Step 4: Final Response Assembly & Session Persistence
    # -----------------------------------------------------------------------

    # Deduplicate sources list
    clean_sources = list(dict.fromkeys(sources))

    response_payload = {
        "answer": answer_text,
        "sources": clean_sources,
        "data": structured_data,
        "intent": intent,
        "location": loc_primary,
        "timestamp": datetime.now().isoformat(),
        "conversation_id": conversation_id,
    }

    save_session_turn(conversation_id, clean_msg, response_payload)
    return response_payload


# ---------------------------------------------------------------------------
# Deterministic Fallback Synthesis (Zero-Hallucination Safe Fallback)
# ---------------------------------------------------------------------------

def _generate_deterministic_fallback(
    query: str,
    intent: str,
    loc_name: Optional[str],
    tools: List[Dict[str, Any]],
    user_role: str,
) -> str:
    """Produces truthful, structured answers if Groq API is temporarily down."""
    loc_label = loc_name or "Surveyed Location"

    if intent == "general":
        return (
            "CITYFLOW AI is an urban mobility intelligence platform for India that combines:\n"
            "• **TomTom Traffic API**: Near-live sensor speeds and real-time incident alerts.\n"
            "• **Google Routes API**: Traffic-aware route planning with real-time ETA comparison.\n"
            "• **CITYFLOW ML Engine**: Next-day machine-learned congestion forecasting based on 7-day persistence and weather signals (currently validated for Bengaluru arterial corridors).\n"
            "• **Authority Operations Center**: Actionable advisory traffic mitigation and emergency hospital routing."
        )

    if intent == "coverage":
        return (
            "CITYFLOW is designed for cities and routes across India. You can search locations, plan routes and check available current traffic and incident information through our connected traffic services.\n\n"
            "For CITYFLOW's next-day ML traffic forecasts, the currently validated coverage is Bengaluru's arterial corridors.\n\n"
            "*(ML forecast coverage is being expanded city-by-city as models are validated.)*"
        )

    if intent == "forecast":
        for t in tools:
            if t.get("tool") == "get_cityflow_forecast":
                if not t.get("hasMLCoverage"):
                    return (
                        f"CITYFLOW's next-day ML forecast is currently validated for Bengaluru arterial corridors. "
                        f"I can still help with available current traffic information or traffic-aware routing for {loc_label}."
                    )
                data = t.get("data", {})
                cong = data.get("predicted_congestion_level", "N/A")
                cat = data.get("congestion_category", "MODERATE")
                spd = data.get("predicted_average_speed", "N/A")
                vol = data.get("predicted_traffic_volume", "N/A")
                return (
                    f"**CITYFLOW NEXT-DAY FORECAST — {loc_label.upper()}**\n\n"
                    f"• **Predicted Congestion**: {cong}% ({cat})\n"
                    f"• **Expected Average Speed**: {spd} km/h\n"
                    f"• **Expected Traffic Volume**: {vol} vehicles/day\n"
                    f"• **Forecast Horizon**: 1-Day-Ahead (Tomorrow)\n"
                    f"• **Source**: CITYFLOW ML Model"
                )

    if intent == "route":
        for t in tools:
            if t.get("tool") == "get_traffic_aware_route":
                r_data = t.get("data", {})
                if not r_data.get("available") or not r_data.get("routes"):
                    return f"Traffic-aware routing between the requested locations is temporarily unavailable."
                routes = r_data.get("routes", [])
                primary = routes[0]
                lines = [
                    f"**TRAFFIC-AWARE ROUTE UPDATE**\n",
                    f"• **Recommended**: {primary.get('name')} ({primary.get('distanceKm')} km)",
                    f"• **Estimated Travel Time**: {primary.get('formattedDuration')} (Delay: +{primary.get('trafficDelayMinutes')} min)",
                    f"• **Traffic Impact**: {primary.get('trafficCondition', 'Normal Traffic Impact')}",
                    f"• **Source**: Google Routes (TRAFFIC_AWARE)",
                ]
                if len(routes) > 1:
                    alt = routes[1]
                    lines.append(f"• **Alternative**: {alt.get('name')} ({alt.get('formattedDuration')}, +{alt.get('trafficDelayMinutes')} min)")
    if intent == "nationwide":
        lines = [
            "**NATIONWIDE TRAFFIC SNAPSHOT (MONITORED HUBS)**\n",
            "CITYFLOW monitors key metropolitan hubs. Complete nationwide traffic coverage is not currently available from a single feed. Here is the current telemetry across monitored hubs:\n",
        ]
        for t in tools:
            if t.get("tool") == "get_nationwide_sample":
                for c in t.get("sampled_cities", []):
                    status = (
                        f"{c.get('current_speed_kmh', 'N/A')} km/h ({c.get('traffic_condition', 'Flowing Normally')})"
                        if c.get("available")
                        else "Temporarily unavailable"
                    )
                    lines.append(f"• **{c.get('city')}**: {status}")
        lines.append("\n• **Source**: TomTom Traffic (Sampled Hub Telemetry)")
        return "\n".join(lines)

    if intent in ["current_traffic", "incident"]:
        flow_data = None
        inc_data = None
        for t in tools:
            if t.get("tool") == "get_live_traffic":
                flow_data = t.get("data", {})
            elif t.get("tool") == "get_traffic_incidents":
                inc_data = t.get("data", {})

        lines = [f"**CURRENT TRAFFIC — {loc_label.upper()}**\n"]
        if flow_data and flow_data.get("available"):
            lines.append(f"• **Current Speed**: {flow_data.get('current_speed_kmh')} km/h (Free-flow: {flow_data.get('free_flow_speed_kmh')} km/h)")
            lines.append(f"• **Flow Condition**: {flow_data.get('traffic_condition', 'Flowing Normally')}")
            lines.append(f"• **Segment Delay**: +{flow_data.get('delay_minutes', 0)} min")
            lines.append(f"• **Source**: TomTom Traffic")
        else:
            lines.append("• Current speed telemetry is temporarily unavailable for this exact junction.")

        if inc_data and inc_data.get("available") and inc_data.get("incidents"):
            incidents = inc_data.get("incidents", [])
            lines.append(f"\n**ACTIVE INCIDENTS OBSERVED** (Count: {len(incidents)}):")
            for inc in incidents[:2]:
                lines.append(f"• {inc.get('description', 'Traffic obstruction')} (+{inc.get('delay_minutes', 0)} min delay)")
        else:
            lines.append("\n**INCIDENT CONTEXT**:")
            lines.append("TomTom is not currently reporting an active accident or road obstruction near this corridor. The available data shows standard traffic movement.")

        return "\n".join(lines)

    return (
        f"Traffic data for {loc_label} has been retrieved from TomTom and Google Routes. "
        "Please specify if you would like current traffic speeds, active incidents, or a traffic-aware route."
    )
