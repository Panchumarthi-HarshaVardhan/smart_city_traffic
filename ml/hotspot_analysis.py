"""
CityFlow AI - Hotspot Analysis Module

Identifies and ranks high-congestion bottlenecks across Bengaluru roads.
Used by frontend dashboard and route planner to avoid severe congestion zones.
"""

import os
import pandas as pd
from ml.predict import predict_multiple_roads


def get_hotspots(project_root=None, top_n=None):
    """
    Retrieve ranked list of road congestion hotspots for Bengaluru.
    Sorted descending by predicted congestion level.
    """
    preds = predict_multiple_roads(project_root=project_root)
    if not preds:
        return []

    # Sort descending by predicted congestion
    hotspots = sorted(preds, key=lambda x: x["predicted_congestion_level"], reverse=True)

    formatted = []
    for h in hotspots:
        formatted.append({
            "road": h["road"],
            "area": h["area"],
            "predicted_congestion": h["predicted_congestion_level"],
            "predicted_speed": h["predicted_average_speed"],
            "predicted_traffic_volume": h["predicted_traffic_volume"],
            "congestion_category": h["congestion_category"],
        })

    if top_n is not None and top_n > 0:
        return formatted[:top_n]
    return formatted


def get_congestion_summary(project_root=None):
    """Generate high-level city-wide traffic health overview."""
    hotspots = get_hotspots(project_root=project_root)
    if not hotspots:
        return {}

    cong_values = [h["predicted_congestion"] for h in hotspots]
    categories = [h["congestion_category"] for h in hotspots]

    return {
        "total_roads": len(hotspots),
        "severe_count": categories.count("SEVERE"),
        "high_count": categories.count("HIGH"),
        "moderate_count": categories.count("MODERATE"),
        "low_count": categories.count("LOW"),
        "average_congestion": round(float(sum(cong_values) / len(cong_values)), 1),
        "worst_road": hotspots[0]["road"],
        "worst_congestion": hotspots[0]["predicted_congestion"],
        "best_road": hotspots[-1]["road"],
        "best_congestion": hotspots[-1]["predicted_congestion"],
    }
