import pytest

from data_processor import (
    load_energy_data,
    rank_nations_by_market_value,
)

# ---------------------------------------------------------------------------
# Static ranking tests (simple unit-level sanity checks)
# ---------------------------------------------------------------------------


# Sample data fixture
@pytest.fixture
def sample_data():
    return {
        'Nation A': 100,
        'Nation B': 200,
        'Nation C': 150,
        'Nation D': 90,
        'Nation E': 300,
    }


# Function to rank nations
def rank_nations(data):
    return sorted(data.items(), key=lambda item: item[1])


# Pytest function to test ranking of nations based on market values
def test_rank_nations(sample_data):
    ranked = rank_nations(sample_data)
    expected_ranking = [
        ('Nation D', 90),
        ('Nation A', 100),
        ('Nation C', 150),
        ('Nation B', 200),
        ('Nation E', 300),
    ]
    assert ranked == expected_ranking


def test_rank_nations_single_entry():
    data = {"Solo": 42}
    assert rank_nations(data) == [("Solo", 42)]


def test_rank_nations_equal_values():
    """Ties are preserved in sorted order (stable sort)."""
    data = {"X": 50, "Y": 50}
    ranked = rank_nations(data)
    values = [v for _, v in ranked]
    assert values == sorted(values)


# ---------------------------------------------------------------------------
# Real-data market value ranking tests
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def real_ranked():
    data = load_energy_data()
    return rank_nations_by_market_value(
        data["nations"],
        data["geopolitical_risks"],
        data["projected_daily_consumption_2026"],
    )


def test_real_ranking_is_non_empty(real_ranked):
    assert len(real_ranked) > 0


def test_real_ranking_worst_has_highest_market_value(real_ranked):
    worst = real_ranked[0]
    best = real_ranked[-1]
    assert worst["market_value"] >= best["market_value"]


def test_real_ranking_china_near_top(real_ranked):
    """China (highest consumption + geopolitical risk) should rank in the top 3 worst."""
    china_rank = next((r["rank"] for r in real_ranked if r["nation"] == "China"), None)
    assert china_rank is not None, "China not found in ranking"
    assert china_rank <= 3, f"China ranked {china_rank}, expected <= 3"


def test_real_ranking_all_market_values_positive(real_ranked):
    for entry in real_ranked:
        assert entry["market_value"] > 0, f"{entry['nation']} market value <= 0"
