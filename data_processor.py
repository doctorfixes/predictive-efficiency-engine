import json
import os


def data_processor(data):
    """Process a list of numbers by doubling each value.

    Args:
        data: A list of numeric values.

    Returns:
        A list with each value doubled.

    Raises:
        ValueError: If data is not a list.
    """
    if not isinstance(data, list):
        raise ValueError("Input must be a list")
    return [x * 2 for x in data]


def load_energy_data(path=None):
    """Load the energy statistics JSON file.

    Args:
        path: Optional path to the JSON file. Defaults to data/energy_stats.json
              relative to this module's directory.

    Returns:
        Parsed JSON data as a dictionary.
    """
    if path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, "data", "energy_stats.json")
    with open(path) as f:
        return json.load(f)


def get_top_consumers(nations, top_n=10):
    """Return the top N nations sorted by base energy consumption.

    Args:
        nations: List of nation dictionaries from energy_stats.json.
        top_n: Number of top nations to return.

    Returns:
        List of nation dicts sorted by baseQuads descending.
    """
    return sorted(nations, key=lambda n: n["baseQuads"], reverse=True)[:top_n]


def get_high_risk_regions(geopolitical_risks, threshold=7.0):
    """Return regions whose geopolitical risk score exceeds the threshold.

    Args:
        geopolitical_risks: Dict mapping region name to risk data.
        threshold: Minimum risk score to include.

    Returns:
        List of (region, score) tuples sorted by score descending.
    """
    high_risk = [
        (region, data["score"])
        for region, data in geopolitical_risks.items()
        if data["score"] >= threshold
    ]
    return sorted(high_risk, key=lambda x: x[1], reverse=True)


def get_regional_summary(nations):
    """Aggregate total base consumption by geographic region.

    Args:
        nations: List of nation dictionaries.

    Returns:
        Dict mapping region name to total baseQuads.
    """
    summary = {}
    for nation in nations:
        region = nation["region"]
        summary[region] = summary.get(region, 0.0) + nation["baseQuads"]
    return summary


def project_consumption(nation, years=5):
    """Project a nation's energy consumption over the given number of years.

    Uses the nation's growthTrend to compound annual consumption from baseQuads.

    Args:
        nation: Nation dictionary with 'baseQuads' and 'growthTrend' keys.
        years: Number of years to project.

    Returns:
        List of projected consumption values (Quads) for each future year.
    """
    base = nation["baseQuads"]
    trend = nation["growthTrend"]
    return [round(base * ((1 + trend) ** y), 4) for y in range(1, years + 1)]


def compute_risk_adjusted_cost(nation, geo_risks):
    """Compute the risk-adjusted cost per unit for a nation.

    For each geopolitical risk factor associated with the nation, applies a
    probability-weighted cost multiplier on top of the nation's base cost.

    Args:
        nation: Nation dict with 'name' and 'baseCostPerUnit' keys.
        geo_risks: Dict mapping nation/region name to risk data.

    Returns:
        Risk-adjusted cost per unit (USD per MMBTU), rounded to 4 decimal places.
        Returns baseCostPerUnit unchanged if the nation has no geo-risk entry.
    """
    name = nation["name"]
    base_cost = nation["baseCostPerUnit"]
    if name not in geo_risks:
        return base_cost
    multiplier = 1.0
    for factor in geo_risks[name]["factors"]:
        prob = factor["probability"]
        cm = factor["costMultiplier"]
        multiplier *= 1.0 + (cm - 1.0) * prob
    return round(base_cost * multiplier, 4)


def compute_effective_supply_multiplier(risk_entry):
    """Compute the net effective supply multiplier for a geopolitical risk entry.

    Applies probability-weighted supply reduction for each factor. A value of 1.0
    means no supply disruption; values below 1.0 indicate reduced supply.

    Args:
        risk_entry: Dict with a 'factors' key containing a list of factor dicts,
                    each with 'supplyMultiplier' and 'probability' fields.

    Returns:
        Net supply multiplier in (0, 1], rounded to 4 decimal places.
    """
    multiplier = 1.0
    for factor in risk_entry["factors"]:
        prob = factor["probability"]
        sm = factor["supplyMultiplier"]
        multiplier *= 1.0 - (1.0 - sm) * prob
    return round(multiplier, 4)


