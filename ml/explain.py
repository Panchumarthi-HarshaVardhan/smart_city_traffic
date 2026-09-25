"""
CityFlow AI - Explainability Module

Provides:
- Model feature importance extraction
- Permutation importance analysis
- Human-interpretable local prediction factor explanations
- Top-10 feature ranking generation for reports
"""

import os
import numpy as np
import pandas as pd
from sklearn.inspection import permutation_importance


def get_feature_importance(model, feature_names):
    """Extract feature importance from a tree-based model."""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "coef_"):
        importances = np.abs(model.coef_)
    else:
        raise ValueError(f"Model {type(model)} has neither feature_importances_ nor coef_")

    df_imp = pd.DataFrame({
        "feature": feature_names,
        "importance": importances,
    }).sort_values("importance", ascending=False).reset_index(drop=True)
    return df_imp


def get_permutation_importance(model, X, y, feature_names, n_repeats=5, random_state=42):
    """Compute permutation feature importance on validation or test data."""
    perm = permutation_importance(
        model, X, y, n_repeats=n_repeats, random_state=random_state, n_jobs=-1
    )
    df_perm = pd.DataFrame({
        "feature": feature_names,
        "importance_mean": perm.importances_mean,
        "importance_std": perm.importances_std,
    }).sort_values("importance_mean", ascending=False).reset_index(drop=True)
    return df_perm


def interpret_feature(feature_name, value):
    """Generate human-readable explanation based on actual model-derived factors."""
    val_str = f"{value:.1f}" if isinstance(value, (int, float, np.floating)) else str(value)
    
    if "congestion_lag" in feature_name:
        return f"Historical road congestion level ({val_str})"
    elif "congestion_roll" in feature_name:
        return f"Recent multi-day congestion trend ({val_str})"
    elif "traffic_volume" in feature_name:
        return f"Recent traffic flow volume ({val_str} vehicles)"
    elif "average_speed" in feature_name:
        return f"Recent historical speed pattern ({val_str} km/h)"
    elif "rain" in feature_name or "precipitation" in feature_name:
        return f"Rainfall / precipitation condition ({val_str} mm)"
    elif "temperature" in feature_name:
        return f"Ambient daily temperature ({val_str} °C)"
    elif "humidity" in feature_name:
        return f"Relative humidity ({val_str}%)"
    elif "is_weekend" in feature_name:
        is_wk = int(value) if isinstance(value, (int, float)) else 0
        return "Weekend traffic pattern" if is_wk else "Weekday commute pattern"
    elif "day_of_week" in feature_name:
        return "Weekly cyclical travel pattern"
    elif "Roadwork" in feature_name:
        return f"Active roadwork or construction ({val_str})"
    elif "Incident Reports" in feature_name:
        return f"Reported traffic incidents ({val_str})"
    elif "capacity" in feature_name:
        return f"Road capacity utilization ({val_str}%)"
    elif "tti" in feature_name:
        return f"Travel Time Index ({val_str})"
    else:
        return f"{feature_name.replace('_', ' ').capitalize()} ({val_str})"


def explain_prediction(prediction_dict, model, feature_names, feature_values, top_n=5):
    """
    Explain a specific prediction using top feature importances and input values.
    Returns structured explanation without fabricating any factors.
    """
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        importances = np.ones(len(feature_names)) / len(feature_names)

    top_indices = np.argsort(importances)[::-1][:top_n]

    top_factors = []
    for idx in top_indices:
        feat = feature_names[idx]
        val = feature_values[idx] if idx < len(feature_values) else None
        imp = float(importances[idx])
        top_factors.append({
            "feature": feat,
            "importance": round(imp, 4),
            "value": val,
            "interpretation": interpret_feature(feat, val),
        })

    return {
        "road": prediction_dict.get("road"),
        "predicted_congestion": prediction_dict.get("predicted_congestion_level"),
        "congestion_category": prediction_dict.get("congestion_category"),
        "top_factors": top_factors,
    }


def run_explainability(models, X_test, y_test, feature_names, project_root=None):
    """Generate global explainability reports and save feature importance CSV."""
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    reports_dir = os.path.join(project_root, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    cong_model = models.get("congestion")
    if cong_model and hasattr(cong_model, "feature_importances_"):
        df_imp = get_feature_importance(cong_model, feature_names)
        out_path = os.path.join(reports_dir, "feature_importance.csv")
        df_imp.to_csv(out_path, index=False)
        print(f"Saved feature importance table to {out_path}")
        print("\nTop 10 Most Important Features for Congestion:")
        for i, row in df_imp.head(10).iterrows():
            print(f"  {i+1:2d}. {row['feature']:<30} (importance: {row['importance']:.4f})")
        return df_imp

    return None
