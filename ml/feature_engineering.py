"""
Feature engineering module for CityFlow AI.

Creates date features, cyclic encodings, road-level lag/rolling features,
and next-day prediction targets from the merged traffic + weather dataset.
"""

import os
import numpy as np
import pandas as pd


# ── Columns to EXCLUDE from the feature set ─────────────────────────────────
_EXCLUDE_COLS = {
    # identifiers / date
    "Date", "date",
    # next-day targets
    "next_day_congestion", "next_day_traffic_volume", "next_day_average_speed",
    # raw current-day target-source columns (use lag features instead)
    "Traffic Volume", "Average Speed", "Congestion Level",
    "Travel Time Index", "Road Capacity Utilization",
}


def get_feature_columns(df):
    """Return the list of feature column names from a feature-engineered DataFrame.

    Keeps Road/Intersection Name and Area Name (for label-encoding downstream).
    Excludes date columns, raw target-source columns, and next-day targets.

    Parameters
    ----------
    df : pd.DataFrame
        A DataFrame produced by :func:`engineer_features`.

    Returns
    -------
    list[str]
        Ordered list of feature column names.
    """
    return [c for c in df.columns if c not in _EXCLUDE_COLS]


def engineer_features(project_root=None):
    """Build the full ML feature matrix from the merged dataset.

    Steps
    -----
    1. Load ``data/processed/merged_dataset.csv``
    2. Parse dates and extract calendar features
    3. Add cyclic encodings for day-of-week and month
    4. Create road-level lag and rolling features (shift-then-roll)
    5. Create three next-day prediction targets
    6. Drop rows with NaN targets
    7. Save intermediate and final datasets

    Parameters
    ----------
    project_root : str or None
        Absolute path to the project root.  When *None*, inferred as the
        parent of the ``ml/`` package directory.

    Returns
    -------
    pd.DataFrame
        Final ML-ready DataFrame (also saved to
        ``data/processed/final_ml_dataset.csv``).
    """
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # ── 1. Load merged data ─────────────────────────────────────────────
    merged_path = os.path.join(project_root, "data", "processed",
                               "merged_dataset.csv")
    df = pd.read_csv(merged_path)
    print(f"Loaded merged dataset: {df.shape[0]} rows × {df.shape[1]} cols")

    # ── 2. Convert date column ──────────────────────────────────────────
    date_col = "Date" if "Date" in df.columns else "date"
    df[date_col] = pd.to_datetime(df[date_col])

    # ── 3. Date features ────────────────────────────────────────────────
    dt = df[date_col]
    df["year"] = dt.dt.year
    df["month"] = dt.dt.month
    df["day"] = dt.dt.day
    df["day_of_week"] = dt.dt.dayofweek            # 0 = Monday
    df["day_of_year"] = dt.dt.dayofyear
    df["week_of_year"] = dt.dt.isocalendar().week.astype(int)
    df["is_weekend"] = (dt.dt.dayofweek >= 5).astype(int)

    # ── 4. Cyclic features ──────────────────────────────────────────────
    df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * (df["month"] - 1) / 12)
    df["month_cos"] = np.cos(2 * np.pi * (df["month"] - 1) / 12)

    # ── 5. Sort by road, then date ──────────────────────────────────────
    df.sort_values(["Road/Intersection Name", date_col], inplace=True)
    df.reset_index(drop=True, inplace=True)

    # ── 6. Road-level lag & rolling features ────────────────────────────
    #     CRITICAL: shift(n) first, then rolling(), so the current day's
    #     value never enters its own features.
    road_grp = df.groupby("Road/Intersection Name")

    # --- Traffic Volume ---
    df["traffic_volume_lag_1"] = road_grp["Traffic Volume"].shift(1)
    df["traffic_volume_lag_3"] = road_grp["Traffic Volume"].shift(3)
    df["traffic_volume_lag_7"] = road_grp["Traffic Volume"].shift(7)
    df["traffic_volume_roll_mean_3"] = (
        road_grp["Traffic Volume"].shift(1)
        .rolling(window=3, min_periods=1).mean()
    )
    df["traffic_volume_roll_mean_7"] = (
        road_grp["Traffic Volume"].shift(1)
        .rolling(window=7, min_periods=1).mean()
    )

    # --- Average Speed ---
    df["average_speed_lag_1"] = road_grp["Average Speed"].shift(1)
    df["average_speed_lag_7"] = road_grp["Average Speed"].shift(7)
    df["average_speed_roll_mean_3"] = (
        road_grp["Average Speed"].shift(1)
        .rolling(window=3, min_periods=1).mean()
    )
    df["average_speed_roll_mean_7"] = (
        road_grp["Average Speed"].shift(1)
        .rolling(window=7, min_periods=1).mean()
    )

    # --- Congestion Level ---
    df["congestion_lag_1"] = road_grp["Congestion Level"].shift(1)
    df["congestion_lag_3"] = road_grp["Congestion Level"].shift(3)
    df["congestion_lag_7"] = road_grp["Congestion Level"].shift(7)
    df["congestion_roll_mean_3"] = (
        road_grp["Congestion Level"].shift(1)
        .rolling(window=3, min_periods=1).mean()
    )
    df["congestion_roll_mean_7"] = (
        road_grp["Congestion Level"].shift(1)
        .rolling(window=7, min_periods=1).mean()
    )

    # --- Travel Time Index ---
    df["tti_lag_1"] = road_grp["Travel Time Index"].shift(1)
    df["tti_lag_7"] = road_grp["Travel Time Index"].shift(7)

    # --- Road Capacity Utilization ---
    df["capacity_lag_1"] = road_grp["Road Capacity Utilization"].shift(1)
    df["capacity_lag_7"] = road_grp["Road Capacity Utilization"].shift(7)

    # ── 7. Save feature dataset (before targets) ────────────────────────
    out_dir = os.path.join(project_root, "data", "processed")
    os.makedirs(out_dir, exist_ok=True)
    feature_path = os.path.join(out_dir, "feature_dataset.csv")
    df.to_csv(feature_path, index=False)
    print(f"Feature dataset saved to: {feature_path}")

    # ── 8. Create next-day prediction targets ───────────────────────────
    road_grp = df.groupby("Road/Intersection Name")
    df["next_day_congestion"] = road_grp["Congestion Level"].shift(-1)
    df["next_day_traffic_volume"] = road_grp["Traffic Volume"].shift(-1)
    df["next_day_average_speed"] = road_grp["Average Speed"].shift(-1)

    # ── 9. Drop rows with NaN targets (last row per road) ───────────────
    target_cols = ["next_day_congestion", "next_day_traffic_volume",
                   "next_day_average_speed"]
    before_drop = len(df)
    df.dropna(subset=target_cols, inplace=True)
    df.reset_index(drop=True, inplace=True)
    after_drop = len(df)
    print(f"Dropped {before_drop - after_drop} rows with NaN targets "
          f"(last row per road)")

    # ── 10. Save final ML dataset ───────────────────────────────────────
    final_path = os.path.join(out_dir, "final_ml_dataset.csv")
    df.to_csv(final_path, index=False)
    print(f"Final ML dataset saved to: {final_path}")

    # ── 11. Summary ─────────────────────────────────────────────────────
    feature_cols = get_feature_columns(df)
    lag_cols = [c for c in df.columns if "lag_" in c or "roll_" in c]

    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING SUMMARY")
    print("=" * 60)
    print(f"Shape              : {df.shape[0]} rows × {df.shape[1]} cols")
    print(f"Feature columns    : {len(feature_cols)}")
    print(f"Lag/rolling cols   : {len(lag_cols)}")
    print(f"Remaining NaN      : {df.isnull().sum().sum()}")

    print("\n--- Sample lag values (first 5 non-null) ---")
    for col in ["traffic_volume_lag_1", "congestion_lag_1",
                "average_speed_lag_1"]:
        if col in df.columns:
            sample = df[col].dropna().head(5).tolist()
            print(f"  {col}: {sample}")

    print("\n--- Target statistics ---")
    for col in target_cols:
        print(f"  {col}:")
        print(f"    {df[col].describe().to_string()}")

    print(f"\nFeature columns ({len(feature_cols)}):")
    print(f"  {feature_cols}")

    # ── 12. Return ──────────────────────────────────────────────────────
    return df


if __name__ == "__main__":
    engineer_features()
