"""
CityFlow AI - Supabase Connection and Schema Verification Test

Tests connectivity to Supabase PostgreSQL and verifies table presence
and column schemas without modifying or ingesting any data.
"""

import sys
import os
from pathlib import Path

# Add project root to sys.path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.supabase_client import get_supabase_client

REQUIRED_COLUMNS = {
    "roads": [
        "id", "road_name", "area_name", "latitude", "longitude"
    ],
    "weather_observations": [
        "observation_date", "temperature_mean", "humidity_mean",
        "precipitation_sum", "rain_sum", "wind_speed_mean", "weather_code"
    ],
    "traffic_observations": [
        "road_id", "observation_date", "traffic_volume", "average_speed",
        "travel_time_index", "congestion_level", "road_capacity_utilization",
        "incident_reports", "environmental_impact"
    ],
    "predictions": [
        "road_id", "prediction_date", "predicted_traffic_volume",
        "predicted_average_speed", "predicted_congestion_level",
        "congestion_category", "model_version"
    ],
    "route_predictions": [
        "source_location", "destination_location", "route_id",
        "distance_km", "base_duration_minutes", "predicted_duration_minutes",
        "predicted_congestion", "congestion_category", "recommendation_reason"
    ],
}


def run_tests() -> dict:
    """Run connection and schema verification tests against Supabase."""
    print("=" * 60)
    print("CITYFLOW AI — SUPABASE CONNECTION & SCHEMA TEST")
    print("=" * 60)

    results = {
        "client_init": False,
        "tables": {},
        "schema_verified": {},
        "missing_columns": {},
        "all_passed": True,
    }

    try:
        client = get_supabase_client()
        results["client_init"] = True
        print("[PASS] Supabase client initialized successfully")
    except Exception as exc:
        print(f"[FAIL] Supabase client initialization failed: {exc}")
        results["all_passed"] = False
        return results

    print("\n--- Testing Table Connectivity ---")
    for table_name in REQUIRED_COLUMNS.keys():
        try:
            res = client.table(table_name).select("*", count="exact").limit(1).execute()
            count = res.count if res.count is not None else len(res.data)
            results["tables"][table_name] = {
                "status": "CONNECTED",
                "count": count
            }
            print(f"Table '{table_name}': CONNECTED (rows: {count})")
        except Exception as exc:
            results["tables"][table_name] = {
                "status": "FAILED",
                "error": str(exc)
            }
            results["all_passed"] = False
            print(f"Table '{table_name}': FAILED ({exc})")

    print("\n--- Verifying Table Column Schemas ---")
    for table_name, expected_cols in REQUIRED_COLUMNS.items():
        missing = []
        for col in expected_cols:
            try:
                # PostgREST validates column names in select clause; raises PGRST204 if missing
                client.table(table_name).select(col).limit(0).execute()
            except Exception:
                missing.append(col)

        if missing:
            results["schema_verified"][table_name] = False
            results["missing_columns"][table_name] = missing
            results["all_passed"] = False
            print(f"Table '{table_name}': SCHEMA MISMATCH - Missing columns: {missing}")
        else:
            results["schema_verified"][table_name] = True
            print(f"Table '{table_name}': SCHEMA VERIFIED ({len(expected_cols)}/{len(expected_cols)} columns present)")

    print("\n" + "=" * 60)
    if results["all_passed"]:
        print("RESULT: ALL SUPABASE TESTS PASSED")
    else:
        print("RESULT: SOME TESTS FAILED")
    print("=" * 60)

    return results


if __name__ == "__main__":
    test_results = run_tests()
    if not test_results["all_passed"]:
        sys.exit(1)
