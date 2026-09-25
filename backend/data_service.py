"""
CityFlow AI - Supabase Read-Only Data Service

Provides high-level read-only query helpers for retrieving roads,
weather observations, traffic history, predictions, and hotspots from Supabase.
"""

import logging
from typing import List, Dict, Any, Optional
from backend.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


def get_roads() -> List[Dict[str, Any]]:
    """
    Retrieve all registered roads from the Supabase 'roads' table.
    
    Returns:
        List of road dictionaries with id, road_name, area_name, latitude, longitude.
    """
    try:
        client = get_supabase_client()
        res = client.table("roads").select("*").order("road_name").execute()
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query roads from Supabase: %s", exc)
        return []


def get_traffic_history(
    road_id: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Retrieve historical traffic observations.

    Args:
        road_id: Optional road UUID/ID to filter observations.
        limit: Maximum number of rows to return (default: 100).

    Returns:
        List of traffic observation records.
    """
    try:
        client = get_supabase_client()
        query = client.table("traffic_observations").select("*")
        if road_id:
            query = query.eq("road_id", road_id)
        res = query.order("observation_date", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query traffic history from Supabase: %s", exc)
        return []


def get_weather(date: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve weather observation records.

    Args:
        date: Optional ISO date string (YYYY-MM-DD) to filter weather.

    Returns:
        List of weather observation records.
    """
    try:
        client = get_supabase_client()
        query = client.table("weather_observations").select("*")
        if date:
            query = query.eq("observation_date", date)
        res = query.order("observation_date", desc=True).limit(30).execute()
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query weather observations from Supabase: %s", exc)
        return []


def get_predictions(
    date: Optional[str] = None,
    road_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve model predictions from Supabase.

    Args:
        date: Optional ISO date string (YYYY-MM-DD) to filter predictions.
        road_id: Optional road UUID/ID to filter predictions.

    Returns:
        List of prediction records.
    """
    try:
        client = get_supabase_client()
        query = client.table("predictions").select("*")
        if date:
            query = query.eq("prediction_date", date)
        if road_id:
            query = query.eq("road_id", road_id)
        res = query.order("prediction_date", desc=True).execute()
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query predictions from Supabase: %s", exc)
        return []


def get_latest_predictions() -> List[Dict[str, Any]]:
    """
    Retrieve the most recent batch of predictions for all roads.

    Returns:
        List of prediction records for the latest available prediction date.
    """
    try:
        client = get_supabase_client()
        # Find latest prediction date
        latest_res = (
            client.table("predictions")
            .select("prediction_date")
            .order("prediction_date", desc=True)
            .limit(1)
            .execute()
        )
        if not latest_res.data:
            return []

        latest_date = latest_res.data[0]["prediction_date"]
        res = (
            client.table("predictions")
            .select("*, roads(road_name, area_name, latitude, longitude)")
            .eq("prediction_date", latest_date)
            .order("predicted_congestion_level", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query latest predictions from Supabase: %s", exc)
        return []


def get_hotspots(threshold: float = 70.0) -> List[Dict[str, Any]]:
    """
    Identify current / predicted congestion hotspots.

    Args:
        threshold: Minimum predicted congestion score to qualify as a hotspot.

    Returns:
        List of hotspot records ordered by predicted congestion descending.
    """
    try:
        client = get_supabase_client()
        # Query predictions with high congestion
        res = (
            client.table("predictions")
            .select("*, roads(road_name, area_name, latitude, longitude)")
            .gte("predicted_congestion_level", threshold)
            .order("predicted_congestion_level", desc=True)
            .limit(20)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.error("Failed to query hotspots from Supabase: %s", exc)
        return []
