"""
Tests for prediction module and hotspot analysis.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.predict import predict_road, predict_multiple_roads, load_models
from ml.hotspot_analysis import get_hotspots, get_congestion_summary


@pytest.fixture(scope="module")
def check_models_exist():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(root, "ml", "models", "congestion_model.joblib")
    if not os.path.exists(model_path):
        pytest.skip("Models not trained yet.")


def test_predict_road_valid(check_models_exist):
    res = predict_road("Silk Board Junction")
    assert "error" not in res
    assert res["road"] == "Silk Board Junction"
    assert "predicted_traffic_volume" in res
    assert "predicted_average_speed" in res
    assert "predicted_congestion_level" in res
    assert res["congestion_category"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]


def test_predict_unknown_road(check_models_exist):
    res = predict_road("NonExistent_Unknown_Expressway_XYZ")
    assert "error" in res
    assert "Available roads" in res["error"] or "not found" in res["error"]


def test_prediction_physical_bounds(check_models_exist):
    res = predict_road("Hebbal Flyover")
    assert 0.0 <= res["predicted_congestion_level"] <= 100.0
    assert res["predicted_average_speed"] > 0
    assert res["predicted_traffic_volume"] >= 0


def test_hotspot_ranking(check_models_exist):
    hotspots = get_hotspots()
    assert len(hotspots) > 0
    # Verify sorted descending
    for i in range(len(hotspots) - 1):
        assert hotspots[i]["predicted_congestion"] >= hotspots[i + 1]["predicted_congestion"]


def test_congestion_summary(check_models_exist):
    summary = get_congestion_summary()
    assert summary["total_roads"] > 0
    assert "average_congestion" in summary
    assert "worst_road" in summary
    assert "best_road" in summary
