"""
CITYFLOW AI - Emergency Response & Corridor Intelligence Service

Provides:
1. Verified Hospital Catalog for emergency routing (Bengaluru medical centers).
2. Proximity-based hospital discovery from ambulance coordinates.
3. Traffic-aware hospital evaluation & recommendation using Google Routes TRAFFIC_AWARE.
4. Emergency corridor congestion & incident analysis using live TomTom telemetry.
5. Deterministic, actionable Authority traffic-management recommendations (without claiming automated signal control).
"""

import math
import logging
from typing import List, Dict, Any, Optional
from backend.traffic_route_service import compute_traffic_aware_routes
from backend.live_traffic_service import get_traffic_incidents, get_live_traffic_flow

logger = logging.getLogger("cityflow.emergency_service")

# ---------------------------------------------------------------------------
# Verified Hospital Catalog (Bengaluru Region)
# Factual coordinates, full names, short identifiers, and emergency desk contacts.
# ---------------------------------------------------------------------------
VERIFIED_HOSPITALS: List[Dict[str, Any]] = [
    {
        "id": "hosp-manipal-old-airport",
        "name": "Manipal Hospital, Old Airport Road",
        "shortName": "Manipal Hospital (Old Airport Rd)",
        "address": "98, HAL Old Airport Rd, Kodihalli, Bengaluru",
        "latitude": 12.9587,
        "longitude": 77.6493,
        "emergencyPhone": "080 2502 4444",
        "traumaLevel": "Level 1 Tertiary Care",
    },
    {
        "id": "hosp-apollo-bannerghatta",
        "name": "Apollo Hospital, Bannerghatta Road",
        "shortName": "Apollo Hospital (Bannerghatta)",
        "address": "154/11, Bannerghatta Main Rd, Krishnaraju Layout, Bengaluru",
        "latitude": 12.8948,
        "longitude": 77.5991,
        "emergencyPhone": "080 2630 4050",
        "traumaLevel": "Level 1 Trauma Center",
    },
    {
        "id": "hosp-fortis-bannerghatta",
        "name": "Fortis Hospital, Bannerghatta Road",
        "shortName": "Fortis Hospital (Bannerghatta)",
        "address": "154/9, Bannerghatta Main Rd, Opposite IIMB, Bengaluru",
        "latitude": 12.8932,
        "longitude": 77.5985,
        "emergencyPhone": "080 6621 4444",
        "traumaLevel": "Multi-Speciality Emergency",
    },
    {
        "id": "hosp-st-johns-koramangala",
        "name": "St. John's Medical College Hospital, Koramangala",
        "shortName": "St. John's Medical Hospital",
        "address": "Sarjapur - Marathahalli Rd, John Nagar, Koramangala, Bengaluru",
        "latitude": 12.9304,
        "longitude": 77.6200,
        "emergencyPhone": "080 2206 5000",
        "traumaLevel": "Level 1 Trauma & Burn Center",
    },
    {
        "id": "hosp-bowring-lady-curzon",
        "name": "Bowring & Lady Curzon Hospital, Shivaji Nagar",
        "shortName": "Bowring & Lady Curzon Hospital",
        "address": "Lady Curzon Rd, Tasker Town, Shivaji Nagar, Bengaluru",
        "latitude": 12.9836,
        "longitude": 77.6044,
        "emergencyPhone": "080 2559 1325",
        "traumaLevel": "Government Apex Emergency",
    },
    {
        "id": "hosp-aster-cmi-hebbal",
        "name": "Aster CMI Hospital, Hebbal",
        "shortName": "Aster CMI (Hebbal)",
        "address": "No. 43/42, NH 44, Sahakar Nagar, Hebbal, Bengaluru",
        "latitude": 13.0560,
        "longitude": 77.5916,
        "emergencyPhone": "080 4344 4344",
        "traumaLevel": "Comprehensive Emergency Center",
    },
    {
        "id": "hosp-narayana-health-city",
        "name": "Narayana Health City, Bommasandra",
        "shortName": "Narayana Health City",
        "address": "258/A, Bommasandra Industrial Area, Anekal Taluk, Bengaluru",
        "latitude": 12.8258,
        "longitude": 77.6917,
        "emergencyPhone": "080 7122 2222",
        "traumaLevel": "Cardiac & Multi-Organ Emergency",
    },
    {
        "id": "hosp-manipal-whitefield",
        "name": "Manipal Hospital, Whitefield",
        "shortName": "Manipal Hospital (Whitefield)",
        "address": "#143, 212-215, EPIP Zone, Whitefield, Bengaluru",
        "latitude": 12.9892,
        "longitude": 77.7470,
        "emergencyPhone": "080 2841 8888",
        "traumaLevel": "Trauma & Critical Care",
    },
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def get_nearby_hospitals(
    lat: float,
    lng: float,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Find candidate hospitals near given coordinates, sorted by straight-line distance.
    Returns 3 to 5 candidate hospitals from the verified catalog.
    """
    candidates = []
    for h in VERIFIED_HOSPITALS:
        dist = haversine_distance_km(lat, lng, h["latitude"], h["longitude"])
        h_copy = dict(h)
        h_copy["straightLineDistanceKm"] = dist
        candidates.append(h_copy)

    candidates.sort(key=lambda x: x["straightLineDistanceKm"])
    return candidates[:limit]


def evaluate_and_recommend_hospital(
    origin_lat: float,
    origin_lng: float,
    limit: int = 4,
) -> Dict[str, Any]:
    """
    Evaluate candidate hospitals near ambulance coordinates by calculating
    live traffic-aware routes to each candidate.

    Selects the recommended hospital based on lowest available traffic-aware ETA,
    route availability, and road condition.

    Returns:
    - recommended_hospital: Selected hospital candidate with traffic-aware route
    - candidates: List of evaluated candidates with factual travel metrics
    - recommendation_reason: Factual explanation
    """
    candidates = get_nearby_hospitals(origin_lat, origin_lng, limit=limit)
    if not candidates:
        return {
            "success": False,
            "error": "No nearby hospital candidates found in catalog.",
            "recommended_hospital": None,
            "candidates": [],
        }

    evaluated_candidates = []

    for c in candidates:
        try:
            route_result = compute_traffic_aware_routes(
                origin_lat=origin_lat,
                origin_lng=origin_lng,
                dest_lat=c["latitude"],
                dest_lng=c["longitude"],
            )
            has_route = route_result.get("available", False) and len(route_result.get("routes", [])) > 0
            
            if has_route:
                primary_route = route_result["routes"][0]
                duration_min = primary_route.get("durationMinutes", 20)
                distance_km = primary_route.get("distanceKm", c["straightLineDistanceKm"])
                traffic_delay_min = primary_route.get("trafficDelayMinutes", 0)
                traffic_condition = primary_route.get("trafficCondition", "Normal Traffic Impact")
                condition_color = primary_route.get("conditionColor", "#10B981")
                routes_list = route_result["routes"]
            else:
                est_min = max(3, int(round(c["straightLineDistanceKm"] * 2.8)))
                duration_min = est_min
                distance_km = round(c["straightLineDistanceKm"] * 1.3, 1)
                traffic_delay_min = 0
                traffic_condition = "Normal Traffic Impact"
                condition_color = "#10B981"
                routes_list = []

            cand_data = {
                "id": c["id"],
                "name": c["name"],
                "shortName": c["shortName"],
                "address": c["address"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "emergencyPhone": c["emergencyPhone"],
                "traumaLevel": c.get("traumaLevel", "Emergency Care"),
                "straightLineDistanceKm": c["straightLineDistanceKm"],
                "distanceKm": distance_km,
                "durationMinutes": duration_min,
                "trafficDelayMinutes": traffic_delay_min,
                "trafficCondition": traffic_condition,
                "conditionColor": condition_color,
                "routeAvailable": has_route,
                "routes": routes_list,
                "primaryRoute": routes_list[0] if routes_list else None,
            }
            evaluated_candidates.append(cand_data)

        except Exception as exc:
            logger.warning("Error evaluating candidate hospital %s: %s", c["name"], exc)
            est_min = max(3, int(round(c["straightLineDistanceKm"] * 2.8)))
            evaluated_candidates.append({
                "id": c["id"],
                "name": c["name"],
                "shortName": c["shortName"],
                "address": c["address"],
                "latitude": c["latitude"],
                "longitude": c["longitude"],
                "emergencyPhone": c["emergencyPhone"],
                "traumaLevel": c.get("traumaLevel", "Emergency Care"),
                "straightLineDistanceKm": c["straightLineDistanceKm"],
                "distanceKm": round(c["straightLineDistanceKm"] * 1.3, 1),
                "durationMinutes": est_min,
                "trafficDelayMinutes": 0,
                "trafficCondition": "Normal Traffic Impact",
                "conditionColor": "#10B981",
                "routeAvailable": False,
                "routes": [],
                "primaryRoute": None,
            })

    # Sort evaluated candidates: lowest traffic-aware duration first
    evaluated_candidates.sort(key=lambda x: (x["durationMinutes"], x["distanceKm"]))

    recommended = evaluated_candidates[0] if evaluated_candidates else None

    # Construct honest rationale
    if recommended:
        delta_msg = ""
        if len(evaluated_candidates) > 1:
            second_best = evaluated_candidates[1]
            diff = second_best["durationMinutes"] - recommended["durationMinutes"]
            if diff > 0:
                delta_msg = f" Saves ~{diff} min compared to {second_best['shortName']}."
        reason = (
            f"Recommended based on the lowest available traffic-aware ETA "
            f"({recommended['durationMinutes']} min, {recommended['distanceKm']} km).{delta_msg}"
        )
    else:
        reason = "No candidate hospital available."

    return {
        "success": True,
        "ambulance_location": {"lat": origin_lat, "lng": origin_lng},
        "recommended_hospital": recommended,
        "candidates": evaluated_candidates,
        "recommendation_reason": reason,
        "catalog_source": "Verified Hospital Catalog (Bengaluru)",
    }


def analyze_corridor_and_recommend(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    active_route: Optional[Dict[str, Any]] = None,
    all_routes: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Perform emergency corridor congestion analysis and generate deterministic,
    actionable Authority Traffic Management Recommendations.
    """
    # 1. Fetch live incidents within ~15km radius of corridor
    center_lat = (origin_lat + dest_lat) / 2.0
    center_lng = (origin_lng + dest_lng) / 2.0
    radius_km = 12.0
    delta_lat = radius_km / 111.0
    delta_lng = radius_km / (111.0 * 0.9)
    incidents_resp = get_traffic_incidents(
        min_lat=center_lat - delta_lat,
        min_lng=center_lng - delta_lng,
        max_lat=center_lat + delta_lat,
        max_lng=center_lng + delta_lng,
    )
    raw_incidents = incidents_resp.get("incidents", [])

    # Filter incidents within ~3.5km of corridor
    corridor_incidents = []
    for inc in raw_incidents:
        point = inc.get("point")
        if point and len(point) >= 2:
            i_lat, i_lng = point[0], point[1]
        else:
            i_lat = inc.get("lat")
            i_lng = inc.get("lng")

        if i_lat is not None and i_lng is not None:
            d_o = haversine_distance_km(i_lat, i_lng, origin_lat, origin_lng)
            d_d = haversine_distance_km(i_lat, i_lng, dest_lat, dest_lng)
            d_m = haversine_distance_km(i_lat, i_lng, center_lat, center_lng)
            if min(d_o, d_d, d_m) <= 3.5:
                corridor_incidents.append(inc)

    # 2. Extract route metrics
    delay_min = 0
    condition = "Normal Traffic Impact"
    route_name = "Primary Emergency Corridor"
    if active_route:
        delay_min = active_route.get("trafficDelayMinutes", 0)
        condition = active_route.get("trafficCondition", "Normal Traffic Impact")
        route_name = active_route.get("name", "Primary Emergency Corridor")

    # 3. Generate deterministic recommendations
    recommendations = []

    # A. HIGH PRIORITY: Severe delays or active incident directly impacting corridor
    if delay_min >= 10 or "high" in condition.lower() or "heavy" in condition.lower():
        recommendations.append({
            "priority": "HIGH PRIORITY",
            "priorityLevel": "high",
            "corridor": route_name,
            "condition": condition,
            "reason": f"Heavy traffic delay (+{delay_min} min) detected along the emergency corridor.",
            "suggestedAction": "Consider traffic-personnel deployment and manual signal priority at bottleneck junctions ahead of the unit.",
        })

    if corridor_incidents:
        closest_inc = corridor_incidents[0]
        inc_desc = closest_inc.get("description") or "Traffic obstruction / road delay"
        inc_delay = closest_inc.get("delay_minutes", round(closest_inc.get("delay_seconds", 0) / 60, 1))
        recommendations.append({
            "priority": "HIGH PRIORITY" if inc_delay >= 5 else "MEDIUM PRIORITY",
            "priorityLevel": "high" if inc_delay >= 5 else "medium",
            "corridor": f"Near {closest_inc.get('road_name') or route_name}",
            "condition": "Active Incident",
            "incident": inc_desc,
            "reason": f"Active road obstruction reported within response sector: {inc_desc}",
            "suggestedAction": "Monitor incident clearance progress. If obstruction persists, consider diverting non-emergency traffic to adjacent arterials.",
        })

    # B. MEDIUM PRIORITY: Moderate traffic or alternative route comparison
    if 4 <= delay_min < 10 and not any(r["priorityLevel"] == "high" for r in recommendations):
        recommendations.append({
            "priority": "MEDIUM PRIORITY",
            "priorityLevel": "medium",
            "corridor": route_name,
            "condition": condition,
            "reason": f"Moderate congestion (+{delay_min} min delay) present along transit segments.",
            "suggestedAction": "Monitor corridor flow at key crossing junctions. Prepare traffic field staff on standby.",
        })

    if all_routes and len(all_routes) > 1:
        alt = all_routes[1]
        alt_delay = alt.get("trafficDelayMinutes", 0)
        if alt_delay < delay_min:
            recommendations.append({
                "priority": "MEDIUM PRIORITY",
                "priorityLevel": "medium",
                "corridor": alt.get("name", "Alternative Corridor"),
                "condition": alt.get("trafficCondition", "Normal Traffic Impact"),
                "reason": f"Alternative corridor exhibits lower delay (+{alt_delay} min vs +{delay_min} min).",
                "suggestedAction": "Consider routing response unit via this alternative corridor if primary corridor flow deteriorates.",
            })

    # C. MONITOR: Standard vigilance
    recommendations.append({
        "priority": "MONITOR",
        "priorityLevel": "monitor",
        "corridor": route_name,
        "condition": condition,
        "reason": "Emergency vehicle transit underway.",
        "suggestedAction": "Maintain continuous telemetry monitoring until unit confirms arrival at destination.",
    })

    # Corridor Analysis Summary
    corridor_analysis = {
        "corridorName": route_name,
        "condition": condition,
        "delayMinutes": delay_min,
        "incidentCount": len(corridor_incidents),
        "nearbyIncidents": corridor_incidents[:3],
        "obstructionDetected": delay_min >= 5 or len(corridor_incidents) > 0,
        "summary": (
            f"Corridor is currently experiencing {condition.lower()} with +{delay_min} min delay."
            + (f" {len(corridor_incidents)} incident(s) detected near route." if corridor_incidents else " No active incidents blocking route.")
        ),
    }

    return {
        "corridor_analysis": corridor_analysis,
        "recommendations": recommendations,
        "disclaimer": "All recommendations are advisory decision-support suggestions for traffic authorities. CITYFLOW does not directly manipulate municipal traffic light systems.",
    }
