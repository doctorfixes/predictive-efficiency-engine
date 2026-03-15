import unittest

from data_processor import (
    data_processor,
    load_energy_data,
    get_top_consumers,
    get_high_risk_regions,
    get_regional_summary,
    project_consumption,
    analyze_and_print,
)


class TestProcessor(unittest.TestCase):

    def test_data_processing(self):
        input_data = [1, 2, 3]
        expected_output = [2, 4, 6]
        result = data_processor(input_data)
        self.assertEqual(result, expected_output)

    def test_empty_data(self):
        input_data = []
        expected_output = []
        result = data_processor(input_data)
        self.assertEqual(result, expected_output)

    def test_invalid_data(self):
        input_data = 'invalid'
        with self.assertRaises(ValueError):
            data_processor(input_data)


class TestEnergyDataAnalysis(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.data = load_energy_data()
        cls.nations = cls.data["nations"]
        cls.geo_risks = cls.data["geopolitical_risks"]
        cls.projections = cls.data["projected_daily_consumption_2026"]

    def test_load_energy_data(self):
        self.assertIn("nations", self.data)
        self.assertIn("geopolitical_risks", self.data)
        self.assertIn("projected_daily_consumption_2026", self.data)
        self.assertIn("metadata", self.data)
        print(f"\n[load_energy_data] Loaded {len(self.nations)} nations, "
              f"{len(self.geo_risks)} geopolitical risk entries, "
              f"{len(self.projections)} daily consumption projections.")

    def test_top_consumers(self):
        top10 = get_top_consumers(self.nations, top_n=10)
        self.assertEqual(len(top10), 10)
        # Verify descending order
        for i in range(len(top10) - 1):
            self.assertGreaterEqual(top10[i]["baseQuads"], top10[i + 1]["baseQuads"])
        print("\n[get_top_consumers] Top 10 nations by base consumption (Quads):")
        for n in top10:
            print(f"  {n['rank']:>3}. {n['name']:<20} {n['baseQuads']:>7.1f} Quads")

    def test_high_risk_regions(self):
        high_risk = get_high_risk_regions(self.geo_risks, threshold=7.0)
        self.assertGreater(len(high_risk), 0)
        for _, score in high_risk:
            self.assertGreaterEqual(score, 7.0)
        print(f"\n[get_high_risk_regions] {len(high_risk)} regions with risk score >= 7.0:")
        for region, score in high_risk:
            print(f"  {region:<20} score={score:.1f}")

    def test_regional_summary(self):
        summary = get_regional_summary(self.nations)
        self.assertIsInstance(summary, dict)
        self.assertGreater(len(summary), 0)
        total = sum(summary.values())
        self.assertGreater(total, 0)
        print("\n[get_regional_summary] Total base consumption by region (Quads):")
        for region, quads in sorted(summary.items(), key=lambda x: x[1], reverse=True):
            print(f"  {region:<25} {quads:>8.1f}")

    def test_project_consumption(self):
        nation = {"name": "Test", "baseQuads": 100.0, "growthTrend": 0.05}
        proj = project_consumption(nation, years=5)
        self.assertEqual(len(proj), 5)
        self.assertAlmostEqual(proj[0], 105.0, places=1)
        self.assertAlmostEqual(proj[4], round(100.0 * (1.05 ** 5), 4), places=1)
        top3 = get_top_consumers(self.nations, top_n=3)
        base_year = self.data["metadata"]["base_year"]
        print("\n[project_consumption] 5-year outlook for top 3 nations (Quads):")
        header = f"  {'Nation':<20}" + "".join(f"  {base_year + y:>8}" for y in range(1, 6))
        print(header)
        for n in top3:
            values = project_consumption(n, years=5)
            row = f"  {n['name']:<20}" + "".join(f"  {v:>8.1f}" for v in values)
            print(row)

    def test_projected_daily_consumption_2026(self):
        self.assertGreater(len(self.projections), 0)
        for entry in self.projections:
            self.assertIn("country", entry)
            self.assertIn("daily_quads", entry)
            self.assertGreater(entry["daily_quads"], 0)
        print("\n[projected_daily_consumption_2026] Top 5 countries for 2026:")
        for entry in self.projections[:5]:
            print(f"  {entry['country']:<20} {entry['daily_quads']:.4f} Quads/day")

    def test_full_analysis_report(self):
        import io
        import sys

        captured = io.StringIO()
        sys.stdout = captured
        try:
            analyze_and_print(self.data)
        finally:
            sys.stdout = sys.__stdout__

        output = captured.getvalue()
        print("\n" + output)

        self.assertIn("Predictive Efficiency Engine", output)
        self.assertIn("Top 10 Nations", output)
        self.assertIn("China", output)
        self.assertIn("High-Risk Geopolitical Regions", output)
        self.assertIn("Ukraine", output)
        self.assertIn("2026 Projected Daily Consumption", output)
        self.assertIn("5-Year Consumption Projection", output)


if __name__ == '__main__':
    unittest.main(verbosity=2)
