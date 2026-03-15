# pytest Configuration
import sys
import os
import pytest

# Ensure the project root is on the path so tests can import data_processor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# Example fixture
@pytest.fixture
def example_fixture():
    return 42


# Sample test function
def test_example(example_fixture):
    assert example_fixture == 42
