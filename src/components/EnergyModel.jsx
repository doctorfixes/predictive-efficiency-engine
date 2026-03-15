import { useState, useMemo, useCallback } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  bg: "#0A0E17",
  surface: "#0f1623",
  surfaceAlt: "#151d2e",
  border: "#1e2d45",
  text: "#e2e8f0",
  textMuted: "#7a8fa8",
  textDim: "#4a5f78",
  accent: "#10b981",
  accentAlt: "#06d6a0",
};

const RESOURCE_COLORS = {
  Coal:       "#6b7280",
  Oil:        "#dc2626",
  Gas:        "#f97316",
  Nuclear:    "#a78bfa",
  Hydro:      "#22d3ee",
  Renewables: "#10b981",
  Wind:       "#38bdf8",
  Geo:        "#34d399",
  Biomass:    "#86efac",
  Bio:        "#4ade80",
  OilShale:   "#b45309",
};

const RESOURCE_LABELS = {
  Coal:       "Coal",
  Oil:        "Oil",
  Gas:        "Nat. Gas",
  Nuclear:    "Nuclear",
  Hydro:      "Hydro",
  Renewables: "Renewables",
  Wind:       "Wind",
  Geo:        "Geothermal",
  Biomass:    "Biomass",
  Bio:        "Biofuel",
  OilShale:   "Oil Shale",
};

const RESOURCE_KEYS = Object.keys(RESOURCE_LABELS);

// Base cost in $/MMBTU
const BASE_COSTS = {
  Coal:       2.85,
  Oil:        18.40,
  Gas:        3.90,
  Nuclear:    1.05,
  Hydro:      0.95,
  Renewables: 1.65,
  Wind:       1.40,
  Geo:        2.10,
  Biomass:    4.20,
  Bio:        5.80,
  OilShale:   8.50,
};

// Annual cost trend (fraction per year; negative = cost falls)
const COST_TRENDS = {
  Coal:       0.020,
  Oil:        0.030,
  Gas:        0.025,
  Nuclear:    0.000,
  Hydro:     -0.010,
  Renewables:-0.050,
  Wind:      -0.045,
  Geo:       -0.020,
  Biomass:   -0.010,
  Bio:       -0.040,
  OilShale:   0.020,
};

const SCENARIOS = {
  constrained:  { label: "Constrained",  multiplier: 0.6, color: "#38bdf8" },
  baseline:     { label: "Baseline",     multiplier: 1.0, color: "#10b981" },
  accelerated:  { label: "Accelerated",  multiplier: 1.4, color: "#f97316" },
};

const SORT_OPTIONS = [
  { key: "rank",        label: "Rank" },
  { key: "projQuads",   label: "Proj. Quads" },
  { key: "deltaPercent",label: "Δ%" },
  { key: "projCost",    label: "Proj. Cost" },
  { key: "costDelta",   label: "Cost Δ%" },
];

const VIEWS = ["Predict", "Cost Pace", "Mix"];

const RENEWABLE_EFFICIENCY_BONUS = 0.08;
const RENEWABLE_BONUS_THRESHOLD = 0.3;
const DEFAULT_SPARKLINE_POINTS = 6;
const RENEWABLE_KEYS = ["Hydro", "Renewables", "Wind", "Geo", "Biomass", "Bio"];

// ─── Country Data (top 50 by daily energy consumption) ───────────────────────

