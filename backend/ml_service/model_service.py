# CityFlow AI - Model Service
"""
FastAPI integration module for CityFlow AI ML predictions.

Wraps the ml package's prediction and analysis functions for use by
the FastAPI backend. All public helpers return plain dicts / lists so
they can be serialised to JSON by FastAPI without extra work.
"""

import sys
import os
import json
import logging
from datetime import datetime, timedelta

import pandas as pd

# ---------------------------------------------------------------------------
# Path setup – make sure the *project root* is on sys.path so that
# ``import ml`` works regardless of how the FastAPI app is launched.
# ---------------------------------------------------------------------------
project_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy imports from the ml package – wrapped so the service can still
# start even if the ml package has not been fully built yet.
# ---------------------------------------------------------------------------
try:
    from ml.predict import predict_road as _ml_predict_road
    from ml.predict import predict_multiple_roads as _ml_predict_multiple_roads
except ImportError as exc:
    logger.warning("ml.predict not available: %s", exc)
    _ml_predict_road = None
    _ml_predict_multiple_roads = None

try:
    from ml.hotspot_analysis import get_hotspots as _ml_get_hotspots
except ImportError as exc:
    logger.warning("ml.hotspot_analysis not available: %s", exc)
    _ml_get_hotspots = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_project_root() -> str:
    """Return the absolute path to the project root directory."""
    return project_root


def _dataset_path() -> str:
    """Return the absolute path to the processed ML dataset."""
    return os.path.join(project_root, "data", "processed", "final_ml_dataset.csv")


def _model_metadata_path() -> str:
    """Return the absolute path to the model metadata JSON."""
    return os.path.join(project_root, "ml", "models", "model_metadata.json")


def _load_dataset() -> pd.DataFrame:
    """Load the final ML dataset and return it as a DataFrame."""
    path = _dataset_path()
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")
    return pd.read_csv(path)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_road(road_name: str, prediction_date: str = None) -> dict:
    """Return an AI-predicted congestion dict for a single road.

    Parameters
    ----------
    road_name : str
        Exact name of the road / intersection as it appears in the dataset.
    prediction_date : str, optional
        ISO-format date string (YYYY-MM-DD). Defaults to tomorrow if omitted.

    Returns
    -------
    dict
        Prediction result or ``{"error": "<message>"}`` on failure.
    """
    try:
        if _ml_predict_road is None:
            return {"error": "ml.predict module is not available"}

        kwargs = {"road_name": road_name}
        if prediction_date is not None:
            kwargs["prediction_date"] = prediction_date

        result = _ml_predict_road(**kwargs)
        return result
    except Exception as exc:
        logger.exception("predict_road failed for %s", road_name)
        return {"error": str(exc)}


def predict_multiple_roads(
    road_names: list = None, prediction_date: str = None
) -> list:
    """Return AI-predicted congestion dicts for several roads.

    Parameters
    ----------
    road_names : list, optional
        List of road names. If *None*, the underlying ml function will
        predict for all known roads.
    prediction_date : str, optional
        ISO-format date string (YYYY-MM-DD).

    Returns
    -------
    list
        List of prediction dicts, or a single-element list containing an
        error dict on failure.
    """
    try:
        if _ml_predict_multiple_roads is None:
            return [{"error": "ml.predict module is not available"}]

        kwargs = {}
        if road_names is not None:
            kwargs["road_names"] = road_names
        if prediction_date is not None:
            kwargs["prediction_date"] = prediction_date

        results = _ml_predict_multiple_roads(**kwargs)
        return results
    except Exception as exc:
        logger.exception("predict_multiple_roads failed")
        return [{"error": str(exc)}]


def get_road_history(road_name: str, n_days: int = 30) -> dict:
    """Return the last *n_days* of historical data for a given road.

    Parameters
    ----------
    road_name : str
        Exact road / intersection name.
    n_days : int
        Number of most-recent days to return (default 30).

    Returns
    -------
    dict
        Keys: ``road_name``, ``dates``, ``traffic_volume``,
        ``average_speed``, ``congestion_level``, ``n_days``.
        Or ``{"error": "<message>"}`` on failure.
    """
    try:
        df = _load_dataset()

        road_df = df[df["Road/Intersection Name"] == road_name].copy()
        if road_df.empty:
            return {"error": f"No data found for road: {road_name}"}

        road_df["date"] = pd.to_datetime(road_df["date"])
        road_df = road_df.sort_values("date", ascending=True)
        road_df = road_df.tail(n_days)

        return {
            "road_name": road_name,
            "n_days": len(road_df),
            "dates": road_df["date"].dt.strftime("%Y-%m-%d").tolist(),
            "traffic_volume": road_df["Traffic Volume"].tolist(),
            "average_speed": road_df["Average Speed"].tolist(),
            "congestion_level": road_df["Congestion Level"].tolist(),
        }
    except Exception as exc:
        logger.exception("get_road_history failed for %s", road_name)
        return {"error": str(exc)}


