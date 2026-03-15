import pytest

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
