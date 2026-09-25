"""
CityFlow AI - Supabase Safe Ingestion Pipeline

Idempotent ingestion pipeline that populates:
1. roads (16 Bengaluru arterial corridors)
2. weather_observations (952 daily Open-Meteo records)
3. traffic_observations (8,936 validated traffic records)
4. predictions (legitimate ML model forecasts)
Leaves route_predictions empty (0 rows) as specified.
"""

import sys
import os
import math
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple

import pandas as pd
import numpy as np

# Ensure project root is in sys.path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.supabase_client import get_supabase_client
from backend.ml_service import model_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("ingest")

# Trusted road coordinates from curated frontend data
TRUSTED_ROAD_COORDINATES = {
    "Sarjapur Road": (12.9242, 77.6543),
    "Sony World Junction": (12.9348, 77.6271),
    "Anil Kumble Circle": (12.9756, 77.6067),
    "Trinity Circle": (12.9729, 77.6198),
    "100 Feet Road": (12.9784, 77.6408),
    "CMH Road": (12.9788, 77.6385),
    "South End Circle": (12.9352, 77.5802),
    "Jayanagar 4th Block": (12.9299, 77.5828),
    "Ballari Road": (13.0358, 77.5970),
    "Hebbal Flyover": (13.0382, 77.5919),
    "Marathahalli Bridge": (12.9554, 77.7011),
    "ITPL Main Road": (12.9866, 77.7317),
    "Hosur Road": (12.8452, 77.6602),
    "Silk Board Junction": (12.9176, 77.6233),
    "Tumkur Road": (13.0285, 77.5408),
    "Yeshwanthpur Circle": (13.0232, 77.5504),
}