def rank_nations_by_market_value(nations, geo_risks, projections_2026):
    """Rank nations by daily market value from worst to best.

    Daily market value is computed as:
        risk_adjusted_cost × supply_adjusted_daily_quads

    Nations with a higher (costlier) market value are ranked worst; those with
    a lower market value are ranked best.

    Args:
        nations: List of nation dicts (must have 'name', 'baseCostPerUnit').
        geo_risks: Dict mapping nation/region name to geopolitical risk data.
        projections_2026: List of {'country': str, 'daily_quads': float} dicts.

    Returns:
        List of result dicts sorted from worst (rank 1) to best, each containing:
        'rank', 'nation', 'adj_cost', 'supply_multiplier', 'daily_quads',
        'market_value'.
    """
    proj_map = {p["country"]: p["daily_quads"] for p in projections_2026}
    results = []
    for nation in nations:
        name = nation["name"]
        if name not in proj_map:
            continue
        adj_cost = compute_risk_adjusted_cost(nation, geo_risks)
        if name in geo_risks:
            supply_mult = compute_effective_supply_multiplier(geo_risks[name])
        else:
            supply_mult = 1.0
        daily_quads = round(proj_map[name] * supply_mult, 6)
        market_value = round(adj_cost * daily_quads, 6)
        results.append({
            "nation": name,
            "adj_cost": adj_cost,
            "supply_multiplier": supply_mult,
            "daily_quads": daily_quads,
            "market_value": market_value,
        })
    results.sort(key=lambda x: x["market_value"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1
    return results


def analyze_and_print(data):
    """Run a full analysis of the energy dataset and print a summary report.

    Args:
        data: Parsed energy_stats.json dictionary.
    """
    nations = data["nations"]
    geo_risks = data["geopolitical_risks"]
    projections = data["projected_daily_consumption_2026"]
    metadata = data["metadata"]

    print("=" * 60)
    print("  Predictive Efficiency Engine — Data Analysis Report")
    print("=" * 60)
    print(f"  Dataset version : {metadata['version']}")
    print(f"  Description     : {metadata['description']}")
    print(f"  Base year       : {metadata['base_year']}")
    print(f"  Horizon         : {metadata['projection_horizon']}")
    print(f"  Units           : {metadata['units']['consumption']}")
    print()

    # Top consumers
    top10 = get_top_consumers(nations, top_n=10)
    print("Top 10 Nations by Base Energy Consumption (Quads):")
    print(f"  {'Rank':<6} {'Nation':<20} {'Quads':>10}  {'Renewable':>10}  {'Growth':>8}")
    print("  " + "-" * 58)
    for n in top10:
        print(
            f"  {n['rank']:<6} {n['name']:<20} {n['baseQuads']:>10.1f}"
            f"  {n['renewableShare']:>9.0%}  {n['growthTrend']:>7.1%}"
        )
    print()

    # Regional summary
    regional = get_regional_summary(nations)
    print("Total Base Consumption by Region (Quads):")
    for region, total in sorted(regional.items(), key=lambda x: x[1], reverse=True):
        print(f"  {region:<25} {total:>8.1f}")
    print()

    # High-risk geopolitical regions
    high_risk = get_high_risk_regions(geo_risks, threshold=7.0)
    print("High-Risk Geopolitical Regions (score >= 7.0):")
    print(f"  {'Region':<20} {'Risk Score':>10}")
    print("  " + "-" * 32)
    for region, score in high_risk:
        print(f"  {region:<20} {score:>10.1f}")
    print()

    # 2026 projected daily consumption (top 5)
    print("2026 Projected Daily Consumption -- Top 5 Countries (Quads/day):")
    for entry in projections[:5]:
        print(f"  {entry['country']:<20} {entry['daily_quads']:.4f}")
    print()

    # 5-year projection for the top 3 consuming nations
    print("5-Year Consumption Projection for Top 3 Nations (Quads):")
    top3 = get_top_consumers(nations, top_n=3)
    base_year = metadata["base_year"]
    header = f"  {'Nation':<20}" + "".join(
        f"  {base_year + y:>8}" for y in range(1, 6)
    )
    print(header)
    print("  " + "-" * (len(header) - 2))
    for n in top3:
        proj = project_consumption(n, years=5)
        row = f"  {n['name']:<20}" + "".join(f"  {v:>8.1f}" for v in proj)
        print(row)
    print()
    print("=" * 60)


if __name__ == "__main__":
    energy_data = load_energy_data()
    analyze_and_print(energy_data)
