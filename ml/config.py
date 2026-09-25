"""
CityFlow AI - Central Configuration
====================================
All project-wide constants, file paths, column definitions,
feature engineering parameters, and model settings.
"""

import os

# ---------------------------------------------------------------------------
# Project root & directory structure
# ---------------------------------------------------------------------------
# ml/ is a direct child of the project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Raw data paths
RAW_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
TRAFFIC_CSV = os.path.join(RAW_DATA_DIR, "Banglore_traffic_Dataset.csv")
WEATHER_CSV = os.path.join(RAW_DATA_DIR, "open-meteo.csv")

# Processed / intermediate data
PROCESSED_DATA_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
MERGED_CSV = os.path.join(PROCESSED_DATA_DIR, "merged_traffic_weather.csv")
FEATURES_CSV = os.path.join(PROCESSED_DATA_DIR, "features.csv")
TRAIN_CSV = os.path.join(PROCESSED_DATA_DIR, "train.csv")
VAL_CSV = os.path.join(PROCESSED_DATA_DIR, "val.csv")
TEST_CSV = os.path.join(PROCESSED_DATA_DIR, "test.csv")

# Model artefacts
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

# Reports & plots
REPORTS_DIR = os.path.join(PROJECT_ROOT, "reports")
PLOTS_DIR = os.path.join(REPORTS_DIR, "plots")

# ---------------------------------------------------------------------------
# Traffic dataset columns (16 columns, 8936 rows, daily, 2022-01-01→2024-08-09)
# ---------------------------------------------------------------------------
TRAFFIC_COLUMNS = [
    "Date",
    "Area Name",
    "Road/Intersection Name",
    "Traffic Volume",
    "Average Speed",
    "Travel Time Index",
    "Congestion Level",
    "Road Capacity Utilization",
    "Incident Reports",
    "Environmental Impact",
    "Public Transport Usage",
    "Traffic Signal Compliance",
    "Parking Usage",
    "Pedestrian and Cyclist Count",
    "Weather Conditions",
    "Roadwork and Construction Activity",
]

# ---------------------------------------------------------------------------
# Weather dataset columns (22848 hourly rows, 7 cols, 3 metadata header rows)
# ---------------------------------------------------------------------------
WEATHER_CSV_SKIPROWS = 3  # first 3 rows are metadata, not data

# Original column names (with unit suffixes as they appear after skiprows=3)
WEATHER_COLUMNS_ORIGINAL = [
    "time",
    "temperature_2m (°C)",
    "relative_humidity_2m (%)",
    "precipitation (mm)",
    "rain (mm)",
    "wind_speed_10m (km/h)",
    "weather_code (wmo code)",
]

# Clean column names (units stripped) used after renaming
WEATHER_COLUMNS_RENAMED = {
    "time": "time",
    "temperature_2m (°C)": "temperature",
    "relative_humidity_2m (%)": "relative_humidity",
    "precipitation (mm)": "precipitation",
    "rain (mm)": "rain",
    "wind_speed_10m (km/h)": "wind_speed",
    "weather_code (wmo code)": "weather_code",
}

# ---------------------------------------------------------------------------
# Feature engineering – lag & rolling window settings
# ---------------------------------------------------------------------------
# Features that get lag columns
LAG_FEATURES = {
    "traffic_volume": [1, 3, 7],
    "congestion": [1, 3, 7],
    "average_speed": [1, 7],
    "tti": [1, 7],
    "capacity": [1, 7],
}

# Column-name mapping so lag code can find the right source column
LAG_FEATURE_COLUMN_MAP = {
    "traffic_volume": "Traffic Volume",
    "congestion": "Congestion Level",
    "average_speed": "Average Speed",
    "tti": "Travel Time Index",
    "capacity": "Road Capacity Utilization",
}

# Rolling window sizes (applied *after* shifting to avoid future leakage)
ROLLING_WINDOWS = [3, 7]

# ---------------------------------------------------------------------------
# Target columns (next-day prediction targets)
# ---------------------------------------------------------------------------
TARGET_COLUMNS = [
    "next_day_congestion",
    "next_day_traffic_volume",
    "next_day_average_speed",
]

# ---------------------------------------------------------------------------
# Congestion thresholds
# ---------------------------------------------------------------------------
# Derived from actual distribution:
#   min ≈ 5.16, Q25 ≈ 64, median ≈ 92, Q75 = 100, max = 100
# The data is heavily right-skewed with many values capped at 100.
CONGESTION_THRESHOLDS = {
    "LOW": (0, 40),          # < 40
    "MODERATE": (40, 70),    # 40 – 70
    "HIGH": (70, 90),        # 70 – 90
    "SEVERE": (90, 100),     # >= 90
}


def categorize_congestion(value):
    """Return a human-readable congestion category for a numeric level.

    Categories (based on actual Bangalore traffic distribution):
        LOW      :  < 40
        MODERATE : 40 – 70
        HIGH     : 70 – 90
        SEVERE   : >= 90

    Parameters
    ----------
    value : float or int
        Congestion level (typically 0–100).

    Returns
    -------
    str
        One of 'LOW', 'MODERATE', 'HIGH', 'SEVERE', or 'UNKNOWN'.
    """
    if value is None:
        return "UNKNOWN"
    try:
        value = float(value)
    except (TypeError, ValueError):
        return "UNKNOWN"

    if value < 40:
        return "LOW"
    elif value < 70:
        return "MODERATE"
    elif value < 90:
        return "HIGH"
    else:
        return "SEVERE"


# ---------------------------------------------------------------------------
# Train / Validation / Test split (time-series – no shuffling)
# ---------------------------------------------------------------------------
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
RANDOM_SEED = 42

# ---------------------------------------------------------------------------
# Model types
# ---------------------------------------------------------------------------
MODEL_TYPES = [
    "linear_regression",
    "ridge",
    "lasso",
    "random_forest",
    "gradient_boosting",
    "xgboost",
]

# ---------------------------------------------------------------------------
# Directory setup helper
# ---------------------------------------------------------------------------

def setup_directories():
    """Create every directory the project needs (idempotent)."""
    dirs = [
        RAW_DATA_DIR,
        PROCESSED_DATA_DIR,
        MODELS_DIR,
        REPORTS_DIR,
        PLOTS_DIR,
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
