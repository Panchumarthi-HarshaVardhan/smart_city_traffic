# CITYFLOW AI
*Predict. Navigate. Optimize.*

AI-Powered Urban Traffic Congestion Prediction & Intelligent Route Recommendation System for Bengaluru, India.  
**DataQuest 2026 Hackathon**

---

## Overview

CITYFLOW AI addresses urban traffic gridlock in Bengaluru by utilizing real-world historical traffic observations and meteorological sensor telemetry to deliver **next-day road-level congestion and travel condition forecasts**.

Rather than relying on static road speed assumptions, CITYFLOW AI models historical recurring trends, weather impacts, and temporal rhythms to predict corridor-level congestion, speeds, and traffic volumes across 16 arterial routes.

---

## System Architecture

```
CITYFLOW-AI/
├── data/
│   ├── raw/
│   │   ├── Banglore_traffic_Dataset.csv   # 8,936 rows of Bengaluru daily traffic data
│   │   └── open-meteo.csv                 # 22,848 hourly weather observations
│   └── processed/
│       ├── daily_weather.csv              # 14 aggregated daily meteorological metrics
│       ├── merged_dataset.csv             # Lossless LEFT JOIN on calendar date
│       ├── feature_dataset.csv            # Date, cyclic, lag & rolling features
│       └── final_ml_dataset.csv           # ML training dataset with next-day targets
│
├── ml/
│   ├── config.py                          # Global parameters, paths, thresholds
│   ├── utils.py                           # Helper routines, metric calculations
│   ├── data_inspection.py                 # Automated dataset auditing & profiling
│   ├── weather_processing.py              # Hourly -> daily weather aggregator
│   ├── data_preprocessing.py              # Data cleaning and merge logic
│   ├── feature_engineering.py             # Lag/rolling generation & target creation
│   ├── train.py                           # Chronological split, training & tuning
│   ├── evaluate.py                        # Metric calculations, comparison & plots
│   ├── predict.py                         # Single & batch road inference engine
│   ├── explain.py                         # Feature importance & factor interpretation
│   ├── hotspot_analysis.py                # City bottleneck identification & ranking
│   ├── models/                            # Trained artifacts & schemas
│   └── tests/                             # 29 automated test cases
│
├── reports/
│   ├── data_quality_report.json           # Detailed statistical audit
│   ├── data_quality_report.md             # Data audit markdown
│   ├── model_comparison.csv               # Baseline vs ML model metrics
│   ├── model_comparison.md                # Markdown comparison tables
│   ├── feature_importance.csv             # Feature importance rankings
│   ├── ML_SUMMARY.md                      # Comprehensive Hackathon report
│   └── plots/                             # Actual vs predicted & residual curves
│
├── backend/
│   └── ml_service/
│       └── model_service.py               # FastAPI integration endpoints
│
├── requirements-ml.txt                    # Project dependencies
├── run_ml_pipeline.py                     # Single-command end-to-end runner
└── README.md
```

---

## Datasets

1. **Bengaluru Traffic Telemetry** (`data/raw/Banglore_traffic_Dataset.csv`):
   - 8,936 rows × 16 attributes across 16 roads and 8 areas.
   - Date span: 2022-01-01 to 2024-08-09 (952 unique dates).
   - Zero missing or duplicate entries.

2. **Open-Meteo Hourly Weather** (`data/raw/open-meteo.csv`):
   - 22,848 records covering temperature, humidity, rainfall, precipitation, wind speed, and weather codes.

---

## Machine Learning Pipeline

### 1. Daily Weather Processing
Hourly weather is aggregated into 14 daily features including temperature extremes/means, rainfall accumulation, rain hours, and modal weather codes.

### 2. Road-Level Lag & Rolling Engineering
To model road inertia without data leakage, all lags and rolling averages are calculated strictly per road using a `shift(1).rolling(w).mean()` pattern:
- **Lags**: Lag-1, Lag-3, Lag-7 for volume, congestion, speed, travel time index, and capacity utilization.
- **Rolls**: 3-day and 7-day rolling means using past days only.

### 3. Chronological Time-Series Splitting
To simulate real-world forward prediction without future leakage:
- **Train (70%)**: 2022-01-01 → 2023-10-27 (6,232 rows)
- **Validation (15%)**: 2023-10-28 → 2024-03-18 (1,366 rows)
- **Test (15%)**: 2024-03-19 → 2024-08-08 (1,322 rows)

### 4. Forecasting Performance

#### Next-Day Congestion (0–100 Scale)
- **Previous-Day Baseline MAE**: 20.447
- **7-Day Rolling Baseline MAE**: 16.284
- **Tuned Random Forest Test MAE**: **16.272** | **Test RMSE: 20.783** | **Test R²: 0.244**

#### Next-Day Traffic Volume (Vehicles/Day)
- **Previous-Day Baseline MAE**: 11,854.88
- **7-Day Rolling Baseline MAE**: 8,914.89
- **Tuned Random Forest Test MAE**: **8,566.80** | **Test RMSE: 10,570.75** | **Test R²: 0.325**

#### Next-Day Average Speed (km/h)
- **Previous-Day Baseline MAE**: 11.956
- **Linear Regression Test MAE**: **8.420** | **Test RMSE: 10.569**

---

## Congestion Categories & Hotspots

Thresholds established from empirical distribution percentiles:
- **LOW**: `< 40.0`
- **MODERATE**: `40.0 – 69.9`
- **HIGH**: `70.0 – 89.9`
- **SEVERE**: `≥ 90.0`

### Top Hotspots in Bengaluru:
1. **Sarjapur Road** (Koramangala) — Congestion: 95.6 [SEVERE]
2. **Sony World Junction** (Koramangala) — Congestion: 93.6 [SEVERE]
3. **Anil Kumble Circle** (M.G. Road) — Congestion: 93.4 [SEVERE]
4. **Trinity Circle** (M.G. Road) — Congestion: 93.4 [SEVERE]
5. **CMH Road** (Indiranagar) — Congestion: 92.2 [SEVERE]

---

## FastAPI Integration

The backend service module in `backend/ml_service/model_service.py` provides clean functions for API integration:

```python
from backend.ml_service.model_service import predict_road, get_hotspots, get_route_traffic_summary

# 1. Single road prediction
pred = predict_road("Silk Board Junction")

# 2. Ranked city-wide congestion hotspots
hotspots = get_hotspots(top_n=5)

# 3. Route summary for multi-segment route planning
route_summary = get_route_traffic_summary(["Silk Board Junction", "Hebbal Flyover"])
```

---

## How to Run the Pipeline

### 1. Install Requirements
```bash
pip install -r requirements-ml.txt
```

### 2. Execute Full ML Pipeline
```bash
python run_ml_pipeline.py
```

### 3. Run Automated Tests
```bash
pytest ml/tests/ -v
```

---

## Key Rules & Compliance
- **Real Data Only**: Zero synthetic data, zero fabricated records.
- **Strict Leakage Prevention**: Features strictly reference historical days.
- **Realistic Scope**: Next-day road forecasting from daily observations (no false claims of 15/30-minute traffic or live GPS telemetry).
