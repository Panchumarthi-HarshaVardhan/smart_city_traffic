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


# ---------------------------------------------------------------------------
# Health & Status Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    """Root status endpoint."""
    return {
        "service": "CITYFLOW AI backend",
        "status": "running",
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


# ---------------------------------------------------------------------------
# ML Intelligence & Prediction Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/roads")
def get_available_roads():
    """Return all known Bengaluru roads with available ML models."""
    return model_service.get_available_roads()


@app.get("/api/predict/{road_name}")
def predict_single_road(road_name: str, prediction_date: Optional[str] = None):
    """Predict traffic volume, average speed, and congestion level for a road."""
    result = model_service.predict_road(road_name=road_name, prediction_date=prediction_date)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/api/predict/batch")
def predict_batch_roads(req: BatchPredictRequest):
    """Predict congestion levels for a list of roads."""
    return model_service.predict_multiple_roads(
        road_names=req.road_names,
        prediction_date=req.prediction_date
    )


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


@app.post("/api/routes/summary")
def get_route_summary(req: RouteSummaryRequest):
    """Analyze and aggregate traffic along a multi-segment route."""
    return model_service.get_route_traffic_summary(road_names=req.road_names)


@app.get("/api/models/info")
def get_models_info():
    """Return trained ML model architecture, training windows, and evaluation metrics."""
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
