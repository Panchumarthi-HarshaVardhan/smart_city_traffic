"""
Data preprocessing module for CityFlow AI.

Merges daily traffic data with daily weather aggregates and cleans the
resulting dataset for downstream modelling.
"""

import os
import numpy as np
import pandas as pd


def preprocess_data(project_root=None):
    """
    Load traffic and daily weather CSVs, merge on date, clean, and save.

    Parameters
    ----------
    project_root : str or None
        Absolute path to the project root directory.
        If None, inferred as the parent of the ml/ directory.

    Returns
    -------
    pd.DataFrame
        Cleaned, merged DataFrame (saved to data/processed/merged_dataset.csv).
    """
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # ── 1. Load traffic data ────────────────────────────────────────────
    traffic_path = os.path.join(project_root, "data", "raw",
                                "Banglore_traffic_Dataset.csv")
    traffic = pd.read_csv(traffic_path)
    print(f"Traffic rows loaded: {len(traffic)}")

    # ── 2. Load daily weather (output of weather_processing.py) ─────────
    weather_path = os.path.join(project_root, "data", "processed",
                                "daily_weather.csv")
    weather = pd.read_csv(weather_path)
    print(f"Weather rows loaded: {len(weather)}")

    # ── 3. Convert traffic 'Date' → datetime, extract date-only ─────────
    traffic["Date"] = pd.to_datetime(traffic["Date"])
    traffic["date"] = traffic["Date"].dt.strftime("%Y-%m-%d")

    # ── 4. Convert weather 'date' to matching string format ─────────────
    weather["date"] = pd.to_datetime(weather["date"]).dt.strftime("%Y-%m-%d")

    # ── 5. LEFT JOIN traffic on weather using the 'date' column ─────────
    rows_before = len(traffic)
    merged = traffic.merge(weather, on="date", how="left")
    rows_after = len(merged)

    # ── 6. Verification prints ──────────────────────────────────────────
    print("\n--- Merge Verification ---")
    print(f"Traffic rows before merge : {rows_before}")
    print(f"Rows after merge          : {rows_after}")

    # Unmatched dates (traffic dates with no weather data)
    weather_dates = set(weather["date"].unique())
    traffic_dates = set(traffic["date"].unique())
    unmatched = sorted(traffic_dates - weather_dates)
    print(f"Unmatched dates (no weather): {len(unmatched)}")
    if unmatched:
        print(f"  First 10: {unmatched[:10]}")

    # Missing weather values after merge
    weather_cols = [c for c in weather.columns if c != "date"]
    missing_weather = merged[weather_cols].isnull().sum()
    missing_any = missing_weather[missing_weather > 0]
    if len(missing_any) > 0:
        print(f"Missing weather values after merge:\n{missing_any.to_string()}")
    else:
        print("Missing weather values after merge: none")

    # Duplicate Date + Road records
    dup_count = merged.duplicated(
        subset=["date", "Road/Intersection Name"], keep=False
    ).sum()
    print(f"Duplicate (date + road) records: {dup_count}")

    # Date range
    date_vals = pd.to_datetime(merged["date"])
    print(f"Date range: {date_vals.min().date()} to {date_vals.max().date()}")

    # ── 7. Clean the merged data ────────────────────────────────────────

    # 7a. Replace inf / -inf with NaN
    merged.replace([np.inf, -np.inf], np.nan, inplace=True)

    # 7b. Impute numerical columns with median
    num_cols = merged.select_dtypes(include=[np.number]).columns
    for col in num_cols:
        if merged[col].isnull().any():
            median_val = merged[col].median()
            merged[col].fillna(median_val, inplace=True)

    # 7c. Impute categorical columns with mode
    cat_cols = merged.select_dtypes(include=["object", "category"]).columns
    for col in cat_cols:
        if merged[col].isnull().any():
            mode_val = merged[col].mode()
            if not mode_val.empty:
                merged[col].fillna(mode_val.iloc[0], inplace=True)

    # 7d. Remove exact duplicate rows (keep first)
    before_dedup = len(merged)
    merged.drop_duplicates(keep="first", inplace=True)
    merged.reset_index(drop=True, inplace=True)
    after_dedup = len(merged)

    # NOTE: We do NOT remove legitimate high congestion / traffic values.
    # The data has many rows capped at 100 for Congestion Level — this is
    # real, not an outlier artefact.

    # Drop the redundant original 'Date' column (keep 'date')
    if "Date" in merged.columns:
        merged.drop(columns=["Date"], inplace=True)

    # ── 8. Save to processed directory ──────────────────────────────────
    out_dir = os.path.join(project_root, "data", "processed")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "merged_dataset.csv")
    merged.to_csv(out_path, index=False)

    # ── 9. Summary ──────────────────────────────────────────────────────
    print("\n--- Cleaned Dataset Summary ---")
    print(f"Rows: {len(merged)}  |  Columns: {len(merged.columns)}")
    print(f"Duplicates removed: {before_dedup - after_dedup}")
    print(f"Remaining NaN: {merged.isnull().sum().sum()}")
    print(f"Columns: {list(merged.columns)}")
    print(f"\nSample (first 3 rows):\n{merged.head(3).to_string()}")
    print(f"\nSaved to: {out_path}")

    # ── 10. Return ──────────────────────────────────────────────────────
    return merged


if __name__ == "__main__":
    preprocess_data()