def get_hotspots(top_n: int = None) -> list:
    """Return congestion hotspot information.

    Parameters
    ----------
    top_n : int, optional
        Number of top hotspots to return. Passed through to the
        underlying ``ml.hotspot_analysis.get_hotspots``.

    Returns
    -------
    list
        List of hotspot dicts, or a single-element list with an error
        dict on failure.
    """
    try:
        if _ml_get_hotspots is None:
            return [{"error": "ml.hotspot_analysis module is not available"}]

        kwargs = {}
        if top_n is not None:
            kwargs["top_n"] = top_n

        results = _ml_get_hotspots(**kwargs)
        return results
    except Exception as exc:
        logger.exception("get_hotspots failed")
        return [{"error": str(exc)}]


def get_route_traffic_summary(road_names: list) -> dict:
    """Return an AI-predicted traffic summary for a set of roads.

    This is useful for route-level overviews: it collects individual
    road predictions, computes aggregate statistics, and suggests a
    departure strategy.

    Parameters
    ----------
    road_names : list
        List of road / intersection names along the route.

    Returns
    -------
    dict
        Summary dict with keys ``road_predictions``,
        ``average_congestion``, ``max_congestion``,
        ``recommended_departure``, and ``note``.
        Or ``{"error": "<message>"}`` on failure.
    """
    try:
        road_predictions = []
        for name in road_names:
            pred = predict_road(name)
            road_predictions.append(pred)

        # Collect congestion values from successful predictions
        congestion_values = []
        for pred in road_predictions:
            if "error" not in pred:
                cong = pred.get("predicted_congestion_level", pred.get("predicted_congestion", pred.get("congestion_level")))
                if cong is not None:
                    congestion_values.append(float(cong))

        if congestion_values:
            avg_congestion = round(sum(congestion_values) / len(congestion_values), 2)
            max_congestion = round(max(congestion_values), 2)
        else:
            avg_congestion = None
            max_congestion = None

        recommended_departure = _recommend_departure(avg_congestion)

        return {
            "road_predictions": road_predictions,
            "average_congestion": avg_congestion,
            "max_congestion": max_congestion,
            "recommended_departure": recommended_departure,
            "note": "AI-predicted travel conditions based on historical patterns",
        }
    except Exception as exc:
        logger.exception("get_route_traffic_summary failed")
        return {"error": str(exc)}


def _recommend_departure(avg_congestion) -> str:
    """Return a human-readable departure recommendation string.

    The recommendation is based on AI-predicted average congestion
    along the route and should *not* be interpreted as live traffic
    guidance.
    """
    if avg_congestion is None:
        return "Unable to determine — insufficient prediction data"
    if avg_congestion < 30:
        return "AI-predicted low congestion — flexible departure time"
    if avg_congestion < 60:
        return "AI-predicted moderate congestion — consider departing early"
    if avg_congestion < 80:
        return "AI-predicted high congestion — depart well before peak hours"
    return "AI-predicted very high congestion — strongly recommend off-peak departure"


def get_available_roads() -> list:
    """Return a sorted list of all road / intersection names in the dataset.

    Returns
    -------
    list
        Unique road names, or a single-element list with an error dict.
    """
    try:
        df = _load_dataset()
        roads = sorted(df["Road/Intersection Name"].dropna().unique().tolist())
        return roads
    except Exception as exc:
        logger.exception("get_available_roads failed")
        return [{"error": str(exc)}]


def get_model_info() -> dict:
    """Load and return the model metadata JSON.

    Returns
    -------
    dict
        Model metadata, or ``{"error": "<message>"}`` on failure.
    """
    try:
        path = _model_metadata_path()
        if not os.path.exists(path):
            return {"error": f"Model metadata not found at {path}"}

        with open(path, "r") as fh:
            metadata = json.load(fh)
        return metadata
    except Exception as exc:
        logger.exception("get_model_info failed")
        return {"error": str(exc)}
