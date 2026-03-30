import json
import math
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


def calc_geo_multipliers(nation_name, geopolitical_risks):
    """Compute weighted geopolitical cost and supply multipliers for a nation.

    Uses a severity-probability weighted average of all risk factors to produce
    composite cost and supply multipliers that reflect geopolitical exposure.

    Args:
        nation_name: Name of the nation.
        geopolitical_risks: Dict mapping region/nation name to risk data from
                            energy_stats.json (each entry has 'score' and 'factors').

    Returns:
        Dict with 'costMult' and 'supplyMult' floats. Both default to 1.0 when
        no geopolitical risk profile exists for the nation.
    """
    if nation_name not in geopolitical_risks:
        return {"costMult": 1.0, "supplyMult": 1.0}
    factors = geopolitical_risks[nation_name]["factors"]
    total_weight = sum(f["severity"] * f["probability"] for f in factors)
    if total_weight == 0:
        return {"costMult": 1.0, "supplyMult": 1.0}
    cost_mult = (
        sum(f["costMultiplier"] * (f["severity"] * f["probability"]) for f in factors)
        / total_weight
    )
    supply_mult = (
        sum(f["supplyMultiplier"] * (f["severity"] * f["probability"]) for f in factors)
        / total_weight
    )
    return {"costMult": round(cost_mult, 6), "supplyMult": round(supply_mult, 6)}


def project_nation(nation, geopolitical_risks, year_offset):
    """Project a nation's energy consumption and resource cost with geopolitical overlay.

    Applies compound growth, renewable discount, geopolitical supply dampening, and
    cost multipliers to produce forward-looking consumption and cost estimates.

    Args:
        nation: Nation dictionary with keys 'name', 'baseQuads', 'baseCostPerUnit',
                'renewableShare', 'growthTrend', and 'costTrend'.
        geopolitical_risks: Dict mapping nation name to risk data.
        year_offset: Number of years ahead to project (e.g. 2 for 2026 from base 2024).

    Returns:
        Dict with:
          'quads'        – projected consumption (Quads),
          'costPerUnit'  – projected cost per MMBTU (USD),
          'totalCostB'   – projected total cost in billions USD,
          'costMult'     – composite geopolitical cost multiplier,
          'supplyMult'   – composite geopolitical supply multiplier,
          'geoCostPct'   – geopolitical cost premium as a percentage.
    """
    mults = calc_geo_multipliers(nation["name"], geopolitical_risks)
    growth_factor = math.pow(1 + nation["growthTrend"], year_offset)
    renewable_discount = 1 - nation["renewableShare"] * 0.05 * year_offset
    supply_dampen = 1 - (1 - mults["supplyMult"]) * min(year_offset / 5, 1)
    projected_quads = nation["baseQuads"] * growth_factor * renewable_discount * supply_dampen
    projected_quads = max(0.0, projected_quads)
    projected_cost_per_unit = (
        nation["baseCostPerUnit"]
        * math.pow(1 + nation["costTrend"], year_offset)
        * mults["costMult"]
    )
    projected_total_cost_b = projected_quads * projected_cost_per_unit * 1e15 / 1e12
    return {
        "quads": round(projected_quads, 4),
        "costPerUnit": round(projected_cost_per_unit, 4),
        "totalCostB": round(max(0.0, projected_total_cost_b), 2),
        "costMult": mults["costMult"],
        "supplyMult": mults["supplyMult"],
        "geoCostPct": round((mults["costMult"] - 1) * 100, 2),
    }


def rank_nations_by_resource_cost(nations, geopolitical_risks, year_offset):
    """Rank nations from best to worst based on projected total resource cost.

    Nations with the lowest total projected cost (in billions USD) receive rank 1
    (best/most affordable), while those with the highest cost receive rank 50
    (worst/most expensive). The returned list is sorted ascending by total cost
    so rank 1 (lowest cost) appears first.

    Args:
        nations: List of nation dictionaries from energy_stats.json.
        geopolitical_risks: Dict mapping nation name to risk data.
        year_offset: Number of years ahead to project.

    Returns:
        List of dicts, each containing the nation's name, rank (1 = best/lowest cost),
        projected metrics, and risk score. Sorted from rank 1 (lowest cost) to
        rank N (highest cost).
    """
    projections = []
    for nation in nations:
        proj = project_nation(nation, geopolitical_risks, year_offset)
        risk_score = geopolitical_risks.get(nation["name"], {}).get("score", 0.0)
        projections.append({
            "name": nation["name"],
            "region": nation["region"],
            "riskScore": risk_score,
            **proj,
        })
    projections.sort(key=lambda x: x["totalCostB"])
    for i, entry in enumerate(projections):
        entry["rank"] = i + 1
    return projections


if __name__ == "__main__":
    energy_data = load_energy_data()
    analyze_and_print(energy_data)

