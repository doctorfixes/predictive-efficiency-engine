# pytest Configuration

# To configure pytest for your Python project, you can create a conftest.py file where you can set fixtures that will be loaded for your tests.

import pytest

# Example fixture
@pytest.fixture
def example_fixture():
    return 42

# Sample test function

def test_example(example_fixture):
    assert example_fixture == 42
