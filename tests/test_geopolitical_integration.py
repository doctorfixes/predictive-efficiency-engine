"""Integration and unit tests for the geopolitical risk and resource prediction model.

Validates risk scores, resource costs, supply multipliers, and market value
rankings derived from the integrated energy/geopolitical dataset.
"""

import pytest

from data_processor import (
    load_energy_data,
    get_high_risk_regions,
    compute_risk_adjusted_cost,
    compute_effective_supply_multiplier,
    rank_nations_by_market_value,
    project_consumption,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def energy_data():
    return load_energy_data()


@pytest.fixture(scope="module")
def nations(energy_data):
    return energy_data["nations"]


@pytest.fixture(scope="module")
def geo_risks(energy_data):
    return energy_data["geopolitical_risks"]


@pytest.fixture(scope="module")
def projections(energy_data):
    return energy_data["projected_daily_consumption_2026"]


@pytest.fixture(scope="module")
def nation_map(nations):
    """Index nations by name for convenient lookup."""
    return {n["name"]: n for n in nations}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_nation(nations, name):
    for n in nations:
        if n["name"] == name:
            return n
    raise KeyError(name)


# ---------------------------------------------------------------------------
# Risk score validation
# ---------------------------------------------------------------------------

class TestRiskScores:
    """Validate the integrity of geopolitical risk scores in the dataset."""

    def test_all_risk_scores_within_bounds(self, geo_risks):
        """Every risk score must be within the documented 0-10 range."""
        for region, data in geo_risks.items():
            score = data["score"]
            assert 0.0 <= score <= 10.0, (
                f"{region} has out-of-range risk score: {score}"
            )

    def test_high_risk_threshold_filter(self, geo_risks):
        """get_high_risk_regions should return only regions >= threshold."""
        threshold = 7.0
        high_risk = get_high_risk_regions(geo_risks, threshold=threshold)
        assert len(high_risk) > 0, "Expected at least one high-risk region"
        for region, score in high_risk:
            assert score >= threshold, (
                f"{region} score {score} is below threshold {threshold}"
            )

    def test_known_high_risk_regions_present(self, geo_risks):
        """Ukraine, Russia, and Iran must appear as high-risk (score >= 7)."""
        high_risk_names = {r for r, _ in get_high_risk_regions(geo_risks, threshold=7.0)}
        for expected in ("Ukraine", "Russia", "Iran"):
            assert expected in high_risk_names, (
                f"Expected '{expected}' in high-risk regions"
            )

    def test_high_risk_regions_sorted_descending(self, geo_risks):
        """High-risk list must be returned in descending score order."""
        high_risk = get_high_risk_regions(geo_risks, threshold=0.0)
        scores = [score for _, score in high_risk]
        assert scores == sorted(scores, reverse=True), (
            "High-risk regions are not sorted in descending order"
        )

    def test_risk_factors_have_required_fields(self, geo_risks):
        """Each risk factor must contain the expected keys."""
        required_keys = {"type", "severity", "probability", "costMultiplier",
                         "supplyMultiplier", "category"}
        for region, data in geo_risks.items():
            for factor in data["factors"]:
                missing = required_keys - factor.keys()
                assert not missing, (
                    f"{region} factor '{factor.get('type')}' missing keys: {missing}"
                )

    def test_factor_probabilities_within_bounds(self, geo_risks):
        """All factor probabilities must be in [0, 1]."""
        for region, data in geo_risks.items():
            for factor in data["factors"]:
                p = factor["probability"]
                assert 0.0 <= p <= 1.0, (
                    f"{region}/{factor['type']} probability {p} out of [0,1]"
                )

    def test_factor_severities_within_bounds(self, geo_risks):
        """All factor severities must be integers in [1, 10]."""
        for region, data in geo_risks.items():
            for factor in data["factors"]:
                s = factor["severity"]
                assert 1 <= s <= 10, (
                    f"{region}/{factor['type']} severity {s} out of [1,10]"
                )


# ---------------------------------------------------------------------------
# Resource cost tests
# ---------------------------------------------------------------------------

class TestResourceCosts:
    """Validate risk-adjusted cost calculations."""

    def test_nation_without_geo_risk_returns_base_cost(self, nations, geo_risks):
        """A nation absent from geo_risks should return its baseCostPerUnit unchanged."""
        # Find a nation not in geo_risks, or use a synthetic one
        nation_without_risk = {"name": "__nonexistent__", "baseCostPerUnit": 7.5}
        result = compute_risk_adjusted_cost(nation_without_risk, geo_risks)
        assert result == 7.5

    def test_high_risk_nation_cost_exceeds_base(self, nation_map, geo_risks):
        """Nations in high-risk zones should have adj_cost >= base cost (costMultiplier >= 1)."""
        for name in ("China", "Russia", "Iran"):
            if name not in nation_map or name not in geo_risks:
                continue
            nation = nation_map[name]
            adj_cost = compute_risk_adjusted_cost(nation, geo_risks)
            assert adj_cost >= nation["baseCostPerUnit"], (
                f"{name} adjusted cost {adj_cost} < base {nation['baseCostPerUnit']}"
            )

    def test_adjusted_cost_is_positive(self, nations, geo_risks):
        """All risk-adjusted costs must be strictly positive."""
        for nation in nations:
            adj_cost = compute_risk_adjusted_cost(nation, geo_risks)
            assert adj_cost > 0, f"{nation['name']} adjusted cost is non-positive"

    def test_adjusted_cost_manual_calculation(self):
        """Verify the probability-weighted multiplier formula against a manual calc."""
        nation = {"name": "TestRegion", "baseCostPerUnit": 10.0}
        geo_risks = {
            "TestRegion": {
                "score": 8.0,
                "factors": [
                    {"probability": 0.5, "costMultiplier": 1.2,
                     "supplyMultiplier": 0.9, "severity": 5, "type": "X",
                     "category": "TEST"},
                ]
            }
        }
        # multiplier = 1 + (1.2 - 1.0) * 0.5 = 1.10
        expected = round(10.0 * 1.10, 4)
        assert compute_risk_adjusted_cost(nation, geo_risks) == expected

    def test_adjusted_cost_multiple_factors(self):
        """Compounding of two factors should follow the multiplicative formula."""
        nation = {"name": "Multi", "baseCostPerUnit": 5.0}
        geo_risks = {
            "Multi": {
                "score": 7.0,
                "factors": [
                    {"probability": 1.0, "costMultiplier": 1.2,
                     "supplyMultiplier": 0.8, "severity": 6, "type": "A",
                     "category": "CONFLICT"},
                    {"probability": 0.5, "costMultiplier": 1.4,
                     "supplyMultiplier": 0.7, "severity": 7, "type": "B",
                     "category": "INFRA"},
                ]
            }
        }
        # factor 1: 1 + (1.2-1)*1.0 = 1.20
        # factor 2: 1 + (1.4-1)*0.5 = 1.20
        # combined: 1.20 * 1.20 = 1.44
        expected = round(5.0 * 1.44, 4)
        assert compute_risk_adjusted_cost(nation, geo_risks) == expected


# ---------------------------------------------------------------------------
# Supply multiplier tests
# ---------------------------------------------------------------------------

class TestSupplyMultipliers:
    """Validate effective supply multiplier calculations."""

    def test_supply_multiplier_below_one_for_active_conflict(self, geo_risks):
        """Ukraine (active war) must have an effective supply multiplier below 1."""
        sm = compute_effective_supply_multiplier(geo_risks["Ukraine"])
        assert sm < 1.0, f"Ukraine supply multiplier {sm} should be < 1.0"

    def test_supply_multiplier_in_valid_range(self, geo_risks):
        """All supply multipliers must be in (0, 1]."""
        for region, data in geo_risks.items():
            sm = compute_effective_supply_multiplier(data)
            assert 0.0 < sm <= 1.0, (
                f"{region} supply multiplier {sm} out of (0,1]"
            )

    def test_supply_multiplier_no_disruption(self):
        """An entry with zero-probability factors should return 1.0."""
        risk_entry = {
            "factors": [
                {"probability": 0.0, "supplyMultiplier": 0.5,
                 "costMultiplier": 1.1, "severity": 3, "type": "Z",
                 "category": "OTHER"},
            ]
        }
        sm = compute_effective_supply_multiplier(risk_entry)
        assert sm == 1.0

    def test_supply_multiplier_manual_calculation(self):
        """Verify the formula against a hand-computed value."""
        risk_entry = {
            "factors": [
                {"probability": 0.8, "supplyMultiplier": 0.7,
                 "costMultiplier": 1.1, "severity": 5, "type": "A",
                 "category": "CONFLICT"},
            ]
        }
        # multiplier = 1 - (1 - 0.7) * 0.8 = 1 - 0.24 = 0.76
        expected = round(1.0 - (1.0 - 0.7) * 0.8, 4)
        assert compute_effective_supply_multiplier(risk_entry) == expected

    def test_ukraine_worse_supply_than_stable_nation(self, geo_risks):
        """Ukraine's supply multiplier must be lower than a stable nation's."""
        ukraine_sm = compute_effective_supply_multiplier(geo_risks["Ukraine"])
        # United States is guaranteed stable in the dataset; Canada is also present
        stable_name = "United States" if "United States" in geo_risks else "Canada"
        if stable_name not in geo_risks:
            pytest.skip(f"No stable reference nation ({stable_name}) found in geo_risks")
        stable_sm = compute_effective_supply_multiplier(geo_risks[stable_name])
        assert ukraine_sm < stable_sm, (
            f"Ukraine SM {ukraine_sm} should be < {stable_name} SM {stable_sm}"
        )


# ---------------------------------------------------------------------------
# Daily market value ranking tests
# ---------------------------------------------------------------------------

class TestMarketValueRanking:
    """Validate the nation-level daily market value ranking."""

    @pytest.fixture(scope="class")
    def ranked(self, nations, geo_risks, projections):
        return rank_nations_by_market_value(nations, geo_risks, projections)

    def test_ranked_list_is_non_empty(self, ranked):
        assert len(ranked) > 0, "Ranking must contain at least one nation"

    def test_ranks_are_sequential(self, ranked):
        """Ranks should run from 1 to len(ranked) without gaps."""
        actual_ranks = [r["rank"] for r in ranked]
        assert actual_ranks == list(range(1, len(ranked) + 1))

    def test_market_values_are_positive(self, ranked):
        for r in ranked:
            assert r["market_value"] > 0, (
                f"{r['nation']} has non-positive market_value"
            )

    def test_market_values_sorted_descending(self, ranked):
        """Worst-to-best means market_value must be non-increasing."""
        values = [r["market_value"] for r in ranked]
        assert values == sorted(values, reverse=True), (
            "Market values are not sorted in descending order"
        )

    def test_result_entry_has_expected_keys(self, ranked):
        expected_keys = {"rank", "nation", "adj_cost", "supply_multiplier",
                         "daily_quads", "market_value"}
        for entry in ranked:
            assert expected_keys <= entry.keys(), (
                f"Entry missing keys: {expected_keys - entry.keys()}"
            )

    def test_high_risk_nation_appears_in_ranking(self, ranked):
        """China (a high-risk, high-consumption nation) must be present."""
        nations_in_ranking = {r["nation"] for r in ranked}
        assert "China" in nations_in_ranking

    def test_best_ranked_nation_has_lowest_market_value(self, ranked):
        best = ranked[-1]
        worst = ranked[0]
        assert best["market_value"] <= worst["market_value"]

    def test_supply_multiplier_applied_correctly(self, nations, geo_risks, projections):
        """Verify that a known nation's market value matches independent calculation."""
        # Use United States as a test case (low risk, stable supply)
        us_nation = next((n for n in nations if n["name"] == "United States"), None)
        us_proj = next((p for p in projections if p["country"] == "United States"), None)
        if us_nation is None or us_proj is None:
            pytest.skip("United States not in dataset")

        adj_cost = compute_risk_adjusted_cost(us_nation, geo_risks)
        if "United States" in geo_risks:
            sm = compute_effective_supply_multiplier(geo_risks["United States"])
        else:
            sm = 1.0
        expected_mv = round(adj_cost * round(us_proj["daily_quads"] * sm, 6), 6)

        ranked = rank_nations_by_market_value(nations, geo_risks, projections)
        us_entry = next((r for r in ranked if r["nation"] == "United States"), None)
        assert us_entry is not None
        assert us_entry["market_value"] == pytest.approx(expected_mv, rel=1e-4)

    def test_daily_comparative_ranking_worst_to_best(self, ranked):
        """Print a human-readable worst-to-best ranking for review."""
        print("\nDaily comparative market value ranking (worst → best):")
        print(f"  {'Rank':<5} {'Nation':<22} {'Adj Cost':>10} {'Supply Mult':>12} {'Market Value':>13}")
        print("  " + "-" * 65)
        for r in ranked:
            print(
                f"  {r['rank']:<5} {r['nation']:<22} {r['adj_cost']:>10.4f}"
                f" {r['supply_multiplier']:>12.4f} {r['market_value']:>13.6f}"
            )


# ---------------------------------------------------------------------------
# Consumption projection integration tests
# ---------------------------------------------------------------------------

class TestProjectionIntegration:
    """Validate that consumption projections integrate correctly with risk data."""

    def test_high_risk_nation_has_higher_adjusted_cost(self, nation_map, geo_risks):
        """China (risk score 7.8) must have adj_cost strictly above its base cost."""
        china = nation_map.get("China")
        if china is None or "China" not in geo_risks:
            pytest.skip("China not available in dataset")
        adj_cost = compute_risk_adjusted_cost(china, geo_risks)
        assert adj_cost > china["baseCostPerUnit"], (
            f"China adj_cost {adj_cost} should exceed base {china['baseCostPerUnit']}"
        )

    def test_projections_align_with_trend(self, nations):
        """Each year's projected consumption must respect the sign of growthTrend."""
        for nation in nations:
            proj = project_consumption(nation, years=3)
            base = nation["baseQuads"]
            trend = nation["growthTrend"]
            if trend > 0:
                assert proj[0] > base, (
                    f"{nation['name']} year-1 projection should exceed base"
                )
            elif trend < 0:
                assert proj[0] < base, (
                    f"{nation['name']} year-1 projection should be below base"
                )

    def test_projection_count_matches_years(self, nations):
        """project_consumption should return exactly `years` values."""
        for years in (1, 3, 5, 10):
            nation = nations[0]
            proj = project_consumption(nation, years=years)
            assert len(proj) == years, (
                f"Expected {years} projections, got {len(proj)}"
            )

    def test_cost_trend_reasonable_range(self, nations):
        """All costTrend values should be within a plausible range (-0.5, 0.5)."""
        for nation in nations:
            ct = nation["costTrend"]
            assert -0.5 < ct < 0.5, (
                f"{nation['name']} costTrend {ct} seems unrealistic"
            )
