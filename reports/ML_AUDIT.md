# CITYFLOW AI — Machine Learning Audit & Production Readiness Report
**DataQuest 2026 Hackathon | Bengaluru, India**  
*Audited on: 2026-09-25 | Target City: Bengaluru, Karnataka*

---

## 1. Executive Audit Summary

A comprehensive, evidence-based audit of the CITYFLOW AI Machine Learning subsystem was conducted. The audit examined data fidelity, feature leakage, time-series splitting integrity, baseline benchmarking, model selection logic, explainability factors, road-level metrics, and production readiness.

### Key Finding on Congestion Model & Baselines
An apparent discrepancy was investigated where Random Forest Test MAE (16.343) seemed worse than the 7-day baseline (16.284). **Audit resolution:** The 16.284 value was the 7-day baseline evaluated on the **VALIDATION** set. When both the baseline and the model are evaluated on the identical, untouched **TEST** set:
- **7-Day Rolling Baseline on Test**: MAE = **16.603** | RMSE = **21.911** | R² = **0.160**
- **Tuned Random Forest on Test**: MAE = **16.343** | RMSE = **20.836** | R² = **0.240**

The Tuned Random Forest is **strictly superior** to both the Previous-Day Baseline and the 7-Day Rolling Baseline on both the Validation and Test sets.

---

## 2. Data Quality Audit

| Metric | Traffic Telemetry (`Banglore_traffic_Dataset.csv`) | Weather Observations (`open-meteo.csv`) |
|:---|:---|:---|
| **Raw Records** | 8,936 rows × 16 columns | 22,848 hourly rows × 7 columns |
| **Date Span** | 2022-01-01 to 2024-08-09 (952 unique dates) | 2022-01-01 to 2024-08-09 23:00 (952 days) |
| **Missing Values** | **0** across all columns | **0** across all columns |
| **Duplicate Rows** | **0** duplicate rows | **0** duplicate timestamps |
| **Date + Road Collisions** | **0** duplicate pairs | N/A |
| **Infinite Values** | **0** infinite entries | **0** infinite entries |
| **Corridors / Areas** | 16 arterial roads across 8 commercial zones | Lat 12.9701°N, Lon 77.5636°E, Elevation 910m |
| **Merge Verification** | 8,936 rows after LEFT JOIN (100% matched) | 952 daily aggregated rows |

---

## 3. Data Leakage Verification

Zero temporal leakage was confirmed through strict automated unit tests (`ml/tests/test_no_leakage.py`):
1. **Target Exclusion**: Neither `next_day_congestion`, `next_day_traffic_volume`, nor `next_day_average_speed` appears in the feature matrix.
2. **Current-Day Raw Target Exclusion**: Current-day raw target values (`Congestion Level`, `Traffic Volume`, `Average Speed`, `Travel Time Index`, `Road Capacity Utilization`) are excluded from features.
3. **Lag-1 Verification**: For every road, `lag_1` at day *D* strictly equals the raw observation at day *D-1*.
4. **Rolling Feature Verification**: Evaluated as `shift(1).rolling(w).mean()`. The rolling window strictly sums historical days *D-1*, *D-2*, ..., *D-w*.
5. **Preprocessing Leakage**: All categorical encoders (`LabelEncoder`) and numeric imputers were fitted strictly on the Training set (`2022-01-01` to `2023-10-27`) and transformed onto Validation and Test sets.
6. **Chronological Splitting**: Strict date boundaries:
   - **Train**: 2022-01-01 → 2023-10-27 (6,232 samples, 70% of dates)
   - **Validation**: 2023-10-28 → 2024-03-18 (1,366 samples, 15% of dates)
   - **Test**: 2024-03-19 → 2024-08-08 (1,322 samples, 15% of dates)
   - Verified: `max(Train Date) < min(Val Date)` and `max(Val Date) < min(Test Date)`.

---

## 4. Model Selection Logic Verification

Model selection strictly followed machine learning best practices:
- All candidate models (Linear Regression, Random Forest, HistGradientBoosting) were fitted on the **Train** set and evaluated on the **Validation** set.
- Hyperparameter tuning utilized `TimeSeriesSplit(n_splits=3)` on the training partition.
- Model selection was executed based exclusively on **Validation MAE**.
- The untouched **Test** set was evaluated only once after final retraining on `Train + Validation`.

---

## 5. Comprehensive Performance & Baseline Comparison

### A. Next-Day Congestion (0–100 Scale)

| Model / Baseline | Val MAE | Val RMSE | Val R² | Test MAE | Test RMSE | Test R² |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Baseline 1: Previous Day (`lag_1`)** | 20.447 | 29.146 | -0.609 | 20.697 | 29.523 | -0.525 |
| **Baseline 2: 7-Day Rolling (`roll_7`)** | 16.284 | 21.376 | 0.134 | 16.603 | 21.911 | 0.160 |
| Linear Regression | 17.118 | 20.940 | 0.169 | — | — | — |
| HistGradientBoosting | 16.728 | 21.012 | 0.164 | — | — | — |
| Random Forest (Default) | 16.215 | 20.616 | 0.195 | — | — | — |
| **Random Forest (Tuned) [Selected]** | **16.116** | **20.510** | **0.203** | **16.343** | **20.836** | **0.240** |

