"""
Weather data processing module for CityFlow AI.

Converts hourly weather data (open-meteo.csv) into daily aggregates
suitable for merging with daily traffic data.
"""

import os
import pandas as pd


def process_weather(project_root=None):
    """
    Read hourly weather data, aggregate to daily, and save processed output.

    Parameters
    ----------
    project_root : str or None
        Absolute path to the project root directory.
        If None, inferred as the parent of the ml/ directory.

    Returns
    -------
    pd.DataFrame
        Daily weather DataFrame with one row per date.
    """
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # ── 1. Read raw hourly weather CSV (3 metadata header rows) ──────────
    raw_path = os.path.join(project_root, "data", "raw", "open-meteo.csv")
    df = pd.read_csv(raw_path, skiprows=3)

    # ── 2-3. Rename columns: strip units from names ─────────────────────
    rename_map = {
        "temperature_2m (°C)": "temperature_2m",
        "relative_humidity_2m (%)": "relative_humidity_2m",
        "precipitation (mm)": "precipitation",
        "rain (mm)": "rain",
        "wind_speed_10m (km/h)": "wind_speed_10m",
        "weather_code (wmo code)": "weather_code",
    }
    df.rename(columns=rename_map, inplace=True)

    # ── 4-5. Parse time and extract date ─────────────────────────────────
    df["time"] = pd.to_datetime(df["time"])
    df["date"] = df["time"].dt.date

    # ── 6. Group by date and compute daily aggregates ────────────────────
    daily = df.groupby("date").agg(
        temperature_mean=("temperature_2m", "mean"),
        temperature_min=("temperature_2m", "min"),
        temperature_max=("temperature_2m", "max"),
        humidity_mean=("relative_humidity_2m", "mean"),
        humidity_min=("relative_humidity_2m", "min"),
        humidity_max=("relative_humidity_2m", "max"),
        precipitation_sum=("precipitation", "sum"),
        rain_sum=("rain", "sum"),
        wind_speed_mean=("wind_speed_10m", "mean"),
        wind_speed_max=("wind_speed_10m", "max"),
        weather_code_mode=("weather_code", lambda x: x.mode()[0]),
        rain_hours=("rain", lambda x: (x > 0).sum()),
        precipitation_hours=("precipitation", lambda x: (x > 0).sum()),
    )

    daily = daily.reset_index()
    daily["date"] = pd.to_datetime(daily["date"])

    # Round floating-point columns for cleaner output
    float_cols = daily.select_dtypes(include="float").columns
    daily[float_cols] = daily[float_cols].round(2)

    # ── 7. Save to processed directory ───────────────────────────────────
    out_dir = os.path.join(project_root, "data", "processed")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "daily_weather.csv")
    daily.to_csv(out_path, index=False)

    # ── 8. Print summary ────────────────────────────────────────────────
    print(f"Daily weather rows: {len(daily)}")
    print(f"Date range: {daily['date'].min().date()} to {daily['date'].max().date()}")
    print(f"Columns: {list(daily.columns)}")
    print(f"\nSample (first 5 rows):\n{daily.head().to_string()}")
    print(f"\nSaved to: {out_path}")

    # ── 9. Return ────────────────────────────────────────────────────────
    return daily


if __name__ == "__main__":
    process_weather()
