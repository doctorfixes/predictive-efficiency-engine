name: Python Data Pipeline Tests

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python 3.11
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        # NEW: Caches your libraries so the build runs in 15s instead of 60s
        cache: 'pip' 

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        # NEW: Only install what's in your requirements file
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
        # Fallback if you haven't made a requirements.txt yet
        pip install pandas numpy 

    - name: Run Data Processor Tests
      run: |
        # NEW: Forces the test to fail the whole build if an error occurs
        python test_processor.py