def validate_local_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Validate raw and processed input datasets before database operations."""
    logger.info("--- Validating Local Data ---")
    traffic_path = project_root / "data" / "raw" / "Banglore_traffic_Dataset.csv"
    weather_path = project_root / "data" / "processed" / "daily_weather.csv"

    if not traffic_path.exists():
        raise FileNotFoundError(f"Missing traffic dataset at {traffic_path}")
    if not weather_path.exists():
        raise FileNotFoundError(f"Missing daily weather dataset at {weather_path}")

    traffic_df = pd.read_csv(traffic_path)
    weather_df = pd.read_csv(weather_path)

    logger.info("Traffic dataset rows: %d, columns: %d", len(traffic_df), len(traffic_df.columns))
    logger.info("Weather dataset rows: %d, columns: %d", len(weather_df), len(weather_df.columns))

    if len(traffic_df) != 8936:
        raise ValueError(f"Expected 8936 traffic rows, got {len(traffic_df)}")
    if len(weather_df) != 952:
        raise ValueError(f"Expected 952 weather rows, got {len(weather_df)}")

    unique_roads = traffic_df["Road/Intersection Name"].nunique()
    if unique_roads != 16:
        raise ValueError(f"Expected 16 unique roads, got {unique_roads}")

    # Verify no nulls in critical key columns
    if traffic_df["Date"].isna().any() or traffic_df["Road/Intersection Name"].isna().any():
        raise ValueError("Null values found in traffic key columns")
    if weather_df["date"].isna().any():
        raise ValueError("Null values found in weather date column")

    logger.info("[PASS] Local dataset validation passed successfully.")
    return traffic_df, weather_df


def ingest_roads(client, traffic_df: pd.DataFrame) -> Dict[str, str]:
    """Extract and upsert unique roads into Supabase."""
    logger.info("\n--- Ingesting Roads (16 unique corridors) ---")
    unique_pairs = traffic_df[["Road/Intersection Name", "Area Name"]].drop_duplicates()

    roads_to_upsert = []
    for _, row in unique_pairs.iterrows():
        road_name = str(row["Road/Intersection Name"]).strip()
        area_name = str(row["Area Name"]).strip()
        coords = TRUSTED_ROAD_COORDINATES.get(road_name)

        roads_to_upsert.append({
            "road_name": road_name,
            "area_name": area_name,
            "latitude": float(coords[0]) if coords else None,
            "longitude": float(coords[1]) if coords else None,
        })

    # Upsert with on_conflict='road_name'
    res = client.table("roads").upsert(roads_to_upsert, on_conflict="road_name").execute()
    logger.info("Upserted %d roads.", len(roads_to_upsert))

    # Fetch all roads to build road_name -> id mapping
    all_roads = client.table("roads").select("id, road_name").execute().data
    road_name_to_id = {r["road_name"]: r["id"] for r in all_roads}

    if len(road_name_to_id) != 16:
        raise ValueError(f"Expected 16 roads in database, found {len(road_name_to_id)}")

    logger.info("[PASS] Verified all 16 roads registered with UUIDs.")
    return road_name_to_id


def ingest_weather(client, weather_df: pd.DataFrame, batch_size: int = 500):
    """Upsert daily weather observations in batches."""
    logger.info("\n--- Ingesting Weather Observations (952 rows) ---")
    weather_records = []
    for _, row in weather_df.iterrows():
        record = {
            "observation_date": str(row["date"]),
            "temperature_mean": float(row["temperature_mean"]) if not pd.isna(row["temperature_mean"]) else None,
            "temperature_min": float(row["temperature_min"]) if not pd.isna(row["temperature_min"]) else None,
            "temperature_max": float(row["temperature_max"]) if not pd.isna(row["temperature_max"]) else None,
            "humidity_mean": float(row["humidity_mean"]) if not pd.isna(row["humidity_mean"]) else None,
            "humidity_min": float(row["humidity_min"]) if not pd.isna(row["humidity_min"]) else None,
            "humidity_max": float(row["humidity_max"]) if not pd.isna(row["humidity_max"]) else None,
            "precipitation_sum": float(row["precipitation_sum"]) if not pd.isna(row["precipitation_sum"]) else None,
            "rain_sum": float(row["rain_sum"]) if not pd.isna(row["rain_sum"]) else None,
            "wind_speed_mean": float(row["wind_speed_mean"]) if not pd.isna(row["wind_speed_mean"]) else None,
            "wind_speed_max": float(row["wind_speed_max"]) if not pd.isna(row["wind_speed_max"]) else None,
            "weather_code": int(row["weather_code_mode"]) if not pd.isna(row["weather_code_mode"]) else None,
            "rain_hours": int(row["rain_hours"]) if not pd.isna(row["rain_hours"]) else None,
            "precipitation_hours": int(row["precipitation_hours"]) if not pd.isna(row["precipitation_hours"]) else None,
            "latitude": 12.970123,
            "longitude": 77.56364,
            "source": "Open-Meteo",
        }
        weather_records.append(record)

    total = len(weather_records)
    for i in range(0, total, batch_size):
        chunk = weather_records[i:i + batch_size]
        client.table("weather_observations").upsert(chunk, on_conflict="observation_date").execute()
        logger.info("  Weather batch %d - %d of %d ingested", i + 1, min(i + batch_size, total), total)

    logger.info("[PASS] Weather observations ingestion completed.")


def ingest_traffic(client, traffic_df: pd.DataFrame, road_name_to_id: Dict[str, str], batch_size: int = 500):
    """Upsert traffic observations in batches."""
    logger.info("\n--- Ingesting Traffic Observations (8,936 rows) ---")
    traffic_records = []
    for _, row in traffic_df.iterrows():
        road_name = str(row["Road/Intersection Name"]).strip()
        road_id = road_name_to_id.get(road_name)
        if not road_id:
            raise ValueError(f"Orphan road name encountered in traffic data: {road_name}")

        record = {
            "road_id": road_id,
            "observation_date": str(row["Date"]),
            "traffic_volume": int(round(row["Traffic Volume"])),
            "average_speed": round(float(row["Average Speed"]), 2),
            "travel_time_index": round(float(row["Travel Time Index"]), 2),
            "congestion_level": round(float(row["Congestion Level"]), 2),
            "road_capacity_utilization": round(float(row["Road Capacity Utilization"]), 2),
            "incident_reports": int(row["Incident Reports"]),
            "environmental_impact": round(float(row["Environmental Impact"]), 2),
            "public_transport_usage": round(float(row["Public Transport Usage"]), 2),
            "traffic_signal_compliance": round(float(row["Traffic Signal Compliance"]), 2),
            "parking_usage": round(float(row["Parking Usage"]), 2),
            "pedestrian_cyclist_count": int(row["Pedestrian and Cyclist Count"]),
            "weather_conditions": str(row["Weather Conditions"]),
            "roadwork_construction_activity": str(row["Roadwork and Construction Activity"]),
        }
        traffic_records.append(record)

    total = len(traffic_records)
    for i in range(0, total, batch_size):
        chunk = traffic_records[i:i + batch_size]
        client.table("traffic_observations").upsert(chunk, on_conflict="road_id,observation_date").execute()
        logger.info("  Traffic batch %d - %d of %d ingested", i + 1, min(i + batch_size, total), total)

    logger.info("[PASS] Traffic observations ingestion completed.")


def ingest_predictions(client, road_name_to_id: Dict[str, str]):
    """Generate and ingest legitimate ML predictions from existing models."""
    logger.info("\n--- Generating and Ingesting ML Predictions ---")
    # Generate default next-day predictions and latest common date predictions
    raw_preds_default = model_service.predict_multiple_roads()
    raw_preds_latest_date = model_service.predict_multiple_roads(prediction_date="2024-08-09")

    # Deduplicate predictions by (road_name, prediction_date)
    combined = {}
    for p in raw_preds_default + raw_preds_latest_date:
        if "error" not in p:
            key = (p["road"], p["prediction_date"])
            combined[key] = p

    pred_records = []
    for (road_name, pred_date), p in combined.items():
        road_id = road_name_to_id.get(road_name)
        if not road_id:
            raise ValueError(f"Road not found for prediction: {road_name}")

        pred_records.append({
            "road_id": road_id,
            "prediction_date": pred_date,
            "predicted_traffic_volume": round(float(p["predicted_traffic_volume"]), 1),
            "predicted_average_speed": round(float(p["predicted_average_speed"]), 1),
            "predicted_congestion_level": round(float(p["predicted_congestion_level"]), 1),
            "congestion_category": str(p["congestion_category"]),
            "model_version": str(p.get("model_version", "1.0.0")),
        })

    logger.info("Generated %d legitimate predictions across %d roads.", len(pred_records), len(combined))

    # Fetch existing predictions to ensure idempotency without duplicate rows
    existing = client.table("predictions").select("id, road_id, prediction_date, model_version").execute().data
    existing_keys = {
        (r["road_id"], r["prediction_date"], r["model_version"]): r["id"]
        for r in existing
    }

    records_to_insert = []
    for r in pred_records:
        k = (r["road_id"], r["prediction_date"], r["model_version"])
        if k not in existing_keys:
            records_to_insert.append(r)

    if records_to_insert:
        client.table("predictions").insert(records_to_insert).execute()
        logger.info("Inserted %d new predictions into Supabase.", len(records_to_insert))
    else:
        logger.info("All %d predictions already exist in Supabase (idempotency check passed).", len(pred_records))

    logger.info("[PASS] Predictions ingestion completed.")


def run_post_ingestion_verification(client, traffic_df: pd.DataFrame, weather_df: pd.DataFrame):
    """Run full verification, integrity checks, and local vs database comparisons."""
    logger.info("\n" + "=" * 60)
    logger.info("POST-INGESTION DATABASE VERIFICATION & AUDIT")
    logger.info("=" * 60)

    # 1. Row counts
    roads_res = client.table("roads").select("*", count="exact").execute()
    weather_res = client.table("weather_observations").select("*", count="exact").execute()
    traffic_res = client.table("traffic_observations").select("*", count="exact").execute()
    pred_res = client.table("predictions").select("*", count="exact").execute()
    route_res = client.table("route_predictions").select("*", count="exact").execute()

    roads_count = roads_res.count
    weather_count = weather_res.count
    traffic_count = traffic_res.count
    pred_count = pred_res.count
    route_count = route_res.count

    print(f"\n1. TABLE ROW COUNTS:")
    print(f"   roads: {roads_count} (Expected: 16)")
    print(f"   weather_observations: {weather_count} (Expected: 952)")
    print(f"   traffic_observations: {traffic_count} (Expected: 8,936)")
    print(f"   predictions: {pred_count}")
    print(f"   route_predictions: {route_count} (Expected: 0)")

    # 2. Duplicate checks
    roads_data = client.table("roads").select("road_name").execute().data
    road_names = [r["road_name"] for r in roads_data]
    road_dups = len(road_names) - len(set(road_names))
    print(f"\n2. DUPLICATE CHECKS:")
    print(f"   roads duplicate road_name: {road_dups}")

    weather_dates = client.table("weather_observations").select("observation_date").execute().data
    w_dates = [w["observation_date"] for w in weather_dates]
    w_dups = len(w_dates) - len(set(w_dates))
    print(f"   weather duplicate observation_date: {w_dups}")

    # Check predictions duplicate keys
    pred_keys = [
        (p["road_id"], p["prediction_date"], p["model_version"])
        for p in pred_res.data
    ]
    p_dups = len(pred_keys) - len(set(pred_keys))
    print(f"   predictions duplicate (road_id + date + version): {p_dups}")

    # 3. Orphan checks
    known_road_ids = set(r["id"] for r in client.table("roads").select("id").execute().data)
    traffic_road_ids = set(t["road_id"] for t in client.table("traffic_observations").select("road_id").limit(1000).execute().data)
    orphan_traffic = len(traffic_road_ids - known_road_ids)

    pred_road_ids = set(p["road_id"] for p in pred_res.data)
    orphan_pred = len(pred_road_ids - known_road_ids)

    print(f"\n3. ORPHAN INTEGRITY CHECKS:")
    print(f"   orphan traffic road_id: {orphan_traffic}")
    print(f"   orphan prediction road_id: {orphan_pred}")

    # 4. Date ranges
    traffic_min_res = client.table("traffic_observations").select("observation_date").order("observation_date", desc=False).limit(1).execute()
    traffic_max_res = client.table("traffic_observations").select("observation_date").order("observation_date", desc=True).limit(1).execute()
    weather_min_res = client.table("weather_observations").select("observation_date").order("observation_date", desc=False).limit(1).execute()
    weather_max_res = client.table("weather_observations").select("observation_date").order("observation_date", desc=True).limit(1).execute()
    pred_dates_res = client.table("predictions").select("prediction_date").execute().data
    distinct_pred_dates = sorted(set(p["prediction_date"] for p in pred_dates_res))

    t_min = traffic_min_res.data[0]["observation_date"] if traffic_min_res.data else None
    t_max = traffic_max_res.data[0]["observation_date"] if traffic_max_res.data else None
    w_min = weather_min_res.data[0]["observation_date"] if weather_min_res.data else None
    w_max = weather_max_res.data[0]["observation_date"] if weather_max_res.data else None

    print(f"\n4. DATE RANGE CHECKS:")
    print(f"   traffic min date: {t_min} | max date: {t_max}")
    print(f"   weather min date: {w_min} | max date: {w_max}")
    print(f"   prediction dates generated: {distinct_pred_dates}")

    # 5. Local vs Supabase comparison
    print(f"\n5. LOCAL VS SUPABASE VALIDATION:")
    print(f"   Local traffic rows: {len(traffic_df)} == Supabase: {traffic_count} -> {'MATCH' if len(traffic_df) == traffic_count else 'MISMATCH'}")
    print(f"   Local weather rows: {len(weather_df)} == Supabase: {weather_count} -> {'MATCH' if len(weather_df) == weather_count else 'MISMATCH'}")
    print(f"   Local roads count: 16 == Supabase: {roads_count} -> {'MATCH' if roads_count == 16 else 'MISMATCH'}")
    print(f"   Traffic dates: local ({traffic_df['Date'].min()} to {traffic_df['Date'].max()}) == Supabase ({t_min} to {t_max}) -> {'MATCH' if t_min == traffic_df['Date'].min() and t_max == traffic_df['Date'].max() else 'MISMATCH'}")
    print(f"   Weather dates: local ({weather_df['date'].min()} to {weather_df['date'].max()}) == Supabase ({w_min} to {w_max}) -> {'MATCH' if w_min == weather_df['date'].min() and w_max == weather_df['date'].max() else 'MISMATCH'}")


def main():
    logger.info("Starting CityFlow AI Phase 4 Supabase Ingestion...")
    traffic_df, weather_df = validate_local_data()

    client = get_supabase_client()
    road_name_to_id = ingest_roads(client, traffic_df)
    ingest_weather(client, weather_df, batch_size=500)
    ingest_traffic(client, traffic_df, road_name_to_id, batch_size=500)
    ingest_predictions(client, road_name_to_id)

    run_post_ingestion_verification(client, traffic_df, weather_df)


if __name__ == "__main__":
    main()
