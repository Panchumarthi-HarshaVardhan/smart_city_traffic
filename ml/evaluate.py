"""
CityFlow AI - Model Evaluation Module

Provides functions for calculating metrics, generating comparison reports,
plotting predictions vs actuals, residuals, and feature importances.
"""

import os
import logging

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Matplotlib style helper
# ---------------------------------------------------------------------------

def _set_plot_style():
    """Set a clean plot style, falling back gracefully."""
    for style in ("seaborn-v0_8-whitegrid", "seaborn-v0_8", "ggplot"):
        if style in plt.style.available:
            plt.style.use(style)
            return
    # If none found, leave default
    logger.warning("No preferred matplotlib style found; using default.")


_set_plot_style()

# ---------------------------------------------------------------------------
# 1. calculate_metrics
# ---------------------------------------------------------------------------

def calculate_metrics(y_true, y_pred):
    """Return a dict with MAE, RMSE, R² and optionally MAPE.

    Parameters
    ----------
    y_true : array-like
        Ground-truth values.
    y_pred : array-like
        Predicted values.

    Returns
    -------
    dict
        Keys: 'mae', 'rmse', 'r2', and 'mape' (only when *y_true* has no
        zeros so that MAPE is well-defined).
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)

    metrics = {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "r2": float(r2_score(y_true, y_pred)),
    }

    if np.all(y_true != 0):
        metrics["mape"] = float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100)

    return metrics


# ---------------------------------------------------------------------------
# 2. generate_model_comparison
# ---------------------------------------------------------------------------

def generate_model_comparison(results, project_root=None):
    """Build a comparison CSV and Markdown report from a *results* dict.

    Parameters
    ----------
    results : dict
        Structure per target::

            {
              'congestion': {
                'prev_day_baseline': {'mae': …, 'rmse': …, 'r2': …, …},
                '7day_baseline': {…},
                'LinearRegression': {…},
                'RandomForest': {…},
                'HistGradientBoosting': {…},
                'XGBoost': {…},
                'best_model': {'name': …, 'test_mae': …, 'test_rmse': …, 'test_r2': …}
              },
              'traffic_volume': {…},
              'average_speed': {…}
            }

    project_root : str or None
        Project root directory.  Defaults to ``../`` relative to this file.

    Returns
    -------
    pandas.DataFrame
        The comparison table that was written to CSV.
    """
    if project_root is None:
        project_root = os.path.join(os.path.dirname(__file__), os.pardir)
    project_root = os.path.abspath(project_root)

    reports_dir = os.path.join(project_root, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    rows = []
    for target, models in results.items():
        for model_name, metrics in models.items():
            if model_name == "best_model":
                # best_model uses different key naming; normalise
                rows.append({
                    "Target": target,
                    "Model": f"{metrics.get('name', 'best')} (best)",
                    "MAE": metrics.get("test_mae", metrics.get("mae")),
                    "RMSE": metrics.get("test_rmse", metrics.get("rmse")),
                    "R2": metrics.get("test_r2", metrics.get("r2")),
                    "MAPE": metrics.get("test_mape", metrics.get("mape")),
                    "Split": "test",
                })
                continue

            split = metrics.get("split", "test")
            rows.append({
                "Target": target,
                "Model": model_name,
                "MAE": metrics.get("mae"),
                "RMSE": metrics.get("rmse"),
                "R2": metrics.get("r2"),
                "MAPE": metrics.get("mape"),
                "Split": split,
            })

    df = pd.DataFrame(rows)

    # --- CSV ---
    csv_path = os.path.join(reports_dir, "model_comparison.csv")
    df.to_csv(csv_path, index=False)
    logger.info("Model comparison CSV saved to %s", csv_path)

    # --- Markdown ---
    md_lines = ["# CityFlow AI — Model Comparison Report\n"]

    for target in results:
        target_df = df[df["Target"] == target].copy()
        if target_df.empty:
            continue

        md_lines.append(f"\n## {target.replace('_', ' ').title()}\n")

        # Build a Markdown table
        md_lines.append("| Model | MAE | RMSE | R² | MAPE | Split |")
        md_lines.append("|-------|-----|------|----|------|-------|")
        for _, row in target_df.iterrows():
            mae_s = f"{row['MAE']:.4f}" if pd.notna(row["MAE"]) else "—"
            rmse_s = f"{row['RMSE']:.4f}" if pd.notna(row["RMSE"]) else "—"
            r2_s = f"{row['R2']:.4f}" if pd.notna(row["R2"]) else "—"
            mape_s = f"{row['MAPE']:.2f}%" if pd.notna(row["MAPE"]) else "—"
            split_s = str(row["Split"]) if pd.notna(row["Split"]) else "—"
            md_lines.append(
                f"| {row['Model']} | {mae_s} | {rmse_s} | {r2_s} | {mape_s} | {split_s} |"
            )

        # Highlight best model if present
        best = results[target].get("best_model")
        if best:
            md_lines.append(f"\n**Best model:** {best.get('name', 'N/A')}\n")

    md_path = os.path.join(reports_dir, "model_comparison.md")
    with open(md_path, "w") as fh:
        fh.write("\n".join(md_lines) + "\n")
    logger.info("Model comparison Markdown saved to %s", md_path)

    return df


# ---------------------------------------------------------------------------
# 3. generate_plots
# ---------------------------------------------------------------------------

_TARGET_LABELS = {
    "congestion": "Congestion Level",
    "traffic_volume": "Traffic Volume",
    "average_speed": "Average Speed",
}

_TARGET_FILE_SUFFIXES = {
    "congestion": "congestion",
    "traffic_volume": "volume",
    "average_speed": "speed",
}


def generate_plots(results, project_root=None):
    """Create actual-vs-predicted, residual, and trend plots.

    Parameters
    ----------
    results : dict
        Must contain a ``'test_predictions'`` key with structure::

            {
              'congestion':      {'y_true': array, 'y_pred': array, 'dates': array},
              'traffic_volume':  {…},
              'average_speed':   {…},
            }

    project_root : str or None
        Project root directory.
    """
    if project_root is None:
        project_root = os.path.join(os.path.dirname(__file__), os.pardir)
    project_root = os.path.abspath(project_root)

    plots_dir = os.path.join(project_root, "reports", "plots")
    os.makedirs(plots_dir, exist_ok=True)

    test_predictions = results.get("test_predictions", {})

    for target, data in test_predictions.items():
        y_true = np.asarray(data["y_true"], dtype=np.float64)
        y_pred = np.asarray(data["y_pred"], dtype=np.float64)
        dates = data.get("dates")

        label = _TARGET_LABELS.get(target, target)
        suffix = _TARGET_FILE_SUFFIXES.get(target, target)

        # --- (a-c) Actual vs Predicted scatter ---
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.scatter(y_true, y_pred, alpha=0.4, edgecolors="k", linewidths=0.3, s=20)
        lo = min(y_true.min(), y_pred.min())
        hi = max(y_true.max(), y_pred.max())
        margin = (hi - lo) * 0.05
        ax.plot([lo - margin, hi + margin], [lo - margin, hi + margin],
                "r--", linewidth=1.5, label="Perfect prediction")
        ax.set_xlabel(f"Actual {label}")
        ax.set_ylabel(f"Predicted {label}")
        ax.set_title(f"Actual vs Predicted — {label}")
        ax.legend()
        fig.tight_layout()
        path = os.path.join(plots_dir, f"actual_vs_predicted_{suffix}.png")
        fig.savefig(path, dpi=150)
        plt.close(fig)
        logger.info("Saved %s", path)

        # --- (d-f) Residual histogram ---
        residuals = y_true - y_pred
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.hist(residuals, bins=40, edgecolor="black", alpha=0.7)
        ax.axvline(0, color="red", linestyle="--", linewidth=1.5)
        ax.set_xlabel("Residual (Actual − Predicted)")
        ax.set_ylabel("Frequency")
        ax.set_title(f"Residual Distribution — {label}")
        fig.tight_layout()
        path = os.path.join(plots_dir, f"residuals_{suffix}.png")
        fig.savefig(path, dpi=150)
        plt.close(fig)
        logger.info("Saved %s", path)

        # --- (g) Time-series trend (congestion only) ---
        if target == "congestion" and dates is not None:
            dates = pd.to_datetime(dates)
            sort_idx = np.argsort(dates)
            dates_sorted = dates[sort_idx]
            y_true_sorted = y_true[sort_idx]
            y_pred_sorted = y_pred[sort_idx]

            fig, ax = plt.subplots(figsize=(12, 6))
            ax.plot(dates_sorted, y_true_sorted, label="Actual", alpha=0.8)
            ax.plot(dates_sorted, y_pred_sorted, label="Predicted", alpha=0.8)
            ax.set_xlabel("Date")
            ax.set_ylabel("Congestion Level")
            ax.set_title("Congestion Trend — Actual vs Predicted (Test Period)")
            ax.legend()
            fig.autofmt_xdate()
            fig.tight_layout()
            path = os.path.join(plots_dir, "congestion_trend.png")
            fig.savefig(path, dpi=150)
            plt.close(fig)
            logger.info("Saved %s", path)

    logger.info("All evaluation plots saved to %s", plots_dir)


# ---------------------------------------------------------------------------
# 4. generate_feature_importance_plot
# ---------------------------------------------------------------------------

def generate_feature_importance_plot(importances, feature_names, project_root=None):
    """Create a horizontal bar chart for the top-20 features and save a CSV.

    Parameters
    ----------
    importances : array-like
        Feature importance values (length must match *feature_names*).
    feature_names : list[str]
        Corresponding feature names.
    project_root : str or None
        Project root directory.
    """
    if project_root is None:
        project_root = os.path.join(os.path.dirname(__file__), os.pardir)
    project_root = os.path.abspath(project_root)

    reports_dir = os.path.join(project_root, "reports")
    plots_dir = os.path.join(reports_dir, "plots")
    os.makedirs(plots_dir, exist_ok=True)

    importances = np.asarray(importances, dtype=np.float64)
    feature_names = list(feature_names)

    # Full CSV ----------------------------------------------------------
    fi_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances,
    }).sort_values("importance", ascending=False).reset_index(drop=True)

    csv_path = os.path.join(reports_dir, "feature_importance.csv")
    fi_df.to_csv(csv_path, index=False)
    logger.info("Feature importance CSV saved to %s", csv_path)

    # Top-20 plot -------------------------------------------------------
    top_n = min(20, len(fi_df))
    top = fi_df.head(top_n).iloc[::-1]  # reverse for horizontal bar (top at top)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(top["feature"], top["importance"], color="steelblue", edgecolor="black")
    ax.set_xlabel("Importance")
    ax.set_title(f"Top {top_n} Feature Importances")
    fig.tight_layout()

    plot_path = os.path.join(plots_dir, "feature_importance.png")
    fig.savefig(plot_path, dpi=150)
    plt.close(fig)
    logger.info("Feature importance plot saved to %s", plot_path)


# ---------------------------------------------------------------------------
# Standalone quick-check
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    # Quick smoke test with synthetic data
    np.random.seed(42)
    y_true_demo = np.random.uniform(20, 100, size=200)
    y_pred_demo = y_true_demo + np.random.normal(0, 5, size=200)

    metrics = calculate_metrics(y_true_demo, y_pred_demo)
    print("Demo metrics:", metrics)

    # Demo model comparison
    demo_results = {
        "congestion": {
            "prev_day_baseline": {"mae": 12.3, "rmse": 18.1, "r2": 0.55, "mape": 15.2},
            "7day_baseline": {"mae": 11.0, "rmse": 16.5, "r2": 0.60, "mape": 13.8},
            "LinearRegression": {"mae": 9.8, "rmse": 14.2, "r2": 0.68, "mape": 12.1},
            "RandomForest": {"mae": 7.2, "rmse": 11.0, "r2": 0.78, "mape": 9.5},
            "HistGradientBoosting": {"mae": 6.5, "rmse": 10.1, "r2": 0.82, "mape": 8.7},
            "XGBoost": {"mae": 6.3, "rmse": 9.8, "r2": 0.83, "mape": 8.4},
            "best_model": {"name": "XGBoost", "test_mae": 6.3, "test_rmse": 9.8, "test_r2": 0.83},
        },
        "traffic_volume": {
            "prev_day_baseline": {"mae": 500, "rmse": 700, "r2": 0.50},
            "LinearRegression": {"mae": 400, "rmse": 550, "r2": 0.65},
            "RandomForest": {"mae": 300, "rmse": 420, "r2": 0.78},
            "best_model": {"name": "RandomForest", "test_mae": 300, "test_rmse": 420, "test_r2": 0.78},
        },
        "average_speed": {
            "prev_day_baseline": {"mae": 3.5, "rmse": 5.0, "r2": 0.45},
            "LinearRegression": {"mae": 2.8, "rmse": 4.0, "r2": 0.60},
            "RandomForest": {"mae": 2.0, "rmse": 3.0, "r2": 0.75},
            "best_model": {"name": "RandomForest", "test_mae": 2.0, "test_rmse": 3.0, "test_r2": 0.75},
        },
    }

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    comp_df = generate_model_comparison(demo_results, project_root=project_root)
    print("\nComparison table:\n", comp_df.to_string(index=False))

    # Demo plots
    dates_demo = pd.date_range("2024-06-01", periods=200, freq="D")
    demo_plot_results = {
        "test_predictions": {
            "congestion": {
                "y_true": y_true_demo,
                "y_pred": y_pred_demo,
                "dates": dates_demo.values,
            },
            "traffic_volume": {
                "y_true": np.random.uniform(1000, 5000, 200),
                "y_pred": np.random.uniform(1000, 5000, 200),
                "dates": dates_demo.values,
            },
            "average_speed": {
                "y_true": np.random.uniform(20, 60, 200),
                "y_pred": np.random.uniform(20, 60, 200),
                "dates": dates_demo.values,
            },
        }
    }
    generate_plots(demo_plot_results, project_root=project_root)

    # Demo feature importance
    demo_features = [f"feature_{i}" for i in range(30)]
    demo_importances = np.random.exponential(0.05, size=30)
    generate_feature_importance_plot(demo_importances, demo_features, project_root=project_root)

    print("\nDone — check reports/ for outputs.")
