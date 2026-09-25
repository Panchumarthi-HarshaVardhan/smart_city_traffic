"""
CRITICAL LEAKAGE PREVENTION TESTS

Verifies:
1. No target columns in feature matrix
2. No raw current target-source columns in feature matrix
3. lag_1 strictly refers to day D-1, never current day D
4. rolling features are computed strictly from historical values (shift(1).rolling())
5. Chronological splitting ensures no future information in training
"""

import os
import sys
import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.feature_engineering import get_feature_columns
from ml.train import get_split_dates


@pytest.fixture(scope="module")
def root_dir():
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_no_target_columns_in_features(root_dir):
    data_path = os.path.join(root_dir, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(data_path):
        pytest.skip("final_ml_dataset.csv not ready yet")

    df = pd.read_csv(data_path)
    feature_cols = get_feature_columns(df)

    targets = ["next_day_congestion", "next_day_traffic_volume", "next_day_average_speed"]
    for t in targets:
        assert t not in feature_cols, f"Target column '{t}' found in feature matrix!"


def test_no_raw_target_source_columns_in_features(root_dir):
    data_path = os.path.join(root_dir, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(data_path):
        pytest.skip("final_ml_dataset.csv not ready yet")

    df = pd.read_csv(data_path)
    feature_cols = get_feature_columns(df)

    raw_targets = [
        "Congestion Level",
        "Traffic Volume",
        "Average Speed",
        "Travel Time Index",
        "Road Capacity Utilization",
    ]
    for raw in raw_targets:
        assert raw not in feature_cols, f"Raw target-source column '{raw}' found in feature matrix!"


def test_lag1_is_strictly_previous_day(root_dir):
    merged_path = os.path.join(root_dir, "data", "processed", "merged_dataset.csv")
    final_path = os.path.join(root_dir, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(merged_path) or not os.path.exists(final_path):
        pytest.skip("Datasets not ready yet")

    df_merged = pd.read_csv(merged_path)
    df_final = pd.read_csv(final_path)

    # Pick a specific road
    road = "Silk Board Junction"
    date_col = "Date" if "Date" in df_merged.columns else "date"

    sub_merged = df_merged[df_merged["Road/Intersection Name"] == road].sort_values(date_col).reset_index(drop=True)
    sub_final = df_final[df_final["Road/Intersection Name"] == road].sort_values(date_col).reset_index(drop=True)

    # Check multiple dates: lag_1 at row i must equal raw Traffic Volume at row i-1
    for i in range(1, min(10, len(sub_final))):
        expected_vol = sub_merged.loc[i - 1, "Traffic Volume"]
        actual_lag1 = sub_final.loc[i, "traffic_volume_lag_1"]
        assert actual_lag1 == expected_vol, f"Lag 1 mismatch at index {i}: {actual_lag1} != {expected_vol}"


def test_rolling_mean_strictly_uses_historical(root_dir):
    final_path = os.path.join(root_dir, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(final_path):
        pytest.skip("final_ml_dataset.csv not ready yet")

    df_final = pd.read_csv(final_path)
    road = "Hebbal Flyover"
    date_col = "Date" if "Date" in df_final.columns else "date"

    sub = df_final[df_final["Road/Intersection Name"] == road].sort_values(date_col).reset_index(drop=True)

    # At row 5, rolling_3 should be mean of rows 4, 3, 2's raw volume, which corresponds to lag_1 of rows 5, 4, 3
    for i in range(4, min(10, len(sub))):
        expected_mean = (sub.loc[i, "traffic_volume_lag_1"] + 
                         sub.loc[i - 1, "traffic_volume_lag_1"] + 
                         sub.loc[i - 2, "traffic_volume_lag_1"]) / 3.0
        actual_roll = sub.loc[i, "traffic_volume_roll_mean_3"]
        assert abs(actual_roll - expected_mean) < 1e-4, f"Rolling mean mismatch at row {i}"


def test_chronological_split_no_leakage(root_dir):
    final_path = os.path.join(root_dir, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(final_path):
        pytest.skip("final_ml_dataset.csv not ready yet")

    df = pd.read_csv(final_path)
    date_col = "Date" if "Date" in df.columns else "date"

    splits = get_split_dates(df, date_col=date_col)

    train_start, train_end = splits["train"]
    val_start, val_end = splits["val"]
    test_start, test_end = splits["test"]

    # Verify strict temporal ordering
    assert train_end < val_start, f"Train overlaps validation! Train end: {train_end}, Val start: {val_start}"
    assert val_end < test_start, f"Validation overlaps test! Val end: {val_end}, Test start: {test_start}"