const NATIONS = [
  { rank:  1, country:"China",          base:0.5044, growth:0.018, mix:{ Coal:0.540, Oil:0.195, Gas:0.090, Nuclear:0.045, Hydro:0.065, Renewables:0.030, Wind:0.025, Geo:0.002, Biomass:0.005, Bio:0.002, OilShale:0.001 } },
  { rank:  2, country:"United States",  base:0.2507, growth:0.018, mix:{ Coal:0.115, Oil:0.360, Gas:0.335, Nuclear:0.085, Hydro:0.025, Renewables:0.045, Wind:0.028, Geo:0.004, Biomass:0.002, Bio:0.001, OilShale:0.000 } },
  { rank:  3, country:"India",          base:0.1385, growth:0.025, mix:{ Coal:0.540, Oil:0.245, Gas:0.065, Nuclear:0.020, Hydro:0.085, Renewables:0.030, Wind:0.010, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank:  4, country:"Russia",         base:0.0789, growth:0.025, mix:{ Coal:0.145, Oil:0.310, Gas:0.420, Nuclear:0.065, Hydro:0.055, Renewables:0.002, Wind:0.001, Geo:0.001, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank:  5, country:"Japan",          base:0.0619, growth:0.018, mix:{ Coal:0.270, Oil:0.380, Gas:0.215, Nuclear:0.045, Hydro:0.040, Renewables:0.030, Wind:0.010, Geo:0.002, Biomass:0.005, Bio:0.003, OilShale:0.000 } },
  { rank:  6, country:"Germany",        base:0.0344, growth:0.018, mix:{ Coal:0.205, Oil:0.325, Gas:0.255, Nuclear:0.010, Hydro:0.015, Renewables:0.120, Wind:0.065, Geo:0.001, Biomass:0.004, Bio:0.000, OilShale:0.000 } },
  { rank:  7, country:"South Korea",    base:0.0304, growth:0.018, mix:{ Coal:0.270, Oil:0.380, Gas:0.195, Nuclear:0.115, Hydro:0.005, Renewables:0.025, Wind:0.005, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank:  8, country:"Canada",         base:0.0291, growth:0.018, mix:{ Coal:0.055, Oil:0.395, Gas:0.285, Nuclear:0.065, Hydro:0.175, Renewables:0.015, Wind:0.010, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank:  9, country:"Saudi Arabia",   base:0.0278, growth:0.025, mix:{ Coal:0.000, Oil:0.600, Gas:0.395, Nuclear:0.000, Hydro:0.000, Renewables:0.003, Wind:0.001, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 10, country:"Brazil",         base:0.0266, growth:0.025, mix:{ Coal:0.055, Oil:0.355, Gas:0.125, Nuclear:0.015, Hydro:0.360, Renewables:0.060, Wind:0.025, Geo:0.001, Biomass:0.004, Bio:0.000, OilShale:0.000 } },
  { rank: 11, country:"France",         base:0.0249, growth:0.018, mix:{ Coal:0.030, Oil:0.330, Gas:0.175, Nuclear:0.365, Hydro:0.060, Renewables:0.020, Wind:0.015, Geo:0.001, Biomass:0.004, Bio:0.000, OilShale:0.000 } },
  { rank: 12, country:"Iran",           base:0.0242, growth:0.025, mix:{ Coal:0.010, Oil:0.325, Gas:0.640, Nuclear:0.000, Hydro:0.020, Renewables:0.003, Wind:0.001, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 13, country:"United Kingdom", base:0.0224, growth:0.018, mix:{ Coal:0.030, Oil:0.350, Gas:0.320, Nuclear:0.070, Hydro:0.010, Renewables:0.145, Wind:0.065, Geo:0.001, Biomass:0.005, Bio:0.004, OilShale:0.000 } },
  { rank: 14, country:"Mexico",         base:0.0202, growth:0.025, mix:{ Coal:0.055, Oil:0.455, Gas:0.370, Nuclear:0.020, Hydro:0.075, Renewables:0.015, Wind:0.005, Geo:0.004, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 15, country:"Australia",      base:0.0187, growth:0.018, mix:{ Coal:0.300, Oil:0.355, Gas:0.275, Nuclear:0.000, Hydro:0.015, Renewables:0.040, Wind:0.015, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 16, country:"Turkey",         base:0.0174, growth:0.025, mix:{ Coal:0.290, Oil:0.310, Gas:0.230, Nuclear:0.000, Hydro:0.100, Renewables:0.040, Wind:0.025, Geo:0.003, Biomass:0.002, Bio:0.000, OilShale:0.000 } },
  { rank: 17, country:"Indonesia",      base:0.0166, growth:0.030, mix:{ Coal:0.540, Oil:0.275, Gas:0.150, Nuclear:0.000, Hydro:0.025, Renewables:0.005, Wind:0.002, Geo:0.002, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 18, country:"Italy",          base:0.0158, growth:0.018, mix:{ Coal:0.065, Oil:0.345, Gas:0.370, Nuclear:0.000, Hydro:0.060, Renewables:0.095, Wind:0.035, Geo:0.016, Biomass:0.009, Bio:0.005, OilShale:0.000 } },
  { rank: 19, country:"Spain",          base:0.0148, growth:0.018, mix:{ Coal:0.060, Oil:0.360, Gas:0.215, Nuclear:0.080, Hydro:0.080, Renewables:0.120, Wind:0.075, Geo:0.000, Biomass:0.005, Bio:0.005, OilShale:0.000 } },
  { rank: 20, country:"Poland",         base:0.0131, growth:0.018, mix:{ Coal:0.480, Oil:0.270, Gas:0.165, Nuclear:0.000, Hydro:0.010, Renewables:0.060, Wind:0.015, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 21, country:"Thailand",       base:0.0122, growth:0.025, mix:{ Coal:0.190, Oil:0.355, Gas:0.390, Nuclear:0.000, Hydro:0.035, Renewables:0.020, Wind:0.005, Geo:0.001, Biomass:0.004, Bio:0.000, OilShale:0.000 } },
  { rank: 22, country:"Egypt",          base:0.0113, growth:0.030, mix:{ Coal:0.005, Oil:0.340, Gas:0.620, Nuclear:0.000, Hydro:0.030, Renewables:0.003, Wind:0.002, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 23, country:"Netherlands",    base:0.0111, growth:0.018, mix:{ Coal:0.095, Oil:0.350, Gas:0.370, Nuclear:0.015, Hydro:0.002, Renewables:0.095, Wind:0.063, Geo:0.000, Biomass:0.005, Bio:0.005, OilShale:0.000 } },
  { rank: 24, country:"Argentina",      base:0.0107, growth:0.025, mix:{ Coal:0.015, Oil:0.340, Gas:0.510, Nuclear:0.040, Hydro:0.065, Renewables:0.020, Wind:0.009, Geo:0.001, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 25, country:"Vietnam",        base:0.0104, growth:0.030, mix:{ Coal:0.420, Oil:0.295, Gas:0.175, Nuclear:0.000, Hydro:0.085, Renewables:0.020, Wind:0.005, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 26, country:"Venezuela",      base:0.0096, growth:0.030, mix:{ Coal:0.005, Oil:0.450, Gas:0.450, Nuclear:0.000, Hydro:0.090, Renewables:0.003, Wind:0.001, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 27, country:"Malaysia",       base:0.0093, growth:0.025, mix:{ Coal:0.215, Oil:0.325, Gas:0.395, Nuclear:0.000, Hydro:0.055, Renewables:0.005, Wind:0.002, Geo:0.001, Biomass:0.002, Bio:0.000, OilShale:0.000 } },
  { rank: 28, country:"Kazakhstan",     base:0.0090, growth:0.025, mix:{ Coal:0.570, Oil:0.215, Gas:0.180, Nuclear:0.000, Hydro:0.030, Renewables:0.002, Wind:0.002, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 29, country:"Nigeria",        base:0.0083, growth:0.030, mix:{ Coal:0.010, Oil:0.355, Gas:0.540, Nuclear:0.000, Hydro:0.075, Renewables:0.015, Wind:0.003, Geo:0.000, Biomass:0.002, Bio:0.000, OilShale:0.000 } },
  { rank: 30, country:"Belgium",        base:0.0079, growth:0.018, mix:{ Coal:0.040, Oil:0.385, Gas:0.290, Nuclear:0.185, Hydro:0.005, Renewables:0.065, Wind:0.025, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank: 31, country:"Sweden",         base:0.0077, growth:0.018, mix:{ Coal:0.040, Oil:0.265, Gas:0.075, Nuclear:0.280, Hydro:0.310, Renewables:0.025, Wind:0.005, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 32, country:"Pakistan",       base:0.0074, growth:0.030, mix:{ Coal:0.265, Oil:0.250, Gas:0.360, Nuclear:0.060, Hydro:0.055, Renewables:0.006, Wind:0.003, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 33, country:"Ukraine",        base:0.0071, growth:0.025, mix:{ Coal:0.355, Oil:0.195, Gas:0.280, Nuclear:0.135, Hydro:0.020, Renewables:0.010, Wind:0.004, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 34, country:"Czech Republic", base:0.0066, growth:0.018, mix:{ Coal:0.355, Oil:0.290, Gas:0.195, Nuclear:0.110, Hydro:0.015, Renewables:0.030, Wind:0.005, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 35, country:"Romania",        base:0.0064, growth:0.025, mix:{ Coal:0.185, Oil:0.280, Gas:0.300, Nuclear:0.090, Hydro:0.105, Renewables:0.030, Wind:0.010, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 36, country:"South Africa",   base:0.0062, growth:0.025, mix:{ Coal:0.720, Oil:0.195, Gas:0.020, Nuclear:0.040, Hydro:0.010, Renewables:0.010, Wind:0.004, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 37, country:"Norway",         base:0.0060, growth:0.018, mix:{ Coal:0.020, Oil:0.310, Gas:0.080, Nuclear:0.000, Hydro:0.580, Renewables:0.005, Wind:0.005, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 38, country:"Greece",         base:0.0053, growth:0.018, mix:{ Coal:0.180, Oil:0.430, Gas:0.185, Nuclear:0.000, Hydro:0.060, Renewables:0.085, Wind:0.055, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank: 39, country:"Austria",        base:0.0052, growth:0.018, mix:{ Coal:0.090, Oil:0.355, Gas:0.275, Nuclear:0.000, Hydro:0.175, Renewables:0.080, Wind:0.025, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 40, country:"Philippines",    base:0.0049, growth:0.030, mix:{ Coal:0.415, Oil:0.385, Gas:0.100, Nuclear:0.000, Hydro:0.065, Renewables:0.025, Wind:0.006, Geo:0.004, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 41, country:"Bangladesh",     base:0.0047, growth:0.030, mix:{ Coal:0.090, Oil:0.295, Gas:0.600, Nuclear:0.000, Hydro:0.010, Renewables:0.003, Wind:0.001, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 42, country:"Portugal",       base:0.0044, growth:0.018, mix:{ Coal:0.045, Oil:0.410, Gas:0.195, Nuclear:0.000, Hydro:0.145, Renewables:0.150, Wind:0.050, Geo:0.005, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 43, country:"Iraq",           base:0.0042, growth:0.030, mix:{ Coal:0.000, Oil:0.595, Gas:0.395, Nuclear:0.000, Hydro:0.010, Renewables:0.000, Wind:0.000, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 44, country:"Algeria",        base:0.0040, growth:0.030, mix:{ Coal:0.000, Oil:0.340, Gas:0.645, Nuclear:0.000, Hydro:0.010, Renewables:0.003, Wind:0.001, Geo:0.000, Biomass:0.001, Bio:0.000, OilShale:0.000 } },
  { rank: 45, country:"Hungary",        base:0.0038, growth:0.018, mix:{ Coal:0.080, Oil:0.300, Gas:0.360, Nuclear:0.185, Hydro:0.010, Renewables:0.055, Wind:0.010, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 46, country:"Israel",         base:0.0036, growth:0.025, mix:{ Coal:0.105, Oil:0.330, Gas:0.465, Nuclear:0.000, Hydro:0.000, Renewables:0.085, Wind:0.010, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank: 47, country:"Denmark",        base:0.0035, growth:0.018, mix:{ Coal:0.060, Oil:0.350, Gas:0.220, Nuclear:0.000, Hydro:0.000, Renewables:0.280, Wind:0.085, Geo:0.000, Biomass:0.005, Bio:0.000, OilShale:0.000 } },
  { rank: 48, country:"Chile",          base:0.0034, growth:0.025, mix:{ Coal:0.235, Oil:0.360, Gas:0.145, Nuclear:0.000, Hydro:0.205, Renewables:0.040, Wind:0.010, Geo:0.005, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 49, country:"Finland",        base:0.0033, growth:0.018, mix:{ Coal:0.095, Oil:0.280, Gas:0.075, Nuclear:0.300, Hydro:0.140, Renewables:0.090, Wind:0.020, Geo:0.000, Biomass:0.000, Bio:0.000, OilShale:0.000 } },
  { rank: 50, country:"Singapore",      base:0.0032, growth:0.025, mix:{ Coal:0.005, Oil:0.340, Gas:0.640, Nuclear:0.000, Hydro:0.000, Renewables:0.010, Wind:0.003, Geo:0.000, Biomass:0.002, Bio:0.000, OilShale:0.000 } },
];

// ─── Pure computation helpers ─────────────────────────────────────────────────

function renewableShare(mix) {
  return RENEWABLE_KEYS.reduce((s, k) => s + (mix[k] || 0), 0);
}

function computeProjectedQuads(base, growth, years, scenarioMult, mix) {
  const renShare = renewableShare(mix);
  const bonus = renShare > RENEWABLE_BONUS_THRESHOLD ? RENEWABLE_EFFICIENCY_BONUS * renShare : 0;
  const effectiveGrowth = growth * scenarioMult * (1 - bonus);
  return base * Math.pow(1 + effectiveGrowth, years);
}

function computeCostIndex(mix, years) {
  return RESOURCE_KEYS.reduce((sum, k) => {
    const share = mix[k] || 0;
    const cost = BASE_COSTS[k] * Math.pow(1 + COST_TRENDS[k], years);
    return sum + share * cost;
  }, 0);
}

function buildSparkline(base, growth, years, scenarioMult, mix, points = DEFAULT_SPARKLINE_POINTS) {
  const vals = [];
  for (let i = 0; i <= points; i++) {
    vals.push(computeProjectedQuads(base, growth, (years * i) / points, scenarioMult, mix));
  }
  return vals;
}

function buildCostSparkline(mix, years, points = DEFAULT_SPARKLINE_POINTS) {
  const vals = [];
  for (let i = 0; i <= points; i++) {
    vals.push(computeCostIndex(mix, (years * i) / points));
  }
  return vals;
}

// ─── Tiny inline SVG sparkline ────────────────────────────────────────────────

function Sparkline({ values, color = "#10b981", width = 64, height = 20 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Stacked bar (resource mix) ───────────────────────────────────────────────

function StackedBar({ mix, width = 160, height = 10 }) {
  let x = 0;
  return (
    <svg width={width} height={height} style={{ display: "block", borderRadius: 3 }}>
      {RESOURCE_KEYS.map((k) => {
        const w = (mix[k] || 0) * width;
        if (w < 0.5) return null;
        const rect = (
          <rect key={k} x={x} y={0} width={w} height={height} fill={RESOURCE_COLORS[k]} />
        );
        x += w;
        return rect;
      })}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnergyModel() {
  const [scenario, setScenario] = useState("baseline");
  const [years, setYears] = useState(5);
  const [view, setView] = useState("Predict");
  const [sortKey, setSortKey] = useState("rank");
  const [selectedCountry, setSelectedCountry] = useState(null);

  const scenarioMult = SCENARIOS[scenario]?.multiplier ?? 1.0;

  // Compute full row data
  const rows = useMemo(() => {
    return NATIONS.map((n) => {
      const projQuads = computeProjectedQuads(n.base, n.growth, years, scenarioMult, n.mix);
      const deltaPercent = ((projQuads - n.base) / n.base) * 100;
      const costCurrent = computeCostIndex(n.mix, 0);
      const projCost = computeCostIndex(n.mix, years);
      const costDelta = ((projCost - costCurrent) / costCurrent) * 100;
      const quadSpark = buildSparkline(n.base, n.growth, years, scenarioMult, n.mix);
      const costSpark = buildCostSparkline(n.mix, years);
      return {
        ...n,
        projQuads,
        deltaPercent,
        costCurrent,
        projCost,
        costDelta,
        quadSpark,
        costSpark,
      };
    });
  }, [years, scenarioMult]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortKey === "rank") return copy.sort((a, b) => a.rank - b.rank);
    if (sortKey === "projQuads") return copy.sort((a, b) => b.projQuads - a.projQuads);
    if (sortKey === "deltaPercent") return copy.sort((a, b) => b.deltaPercent - a.deltaPercent);
    if (sortKey === "projCost") return copy.sort((a, b) => b.projCost - a.projCost);
    if (sortKey === "costDelta") return copy.sort((a, b) => b.costDelta - a.costDelta);
    return copy;
  }, [rows, sortKey]);

  const selected = useMemo(
    () => rows.find((r) => r.country === selectedCountry) || null,
    [rows, selectedCountry]
  );

  const handleRowClick = useCallback(
    (country) => setSelectedCountry((prev) => (prev === country ? null : country)),
    []
  );

  // ── Resource mix global aggregates ──
  const globalMixData = useMemo(() => {
    const totals = {};
    RESOURCE_KEYS.forEach((k) => (totals[k] = 0));
    rows.forEach((r) => {
      RESOURCE_KEYS.forEach((k) => {
        totals[k] += (r.mix[k] || 0) * r.base;
      });
    });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return RESOURCE_KEYS.map((k) => ({
      key: k,
      label: RESOURCE_LABELS[k],
      color: RESOURCE_COLORS[k],
      share: grandTotal > 0 ? totals[k] / grandTotal : 0,
      currentCost: BASE_COSTS[k],
      projCost: BASE_COSTS[k] * Math.pow(1 + COST_TRENDS[k], years),
    })).sort((a, b) => b.share - a.share);
  }, [rows, years]);

  // ── Styles ──
  const S = {
    root: {
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'JetBrains Mono', 'Space Mono', 'Courier New', monospace",
      minHeight: "100vh",
      padding: "16px",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      marginBottom: "16px",
    },
    title: {
      fontSize: "15px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      color: COLORS.accent,
      textTransform: "uppercase",
    },
    subtitle: { fontSize: "11px", color: COLORS.textMuted, marginTop: "2px" },
    controls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    btnGroup: { display: "flex", gap: "4px" },
    btn: (active, color) => ({
      background: active ? (color || COLORS.accent) : "transparent",
      color: active ? "#fff" : COLORS.textMuted,
      border: `1px solid ${active ? (color || COLORS.accent) : COLORS.border}`,
      borderRadius: "4px",
      padding: "4px 10px",
      fontSize: "11px",
      cursor: "pointer",
      fontFamily: "inherit",
      letterSpacing: "0.04em",
      transition: "all 0.15s",
    }),
    sliderWrap: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "11px",
      color: COLORS.textMuted,
    },
    slider: {
      accentColor: COLORS.accent,
      width: "100px",
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
    th: {
      padding: "6px 8px",
      textAlign: "left",
      color: COLORS.textDim,
      borderBottom: `1px solid ${COLORS.border}`,
      fontSize: "10px",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      cursor: "pointer",
      userSelect: "none",
      whiteSpace: "nowrap",
    },
    thActive: { color: COLORS.accent },
    td: { padding: "5px 8px", borderBottom: `1px solid ${COLORS.border}20`, whiteSpace: "nowrap" },
    pos: { color: COLORS.accent },
    neg: { color: "#ef4444" },
    neutral: { color: COLORS.textMuted },
    card: {
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "6px",
      padding: "12px",
    },
    sectionTitle: {
      fontSize: "10px",
      color: COLORS.textDim,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "10px",
    },
  };

  const fmt4 = (v) => v.toFixed(4);
  const fmtPct = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
  const fmtCost = (v) => "$" + v.toFixed(2);

  // ── Predict table view ──
  const renderPredictView = () => (
    <div style={{ overflowX: "auto" }}>
      <table style={S.table}>
        <thead>
          <tr>
            {[
              { k: "rank", label: "#" },
              { k: null, label: "Country" },
              { k: "rank", label: "Base (Q)" },
              { k: "projQuads", label: `Proj. (Q)` },
              { k: "deltaPercent", label: "Δ Quads" },
              { k: null, label: "Traj." },
              { k: "projCost", label: "Cost Now" },
              { k: "projCost", label: `Cost @${years}yr` },
              { k: "costDelta", label: "Cost Δ" },
              { k: null, label: "Cost Traj." },
            ].map((col, i) => (
              <th
                key={i}
                style={{ ...S.th, ...(col.k && sortKey === col.k ? S.thActive : {}) }}
                onClick={() => col.k && setSortKey(col.k)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const isSelected = selectedCountry === r.country;
            return (
              <tr
                key={r.country}
                onClick={() => handleRowClick(r.country)}
                style={{
                  cursor: "pointer",
                  background: isSelected ? `${COLORS.accent}18` : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <td style={{ ...S.td, color: COLORS.textDim }}>{r.rank}</td>
                <td style={{ ...S.td, color: COLORS.text, fontWeight: isSelected ? 600 : 400 }}>
                  {r.country}
                </td>
                <td style={{ ...S.td, ...S.neutral }}>{fmt4(r.base)}</td>
                <td style={{ ...S.td, color: COLORS.text }}>{fmt4(r.projQuads)}</td>
                <td style={{ ...S.td, ...(r.deltaPercent >= 0 ? S.pos : S.neg) }}>
                  {fmtPct(r.deltaPercent)}
                </td>
                <td style={S.td}>
                  <Sparkline
                    values={r.quadSpark}
                    color={SCENARIOS[scenario]?.color ?? COLORS.accent}
                    width={56}
                    height={18}
                  />
                </td>
                <td style={{ ...S.td, ...S.neutral }}>{fmtCost(r.costCurrent)}</td>
                <td style={{ ...S.td, color: COLORS.text }}>{fmtCost(r.projCost)}</td>
                <td style={{ ...S.td, ...(r.costDelta >= 0 ? S.neg : S.pos) }}>
                  {fmtPct(r.costDelta)}
                </td>
                <td style={S.td}>
                  <Sparkline
                    values={r.costSpark}
                    color={r.costDelta >= 0 ? "#ef4444" : "#10b981"}
                    width={56}
                    height={18}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ── Cost Pace view ──
  const renderCostPaceView = () => {
    const top25 = [...rows].sort((a, b) => b.projCost - a.projCost).slice(0, 25);
    return (
      <div>
        <div style={{ ...S.sectionTitle }}>TOP 25 BY PROJECTED COST INDEX ({years}YR HORIZON)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {top25.map((r) => {
            const barMax = top25[0].projCost;
            const barW = (r.projCost / barMax) * 320;
            const baseBarW = (r.costCurrent / barMax) * 320;
            return (
              <div
                key={r.country}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  opacity: selectedCountry && selectedCountry !== r.country ? 0.5 : 1,
                }}
                onClick={() => handleRowClick(r.country)}
              >
                <div style={{ width: "120px", fontSize: "11px", color: COLORS.textMuted, textAlign: "right" }}>
                  {r.country}
                </div>
                <div style={{ position: "relative", width: "320px", height: "16px" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "4px",
                      width: `${baseBarW}px`,
                      height: "8px",
                      background: COLORS.border,
                      borderRadius: "2px",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "4px",
                      width: `${barW}px`,
                      height: "8px",
                      background: SCENARIOS[scenario]?.color ?? COLORS.accent,
                      borderRadius: "2px",
                      opacity: 0.85,
                    }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: COLORS.text, width: "52px" }}>
                  {fmtCost(r.projCost)}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: r.costDelta >= 0 ? "#ef4444" : "#10b981",
                    width: "48px",
                  }}
                >
                  {fmtPct(r.costDelta)}
                </div>
                <Sparkline values={r.costSpark} color={r.costDelta >= 0 ? "#ef4444" : "#10b981"} width={48} height={16} />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "20px", ...S.sectionTitle }}>RESOURCE UNIT COSTS ($/MMBTU)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
          {RESOURCE_KEYS.map((k) => {
            const projCost = BASE_COSTS[k] * Math.pow(1 + COST_TRENDS[k], years);
            const delta = ((projCost - BASE_COSTS[k]) / BASE_COSTS[k]) * 100;
            return (
              <div key={k} style={{ ...S.card, borderLeft: `3px solid ${RESOURCE_COLORS[k]}` }}>
                <div style={{ fontSize: "10px", color: COLORS.textDim, marginBottom: "4px" }}>
                  {RESOURCE_LABELS[k]}
                </div>
                <div style={{ fontSize: "13px", color: COLORS.text }}>{fmtCost(BASE_COSTS[k])}</div>
                <div
                  style={{ fontSize: "11px", color: delta >= 0 ? "#ef4444" : "#10b981", marginTop: "2px" }}
                >
                  → {fmtCost(projCost)} ({fmtPct(delta)})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Mix view ──
  const renderMixView = () => {
    const barMax = globalMixData[0].share;
    return (
      <div>
        <div style={{ ...S.sectionTitle }}>GLOBAL ENERGY SOURCE DISTRIBUTION (WEIGHTED BY CONSUMPTION)</div>

        {/* Stacked global bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: COLORS.textMuted, marginBottom: "6px" }}>
            Aggregate resource mix — all 50 nations
          </div>
          {/* Build a combined mix for display */}
          <svg width="100%" height="24" style={{ display: "block", maxWidth: "600px" }}>
            {(() => {
              let x = 0;
              return globalMixData.map((d) => {
                const w = d.share * 600;
                const rect = (
                  <rect
                    key={d.key}
                    x={`${(x / 600) * 100}%`}
                    y={0}
                    width={`${(w / 600) * 100}%`}
                    height={24}
                    fill={d.color}
                  />
                );
                x += w;
                return rect;
              });
            })()}
          </svg>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {globalMixData.map((d) => (
              <div key={d.key} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: COLORS.textMuted }}>
                <span style={{ width: "10px", height: "10px", background: d.color, display: "inline-block", borderRadius: "2px" }} />
                {d.label} {(d.share * 100).toFixed(1)}%
              </div>
            ))}
          </div>
        </div>

        {/* Resource cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
          {globalMixData.map((d) => {
            const projCost = d.projCost;
            const costDelta = ((projCost - d.currentCost) / d.currentCost) * 100;
            const barW = (d.share / barMax) * 120;
            return (
              <div key={d.key} style={{ ...S.card, borderTop: `2px solid ${d.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: COLORS.text, fontWeight: 600 }}>{d.label}</div>
                    <div style={{ fontSize: "10px", color: COLORS.textDim, marginTop: "2px" }}>
                      {(d.share * 100).toFixed(2)}% global share
                    </div>
                  </div>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: d.color,
                      marginTop: "2px",
                    }}
                  />
                </div>
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      height: "4px",
                      background: d.color,
                      width: `${barW}px`,
                      borderRadius: "2px",
                      maxWidth: "100%",
                    }}
                  />
                </div>
                <div style={{ marginTop: "8px", fontSize: "11px" }}>
                  <div style={{ color: COLORS.textMuted }}>
                    Cost: <span style={{ color: COLORS.text }}>{fmtCost(d.currentCost)}</span> → <span style={{ color: costDelta >= 0 ? "#ef4444" : "#10b981" }}>{fmtCost(projCost)}</span>
                  </div>
                  <div style={{ color: costDelta >= 0 ? "#ef4444" : "#10b981", fontSize: "10px", marginTop: "2px" }}>
                    {fmtPct(costDelta)} over {years}yr
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Selected country detail panel ──
  const renderDetailPanel = () => {
    if (!selected) return null;
    return (
      <div style={{ ...S.card, marginTop: "16px", borderColor: COLORS.accent }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: COLORS.accent }}>
              {selected.country}
            </div>
            <div style={{ fontSize: "10px", color: COLORS.textDim, marginTop: "2px" }}>
              Rank #{selected.rank} · Growth tier: {selected.growth * 100}%/yr base
            </div>
          </div>
          <button
            onClick={() => setSelectedCountry(null)}
            style={{ ...S.btn(false), padding: "2px 8px", fontSize: "11px" }}
          >
            ✕
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          <div>
            <div style={{ ...S.sectionTitle }}>CONSUMPTION</div>
            <div style={{ fontSize: "11px", color: COLORS.textMuted }}>
              Base: <span style={{ color: COLORS.text }}>{fmt4(selected.base)} Q/day</span>
            </div>
            <div style={{ fontSize: "11px", color: COLORS.textMuted }}>
              Projected: <span style={{ color: COLORS.text }}>{fmt4(selected.projQuads)} Q/day</span>
            </div>
            <div style={{ fontSize: "11px", color: selected.deltaPercent >= 0 ? COLORS.accent : "#ef4444" }}>
              Δ {fmtPct(selected.deltaPercent)}
            </div>
            <div style={{ marginTop: "6px" }}>
              <Sparkline values={selected.quadSpark} color={SCENARIOS[scenario]?.color ?? COLORS.accent} width={120} height={30} />
            </div>
          </div>
          <div>
            <div style={{ ...S.sectionTitle }}>COST INDEX</div>
            <div style={{ fontSize: "11px", color: COLORS.textMuted }}>
              Current: <span style={{ color: COLORS.text }}>{fmtCost(selected.costCurrent)}/MMBTU</span>
            </div>
            <div style={{ fontSize: "11px", color: COLORS.textMuted }}>
              Projected: <span style={{ color: COLORS.text }}>{fmtCost(selected.projCost)}/MMBTU</span>
            </div>
            <div style={{ fontSize: "11px", color: selected.costDelta >= 0 ? "#ef4444" : COLORS.accent }}>
              Δ {fmtPct(selected.costDelta)}
            </div>
            <div style={{ marginTop: "6px" }}>
              <Sparkline
                values={selected.costSpark}
                color={selected.costDelta >= 0 ? "#ef4444" : "#10b981"}
                width={120}
                height={30}
              />
            </div>
          </div>
          <div>
            <div style={{ ...S.sectionTitle }}>RESOURCE MIX</div>
            <StackedBar mix={selected.mix} width={200} height={12} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
              {RESOURCE_KEYS.filter((k) => (selected.mix[k] || 0) > 0.005).map((k) => (
                <span
                  key={k}
                  style={{
                    fontSize: "10px",
                    color: RESOURCE_COLORS[k],
                    background: `${RESOURCE_COLORS[k]}22`,
                    padding: "1px 5px",
                    borderRadius: "3px",
                  }}
                >
                  {RESOURCE_LABELS[k]} {((selected.mix[k] || 0) * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>⚡ Energy Consumption Predictive Model</div>
          <div style={S.subtitle}>Top 50 nations · {years}-year horizon · {SCENARIOS[scenario]?.label ?? scenario} scenario</div>
        </div>
        <div style={S.controls}>
          {/* Scenario selector */}
          <div style={S.btnGroup}>
            {Object.entries(SCENARIOS).map(([k, v]) => (
              <button
                key={k}
                style={S.btn(scenario === k, v.color)}
                onClick={() => setScenario(k)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Years slider */}
          <div style={S.sliderWrap}>
            <span>Horizon:</span>
            <input
              type="range"
              min={1}
              max={15}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              style={S.slider}
            />
            <span style={{ color: COLORS.text, minWidth: "28px" }}>{years}yr</span>
          </div>

          {/* View switcher */}
          <div style={S.btnGroup}>
            {VIEWS.map((v) => (
              <button key={v} style={S.btn(view === v)} onClick={() => setView(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort bar (Predict view only) */}
      {view === "Predict" && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: COLORS.textDim, letterSpacing: "0.08em" }}>SORT:</span>
          {SORT_OPTIONS.map((o) => (
            <button key={o.key} style={S.btn(sortKey === o.key)} onClick={() => setSortKey(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Main view */}
      <div style={{ ...S.card }}>
        {view === "Predict" && renderPredictView()}
        {view === "Cost Pace" && renderCostPaceView()}
        {view === "Mix" && renderMixView()}
      </div>

      {/* Detail panel */}
      {renderDetailPanel()}

      {/* Footer */}
      <div style={{ marginTop: "12px", fontSize: "10px", color: COLORS.textDim, textAlign: "right" }}>
        Model params: growth × {scenarioMult}x · renewable efficiency bonus {(RENEWABLE_EFFICIENCY_BONUS * 100).toFixed(0)}% · costs compounded annually
      </div>
    </div>
  );
}
