# Data Quality Report

_Generated: 2026-09-25 12:14:00_

## 1. Traffic Dataset

**File:** `data/raw/Banglore_traffic_Dataset.csv`

- **Rows:** 8936
- **Columns:** 16
- **Date range:** 2022-01-01 00:00:00 → 2024-08-09 00:00:00
- **Unique dates:** 952
- **Unique roads:** 16
- **Unique areas:** 8
- **Duplicate rows:** 0
- **Duplicate (Date + Road) combos:** 0
- **Total missing values:** 0
- **Total infinite values:** 0

### Data Types

| Column | Dtype |
|--------|-------|
| Date | object |
| Area Name | object |
| Road/Intersection Name | object |
| Traffic Volume | int64 |
| Average Speed | float64 |
| Travel Time Index | float64 |
| Congestion Level | float64 |
| Road Capacity Utilization | float64 |
| Incident Reports | int64 |
| Environmental Impact | float64 |
| Public Transport Usage | float64 |
| Traffic Signal Compliance | float64 |
| Parking Usage | float64 |
| Pedestrian and Cyclist Count | int64 |
| Weather Conditions | object |
| Roadwork and Construction Activity | object |

### Numerical Statistics

| Column | Min | Q25 | Median | Mean | Q75 | Max | Std |
|--------|-----|-----|--------|------|-----|-----|-----|
| Traffic Volume | 4233.00 | 19413.00 | 27600.00 | 29236.05 | 38058.50 | 72039.00 | 13001.81 |
| Average Speed | 20.00 | 31.78 | 39.20 | 39.45 | 46.64 | 89.79 | 10.71 |
| Travel Time Index | 1.00 | 1.24 | 1.50 | 1.38 | 1.50 | 1.50 | 0.17 |
| Congestion Level | 5.16 | 64.29 | 92.39 | 80.82 | 100.00 | 100.00 | 23.53 |
| Road Capacity Utilization | 18.74 | 97.35 | 100.00 | 92.03 | 100.00 | 100.00 | 16.58 |
| Incident Reports | 0.00 | 0.00 | 1.00 | 1.57 | 2.00 | 10.00 | 1.42 |
| Environmental Impact | 58.47 | 88.83 | 105.20 | 108.47 | 126.12 | 194.08 | 26.00 |
| Public Transport Usage | 10.01 | 27.34 | 45.17 | 45.09 | 62.43 | 79.98 | 20.21 |
| Traffic Signal Compliance | 60.00 | 69.83 | 79.99 | 79.95 | 89.96 | 99.99 | 11.59 |
| Parking Usage | 50.02 | 62.55 | 75.32 | 75.16 | 87.52 | 100.00 | 14.41 |
| Pedestrian and Cyclist Count | 66.00 | 94.00 | 102.00 | 114.53 | 111.00 | 243.00 | 36.81 |

### Categorical Value Counts

**Weather Conditions**

| Value | Count |
|-------|-------|
| Clear | 5426 |
| Overcast | 1296 |
| Fog | 959 |
| Rain | 827 |
| Windy | 428 |

**Roadwork and Construction Activity**

| Value | Count |
|-------|-------|
| No | 8054 |
| Yes | 882 |

**Area Name**

| Value | Count |
|-------|-------|
| Indiranagar | 1720 |
| M.G. Road | 1501 |
| Koramangala | 1364 |
| Jayanagar | 1173 |
| Hebbal | 950 |
| Whitefield | 942 |
| Yeshwanthpur | 734 |
| Electronic City | 552 |

**Road/Intersection Name**

| Value | Count |
|-------|-------|
| 100 Feet Road | 860 |
| CMH Road | 860 |
| Anil Kumble Circle | 759 |
| Trinity Circle | 742 |
| Sony World Junction | 684 |
| Sarjapur Road | 680 |
| South End Circle | 593 |
| Jayanagar 4th Block | 580 |
| Marathahalli Bridge | 492 |
| Ballari Road | 476 |
| Hebbal Flyover | 474 |
| ITPL Main Road | 450 |
| Yeshwanthpur Circle | 373 |
| Tumkur Road | 361 |
| Hosur Road | 277 |
| Silk Board Junction | 275 |

### Outliers (IQR Method)

| Column | Count | Lower Bound | Upper Bound | Min Outlier | Max Outlier |
|--------|-------|-------------|-------------|-------------|-------------|
| Traffic Volume | 24 | -8555.25 | 66026.75 | 66047.00 | 72039.00 |
| Average Speed | 33 | 9.47 | 68.95 | 68.99 | 89.79 |
| Congestion Level | 3 | 10.73 | 153.56 | 5.16 | 8.74 |
| Road Capacity Utilization | 2078 | 93.39 | 103.97 | 18.74 | 93.36 |
| Incident Reports | 100 | -3.00 | 5.00 | 6.00 | 10.00 |
| Environmental Impact | 24 | 32.89 | 182.05 | 182.09 | 194.08 |
| Pedestrian and Cyclist Count | 1316 | 68.50 | 136.50 | 66.00 | 243.00 |

### Unique Areas

- Electronic City
- Hebbal
- Indiranagar
- Jayanagar
- Koramangala
- M.G. Road
- Whitefield
- Yeshwanthpur

### Unique Roads

- 100 Feet Road
- Anil Kumble Circle
- Ballari Road
- CMH Road
- Hebbal Flyover
- Hosur Road
- ITPL Main Road
- Jayanagar 4th Block
- Marathahalli Bridge
- Sarjapur Road
- Silk Board Junction
- Sony World Junction
- South End Circle
- Trinity Circle
- Tumkur Road
- Yeshwanthpur Circle

## 2. Weather Dataset

**File:** `data/raw/open-meteo.csv`

- **Latitude:** 12.970123
- **Longitude:** 77.56364
- **Elevation:** 910.0 m
- **Timezone:** Asia/Kolkata
- **Rows:** 22848
- **Columns:** 7
- **Date range:** 2022-01-01 00:00:00 → 2024-08-09 23:00:00
- **Duplicate timestamps:** 0
- **Total missing values:** 0

### Numerical Statistics

| Column | Min | Q25 | Median | Mean | Q75 | Max | Std |
|--------|-----|-----|--------|------|-----|-----|-----|
| temperature_2m (°C) | 11.90 | 20.40 | 22.80 | 23.56 | 26.50 | 39.50 | 4.37 |
| relative_humidity_2m (%) | 10.00 | 52.00 | 72.00 | 68.48 | 90.00 | 100.00 | 23.35 |
| precipitation (mm) | 0.00 | 0.00 | 0.00 | 0.11 | 0.00 | 12.80 | 0.57 |
| rain (mm) | 0.00 | 0.00 | 0.00 | 0.11 | 0.00 | 12.80 | 0.57 |
| wind_speed_10m (km/h) | 0.00 | 8.70 | 12.00 | 12.47 | 15.60 | 39.30 | 5.31 |
| weather_code (wmo code) | 0.00 | 1.00 | 3.00 | 10.70 | 3.00 | 65.00 | 19.31 |
