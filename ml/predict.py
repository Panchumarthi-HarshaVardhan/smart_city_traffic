"""
CityFlow AI - Road-Level Traffic & Congestion Prediction Module

Provides:
- Model loading from ml/models/
- Next-day prediction for single roads
- Batch prediction across all known roads in Bengaluru
- Route integration helper for OSRM ETA adjustment
"""

import os
import json
import logging
from datetime import datetime, timedelta

import joblib
import numpy as np
import pandas as pd

from ml.config import categorize_congestion

logger = logging.getLogger(__name__)

_MODELS_CACHE = {}


def load_models(project_root=None):
    """Load all serialized models, encoders, and schemas with in-memory caching."""
    global _MODELS_CACHE

    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    models_dir = os.path.join(project_root, "ml", "models")
    if not os.path.exists(models_dir):
        raise FileNotFoundError(f"Models directory not found at {models_dir}. Run training first.")

    if _MODELS_CACHE.get("loaded"):
        return _MODELS_CACHE

    cong_path = os.path.join(models_dir, "congestion_model.joblib")
    vol_path = os.path.join(models_dir, "traffic_volume_model.joblib")
    spd_path = os.path.join(models_dir, "speed_model.joblib")
    enc_path = os.path.join(models_dir, "encoders.joblib")
    schema_path = os.path.join(models_dir, "feature_schema.json")
    meta_path = os.path.join(models_dir, "model_metadata.json")

    for p in [cong_path, vol_path, spd_path, enc_path, schema_path, meta_path]:
        if not os.path.exists(p):
            raise FileNotFoundError(f"Required model artifact missing: {p}")

    bundle = joblib.load(enc_path)
    with open(schema_path, "r") as f:
        schema = json.load(f)
    with open(meta_path, "r") as f:
        metadata = json.load(f)

    _MODELS_CACHE = {
        "congestion_model": joblib.load(cong_path),
        "traffic_volume_model": joblib.load(vol_path),
        "speed_model": joblib.load(spd_path),
        "encoders": bundle["encoders"],
        "medians": bundle["medians"],
        "categorical_cols": bundle["categorical_cols"],
        "feature_names": schema["feature_names"],
        "metadata": metadata,
        "loaded": True,
    }

    return _MODELS_CACHE


def _get_latest_features_for_road(road_name, project_root=None):
    """Fetch the most recent feature row for a given road from final_ml_dataset.csv."""
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    dataset_path = os.path.join(project_root, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Processed dataset not found at {dataset_path}")

    df = pd.read_csv(dataset_path)
    date_col = "Date" if "Date" in df.columns else "date"
    road_col = "Road/Intersection Name"

    road_df = df[df[road_col].str.lower() == road_name.strip().lower()].sort_values(date_col)
    if road_df.empty:
        available = sorted(df[road_col].unique().tolist())
        return None, None, f"Road '{road_name}' not found. Available roads: {available}"

    latest_row = road_df.iloc[-1].copy()
    area_name = latest_row["Area Name"]
    return latest_row, area_name, None


def predict_road(road_name, prediction_date=None, project_root=None):
    """
    Generate next-day traffic, speed, and congestion forecasts for a specific road.
    
    Returns clean dictionary with AI-predicted values and congestion severity.
    """
    try:
        cache = load_models(project_root=project_root)
    except Exception as e:
        return {"error": f"Failed to load models: {str(e)}"}

    latest_row, area_name, err = _get_latest_features_for_road(road_name, project_root=project_root)
    if err:
        return {"error": err}

    feature_names = cache["feature_names"]
    encoders = cache["encoders"]
    medians = cache["medians"]
    cat_cols = cache["categorical_cols"]

    # Build feature vector
    feat_series = latest_row[feature_names].copy()

    # Apply date override if requested
    if prediction_date:
        try:
            dt = pd.to_datetime(prediction_date)
            if "year" in feat_series: feat_series["year"] = dt.year
            if "month" in feat_series: feat_series["month"] = dt.month
            if "day" in feat_series: feat_series["day"] = dt.day
            if "day_of_week" in feat_series: feat_series["day_of_week"] = dt.dayofweek
            if "day_of_year" in feat_series: feat_series["day_of_year"] = dt.dayofyear
            if "week_of_year" in feat_series: feat_series["week_of_year"] = int(dt.isocalendar()[1])
            if "is_weekend" in feat_series: feat_series["is_weekend"] = int(dt.dayofweek >= 5)
            if "day_of_week_sin" in feat_series: feat_series["day_of_week_sin"] = np.sin(2 * np.pi * dt.dayofweek / 7)
            if "day_of_week_cos" in feat_series: feat_series["day_of_week_cos"] = np.cos(2 * np.pi * dt.dayofweek / 7)
            if "month_sin" in feat_series: feat_series["month_sin"] = np.sin(2 * np.pi * (dt.month - 1) / 12)
            if "month_cos" in feat_series: feat_series["month_cos"] = np.cos(2 * np.pi * (dt.month - 1) / 12)
        except Exception:
            pass
    else:
        # Default next-day prediction from latest dataset date
        last_date = str(latest_row.get("date", latest_row.get("Date", "2024-08-09")))
        prediction_date = (pd.to_datetime(last_date) + timedelta(days=1)).strftime("%Y-%m-%d")

    # Encode categoricals and impute missing
    row_df = pd.DataFrame([feat_series])
    for c in cat_cols:
        if c in row_df.columns:
            le = encoders[c]
            val = str(row_df[c].iloc[0])
            if val in le.classes_:
                row_df[c] = le.transform([val])[0]
            else:
                row_df[c] = le.transform([le.classes_[0]])[0]

    num_cols = [c for c in feature_names if c not in cat_cols]
    for c in num_cols:
        med = medians.get(c, 0.0)
        row_df[c] = row_df[c].fillna(med)

    X_input = row_df[feature_names]

    # Predict using the three models
    pred_vol = float(cache["traffic_volume_model"].predict(X_input)[0])
    pred_spd = float(cache["speed_model"].predict(X_input)[0])
    pred_cong = float(cache["congestion_model"].predict(X_input)[0])

    # Bound physical constraints
    pred_cong = max(0.0, min(100.0, pred_cong))
    pred_vol = max(0.0, pred_vol)
    pred_spd = max(5.0, pred_spd)

    category = categorize_congestion(pred_cong)

    return {
        "road": latest_row["Road/Intersection Name"],
        "area": area_name,
        "prediction_date": prediction_date,
        "predicted_traffic_volume": round(pred_vol, 1),
        "predicted_average_speed": round(pred_spd, 1),
        "predicted_congestion_level": round(pred_cong, 1),
        "congestion_category": category,
        "model_version": cache["metadata"].get("model_version", "1.0.0"),
        "confidence_note": "AI-predicted traffic conditions based on historical road patterns and weather",
    }


def predict_multiple_roads(road_names=None, prediction_date=None, project_root=None):
    """Predict traffic and congestion for a list of roads (or all 16 roads if None)."""
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if road_names is None:
        dataset_path = os.path.join(project_root, "data", "processed", "final_ml_dataset.csv")
        df = pd.read_csv(dataset_path)
        road_names = sorted(df["Road/Intersection Name"].unique().tolist())

    results = []
    for r in road_names:
        res = predict_road(r, prediction_date=prediction_date, project_root=project_root)
        if "error" not in res:
            results.append(res)
    return results


def get_road_prediction(road_name, project_root=None):
    """Specialized helper for route engine integration (OSRM ETA adjustment)."""
    return predict_road(road_name, project_root=project_root)
