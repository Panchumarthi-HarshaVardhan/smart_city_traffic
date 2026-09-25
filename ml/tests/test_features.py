"""
Tests for feature engineering, calendar attributes, lag features, and targets.
"""

import os
import sys
import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.config import categorize_congestion
from ml.feature_engineering import get_feature_columns


@pytest.fixture(scope="module")
def processed_datasets():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    final_path = os.path.join(root, "data", "processed", "final_ml_dataset.csv")
    feature_path = os.path.join(root, "data", "processed", "feature_dataset.csv")
    
    if not os.path.exists(final_path) or not os.path.exists(feature_path):
        pytest.skip("Processed datasets not generated yet.")
    
    df_final = pd.read_csv(final_path)
    df_feat = pd.read_csv(feature_path)
    return df_final, df_feat


def test_date_features_created(processed_datasets):
    df_final, _ = processed_datasets
    expected_date_cols = ["year", "month", "day", "day_of_week", "day_of_year", "week_of_year", "is_weekend"]
    for col in expected_date_cols:
        assert col in df_final.columns, f"Missing date feature: {col}"


def test_cyclic_features_range(processed_datasets):
    df_final, _ = processed_datasets
    cyclic_cols = ["day_of_week_sin", "day_of_week_cos", "month_sin", "month_cos"]
    for col in cyclic_cols:
        assert col in df_final.columns
        assert df_final[col].min() >= -1.0 - 1e-5
        assert df_final[col].max() <= 1.0 + 1e-5


def test_lag_features_exist(processed_datasets):
    df_final, _ = processed_datasets
    required_lags = [
        "traffic_volume_lag_1", "traffic_volume_lag_3", "traffic_volume_lag_7",
        "average_speed_lag_1", "average_speed_lag_7",
        "congestion_lag_1", "congestion_lag_3", "congestion_lag_7",
        "tti_lag_1", "tti_lag_7",
        "capacity_lag_1", "capacity_lag_7",
    ]
    for col in required_lags:
        assert col in df_final.columns, f"Missing lag column: {col}"


def test_rolling_features_exist(processed_datasets):
    df_final, _ = processed_datasets
    required_rolls = [
        "traffic_volume_roll_mean_3", "traffic_volume_roll_mean_7",
        "average_speed_roll_mean_3", "average_speed_roll_mean_7",
        "congestion_roll_mean_3", "congestion_roll_mean_7",
    ]
    for col in required_rolls:
        assert col in df_final.columns, f"Missing rolling column: {col}"


def test_targets_created_and_no_nan(processed_datasets):
    df_final, _ = processed_datasets
    target_cols = ["next_day_congestion", "next_day_traffic_volume", "next_day_average_speed"]
    for col in target_cols:
        assert col in df_final.columns, f"Missing target column: {col}"
        assert df_final[col].isnull().sum() == 0, f"Found NaN values in target {col}"


def test_congestion_categorization():
    assert categorize_congestion(20.0) == "LOW"
    assert categorize_congestion(39.9) == "LOW"
    assert categorize_congestion(40.0) == "MODERATE"
    assert categorize_congestion(69.9) == "MODERATE"
    assert categorize_congestion(70.0) == "HIGH"
    assert categorize_congestion(89.9) == "HIGH"
    assert categorize_congestion(90.0) == "SEVERE"
    assert categorize_congestion(100.0) == "SEVERE"
