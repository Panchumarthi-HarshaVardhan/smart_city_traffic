# CityFlow AI — Model Comparison Report


## Congestion

| Model | MAE | RMSE | R² | MAPE | Split |
|-------|-----|------|----|------|-------|
| prev_day_baseline | 20.4466 | 29.1461 | -0.6092 | 35.39% | test |
| 7day_baseline | 16.2839 | 21.3758 | 0.1344 | 28.89% | test |
| LinearRegression | 17.1179 | 20.9399 | 0.1694 | 29.40% | test |
| RandomForest | 16.2151 | 20.6165 | 0.1948 | 28.34% | test |
| HistGradientBoosting | 16.7278 | 21.0122 | 0.1636 | 28.79% | test |
| RandomForest (Tuned) (best) | 16.3429 | 20.8362 | 0.2402 | 31.22% | test |

**Best model:** RandomForest (Tuned)


## Traffic Volume

| Model | MAE | RMSE | R² | MAPE | Split |
|-------|-----|------|----|------|-------|
| prev_day_baseline | 11854.8829 | 15062.8850 | -0.4289 | 52.02% | test |
| 7day_baseline | 8914.8930 | 11193.0101 | 0.2110 | 40.70% | test |
| LinearRegression | 8827.6604 | 10980.2372 | 0.2407 | 40.31% | test |
| RandomForest | 8568.1629 | 10674.9615 | 0.2824 | 39.46% | test |
| HistGradientBoosting | 8587.6829 | 10651.6552 | 0.2855 | 39.16% | test |
| RandomForest (Tuned) (best) | 8565.7111 | 10583.6378 | 0.3237 | 41.08% | test |

**Best model:** RandomForest (Tuned)


## Average Speed

| Model | MAE | RMSE | R² | MAPE | Split |
|-------|-----|------|----|------|-------|
| prev_day_baseline | 11.9558 | 14.9732 | -0.9608 | 33.59% | test |
| 7day_baseline | 8.8728 | 11.1244 | -0.0823 | 25.46% | test |
| LinearRegression | 8.4251 | 10.5321 | 0.0299 | 24.35% | test |
| RandomForest | 8.4964 | 10.5618 | 0.0244 | 24.70% | test |
| HistGradientBoosting | 8.5867 | 10.7435 | -0.0095 | 24.86% | test |
| LinearRegression (best) | 8.4196 | 10.5688 | 0.0048 | 23.79% | test |

**Best model:** LinearRegression


## Test Predictions

| Model | MAE | RMSE | R² | MAPE | Split |
|-------|-----|------|----|------|-------|
| congestion | — | — | — | — | test |
| traffic_volume | — | — | — | — | test |
| average_speed | — | — | — | — | test |
