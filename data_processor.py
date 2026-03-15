def data_processor(data):
    """Process energy consumption data by scaling each value by a factor of 2.

    Args:
        data: A list of numeric energy values to process.

    Returns:
        A list with each value doubled.

    Raises:
        ValueError: If data is not a list.
    """
    if not isinstance(data, list):
        raise ValueError("Input data must be a list")
    return [x * 2 for x in data]

