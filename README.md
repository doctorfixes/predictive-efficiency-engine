# predictive-efficiency-engine

[![Predictive Efficiency Engine - Daily Data Pipeline](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml/badge.svg)](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml)
[![Energy Data Validation](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/energy-data-validation.yml/badge.svg)](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/energy-data-validation.yml)

Production-ready data pipeline for processing energy generation CSV data using stochastic time-series logic with lag features, rolling volatility analysis, and regime detection for efficiency margin prediction. Now includes an Energy Consumption Predictive Model with integrated Geopolitical Risk Overlay.

## Overview

This pipeline implements quantitative time-series analysis for energy generation data:

- **Lag Features**: Captures momentum with t-1 and t-24 hour shifts
- **Rolling Volatility**: 7-day rolling standard deviation for regime detection
- **Stochastic Thresholds**: 2-sigma uncertainty flags for stress point identification
- **Daily Execution**: Automated scheduling at 00:00 UTC with push triggers

## Energy Consumption Predictive Model

The `EnergyModel` React component (`src/components/EnergyModel.jsx`) provides an interactive dashboard for predicting global energy consumption with integrated geopolitical risk assessment.

### Views

- **PREDICT**: Country consumption and cost table with sparkline trend charts
- **GEO RISK**: Risk-sorted analysis with factor breakdowns (conflict, trade, sanction, policy)
- **COST PACE**: Resource pricing trends and geopolitical cost premiums

### Interactive Controls

- **Scenario selector**: Constrained / Baseline / Accelerated growth scenarios
- **Time horizon slider**: 1–15 year projection window
- **View switcher**: Predict / Risk / Cost tabs
- **Risk filters**: All / High / Conflict / Trade / Sanction / Policy
- **Sort options**: Risk / Quads / Cost / Geo Impact / Rank

### Summary Metrics

| Metric | Description |
|--------|-------------|
| Current daily consumption | Total Quads across all tracked nations |
| Projected daily consumption | Scenario-adjusted forecast |
| Average geopolitical risk score | Composite 0–10 risk index |
| High-risk nation count | Nations with risk score ≥ 7 |

### Geopolitical Risk Factors

Each of the 25 tracked nations includes a composite risk profile with:

- **Conflict** – Active military conflict or territorial disputes
- **Trade** – Sanctions, tariffs, or export restrictions affecting supply chains
- **Sanction** – International sanctions impacting energy infrastructure
- **Policy** – Regulatory instability or nationalisation risk

Risk scores drive a supply disruption damping factor applied to consumption projections.

### Usage

```jsx
import EnergyModel from "./src/components/EnergyModel";

function App() {
  return <EnergyModel />;
}
```

### Scenario Modeling

Three built-in growth scenarios adjust annual consumption growth rates:

| Scenario | Description |
|----------|-------------|
| Constrained | Lower-bound growth under supply restrictions |
| Baseline | Moderate expected trajectory |
| Accelerated | Upper-bound under high-demand conditions |

## Data

- `data/energy_stats.json` — 50-nation dataset with consumption figures, resource cost indices, and geopolitical risk profiles (validated via CI)

## Status

Click the badge above to view workflow runs and deployment status.