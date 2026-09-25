"""
Data Inspection Module for CityFlow AI Project.

Loads the Bangalore traffic dataset and Open-Meteo weather dataset,
computes quality metrics, detects issues, and generates reports in
JSON and Markdown formats under reports/.

Usage:
    # As a module
    from ml.data_inspection import run_inspection
    report = run_inspection()

    # Standalone
    python -m ml.data_inspection
"""

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Path helpers
# ---------------------------------------------------------------------------

def _project_root(override: Optional[str] = None) -> str:
    """Return the project root directory."""
    if override:
        return override
    # ml/ is a direct child of the project root
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _traffic_csv_path(root: str) -> str:
    return os.path.join(root, "data", "raw", "Banglore_traffic_Dataset.csv")


def _weather_csv_path(root: str) -> str:
    return os.path.join(root, "data", "raw", "open-meteo.csv")


# ---------------------------------------------------------------------------
# JSON serialiser that handles numpy / pandas / datetime types
# ---------------------------------------------------------------------------

def _json_default(obj: Any) -> Any:
    """Custom default serialiser for json.dumps."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (pd.Timestamp, datetime)):
        return str(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, set):
        return sorted(obj)
    return str(obj)


# ---------------------------------------------------------------------------
# Traffic dataset inspection
# ---------------------------------------------------------------------------

def _inspect_traffic(path: str) -> Dict[str, Any]:
    """Return a comprehensive quality report dict for the traffic dataset."""
    df = pd.read_csv(path)

    report: Dict[str, Any] = {}

    # ---- basic shape ----
    report["shape"] = {"rows": df.shape[0], "columns": df.shape[1]}
    report["column_names"] = df.columns.tolist()
    report["dtypes"] = {col: str(dtype) for col, dtype in df.dtypes.items()}

    # ---- missing values ----
    missing = df.isnull().sum()
    report["missing_values"] = {
        "per_column": missing.to_dict(),
        "total": int(missing.sum()),
    }

    # ---- duplicates ----
    report["duplicate_rows"] = int(df.duplicated().sum())

    dup_key_cols = ["Date", "Road/Intersection Name"]
    report["duplicate_date_road"] = int(df.duplicated(subset=dup_key_cols).sum())

    # ---- date range ----
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    valid_dates = df["Date"].dropna()
    report["date_range"] = {
        "min": str(valid_dates.min()),
        "max": str(valid_dates.max()),
        "invalid_dates_count": int(df["Date"].isnull().sum() - missing["Date"]),
    }
    report["unique_dates_count"] = int(valid_dates.nunique())

    # ---- uniques ----
    report["unique_roads"] = {
        "count": int(df["Road/Intersection Name"].nunique()),
        "list": sorted(df["Road/Intersection Name"].dropna().unique().tolist()),
    }
    report["unique_areas"] = {
        "count": int(df["Area Name"].nunique()),
        "list": sorted(df["Area Name"].dropna().unique().tolist()),
    }

    # ---- numerical statistics ----
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats: Dict[str, Dict[str, float]] = {}
    for col in num_cols:
        s = df[col].describe()
        stats[col] = {
            "min": float(s["min"]),
            "max": float(s["max"]),
            "mean": float(s["mean"]),
            "std": float(s["std"]),
            "Q25": float(s["25%"]),
            "Q50": float(s["50%"]),
            "Q75": float(s["75%"]),
        }
    report["numerical_statistics"] = stats

    # ---- categorical value counts ----
    cat_cols = [
        "Weather Conditions",
        "Roadwork and Construction Activity",
        "Area Name",
        "Road/Intersection Name",
    ]
    cat_counts: Dict[str, Dict[str, int]] = {}
    for col in cat_cols:
        if col in df.columns:
            cat_counts[col] = df[col].value_counts().to_dict()
    report["categorical_value_counts"] = cat_counts

    # ---- infinite values ----
    inf_counts: Dict[str, int] = {}
    for col in num_cols:
        n_inf = int(np.isinf(df[col]).sum())
        if n_inf > 0:
            inf_counts[col] = n_inf
    report["infinite_values"] = {
        "per_column": inf_counts,
        "total": sum(inf_counts.values()),
    }

    # ---- IQR-based outlier detection ----
    outliers: Dict[str, Dict[str, Any]] = {}
    for col in num_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        mask = (df[col] < lower) | (df[col] > upper)
        n_outliers = int(mask.sum())
        if n_outliers > 0:
            outliers[col] = {
                "count": n_outliers,
                "lower_bound": float(lower),
                "upper_bound": float(upper),
                "min_outlier": float(df.loc[mask, col].min()),
                "max_outlier": float(df.loc[mask, col].max()),
            }
    report["outliers_iqr"] = outliers

    return report


# ---------------------------------------------------------------------------
# Weather dataset inspection
# ---------------------------------------------------------------------------

def _read_weather_metadata(path: str) -> Dict[str, Any]:
    """Read the first metadata row (latitude, longitude, elevation, tz)."""
    meta_df = pd.read_csv(path, nrows=1)  # reads row 0 header + row 1 values
    meta: Dict[str, Any] = {}
    for col in meta_df.columns:
        val = meta_df[col].iloc[0]
        # try to convert numeric strings
        try:
            val = float(val)
        except (ValueError, TypeError):
            pass
        meta[col] = val
    return meta


def _inspect_weather(path: str) -> Dict[str, Any]:
    """Return a quality report dict for the weather dataset."""
    df = pd.read_csv(path, skiprows=3)

    report: Dict[str, Any] = {}

    # ---- metadata from the first rows ----
    report["metadata"] = _read_weather_metadata(path)

    # ---- basic shape ----
    report["shape"] = {"rows": df.shape[0], "columns": df.shape[1]}
    report["column_names"] = df.columns.tolist()
    report["dtypes"] = {col: str(dtype) for col, dtype in df.dtypes.items()}

    # ---- missing values ----
    missing = df.isnull().sum()
    report["missing_values"] = {
        "per_column": missing.to_dict(),
        "total": int(missing.sum()),
    }

    # ---- date range ----
    df["time"] = pd.to_datetime(df["time"], errors="coerce")
    valid_times = df["time"].dropna()
    report["date_range"] = {
        "min": str(valid_times.min()),
        "max": str(valid_times.max()),
    }

    # ---- duplicates ----
    report["duplicate_timestamps"] = int(df.duplicated(subset=["time"]).sum())

    # ---- numerical statistics ----
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    stats: Dict[str, Dict[str, float]] = {}
    for col in num_cols:
        s = df[col].describe()
        stats[col] = {
            "min": float(s["min"]),
            "max": float(s["max"]),
            "mean": float(s["mean"]),
            "std": float(s["std"]),
            "Q25": float(s["25%"]),
            "Q50": float(s["50%"]),
            "Q75": float(s["75%"]),
        }
    report["numerical_statistics"] = stats

    return report


# ---------------------------------------------------------------------------
# Markdown report generation
# ---------------------------------------------------------------------------

def _generate_markdown(report: Dict[str, Any]) -> str:
    """Convert the full report dict into a formatted Markdown string."""
    lines = []
    lines.append("# Data Quality Report")
    lines.append(f"\n_Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_\n")

    # ===== TRAFFIC =====
    tr = report["traffic"]
    lines.append("## 1. Traffic Dataset\n")
    lines.append(f"**File:** `data/raw/Banglore_traffic_Dataset.csv`\n")
    lines.append(f"- **Rows:** {tr['shape']['rows']}")
    lines.append(f"- **Columns:** {tr['shape']['columns']}")
    lines.append(f"- **Date range:** {tr['date_range']['min']} → {tr['date_range']['max']}")
    lines.append(f"- **Unique dates:** {tr['unique_dates_count']}")
    lines.append(f"- **Unique roads:** {tr['unique_roads']['count']}")
    lines.append(f"- **Unique areas:** {tr['unique_areas']['count']}")
    lines.append(f"- **Duplicate rows:** {tr['duplicate_rows']}")
    lines.append(f"- **Duplicate (Date + Road) combos:** {tr['duplicate_date_road']}")
    lines.append(f"- **Total missing values:** {tr['missing_values']['total']}")
    lines.append(f"- **Total infinite values:** {tr['infinite_values']['total']}\n")

    # missing values table
    mv = tr["missing_values"]["per_column"]
    if any(v > 0 for v in mv.values()):
        lines.append("### Missing Values\n")
        lines.append("| Column | Missing |")
        lines.append("|--------|---------|")
        for col, cnt in mv.items():
            if cnt > 0:
                lines.append(f"| {col} | {cnt} |")
        lines.append("")

    # dtypes
    lines.append("### Data Types\n")
    lines.append("| Column | Dtype |")
    lines.append("|--------|-------|")
    for col, dtype in tr["dtypes"].items():
        lines.append(f"| {col} | {dtype} |")
    lines.append("")

    # numerical stats
    lines.append("### Numerical Statistics\n")
    lines.append("| Column | Min | Q25 | Median | Mean | Q75 | Max | Std |")
    lines.append("|--------|-----|-----|--------|------|-----|-----|-----|")
    for col, s in tr["numerical_statistics"].items():
        lines.append(
            f"| {col} | {s['min']:.2f} | {s['Q25']:.2f} | "
            f"{s['Q50']:.2f} | {s['mean']:.2f} | {s['Q75']:.2f} | "
            f"{s['max']:.2f} | {s['std']:.2f} |"
        )
    lines.append("")

    # categorical
    lines.append("### Categorical Value Counts\n")
    for cat_col, counts in tr["categorical_value_counts"].items():
        lines.append(f"**{cat_col}**\n")
        lines.append("| Value | Count |")
        lines.append("|-------|-------|")
        for val, cnt in counts.items():
            lines.append(f"| {val} | {cnt} |")
        lines.append("")

    # outliers
    if tr["outliers_iqr"]:
        lines.append("### Outliers (IQR Method)\n")
        lines.append("| Column | Count | Lower Bound | Upper Bound | Min Outlier | Max Outlier |")
        lines.append("|--------|-------|-------------|-------------|-------------|-------------|")
        for col, info in tr["outliers_iqr"].items():
            lines.append(
                f"| {col} | {info['count']} | {info['lower_bound']:.2f} | "
                f"{info['upper_bound']:.2f} | {info['min_outlier']:.2f} | "
                f"{info['max_outlier']:.2f} |"
            )
        lines.append("")

    # unique lists
    lines.append("### Unique Areas\n")
    for a in tr["unique_areas"]["list"]:
        lines.append(f"- {a}")
    lines.append("")

    lines.append("### Unique Roads\n")
    for r in tr["unique_roads"]["list"]:
        lines.append(f"- {r}")
    lines.append("")

    # ===== WEATHER =====
    we = report["weather"]
    lines.append("## 2. Weather Dataset\n")
    lines.append(f"**File:** `data/raw/open-meteo.csv`\n")

    meta = we["metadata"]
    lines.append(f"- **Latitude:** {meta.get('latitude', 'N/A')}")
    lines.append(f"- **Longitude:** {meta.get('longitude', 'N/A')}")
    lines.append(f"- **Elevation:** {meta.get('elevation', 'N/A')} m")
    lines.append(f"- **Timezone:** {meta.get('timezone', 'N/A')}")
    lines.append(f"- **Rows:** {we['shape']['rows']}")
    lines.append(f"- **Columns:** {we['shape']['columns']}")
    lines.append(f"- **Date range:** {we['date_range']['min']} → {we['date_range']['max']}")
    lines.append(f"- **Duplicate timestamps:** {we['duplicate_timestamps']}")
    lines.append(f"- **Total missing values:** {we['missing_values']['total']}\n")

    # missing
    wmv = we["missing_values"]["per_column"]
    if any(v > 0 for v in wmv.values()):
        lines.append("### Missing Values\n")
        lines.append("| Column | Missing |")
        lines.append("|--------|---------|")
        for col, cnt in wmv.items():
            if cnt > 0:
                lines.append(f"| {col} | {cnt} |")
        lines.append("")

    # weather numerical stats
    lines.append("### Numerical Statistics\n")
    lines.append("| Column | Min | Q25 | Median | Mean | Q75 | Max | Std |")
    lines.append("|--------|-----|-----|--------|------|-----|-----|-----|")
    for col, s in we["numerical_statistics"].items():
        lines.append(
            f"| {col} | {s['min']:.2f} | {s['Q25']:.2f} | "
            f"{s['Q50']:.2f} | {s['mean']:.2f} | {s['Q75']:.2f} | "
            f"{s['max']:.2f} | {s['std']:.2f} |"
        )
    lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Terminal summary
# ---------------------------------------------------------------------------

def _print_summary(report: Dict[str, Any]) -> None:
    """Print a concise summary to the terminal."""
    tr = report["traffic"]
    we = report["weather"]

    print("=" * 60)
    print("  DATA QUALITY INSPECTION SUMMARY")
    print("=" * 60)

    print(f"\n--- Traffic Dataset ---")
    print(f"  Shape:             {tr['shape']['rows']} rows × {tr['shape']['columns']} cols")
    print(f"  Date range:        {tr['date_range']['min']} → {tr['date_range']['max']}")
    print(f"  Unique dates:      {tr['unique_dates_count']}")
    print(f"  Unique roads:      {tr['unique_roads']['count']}")
    print(f"  Unique areas:      {tr['unique_areas']['count']}")
    print(f"  Missing values:    {tr['missing_values']['total']}")
    print(f"  Duplicate rows:    {tr['duplicate_rows']}")
    print(f"  Dup (Date+Road):   {tr['duplicate_date_road']}")
    print(f"  Infinite values:   {tr['infinite_values']['total']}")
    print(f"  Columns w/ outliers (IQR): {len(tr['outliers_iqr'])}")

    # Congestion Level quick look
    cong = tr["numerical_statistics"].get("Congestion Level", {})
    if cong:
        print(f"  Congestion Level:  min={cong['min']:.2f}  Q25={cong['Q25']:.2f}  "
              f"median={cong['Q50']:.2f}  Q75={cong['Q75']:.2f}  max={cong['max']:.2f}")

    print(f"\n--- Weather Dataset ---")
    print(f"  Shape:             {we['shape']['rows']} rows × {we['shape']['columns']} cols")
    print(f"  Date range:        {we['date_range']['min']} → {we['date_range']['max']}")
    print(f"  Missing values:    {we['missing_values']['total']}")
    print(f"  Dup timestamps:    {we['duplicate_timestamps']}")
    meta = we["metadata"]
    print(f"  Location:          ({meta.get('latitude', '?')}, {meta.get('longitude', '?')})")
    print(f"  Elevation:         {meta.get('elevation', '?')} m")
    print(f"  Timezone:          {meta.get('timezone', '?')}")

    print("\n" + "=" * 60)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run_inspection(project_root: Optional[str] = None) -> Dict[str, Any]:
    """
    Run a full data-quality inspection on traffic and weather datasets.

    Parameters
    ----------
    project_root : str or None
        Path to the project root. If None, inferred from this file's location.

    Returns
    -------
    dict
        Combined report with keys 'traffic' and 'weather'.
    """
    root = _project_root(project_root)
    reports_dir = os.path.join(root, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    # ---- inspect ----
    traffic_path = _traffic_csv_path(root)
    weather_path = _weather_csv_path(root)

    print(f"[inspect] Loading traffic data from: {traffic_path}")
    traffic_report = _inspect_traffic(traffic_path)

    print(f"[inspect] Loading weather data from: {weather_path}")
    weather_report = _inspect_weather(weather_path)

    report = {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "traffic": traffic_report,
        "weather": weather_report,
    }

    # ---- save JSON ----
    json_path = os.path.join(reports_dir, "data_quality_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, default=_json_default, ensure_ascii=False)
    print(f"[inspect] JSON report saved to: {json_path}")

    # ---- save Markdown ----
    md_path = os.path.join(reports_dir, "data_quality_report.md")
    md_content = _generate_markdown(report)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"[inspect] Markdown report saved to: {md_path}")

    # ---- terminal summary ----
    _print_summary(report)

    return report


# ---------------------------------------------------------------------------
# Standalone execution
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_inspection()
