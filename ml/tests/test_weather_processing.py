"""
CityFlow AI — Weather Processing Tests
=======================================
Verify raw weather CSV loading, column structure, and daily aggregation.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
import pandas as pd

from ml.config import WEATHER_CSV, WEATHER_CSV_SKIPROWS, WEATHER_COLUMNS_ORIGINAL

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def raw_weather():
    """Load the raw hourly weather CSV."""
    return pd.read_csv(WEATHER_CSV, skiprows=WEATHER_CSV_SKIPROWS)


@pytest.fixture(scope="module")
def daily_weather():
    """Run process_weather() and return the daily aggregated DataFrame."""
    from ml.weather_processing import process_weather
    return process_weather(project_root=PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_weather_csv_exists():
    """Verify open-meteo.csv exists on disk."""
    assert os.path.isfile(WEATHER_CSV), f"Weather CSV not found: {WEATHER_CSV}"


def test_weather_csv_loads(raw_weather):
    """Load with skiprows=3, verify shape > 0."""
    assert raw_weather.shape[0] > 0, "Weather CSV loaded 0 rows"
    assert raw_weather.shape[1] > 0, "Weather CSV loaded 0 columns"


def test_weather_columns(raw_weather):
    """Verify expected columns with unit names."""
    for col in WEATHER_COLUMNS_ORIGINAL:
        assert col in raw_weather.columns, (
            f"Missing column '{col}' in raw weather. "
            f"Got: {list(raw_weather.columns)}"
        )


def test_weather_aggregation(daily_weather, raw_weather):
    """Run process_weather(), verify output has expected daily columns,
    verify row count equals unique dates in input."""
    expected_daily_cols = [
        "date",
        "temperature_mean",
        "temperature_min",
        "temperature_max",
        "humidity_mean",
        "humidity_min",
        "humidity_max",
        "precipitation_sum",
        "rain_sum",
        "wind_speed_mean",
        "wind_speed_max",
        "weather_code_mode",
        "rain_hours",
        "precipitation_hours",
    ]
    for col in expected_daily_cols:
        assert col in daily_weather.columns, (
            f"Missing daily column '{col}'. Got: {list(daily_weather.columns)}"
        )

    # Row count should equal the number of unique dates in the raw hourly data
    raw_dates = pd.to_datetime(raw_weather["time"]).dt.date.nunique()
    assert len(daily_weather) == raw_dates, (
        f"Daily weather rows ({len(daily_weather)}) != unique raw dates ({raw_dates})"
    )


def test_daily_weather_date_range(daily_weather, raw_weather):
    """Verify that the date range in daily output matches the raw input."""
    raw_min = pd.to_datetime(raw_weather["time"]).dt.date.min()
    raw_max = pd.to_datetime(raw_weather["time"]).dt.date.max()

    daily_min = pd.to_datetime(daily_weather["date"]).dt.date.min()
    daily_max = pd.to_datetime(daily_weather["date"]).dt.date.max()

    assert daily_min == raw_min, f"Date min mismatch: {daily_min} vs {raw_min}"
    assert daily_max == raw_max, f"Date max mismatch: {daily_max} vs {raw_max}"


def test_no_missing_values_in_daily(daily_weather):
    """Verify no NaN in the daily aggregated output."""
    nan_counts = daily_weather.isnull().sum()
    cols_with_nan = nan_counts[nan_counts > 0]
    assert cols_with_nan.empty, (
        f"NaN found in daily weather:\n{cols_with_nan.to_string()}"
    )