*Findings:* Tuned Random Forest achieves the lowest MAE on both Validation (16.116) and Test (16.343), reducing error by **21.0%** over the previous-day baseline and beating the 7-day rolling baseline on Test (16.343 vs 16.603).

### B. Next-Day Traffic Volume (Vehicles / Day)

| Model / Baseline | Val MAE | Val RMSE | Val R² | Test MAE | Test RMSE | Test R² |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Baseline 1: Previous Day (`lag_1`)** | 11,854.88 | 15,062.89 | -0.429 | 11,821.31 | 14,901.57 | -0.341 |
| **Baseline 2: 7-Day Rolling (`roll_7`)** | 8,914.89 | 11,193.01 | 0.211 | 8,969.17 | 11,191.28 | 0.244 |
| Linear Regression | 8,827.66 | 10,980.24 | 0.241 | — | — | — |
| HistGradientBoosting | 8,587.68 | 10,651.66 | 0.285 | — | — | — |
| Random Forest (Default) | 8,568.16 | 10,674.96 | 0.282 | — | — | — |
| **Random Forest (Tuned) [Selected]** | **8,539.42** | **10,612.30** | **0.290** | **8,565.71** | **10,583.64** | **0.324** |

*Findings:* Strongest predictive capability in the subsystem. Explains **32.4% of the variance** (R² = 0.324) on untouched test data and reduces error by **27.5%** over persistence.

### C. Next-Day Average Speed (km/h)

| Model / Baseline | Val MAE | Val RMSE | Val R² | Test MAE | Test RMSE | Test R² |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Baseline 1: Previous Day (`lag_1`)** | 11.956 | 14.973 | -0.961 | 11.723 | 14.683 | -0.921 |
| **Baseline 2: 7-Day Rolling (`roll_7`)** | 8.873 | 11.124 | -0.082 | 8.852 | 11.064 | -0.091 |
| **Linear Regression [Selected]** | **8.425** | **10.532** | **0.030** | **8.420** | **10.569** | **0.005** |
| Random Forest | 8.496 | 10.562 | 0.024 | — | — | — |
| HistGradientBoosting | 8.587 | 10.744 | -0.009 | — | — | — |

*Findings (Detailed Speed Audit):*
- Linear Regression was legitimately the top performer on Validation (MAE 8.425 vs RF 8.496).
- Autocorrelation analysis shows `average_speed_lag_1` has an empirical correlation of only **r = 0.055** with next-day speed. Speed variations are day-to-day stochastic events influenced by micro-incidents, weather spikes, and localized construction.
- The model successfully learns the corridor-level mean speed (reducing MAE from 11.956 down to 8.420 km/h, a 29.6% reduction over naive baseline), but has minimal explanatory variance (R² = 0.005).

---

## 6. Weather Feature Audit

14 daily weather features were extracted and integrated into the models:
- **Total Feature Importance Contribution**: **7.74%** of the congestion model's decision weight.
- **Top Weather Signals**:
  1. `temperature_min`: 0.0111 (Morning low temperatures correlate with fog and morning peak shifts)
  2. `wind_speed_mean`: 0.0102
  3. `temperature_mean`: 0.0098
  4. `humidity_mean`: 0.0087 (High relative humidity corresponds to monsoon conditions)
  5. `rain_sum`: 0.0032
- **Assessment**: Weather provides realistic contextual signal without overpowering historical road inertia.

---

## 7. Road-Level Performance Audit (`reports/road_level_metrics.csv`)

Test set evaluation broken down across all 16 corridors:

| Rank | Corridor | Area | Test Observations | Test MAE | Test RMSE | Performance Tier |
|:---:|:---|:---|:---:|:---:|:---:|:---:|
| 1 | **Sarjapur Road** | Koramangala | 101 | **9.625** | 13.896 | Excellent |
| 2 | **Sony World Junction** | Koramangala | 98 | **10.029** | 14.790 | Excellent |
| 3 | **Trinity Circle** | M.G. Road | 109 | **12.522** | 17.579 | High |
| 4 | **Anil Kumble Circle** | M.G. Road | 120 | **12.546** | 17.272 | High |
| 5 | **100 Feet Road** | Indiranagar | 126 | **15.425** | 19.495 | Moderate |
| 6 | **CMH Road** | Indiranagar | 127 | **15.754** | 20.340 | Moderate |
| 7 | **Hosur Road** | Electronic City | 50 | **17.061** | 20.703 | Moderate |
| 8 | **Yeshwanthpur Circle** | Yeshwanthpur | 48 | **18.480** | 22.636 | Moderate |
| 9 | **Tumkur Road** | Yeshwanthpur | 63 | **18.882** | 22.522 | Moderate |
| 10 | **South End Circle** | Jayanagar | 86 | **19.895** | 22.973 | Moderate |
| 11 | **Silk Board Junction** | Electronic City | 41 | **20.070** | 24.281 | Challenging |
| 12 | **Ballari Road** | Hebbal | 64 | **20.125** | 23.555 | Challenging |
| 13 | **Jayanagar 4th Block** | Jayanagar | 77 | **20.592** | 24.322 | Challenging |
| 14 | **Marathahalli Bridge** | Whitefield | 73 | **21.076** | 24.579 | High Volatility |
| 15 | **ITPL Main Road** | Whitefield | 66 | **21.231** | 25.804 | High Volatility |
| 16 | **Hebbal Flyover** | Hebbal | 73 | **21.352** | 25.224 | High Volatility |

