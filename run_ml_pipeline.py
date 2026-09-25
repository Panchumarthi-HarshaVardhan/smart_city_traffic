"""
CityFlow AI - Master Machine Learning Pipeline Runner

Executes the entire end-to-end ML lifecycle:
1. Dataset inspection and quality reporting
2. Weather processing and daily aggregation
3. Traffic and weather dataset merging and cleaning
4. Feature engineering with road-level lags and target creation
5. Chronological time-series model training and tuning (LR, RF, HGBR, XGBoost)
6. Model evaluation and artifact serialization
7. Visualizations and feature importance extraction
8. Automated unit and leak-prevention test execution
9. Final comprehensive terminal summary
"""

import os
import sys
import json
import subprocess
import pandas as pd

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ml.data_inspection import run_inspection
from ml.weather_processing import process_weather
from ml.data_preprocessing import preprocess_data
from ml.feature_engineering import engineer_features
from ml.train import run_training
from ml.explain import run_explainability
from ml.predict import predict_multiple_roads
from ml.hotspot_analysis import get_hotspots


def main():
    print("=" * 70)
    print("CITYFLOW AI — FULL MACHINE LEARNING PIPELINE EXECUTION")
    print("AI-Powered Urban Traffic Congestion Prediction — Bengaluru")
    print("=" * 70)

    # Step 1: Data Quality Inspection
    print("\n>>> STEP 1: Inspecting raw datasets & generating data quality reports...")
    quality_report = run_inspection(project_root=PROJECT_ROOT)

    # Step 2: Weather Processing
    print("\n>>> STEP 2: Processing Open-Meteo hourly weather into daily aggregates...")
    daily_weather = process_weather(project_root=PROJECT_ROOT)

    # Step 3: Traffic + Weather Merging & Cleaning
    print("\n>>> STEP 3: Merging traffic with weather & cleaning...")
    merged_data = preprocess_data(project_root=PROJECT_ROOT)

    # Step 4: Feature Engineering
    print("\n>>> STEP 4: Engineering date, cyclic, road-level lag & target features...")
    final_ml_df = engineer_features(project_root=PROJECT_ROOT)

    # Step 5: Training, Tuning & Evaluation
    print("\n>>> STEP 5: Running chronological training, hyperparameter tuning & evaluation...")
    train_output = run_training(project_root=PROJECT_ROOT)

    # Step 6: Explainability
    print("\n>>> STEP 6: Generating model explainability and feature rankings...")
    models = train_output["models"]
    feature_cols = train_output["feature_cols"]
    df_imp = run_explainability(models, None, None, feature_cols, project_root=PROJECT_ROOT)

    # Step 7: Run Pytest Suite
    print("\n>>> STEP 7: Running automated test suite (including data leakage checks)...")
    test_result = subprocess.run(
        ["pytest", "ml/tests/", "-v", "--tb=short"],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )
    print(test_result.stdout)
    if test_result.stderr:
        print(test_result.stderr)

    passed_count = test_result.stdout.count("PASSED")
    failed_count = test_result.stdout.count("FAILED")

    # Load results for terminal summary
    results = train_output["results"]
    metadata = train_output["metadata"]
    splits = train_output["splits"]

    # Read top features
    top_features = []
    if df_imp is not None:
        top_features = df_imp.head(10)["feature"].tolist()

    # Step 8: Final Formatted Terminal Summary
    print("\n" + "=" * 40)
    print("CITYFLOW AI — ML PIPELINE COMPLETE")
    print("=" * 40)

    print("\nDATASETS")
    print("-" * 40)
    print(f"Traffic rows: {quality_report['traffic']['shape']['rows']}")
    print(f"Traffic dates: {quality_report['traffic']['unique_dates_count']}")
    print(f"Traffic roads: {quality_report['traffic']['unique_roads']['count']}")
    print(f"Traffic areas: {quality_report['traffic']['unique_areas']['count']}")
    print(f"\nWeather hourly rows: {quality_report['weather']['shape']['rows']}")
    print(f"Weather daily rows: {len(daily_weather)}")
    print(f"\nMerged rows: {len(merged_data)}")
    print(f"ML features: {len(feature_cols)}")

    print("\nDATA SPLIT")
    print("-" * 40)
    print(f"Train: {splits['train'][0]} → {splits['train'][1]}")
    print(f"Validation: {splits['val'][0]} → {splits['val'][1]}")
    print(f"Test: {splits['test'][0]} → {splits['test'][1]}")

    print("\nMODEL PERFORMANCE")
    print("-" * 40)

    print("\nCONGESTION")
    print(f"Baseline MAE: {results['congestion']['prev_day_baseline']['mae']:.3f}")
    print(f"Best model: {metadata['models']['congestion']['algorithm']}")
    print(f"Test MAE: {metadata['models']['congestion']['test_mae']:.3f}")
    print(f"Test RMSE: {metadata['models']['congestion']['test_rmse']:.3f}")
    print(f"Test R²: {metadata['models']['congestion']['test_r2']:.3f}")

    print("\nTRAFFIC VOLUME")
    print(f"Baseline MAE: {results['traffic_volume']['prev_day_baseline']['mae']:.3f}")
    print(f"Best model: {metadata['models']['traffic_volume']['algorithm']}")
    print(f"Test MAE: {metadata['models']['traffic_volume']['test_mae']:.3f}")
    print(f"Test RMSE: {metadata['models']['traffic_volume']['test_rmse']:.3f}")
    print(f"Test R²: {metadata['models']['traffic_volume']['test_r2']:.3f}")

    print("\nAVERAGE SPEED")
    print(f"Baseline MAE: {results['average_speed']['prev_day_baseline']['mae']:.3f}")
    print(f"Best model: {metadata['models']['average_speed']['algorithm']}")
    print(f"Test MAE: {metadata['models']['average_speed']['test_mae']:.3f}")
    print(f"Test RMSE: {metadata['models']['average_speed']['test_rmse']:.3f}")
    print(f"Test R²: {metadata['models']['average_speed']['test_r2']:.3f}")

    print("\nTOP FEATURES")
    print("-" * 40)
    for idx, feat in enumerate(top_features, 1):
        print(f"{idx}. {feat}")

    print("\nMODEL FILES")
    print("-" * 40)
    models_dir = os.path.join(PROJECT_ROOT, "ml", "models")
    for f in sorted(os.listdir(models_dir)):
        print(f"ml/models/{f}")

    print("\nTESTS")
    print("-" * 40)
    print(f"Passed: {passed_count}")
    print(f"Failed: {failed_count}")

    print("=" * 40)


if __name__ == "__main__":
    main()
