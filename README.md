# predictive-efficiency-engine

[![Predictive Efficiency Engine - Daily Data Pipeline](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml/badge.svg)](https://github.com/doctorfixes/predictive-efficiency-engine/actions/workflows/main.yml)

Production-ready data pipeline for processing energy generation CSV data using stochastic time-series logic with lag features, rolling volatility analysis, and regime detection for efficiency margin prediction.

## Overview

This pipeline implements quantitative time-series analysis for energy generation data:

- **Lag Features**: Captures momentum with t-1 and t-24 hour shifts
- **Rolling Volatility**: 7-day rolling standard deviation for regime detection
- **Stochastic Thresholds**: 2-sigma uncertainty flags for stress point identification
- **Daily Execution**: Automated scheduling at 00:00 UTC with push triggers

## Status

Click the badge above to view workflow runs and deployment status.