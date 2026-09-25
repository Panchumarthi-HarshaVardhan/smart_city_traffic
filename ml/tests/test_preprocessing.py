"""
CityFlow AI — Preprocessing Tests
==================================
Verify traffic CSV loading, merge with weather data, and data integrity.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
import numpy as np
import pandas as pd

from ml.config import TRAFFIC_CSV, TRAFFIC_COLUMNS

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def raw_traffic():
    """Load the raw traffic CSV."""
    return pd.read_csv(TRAFFIC_CSV)


@pytest.fixture(scope="module")
def merged():
    """Run the full preprocessing pipeline and return the merged DataFrame."""
    # Ensure daily weather exists (dependency of preprocess_data)
    from ml.weather_processing import process_weather
    daily_weather_path = os.path.join(PROJECT_ROOT, "data", "processed", "daily_weather.csv")
    if not os.path.isfile(daily_weather_path):
        process_weather(project_root=PROJECT_ROOT)

    from ml.data_preprocessing import preprocess_data
    return preprocess_data(project_root=PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_traffic_csv_exists():
    """Verify Banglore_traffic_Dataset.csv exists on disk."""
    assert os.path.isfile(TRAFFIC_CSV), f"Traffic CSV not found: {TRAFFIC_CSV}"


def test_traffic_csv_loads(raw_traffic):
    """Verify shape is (8936, 16)."""
    assert raw_traffic.shape == (8936, 16), (
        f"Expected (8936, 16), got {raw_traffic.shape}"
    )


def test_traffic_columns(raw_traffic):
    """Verify all 16 expected columns are present."""
    for col in TRAFFIC_COLUMNS:
        assert col in raw_traffic.columns, (
            f"Missing column '{col}'. Got: {list(raw_traffic.columns)}"
        )


def test_merge_preserves_rows(merged, raw_traffic):
    """preprocess_data() should preserve the traffic row count (left join)."""
    # After deduplication, rows could decrease, but a left join should not
    # add rows.  At minimum, we check no rows were added.
    assert len(merged) <= len(raw_traffic), (
        f"Merge added rows: {len(merged)} > {len(raw_traffic)}"
    )
    # And the count shouldn't drop drastically (at most a few exact dups)
    assert len(merged) >= len(raw_traffic) * 0.99, (
        f"Too many rows lost: {len(merged)} vs {len(raw_traffic)}"
    )


def test_no_duplicate_date_road(merged):
    """Verify no duplicate (date, Road/Intersection Name) combinations."""
    dup_count = merged.duplicated(
        subset=["date", "Road/Intersection Name"], keep=False
    ).sum()
    assert dup_count == 0, (
        f"Found {dup_count} duplicate (date, road) records"
    )


def test_merged_has_weather_columns(merged):
    """Verify weather columns are present after merge."""
    expected_weather_cols = [
        "temperature_mean",
        "humidity_mean",
        "precipitation_sum",
        "wind_speed_mean",
    ]
    for col in expected_weather_cols:
        assert col in merged.columns, (
            f"Missing weather column '{col}' in merged data. "
            f"Got: {list(merged.columns)}"
        )


def test_no_infinite_values(merged):
    """Verify no inf / -inf in the merged dataset."""
    num_df = merged.select_dtypes(include=[np.number])
    inf_mask = np.isinf(num_df.values)
    assert not inf_mask.any(), (
        "Found infinite values in merged dataset at columns: "
        f"{[c for c in num_df.columns if np.isinf(num_df[c].values).any()]}"
    )
