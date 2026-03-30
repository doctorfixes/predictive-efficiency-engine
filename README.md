# predictive-efficiency-engine

[![Predictive Efficiency Engine - Daily Data Pipeline](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml/badge.svg)](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml)
[![Energy Data Validation](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/energy-data-validation.yml/badge.svg)](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/energy-data-validation.yml)

Production-ready data pipeline for processing energy consumption JSON data, providing nation-level consumption analysis, geopolitical risk assessment, and multi-year forecasting. Includes an Energy Consumption Predictive Model with integrated Geopolitical Risk Overlay.

## Overview

This pipeline implements quantitative analysis for energy consumption data:

- **Top Consumer Ranking**: Nations sorted by base energy consumption in Quads
- **Geopolitical Risk Assessment**: Composite risk scoring across conflict, trade, sanction, and policy factors
- **Regional Aggregation**: Total base consumption grouped by geographic region
- **Consumption Projection**: Compound annual growth forecasting over configurable time horizons

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