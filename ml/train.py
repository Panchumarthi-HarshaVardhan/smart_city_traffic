"""
CityFlow AI - Model Training Module

Implements:
1. Chronological time-series split (70% Train, 15% Val, 15% Test based on dates)
2. Feature preparation with leak-free preprocessing (encoders/imputers fit on Train only)
3. Baseline evaluation (Previous-day, 7-day rolling mean)
4. ML model training (Linear Regression, Random Forest, HistGradientBoosting, XGBoost)
5. Time-series cross-validated hyperparameter tuning
6. Final model selection, retraining on Train+Val, and evaluation on untouched Test set
7. Model artifact serialization
"""

import os
import json
import logging
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit

logger = logging.getLogger(__name__)

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except Exception as e:
    xgb = None
    XGB_AVAILABLE = False
    logger.warning("XGBoost library not available (%s). Using HistGradientBoosting and RandomForest.", e)

from ml.evaluate import calculate_metrics, generate_model_comparison, generate_plots, generate_feature_importance_plot
from ml.feature_engineering import get_feature_columns

CATEGORICAL_COLS = [
    "Area Name",
    "Road/Intersection Name",
    "Weather Conditions",
    "Roadwork and Construction Activity",
]

TARGET_COLS = [
    "next_day_congestion",
    "next_day_traffic_volume",
    "next_day_average_speed",
]

BASELINE_MAP = {
    "next_day_congestion": {
        "lag_1": "congestion_lag_1",
        "roll_7": "congestion_roll_mean_7",
    },
    "next_day_traffic_volume": {
        "lag_1": "traffic_volume_lag_1",
        "roll_7": "traffic_volume_roll_mean_7",
    },
    "next_day_average_speed": {
        "lag_1": "average_speed_lag_1",
        "roll_7": "average_speed_roll_mean_7",
    },
}


def get_split_dates(df, date_col="date"):
    """Compute chronological date split boundaries: 70% train, 15% val, 15% test."""
    unique_dates = sorted(df[date_col].unique())
    n = len(unique_dates)
    train_end_idx = int(n * 0.70)
    val_end_idx = int(n * 0.85)

    train_dates = (unique_dates[0], unique_dates[train_end_idx - 1])
    val_dates = (unique_dates[train_end_idx], unique_dates[val_end_idx - 1])
    test_dates = (unique_dates[val_end_idx], unique_dates[-1])

    return {
        "train": train_dates,
        "val": val_dates,
        "test": test_dates,
        "all_dates": unique_dates,
    }


def prepare_features(df, feature_cols, encoders=None, medians=None, fit=False):
    """
    Transform raw features into clean numeric matrix.
    Categoricals are label-encoded; missing numeric values imputed with median.
    """
    X = df[feature_cols].copy()

    if fit:
        encoders = {}
        medians = {}

    # 1. Categorical encoding
    for cat_col in CATEGORICAL_COLS:
        if cat_col in X.columns:
            X[cat_col] = X[cat_col].astype(str)
            if fit:
                le = LabelEncoder()
                X[cat_col] = le.fit_transform(X[cat_col])
                encoders[cat_col] = le
            else:
                le = encoders[cat_col]
                # Map unseen categories to -1 or known class
                known_classes = set(le.classes_)
                X[cat_col] = X[cat_col].map(lambda s: s if s in known_classes else le.classes_[0])
                X[cat_col] = le.transform(X[cat_col])

    # 2. Numeric imputation
    num_cols = [c for c in feature_cols if c not in CATEGORICAL_COLS]
    for col in num_cols:
        if fit:
            med = float(X[col].median())
            medians[col] = med
        else:
            med = medians.get(col, 0.0)
        X[col] = X[col].fillna(med)

    return X, encoders, medians