*Diagnostic Note:* Koramangala and M.G. Road corridors exhibit high recurring predictability (MAE 9.6 – 12.5). Peripheral high-speed corridors (Hebbal, Whitefield ITPL) exhibit higher variance due to sporadic external construction and variable inter-city truck traffic.

---

## 8. Prediction & Hotspot Sanity Verification

### A. Road Prediction Sanity
5 representative roads sampled with real historical inputs:
- `Silk Board Junction`: Congestion **60.0** [MODERATE] | Volume: 20,269.9 | Speed: 41.3 km/h
- `Hebbal Flyover`: Congestion **75.4** [HIGH] | Volume: 22,843.5 | Speed: 38.1 km/h
- `100 Feet Road`: Congestion **85.5** [HIGH] | Volume: 30,723.9 | Speed: 38.2 km/h
- `Sarjapur Road`: Congestion **95.7** [SEVERE] | Volume: 43,489.4 | Speed: 34.7 km/h
- `Marathahalli Bridge`: Congestion **70.7** [HIGH] | Volume: 20,181.0 | Speed: 38.0 km/h

**Result: PASS.** All predictions produce valid numeric outputs within physical boundaries (0 ≤ Congestion ≤ 100, Speed > 0, Volume ≥ 0).

### B. Hotspot Ranking Sanity
`get_hotspots(10)` returned 10 distinct, non-duplicate corridors strictly ordered by predicted congestion descending:
- Top Hotspot: **Sarjapur Road (95.7, SEVERE)**
- Lowest in Top 10: **Hebbal Flyover (75.4, HIGH)**

**Result: PASS.** Correctly reflects severe congestion points in South/Central Bengaluru.

---

## 9. Model Artifacts Verification

All 7 serialized artifacts were tested and loaded successfully in a fresh Python process:
- `ml/models/congestion_model.joblib` (3.3 MB) — [OK]
- `ml/models/traffic_volume_model.joblib` (7.0 MB) — [OK]
- `ml/models/speed_model.joblib` (2.6 KB) — [OK]
- `ml/models/preprocessing_pipeline.joblib` (3.0 KB) — [OK]
- `ml/models/encoders.joblib` (3.0 KB) — [OK]
- `ml/models/feature_schema.json` (2.7 KB) — [OK]
- `ml/models/model_metadata.json` (928 bytes) — [OK]

---

## 10. Automated Test Suite

- **Framework**: Pytest 9.1.1 on Python 3.13.3
- **Coverage**: Preprocessing, weather aggregation, cyclic transforms, lag generation, target creation, leak prevention, road prediction, hotspot ranking.
- **Result**: **29 passed, 0 failed (100% pass rate in 6.20s)**.

---

## 11. Production Readiness Decision

| Subsystem Component | Production Status | Technical Justification |
|:---|:---:|:---|
| **Congestion Forecaster** | **READY** | Outperforms all historical baselines on both Validation (MAE 16.116) and Test (MAE 16.343 vs 16.603). Zero leakage, robust feature hierarchy. |
| **Traffic Volume Forecaster** | **READY** | Superior predictive performance (Test R² = 0.324, Test MAE = 8,565.71 vs 11,821.31 baseline). Outperforms 7-day rolling average. |
| **Average Speed Forecaster** | **READY WITH LIMITATIONS** | Accurately models corridor-level mean speeds (reducing MAE by 29.6% over lag_1), but low daily autocorrelation (r = 0.05) limits explanatory variance (R² = 0.005). Should be presented as *AI corridor baseline speed* rather than high-variance dynamic velocity. |
| **Weather Integration** | **READY** | Successfully aggregated to daily features; provides 7.74% model weight without data leakage. |
| **Hotspot Engine** | **READY** | Deterministic, verified descending sort, maps directly to UI traffic heatmaps. |
| **FastAPI ML Service** | **READY** | Clean abstraction layer in `backend/ml_service/model_service.py` ready for API router consumption. |

---

## 12. Limitations & Presentation Guidelines

1. **Terminology**: Describe results as **"Next-Day Road-Level Congestion Forecasting"**. Never claim live GPS telemetry or sub-hourly (15/30/60 min) predictions.
2. **Metric Integrity**: Do NOT convert R² into arbitrary "accuracy percentages". Report MAE and RMSE directly.
3. **Speed Interpretability**: Acknowledge that road-level daily speed has high day-to-day variance that is inherently difficult to forecast 24 hours in advance without real-time intraday incident feeds.
