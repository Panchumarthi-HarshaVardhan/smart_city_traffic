"""
CityFlow AI - FastAPI Application Backend

Exposes core REST API endpoints for traffic intelligence, ML predictions,
Supabase data access, and health checks.
"""

import sys
import logging
from typing import List, Optional
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure project root is in sys.path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.supabase_client import get_supabase_client
from backend.ml_service import model_service
from backend import data_service
from backend.live_traffic_service import (
    get_live_traffic_flow,
    get_traffic_incidents,
    check_tomtom_health,
)
from backend.traffic_route_service import (
    compute_traffic_aware_routes,
    check_google_routes_health,
)
from backend.emergency_service import (
    get_nearby_hospitals,
    evaluate_and_recommend_hospital,
    analyze_corridor_and_recommend,
)
from backend.traffic_agent import (
    orchestrate_traffic_agent,
    clear_session,
    get_session_history,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cityflow.backend")

app = FastAPI(
    title="CITYFLOW AI Backend",
    description="AI-Powered Urban Traffic Congestion Prediction & Intelligent Route Recommendation System",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------------------------

class BatchPredictRequest(BaseModel):
    road_names: Optional[List[str]] = None
    prediction_date: Optional[str] = None


class RouteSummaryRequest(BaseModel):
    road_names: List[str]


class TrafficRouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float


class RecommendHospitalRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    limit: Optional[int] = 5


class AnalyzeCorridorRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    active_route: Optional[dict] = None
    all_routes: Optional[List[dict]] = None


class AgentChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"
    location: Optional[dict] = None
    role: Optional[str] = "citizen"


class ClearSessionRequest(BaseModel):
    conversation_id: str



# ---------------------------------------------------------------------------
# Health & Status Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    """Root status endpoint."""
    return {
        "service": "CITYFLOW AI backend",
        "status": "running",
        "coverage": {
            "routing": "India-wide",
            "ml_prediction": "Bengaluru (Validated arterial corridors)"
        },
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    """Basic health check endpoint."""
    return {
        "status": "ok",
        "service": "CITYFLOW AI backend",
    }


@app.get("/api/supabase/health")
def supabase_health():
    """
    Verify backend connectivity to Supabase PostgreSQL without exposing credentials.
    """
    try:
        client = get_supabase_client()
        client.table("roads").select("id").limit(1).execute()
        return {
            "status": "connected",
            "database": "supabase",
        }
    except Exception as exc:
        logger.error("Supabase health check failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "disconnected",
                "database": "supabase",
                "error": "Unable to communicate with database",
            },
        )


@app.get("/api/live-traffic/health")
def live_traffic_health():
    """Verify backend connectivity to TomTom Traffic API without exposing keys."""
    return check_tomtom_health()


@app.get("/api/traffic-route/health")
def traffic_route_health():
    """Verify backend connectivity to Google Routes API without exposing keys."""
    return check_google_routes_health()


# ---------------------------------------------------------------------------
# ML Intelligence & Prediction Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/roads")
def get_available_roads():
    """Return all known Bengaluru roads with available ML models."""
    return model_service.get_available_roads()


def _format_prediction(res: dict) -> dict:
    return {
        "road_name": res.get("road"),
        "area_name": res.get("area"),
        "predicted_congestion_level": res.get("predicted_congestion_level"),
        "congestion_category": res.get("congestion_category"),
        "predicted_traffic_volume": res.get("predicted_traffic_volume"),
        "predicted_average_speed": res.get("predicted_average_speed"),
        "model_version": res.get("model_version", "1.0.0"),
        "prediction_date": res.get("prediction_date"),
        "coverage_city": "Bengaluru",
        "signals": [
            "Recent 7-day traffic volume persistence",
            "Road corridor capacity saturation index",
            "Historical speed profile along arterial segment",
            "Environmental & weather precipitation signals",
            "Traffic signal compliance & incident history"
        ],
        "confidence_note": res.get("confidence_note"),
    }


@app.get("/api/predictions/{road_name}")
def get_prediction(road_name: str, prediction_date: Optional[str] = None):
    """Predict traffic volume, average speed, and congestion level for a road."""
    result = model_service.predict_road(road_name=road_name, prediction_date=prediction_date)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return _format_prediction(result)


@app.get("/api/predict/{road_name}")
def predict_single_road(road_name: str, prediction_date: Optional[str] = None):
    """Direct alias for road prediction."""
    return get_prediction(road_name=road_name, prediction_date=prediction_date)


@app.post("/api/predict/batch")
def predict_batch_roads(req: BatchPredictRequest):
    """Predict congestion levels for a list of roads."""
    raw_list = model_service.predict_multiple_roads(
        road_names=req.road_names,
        prediction_date=req.prediction_date
    )
    return [_format_prediction(p) for p in raw_list if "error" not in p]


@app.get("/api/hotspots")
def get_congestion_hotspots(top_n: int = Query(default=10, ge=1, le=50)):
    """Return top AI-predicted traffic congestion hotspots in Bengaluru."""
    return model_service.get_hotspots(top_n=top_n)


@app.get("/api/history/{road_name}")
def get_road_traffic_history(road_name: str, days: int = Query(default=30, ge=1, le=365)):
    """Return historical traffic time series data for a specific road."""
    result = model_service.get_road_history(road_name=road_name, n_days=days)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/traffic/road/{road_name}")
def get_traffic_for_road(road_name: str, days: int = Query(default=30, ge=1, le=365)):
    """Alias for road history."""
    return get_road_traffic_history(road_name=road_name, days=days)


@app.post("/api/routes/summary")
def get_route_summary(req: RouteSummaryRequest):
    """Analyze and aggregate traffic along a multi-segment route."""
    return model_service.get_route_traffic_summary(road_names=req.road_names)


@app.get("/api/models/info")
def get_models_info():
    """Return trained ML model architecture, training windows, and evaluation metrics."""
    return model_service.get_model_info()


@app.get("/api/model-info")
def get_model_info_alias():
    """Alias for model info."""
    return model_service.get_model_info()


# ---------------------------------------------------------------------------
# Supabase Query Endpoints (Data Service)
# ---------------------------------------------------------------------------

@app.get("/api/supabase/roads")
def get_supabase_roads():
    """Retrieve roads stored in Supabase PostgreSQL."""
    return data_service.get_roads()


@app.get("/api/supabase/traffic")
def get_supabase_traffic(road_id: Optional[str] = None, limit: int = 50):
    """Retrieve traffic observations from Supabase."""
    return data_service.get_traffic_history(road_id=road_id, limit=limit)


@app.get("/api/supabase/weather")
def get_supabase_weather(date: Optional[str] = None):
    """Retrieve weather observations from Supabase."""
    return data_service.get_weather(date=date)


# ---------------------------------------------------------------------------
# TomTom Live Traffic & Incidents Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/live-traffic")
def get_live_traffic(
    lat: float = Query(..., description="Latitude of the road segment"),
    lng: float = Query(..., description="Longitude of the road segment"),
    zoom: int = Query(default=10, ge=1, le=18, description="Zoom level for segment detail"),
):
    """
    Retrieve real-time traffic flow speed, free-flow speed, travel time, and condition
    from TomTom Traffic API.
    """
    return get_live_traffic_flow(lat=lat, lng=lng, zoom=zoom)


@app.get("/api/traffic-incidents")
def get_incidents(
    min_lat: Optional[float] = Query(default=None),
    min_lng: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    max_lng: Optional[float] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    radius_km: float = Query(default=15.0),
):
    """
    Retrieve real-time traffic incidents (closures, delays, accidents) from TomTom API.
    """
    if min_lat is None or min_lng is None or max_lat is None or max_lng is None:
        c_lat = lat if lat is not None else 12.9716
        c_lng = lng if lng is not None else 77.5946
        delta_lat = radius_km / 111.0
        delta_lng = radius_km / (111.0 * 0.9)
        min_lat = c_lat - delta_lat
        max_lat = c_lat + delta_lat
        min_lng = c_lng - delta_lng
        max_lng = c_lng + delta_lng

    return get_traffic_incidents(
        min_lat=min_lat,
        min_lng=min_lng,
        max_lat=max_lat,
        max_lng=max_lng,
    )


# ---------------------------------------------------------------------------
# Google Routes (Traffic-Aware Routing) Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/traffic-route")
def calculate_traffic_route_post(req: TrafficRouteRequest):
    """
    Calculate traffic-aware routes, ETAs, and decoded polylines using Google Routes API.
    """
    return compute_traffic_aware_routes(
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        dest_lat=req.dest_lat,
        dest_lng=req.dest_lng,
    )


@app.get("/api/traffic-route")
def calculate_traffic_route_get(
    origin_lat: float = Query(..., description="Origin latitude"),
    origin_lng: float = Query(..., description="Origin longitude"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lng: float = Query(..., description="Destination longitude"),
):
    """GET alias for traffic-aware route calculation."""
    return compute_traffic_aware_routes(
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        dest_lat=dest_lat,
        dest_lng=dest_lng,
    )


# ---------------------------------------------------------------------------
# Emergency Response Intelligence Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/emergency/hospitals-nearby")
def get_hospitals_nearby_endpoint(
    lat: float = Query(..., description="Ambulance or base latitude"),
    lng: float = Query(..., description="Ambulance or base longitude"),
    limit: int = Query(default=5, ge=1, le=10, description="Max candidate hospitals"),
):
    """
    Find nearby candidate hospitals from verified catalog, sorted by proximity.
    """
    return {
        "success": True,
        "count": len(get_nearby_hospitals(lat=lat, lng=lng, limit=limit)),
        "hospitals": get_nearby_hospitals(lat=lat, lng=lng, limit=limit),
    }


@app.post("/api/emergency/recommend-hospital")
def recommend_hospital_endpoint(req: RecommendHospitalRequest):
    """
    Automatically evaluate nearby candidate hospitals from ambulance coordinates
    using traffic-aware routes and recommend the destination with lowest ETA.
    """
    return evaluate_and_recommend_hospital(
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        limit=req.limit or 5,
    )


@app.post("/api/emergency/analyze-corridor")
def analyze_corridor_endpoint(req: AnalyzeCorridorRequest):
    """
    Analyze live traffic problems and incidents along the emergency corridor and
    produce factual, actionable Authority Traffic Management Recommendations.
    """
    return analyze_corridor_and_recommend(
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        dest_lat=req.dest_lat,
        dest_lng=req.dest_lng,
        active_route=req.active_route,
        all_routes=req.all_routes,
    )


# ---------------------------------------------------------------------------
# Traffic Intelligence Agent Endpoints (Groq + Multi-Source Tools)
# ---------------------------------------------------------------------------

@app.post("/api/agent/chat")
def agent_chat_endpoint(req: AgentChatRequest):
    """
    Traffic Intelligence Agent: Grounded conversational reasoning using Groq LLM
    backed by TomTom live flow, TomTom incidents, Google Routes, and CITYFLOW ML.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    return orchestrate_traffic_agent(
        message=req.message,
        conversation_id=req.conversation_id or "default",
        user_location=req.location,
        user_role=req.role or "citizen",
    )


@app.get("/api/agent/prompts")
def agent_prompts_endpoint(role: str = Query(default="citizen")):
    """Return role-tailored prompt suggestions for the agent interface."""
    if role == "authority":
        return {
            "prompts": [
                "Which corridors currently have heavy traffic in Bengaluru?",
                "Why is Sarjapur Road congested right now?",
                "What incidents are currently reported across the city?",
                "What congestion mitigation actions should we consider for Silk Board?",
                "Find the fastest emergency route to St. John's Hospital.",
            ]
        }
    return {
        "prompts": [
            "How is traffic in Bengaluru right now?",
            "What's happening with traffic in Hyderabad?",
            "Why is traffic bad near Silk Board Junction?",
            "Will traffic be bad tomorrow in Bengaluru?",
            "Find a route from Hyderabad to Bengaluru.",
            "What is CITYFLOW AI and how does it predict?",
        ]
    }


@app.post("/api/agent/clear")
def agent_clear_endpoint(req: ClearSessionRequest):
    """Clear conversation history for a given session."""
    clear_session(req.conversation_id)
    return {"success": True, "message": "Session context cleared."}