def run_training(project_root=None):
    """Execute complete end-to-end model training, tuning, evaluation, and serialization."""
    if project_root is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    print("=" * 60)
    print("CITYFLOW AI — MACHINE LEARNING MODEL TRAINING")
    print("=" * 60)

    # 1. Load data
    data_path = os.path.join(project_root, "data", "processed", "final_ml_dataset.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run feature_engineering first.")

    df = pd.read_csv(data_path)
    date_col = "Date" if "Date" in df.columns else "date"
    df[date_col] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")

    feature_cols = get_feature_columns(df)
    print(f"Loaded dataset: {len(df)} rows, {len(feature_cols)} features")

    # 2. Time-based Split
    splits = get_split_dates(df, date_col=date_col)
    print("\n--- CHRONOLOGICAL DATA SPLIT ---")
    print(f"TRAIN      : {splits['train'][0]} → {splits['train'][1]}")
    print(f"VALIDATION : {splits['val'][0]} → {splits['val'][1]}")
    print(f"TEST       : {splits['test'][0]} → {splits['test'][1]}")

    train_mask = (df[date_col] >= splits['train'][0]) & (df[date_col] <= splits['train'][1])
    val_mask = (df[date_col] >= splits['val'][0]) & (df[date_col] <= splits['val'][1])
    test_mask = (df[date_col] >= splits['test'][0]) & (df[date_col] <= splits['test'][1])

    train_df = df[train_mask].copy()
    val_df = df[val_mask].copy()
    test_df = df[test_mask].copy()

    print(f"Rows -> Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")

    # 3. Fit preprocessing on Train only
    X_train, encoders, medians = prepare_features(train_df, feature_cols, fit=True)
    X_val, _, _ = prepare_features(val_df, feature_cols, encoders=encoders, medians=medians, fit=False)
    X_test, _, _ = prepare_features(test_df, feature_cols, encoders=encoders, medians=medians, fit=False)

    # Combined Train+Val for final fit
    train_val_df = pd.concat([train_df, val_df], axis=0).reset_index(drop=True)
    X_train_val, encoders_tv, medians_tv = prepare_features(train_val_df, feature_cols, fit=True)
    X_test_final, _, _ = prepare_features(test_df, feature_cols, encoders=encoders_tv, medians=medians_tv, fit=False)

    # Results tracking structure for evaluate.py
    results = {
        "congestion": {},
        "traffic_volume": {},
        "average_speed": {},
        "test_predictions": {},
    }

    final_models = {}
    best_model_names = {}
    test_metrics_summary = {}

    target_name_map = {
        "next_day_congestion": "congestion",
        "next_day_traffic_volume": "traffic_volume",
        "next_day_average_speed": "average_speed",
    }

    for target in TARGET_COLS:
        t_key = target_name_map[target]
        print("\n" + "=" * 50)
        print(f"TARGET: {target.upper()} ({t_key})")
        print("=" * 50)

        y_train = train_df[target].values
        y_val = val_df[target].values
        y_test = test_df[target].values
        y_train_val = train_val_df[target].values

        # A. Baselines on Validation
        b_lag1_col = BASELINE_MAP[target]["lag_1"]
        b_roll7_col = BASELINE_MAP[target]["roll_7"]

        val_pred_lag1 = val_df[b_lag1_col].fillna(val_df[b_lag1_col].median()).values
        val_pred_roll7 = val_df[b_roll7_col].fillna(val_df[b_roll7_col].median()).values

        base_lag1_metrics = calculate_metrics(y_val, val_pred_lag1)
        base_roll7_metrics = calculate_metrics(y_val, val_pred_roll7)

        results[t_key]["prev_day_baseline"] = base_lag1_metrics
        results[t_key]["7day_baseline"] = base_roll7_metrics

        print(f"Baseline 1 (Previous Day) Val MAE : {base_lag1_metrics['mae']:.3f}, RMSE: {base_lag1_metrics['rmse']:.3f}, R²: {base_lag1_metrics['r2']:.3f}")
        print(f"Baseline 2 (7-Day Rolling) Val MAE : {base_roll7_metrics['mae']:.3f}, RMSE: {base_roll7_metrics['rmse']:.3f}, R²: {base_roll7_metrics['r2']:.3f}")

        # B. ML Candidate Models
        candidate_models = {
            "LinearRegression": LinearRegression(),
            "RandomForest": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
            "HistGradientBoosting": HistGradientBoostingRegressor(max_iter=150, max_depth=8, learning_rate=0.08, random_state=42),
        }
        if XGB_AVAILABLE and xgb is not None:
            candidate_models["XGBoost"] = xgb.XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.08, random_state=42, n_jobs=-1)

        val_scores = {}
        for m_name, model in candidate_models.items():
            model.fit(X_train, y_train)
            val_preds = model.predict(X_val)
            metrics = calculate_metrics(y_val, val_preds)
            results[t_key][m_name] = metrics
            val_scores[m_name] = metrics["mae"]
            print(f"{m_name:<22} Val MAE : {metrics['mae']:.3f}, RMSE: {metrics['rmse']:.3f}, R²: {metrics['r2']:.3f}")

        # C. Select best tree-based candidate for tuning
        best_candidate = min(val_scores, key=val_scores.get)
        print(f"\n--> Strongest initial model on validation: {best_candidate} (MAE: {val_scores[best_candidate]:.3f})")

        # D. Time-series cross-validated tuning
        print("Tuning hyperparameters with TimeSeriesSplit...")
        tscv = TimeSeriesSplit(n_splits=3)

        if best_candidate == "XGBoost" and XGB_AVAILABLE and xgb is not None:
            param_dist = {
                "n_estimators": [100, 150, 200],
                "max_depth": [4, 6, 8],
                "learning_rate": [0.03, 0.07, 0.1],
                "subsample": [0.8, 0.9, 1.0],
                "colsample_bytree": [0.7, 0.8, 1.0],
            }
            base_estimator = xgb.XGBRegressor(random_state=42, n_jobs=-1)
        elif best_candidate == "HistGradientBoosting":
            param_dist = {
                "max_iter": [100, 150, 200],
                "max_depth": [4, 6, 8, None],
                "learning_rate": [0.03, 0.07, 0.1],
                "min_samples_leaf": [10, 20, 30],
            }
            base_estimator = HistGradientBoostingRegressor(random_state=42)
        else:
            param_dist = {
                "n_estimators": [100, 150, 200],
                "max_depth": [8, 12, 16, None],
                "min_samples_leaf": [2, 4, 8],
            }
            base_estimator = RandomForestRegressor(random_state=42, n_jobs=-1)

        search = RandomizedSearchCV(
            estimator=base_estimator,
            param_distributions=param_dist,
            n_iter=10,
            cv=tscv,
            scoring="neg_mean_absolute_error",
            random_state=42,
            n_jobs=-1,
        )
        search.fit(X_train, y_train)
        tuned_model = search.best_estimator_
        tuned_val_preds = tuned_model.predict(X_val)
        tuned_metrics = calculate_metrics(y_val, tuned_val_preds)
        print(f"Tuned {best_candidate} Val MAE: {tuned_metrics['mae']:.3f} (Best params: {search.best_params_})")

        # Pick between default best candidate and tuned candidate based on val MAE
        if tuned_metrics["mae"] < val_scores[best_candidate]:
            selected_model_class = tuned_model.__class__
            selected_params = search.best_params_
            winning_name = f"{best_candidate} (Tuned)"
        else:
            selected_model_class = candidate_models[best_candidate].__class__
            selected_params = candidate_models[best_candidate].get_params()
            winning_name = best_candidate

        best_model_names[t_key] = winning_name

        # E. Final Retraining on Train + Val, evaluate on untouched Test
        print(f"\nRetraining {winning_name} on Train + Validation combined...")
        final_model = selected_model_class(**selected_params)
        final_model.fit(X_train_val, y_train_val)

        test_preds = final_model.predict(X_test_final)
        test_metrics = calculate_metrics(y_test, test_preds)

        results[t_key]["best_model"] = {
            "name": winning_name,
            "test_mae": test_metrics["mae"],
            "test_rmse": test_metrics["rmse"],
            "test_r2": test_metrics["r2"],
        }
        if "mape" in test_metrics:
            results[t_key]["best_model"]["test_mape"] = test_metrics["mape"]

        test_metrics_summary[t_key] = test_metrics
        final_models[t_key] = final_model

        results["test_predictions"][t_key] = {
            "y_true": y_test,
            "y_pred": test_preds,
            "dates": test_df[date_col].values,
        }

        print(f"FINAL TEST EVALUATION ({winning_name}):")
        print(f"  Test MAE  : {test_metrics['mae']:.3f}")
        print(f"  Test RMSE : {test_metrics['rmse']:.3f}")
        print(f"  Test R²   : {test_metrics['r2']:.3f}")
        if "mape" in test_metrics:
            print(f"  Test MAPE : {test_metrics['mape']:.2f}%")

    # 4. Save Models & Artifacts
    models_dir = os.path.join(project_root, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(final_models["congestion"], os.path.join(models_dir, "congestion_model.joblib"))
    joblib.dump(final_models["traffic_volume"], os.path.join(models_dir, "traffic_volume_model.joblib"))
    joblib.dump(final_models["average_speed"], os.path.join(models_dir, "speed_model.joblib"))

    # Save encoders & medians for serving
    encoders_bundle = {
        "encoders": encoders_tv,
        "medians": medians_tv,
        "categorical_cols": CATEGORICAL_COLS,
    }
    joblib.dump(encoders_bundle, os.path.join(models_dir, "encoders.joblib"))
    joblib.dump(encoders_bundle, os.path.join(models_dir, "preprocessing_pipeline.joblib"))

    # Feature schema
    schema = {
        "feature_names": feature_cols,
        "categorical_features": CATEGORICAL_COLS,
        "numerical_features": [c for c in feature_cols if c not in CATEGORICAL_COLS],
        "n_features": len(feature_cols),
        "target_names": TARGET_COLS,
    }
    with open(os.path.join(models_dir, "feature_schema.json"), "w") as f:
        json.dump(schema, f, indent=2)

    # Metadata
    metadata = {
        "model_version": "1.0.0",
        "city": "Bengaluru, India",
        "project": "CITYFLOW AI",
        "creation_timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_rows": len(df),
        "train_date_range": [splits["train"][0], splits["train"][1]],
        "val_date_range": [splits["val"][0], splits["val"][1]],
        "test_date_range": [splits["test"][0], splits["test"][1]],
        "models": {
            "congestion": {
                "algorithm": best_model_names["congestion"],
                "test_mae": test_metrics_summary["congestion"]["mae"],
                "test_rmse": test_metrics_summary["congestion"]["rmse"],
                "test_r2": test_metrics_summary["congestion"]["r2"],
            },
            "traffic_volume": {
                "algorithm": best_model_names["traffic_volume"],
                "test_mae": test_metrics_summary["traffic_volume"]["mae"],
                "test_rmse": test_metrics_summary["traffic_volume"]["rmse"],
                "test_r2": test_metrics_summary["traffic_volume"]["r2"],
            },
            "average_speed": {
                "algorithm": best_model_names["average_speed"],
                "test_mae": test_metrics_summary["average_speed"]["mae"],
                "test_rmse": test_metrics_summary["average_speed"]["rmse"],
                "test_r2": test_metrics_summary["average_speed"]["r2"],
            },
        },
    }
    with open(os.path.join(models_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    # 5. Reports & Visualizations
    print("\nGenerating model comparison reports and plots...")
    generate_model_comparison(results, project_root=project_root)
    generate_plots(results, project_root=project_root)

    # Feature Importance for congestion model
    best_cong_model = final_models["congestion"]
    if hasattr(best_cong_model, "feature_importances_"):
        importances = best_cong_model.feature_importances_
        generate_feature_importance_plot(importances, feature_cols, project_root=project_root)

    print("\nTraining and artifact generation complete!")
    return {
        "results": results,
        "models": final_models,
        "splits": splits,
        "metadata": metadata,
        "feature_cols": feature_cols,
        "encoders": encoders_tv,
        "medians": medians_tv,
    }


if __name__ == "__main__":
    run_training()
