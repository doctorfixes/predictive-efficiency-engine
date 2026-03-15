import { useState, useMemo } from "react";

// ─── Color & Style Constants ────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0f1a",
  surface: "#111827",
  surfaceAlt: "#1a2332",
  surfaceHover: "#1e2d42",
  border: "#1e293b",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#10b981",
  accentAlt: "#06d6a0",
  orange: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  purple: "#a78bfa",
};

const TAG_COLORS = {
  CONFLICT: { bg: "#7f1d1d", text: "#fca5a5", border: "#991b1b" },
  TRADE:    { bg: "#78350f", text: "#fcd34d", border: "#92400e" },
  SANCTION: { bg: "#581c87", text: "#d8b4fe", border: "#6b21a8" },
  POLICY:   { bg: "#1e3a5f", text: "#93c5fd", border: "#1e40af" },
  INFRA:    { bg: "#064e3b", text: "#6ee7b7", border: "#065f46" },
  ECON:     { bg: "#713f12", text: "#fde68a", border: "#854d0e" },
  STABLE:   { bg: "#1f2937", text: "#9ca3af", border: "#374151" },
};

// ─── Geopolitical Risk Data ──────────────────────────────────────────────────
const GEO_RISKS = {
  Ukraine: {
    score: 9.8,
    factors: [
      { type: "Active War Zone", desc: "Russian invasion causing infrastructure destruction and energy system collapse", severity: 10, prob: 0.98, costMult: 1.35, supplyMult: 0.62, category: "CONFLICT" },
      { type: "Transit Leverage", desc: "Natural gas transit disruptions affecting European energy security", severity: 9, prob: 0.85, costMult: 1.22, supplyMult: 0.71, category: "INFRA" },
      { type: "Grid Attacks", desc: "Systematic targeting of power generation and distribution infrastructure", severity: 9, prob: 0.92, costMult: 1.28, supplyMult: 0.68, category: "INFRA" },
    ],
  },
  Russia: {
    score: 9.2,
    factors: [
      { type: "Ukraine War", desc: "Ongoing military conflict with massive economic and energy sector sanctions", severity: 9, prob: 0.95, costMult: 1.18, supplyMult: 0.75, category: "CONFLICT" },
      { type: "Western Sanctions", desc: "Comprehensive sanctions on energy exports limiting revenue and technology access", severity: 9, prob: 0.95, costMult: 1.24, supplyMult: 0.72, category: "SANCTION" },
      { type: "Pipeline Sabotage", desc: "Nord Stream pipeline destruction and reduced European gas dependency", severity: 8, prob: 0.80, costMult: 1.16, supplyMult: 0.78, category: "INFRA" },
      { type: "Ruble Instability", desc: "Currency volatility impacting energy investment and operational costs", severity: 7, prob: 0.75, costMult: 1.12, supplyMult: 0.85, category: "ECON" },
    ],
  },
  Iran: {
    score: 9.0,
    factors: [
      { type: "Nuclear Standoff", desc: "Escalating nuclear program tensions with Western nations and Israel", severity: 9, prob: 0.88, costMult: 1.26, supplyMult: 0.73, category: "CONFLICT" },
      { type: "Hormuz Chokepoint", desc: "Threats to close Strait of Hormuz controlling 20% of global oil flow", severity: 10, prob: 0.65, costMult: 1.42, supplyMult: 0.58, category: "INFRA" },
      { type: "Oil Sanctions", desc: "US and EU oil sanctions blocking export revenues and technology imports", severity: 9, prob: 0.95, costMult: 1.30, supplyMult: 0.65, category: "SANCTION" },
      { type: "Proxy Conflicts", desc: "Support for regional proxy forces escalating Middle East tensions", severity: 8, prob: 0.80, costMult: 1.18, supplyMult: 0.80, category: "CONFLICT" },
    ],
  },
  Taiwan: {
    score: 8.5,
    factors: [
      { type: "Cross-Strait Crisis", desc: "Chinese military pressure and blockade scenarios threatening energy imports", severity: 9, prob: 0.70, costMult: 1.28, supplyMult: 0.68, category: "CONFLICT" },
      { type: "LNG Dependency", desc: "Heavy reliance on imported LNG vulnerable to maritime disruption", severity: 8, prob: 0.75, costMult: 1.22, supplyMult: 0.72, category: "INFRA" },
      { type: "Semiconductor Leverage", desc: "Chip production tied to energy supply creating strategic vulnerability", severity: 7, prob: 0.65, costMult: 1.15, supplyMult: 0.82, category: "ECON" },
    ],
  },
  China: {
    score: 7.8,
    factors: [
      { type: "Trade War", desc: "US-China technology and trade war escalating energy sector decoupling", severity: 8, prob: 0.85, costMult: 1.14, supplyMult: 0.88, category: "TRADE" },
      { type: "Taiwan Strait Risk", desc: "Military posturing increasing regional instability and shipping costs", severity: 9, prob: 0.60, costMult: 1.20, supplyMult: 0.78, category: "CONFLICT" },
      { type: "LNG Import Risk", desc: "Vulnerability to LNG supply disruption from US allies in crisis scenario", severity: 7, prob: 0.55, costMult: 1.16, supplyMult: 0.82, category: "INFRA" },
      { type: "Coal Dependency", desc: "High coal consumption facing international pressure and transition costs", severity: 6, prob: 0.90, costMult: 1.08, supplyMult: 0.92, category: "POLICY" },
    ],
  },
  Iraq: {
    score: 7.5,
    factors: [
      { type: "Internal Conflict", desc: "Ongoing sectarian tensions and IS resurgence threatening oil infrastructure", severity: 8, prob: 0.70, costMult: 1.20, supplyMult: 0.74, category: "CONFLICT" },
      { type: "Iran Influence", desc: "Iranian proxy militia control over significant portions of energy sector", severity: 7, prob: 0.80, costMult: 1.14, supplyMult: 0.80, category: "CONFLICT" },
      { type: "Infrastructure Decay", desc: "Aging oil fields and pipelines with chronic underinvestment", severity: 7, prob: 0.85, costMult: 1.12, supplyMult: 0.78, category: "INFRA" },
    ],
  },
  Pakistan: {
    score: 7.0,
    factors: [
      { type: "Political Instability", desc: "Government crisis and military tensions affecting energy policy continuity", severity: 7, prob: 0.85, costMult: 1.18, supplyMult: 0.78, category: "POLICY" },
      { type: "IMF Conditions", desc: "Austerity requirements forcing energy subsidy cuts and price volatility", severity: 7, prob: 0.80, costMult: 1.22, supplyMult: 0.82, category: "ECON" },
      { type: "India-Pakistan Tensions", desc: "Nuclear-armed neighbor conflict risk affecting cross-border energy trade", severity: 8, prob: 0.45, costMult: 1.14, supplyMult: 0.75, category: "CONFLICT" },
    ],
  },
  Turkey: {
    score: 6.2,
    factors: [
      { type: "Gas Hub Ambition", desc: "Geopolitical leverage from Russia-EU gas transit creating price uncertainty", severity: 6, prob: 0.75, costMult: 1.12, supplyMult: 0.88, category: "TRADE" },
      { type: "Currency Crisis", desc: "Lira depreciation massively inflating energy import costs", severity: 7, prob: 0.80, costMult: 1.20, supplyMult: 0.85, category: "ECON" },
      { type: "Regional Conflicts", desc: "Involvement in Syrian and Kurdish conflicts affecting southern energy routes", severity: 5, prob: 0.65, costMult: 1.08, supplyMult: 0.90, category: "CONFLICT" },
    ],
  },
  "South Korea": {
    score: 5.8,
    factors: [
      { type: "North Korea Nuclear", desc: "DPRK nuclear program and missile tests creating regional security uncertainty", severity: 8, prob: 0.70, costMult: 1.10, supplyMult: 0.88, category: "CONFLICT" },
      { type: "LNG Import Dependency", desc: "Near-total dependence on LNG imports vulnerable to price spikes and disruption", severity: 6, prob: 0.75, costMult: 1.14, supplyMult: 0.85, category: "INFRA" },
      { type: "China Trade Tension", desc: "Economic retaliation risks from THAAD deployment and trade friction", severity: 5, prob: 0.60, costMult: 1.08, supplyMult: 0.92, category: "TRADE" },
    ],
  },
  India: {
    score: 5.5,
    factors: [
      { type: "Russia Sanctions Navigation", desc: "Discounted Russian oil purchases creating secondary sanctions exposure", severity: 6, prob: 0.70, costMult: 1.08, supplyMult: 0.88, category: "SANCTION" },
      { type: "China Border Tension", desc: "LAC border disputes potentially disrupting energy investment corridors", severity: 7, prob: 0.55, costMult: 1.10, supplyMult: 0.85, category: "CONFLICT" },
      { type: "Coal Phase-Out Pressure", desc: "International pressure on coal dependency vs. domestic energy security", severity: 5, prob: 0.85, costMult: 1.06, supplyMult: 0.90, category: "POLICY" },
    ],
  },
  Egypt: {
    score: 5.5,
    factors: [
      { type: "Suez Canal Risk", desc: "Houthi attacks in Red Sea affecting canal traffic and energy transit premiums", severity: 7, prob: 0.70, costMult: 1.18, supplyMult: 0.82, category: "INFRA" },
      { type: "Gas Export Ambition", desc: "LNG export strategy creating regional political friction with neighbors", severity: 5, prob: 0.65, costMult: 1.10, supplyMult: 0.88, category: "TRADE" },
      { type: "IMF Pressure", desc: "Currency devaluation and subsidy reforms straining energy affordability", severity: 6, prob: 0.80, costMult: 1.14, supplyMult: 0.86, category: "ECON" },
    ],
  },
  "Saudi Arabia": {
    score: 5.5,
    factors: [
      { type: "OPEC+ Politics", desc: "Production cut decisions creating volatility in global energy markets", severity: 6, prob: 0.85, costMult: 1.12, supplyMult: 0.85, category: "TRADE" },
      { type: "Yemen Conflict", desc: "Houthi drone attacks on oil facilities demonstrating infrastructure vulnerability", severity: 7, prob: 0.65, costMult: 1.15, supplyMult: 0.82, category: "CONFLICT" },
      { type: "US Alliance Strain", desc: "Tension with US over production policy affecting security guarantees", severity: 5, prob: 0.60, costMult: 1.08, supplyMult: 0.90, category: "POLICY" },
    ],
  },
  Kazakhstan: {
    score: 5.0,
    factors: [
      { type: "Russia Transit Dependence", desc: "Pipeline infrastructure controlled by Russia creating leverage risk", severity: 6, prob: 0.75, costMult: 1.12, supplyMult: 0.84, category: "INFRA" },
      { type: "CPC Pipeline Disruption", desc: "Caspian Pipeline Consortium disruptions reducing export capacity", severity: 6, prob: 0.65, costMult: 1.10, supplyMult: 0.82, category: "INFRA" },
      { type: "Internal Unrest", desc: "Political protests and social unrest affecting energy sector stability", severity: 5, prob: 0.55, costMult: 1.08, supplyMult: 0.88, category: "POLICY" },
    ],
  },
  "South Africa": {
    score: 5.0,
    factors: [
      { type: "Grid Collapse Risk", desc: "Eskom power utility in crisis with rolling blackouts threatening economy", severity: 8, prob: 0.90, costMult: 1.24, supplyMult: 0.72, category: "INFRA" },
      { type: "Coal Transition Pressure", desc: "Just Energy Transition partnership creating investment and policy uncertainty", severity: 5, prob: 0.80, costMult: 1.10, supplyMult: 0.88, category: "POLICY" },
    ],
  },
  Algeria: {
    score: 4.5,
    factors: [
      { type: "Gas Export Reliability", desc: "Pipeline disputes with Spain and political tensions affecting European supply", severity: 5, prob: 0.65, costMult: 1.10, supplyMult: 0.88, category: "TRADE" },
      { type: "Political Succession", desc: "Leadership uncertainty creating policy instability in energy sector", severity: 4, prob: 0.55, costMult: 1.06, supplyMult: 0.92, category: "POLICY" },
    ],
  },
  "United States": {
    score: 2.0,
    factors: [
      { type: "Policy Continuity", desc: "Energy policy shifts between administrations creating investment uncertainty", severity: 3, prob: 0.70, costMult: 1.04, supplyMult: 0.96, category: "POLICY" },
      { type: "LNG Export Growth", desc: "Strong export position with stable geopolitical footing", severity: 2, prob: 0.30, costMult: 1.02, supplyMult: 0.98, category: "STABLE" },
    ],
  },
  Canada: {
    score: 1.5,
    factors: [
      { type: "Pipeline Disputes", desc: "Internal provincial disputes over pipeline construction causing delays", severity: 3, prob: 0.60, costMult: 1.03, supplyMult: 0.97, category: "POLICY" },
    ],
  },
  France: {
    score: 2.0,
    factors: [
      { type: "Nuclear Fleet Aging", desc: "Aging nuclear fleet requiring maintenance causing supply volatility", severity: 3, prob: 0.65, costMult: 1.05, supplyMult: 0.94, category: "INFRA" },
      { type: "Energy Transition Politics", desc: "Political debate over nuclear policy creating investment uncertainty", severity: 2, prob: 0.50, costMult: 1.03, supplyMult: 0.97, category: "POLICY" },
    ],
  },
  Japan: {
    score: 2.5,
    factors: [
      { type: "LNG Supply Risk", desc: "High LNG import dependency with limited domestic production", severity: 4, prob: 0.50, costMult: 1.08, supplyMult: 0.92, category: "INFRA" },
      { type: "North Korea Threat", desc: "Regional nuclear threat affecting energy infrastructure security", severity: 5, prob: 0.35, costMult: 1.06, supplyMult: 0.94, category: "CONFLICT" },
    ],
  },
  Australia: {
    score: 1.8,
    factors: [
      { type: "China Trade Friction", desc: "Trade tensions with China affecting LNG export revenues", severity: 3, prob: 0.55, costMult: 1.05, supplyMult: 0.95, category: "TRADE" },
      { type: "Grid Transition", desc: "Rapid renewable transition creating grid stability challenges", severity: 3, prob: 0.65, costMult: 1.04, supplyMult: 0.95, category: "POLICY" },
    ],
  },
  Brazil: {
    score: 2.2,
    factors: [
      { type: "Amazon Policy Risk", desc: "International pressure on deforestation affecting energy investment", severity: 3, prob: 0.60, costMult: 1.05, supplyMult: 0.96, category: "POLICY" },
      { type: "Drought Risk", desc: "Hydro dependency vulnerable to climate-driven drought cycles", severity: 4, prob: 0.55, costMult: 1.08, supplyMult: 0.90, category: "INFRA" },
    ],
  },
  Netherlands: {
    score: 1.5,
    factors: [
      { type: "Gas Field Closure", desc: "Groningen gas field closure due to earthquake risk reducing domestic supply", severity: 3, prob: 0.90, costMult: 1.06, supplyMult: 0.92, category: "INFRA" },
    ],
  },
  Spain: {
    score: 2.0,
    factors: [
      { type: "Algeria Gas Dispute", desc: "Political tensions with Algeria affecting pipeline gas imports", severity: 3, prob: 0.55, costMult: 1.06, supplyMult: 0.94, category: "TRADE" },
      { type: "Renewable Integration", desc: "Rapid renewable growth requiring grid infrastructure upgrades", severity: 2, prob: 0.70, costMult: 1.03, supplyMult: 0.97, category: "POLICY" },
    ],
  },
  Qatar: {
    score: 2.8,
    factors: [
      { type: "LNG Market Power", desc: "Dominant LNG position creating pricing leverage and contractual risks", severity: 3, prob: 0.60, costMult: 1.06, supplyMult: 0.94, category: "TRADE" },
      { type: "Gulf Stability", desc: "Regional Gulf tensions periodically affecting energy shipping lanes", severity: 4, prob: 0.45, costMult: 1.10, supplyMult: 0.90, category: "CONFLICT" },
    ],
  },
  Germany: {
    score: 2.2,
    factors: [
      { type: "Russian Gas Dependency Legacy", desc: "Post-Nord Stream supply shock still reverberating through energy markets", severity: 4, prob: 0.70, costMult: 1.12, supplyMult: 0.90, category: "INFRA" },
      { type: "Industrial Competitiveness", desc: "High energy costs threatening industrial base and economic competitiveness", severity: 4, prob: 0.85, costMult: 1.10, supplyMult: 0.92, category: "ECON" },
    ],
  },
};

// ─── Nation Energy Data (50 nations) ─────────────────────────────────────────
const NATIONS = [
  { rank: 1,  name: "China",          region: "Asia-Pacific",  baseQuads: 159.4, baseCost: 5.20, renewable: 0.18, growth: 0.032, costTrend: 0.018 },
  { rank: 2,  name: "United States",  region: "Americas",      baseQuads: 97.3,  baseCost: 6.50, renewable: 0.22, growth: 0.012, costTrend: 0.015 },
  { rank: 3,  name: "India",          region: "Asia-Pacific",  baseQuads: 35.8,  baseCost: 4.80, renewable: 0.12, growth: 0.054, costTrend: 0.022 },
  { rank: 4,  name: "Russia",         region: "Europe",        baseQuads: 32.6,  baseCost: 3.20, renewable: 0.19, growth: 0.008, costTrend: 0.035 },
  { rank: 5,  name: "Japan",          region: "Asia-Pacific",  baseQuads: 17.5,  baseCost: 9.80, renewable: 0.21, growth: -0.005, costTrend: 0.012 },
  { rank: 6,  name: "Germany",        region: "Europe",        baseQuads: 12.4,  baseCost: 12.50, renewable: 0.35, growth: -0.012, costTrend: 0.008 },
  { rank: 7,  name: "South Korea",    region: "Asia-Pacific",  baseQuads: 11.8,  baseCost: 10.20, renewable: 0.08, growth: 0.015, costTrend: 0.014 },
  { rank: 8,  name: "Canada",         region: "Americas",      baseQuads: 14.6,  baseCost: 5.40, renewable: 0.29, growth: 0.009, costTrend: 0.011 },
  { rank: 9,  name: "Brazil",         region: "Americas",      baseQuads: 12.7,  baseCost: 5.80, renewable: 0.48, growth: 0.028, costTrend: 0.016 },
  { rank: 10, name: "France",         region: "Europe",        baseQuads: 9.8,   baseCost: 11.20, renewable: 0.27, growth: -0.003, costTrend: 0.009 },
  { rank: 11, name: "Saudi Arabia",   region: "Middle East",   baseQuads: 11.4,  baseCost: 2.80, renewable: 0.02, growth: 0.025, costTrend: 0.020 },
  { rank: 12, name: "Iran",           region: "Middle East",   baseQuads: 11.8,  baseCost: 1.90, renewable: 0.04, growth: 0.031, costTrend: 0.042 },
  { rank: 13, name: "United Kingdom", region: "Europe",        baseQuads: 8.2,   baseCost: 10.80, renewable: 0.31, growth: -0.010, costTrend: 0.010 },
  { rank: 14, name: "Mexico",         region: "Americas",      baseQuads: 8.8,   baseCost: 4.60, renewable: 0.18, growth: 0.023, costTrend: 0.018 },
  { rank: 15, name: "Italy",          region: "Europe",        baseQuads: 6.9,   baseCost: 12.80, renewable: 0.34, growth: -0.008, costTrend: 0.007 },
  { rank: 16, name: "Australia",      region: "Asia-Pacific",  baseQuads: 6.1,   baseCost: 6.20, renewable: 0.19, growth: 0.018, costTrend: 0.013 },
  { rank: 17, name: "Indonesia",      region: "Asia-Pacific",  baseQuads: 8.4,   baseCost: 4.20, renewable: 0.13, growth: 0.046, costTrend: 0.021 },
  { rank: 18, name: "Turkey",         region: "Europe",        baseQuads: 6.8,   baseCost: 7.80, renewable: 0.21, growth: 0.032, costTrend: 0.048 },
  { rank: 19, name: "Poland",         region: "Europe",        baseQuads: 4.2,   baseCost: 8.40, renewable: 0.19, growth: 0.005, costTrend: 0.012 },
  { rank: 20, name: "Ukraine",        region: "Europe",        baseQuads: 2.8,   baseCost: 6.90, renewable: 0.22, growth: -0.032, costTrend: 0.065 },
  { rank: 21, name: "Netherlands",    region: "Europe",        baseQuads: 3.5,   baseCost: 11.80, renewable: 0.23, growth: -0.005, costTrend: 0.009 },
  { rank: 22, name: "Spain",          region: "Europe",        baseQuads: 4.8,   baseCost: 9.60, renewable: 0.38, growth: 0.008, costTrend: 0.008 },
  { rank: 23, name: "Argentina",      region: "Americas",      baseQuads: 3.9,   baseCost: 4.90, renewable: 0.32, growth: 0.019, costTrend: 0.022 },
  { rank: 24, name: "Thailand",       region: "Asia-Pacific",  baseQuads: 4.1,   baseCost: 5.60, renewable: 0.15, growth: 0.035, costTrend: 0.019 },
  { rank: 25, name: "Pakistan",       region: "Asia-Pacific",  baseQuads: 3.8,   baseCost: 5.10, renewable: 0.08, growth: 0.038, costTrend: 0.038 },
  { rank: 26, name: "Egypt",          region: "Africa",        baseQuads: 3.9,   baseCost: 4.30, renewable: 0.06, growth: 0.042, costTrend: 0.028 },
  { rank: 27, name: "Malaysia",       region: "Asia-Pacific",  baseQuads: 3.6,   baseCost: 4.80, renewable: 0.12, growth: 0.040, costTrend: 0.018 },
  { rank: 28, name: "Iraq",           region: "Middle East",   baseQuads: 2.5,   baseCost: 2.10, renewable: 0.03, growth: 0.052, costTrend: 0.032 },
  { rank: 29, name: "Algeria",        region: "Africa",        baseQuads: 2.4,   baseCost: 2.60, renewable: 0.02, growth: 0.038, costTrend: 0.022 },
  { rank: 30, name: "Venezuela",      region: "Americas",      baseQuads: 2.2,   baseCost: 1.80, renewable: 0.25, growth: -0.015, costTrend: 0.028 },
  { rank: 31, name: "Vietnam",        region: "Asia-Pacific",  baseQuads: 3.2,   baseCost: 4.10, renewable: 0.20, growth: 0.061, costTrend: 0.023 },
  { rank: 32, name: "Philippines",    region: "Asia-Pacific",  baseQuads: 2.1,   baseCost: 7.80, renewable: 0.22, growth: 0.048, costTrend: 0.020 },
  { rank: 33, name: "Bangladesh",     region: "Asia-Pacific",  baseQuads: 1.8,   baseCost: 5.40, renewable: 0.04, growth: 0.062, costTrend: 0.025 },
  { rank: 34, name: "Colombia",       region: "Americas",      baseQuads: 1.8,   baseCost: 5.20, renewable: 0.42, growth: 0.029, costTrend: 0.016 },
  { rank: 35, name: "South Africa",   region: "Africa",        baseQuads: 4.2,   baseCost: 6.80, renewable: 0.09, growth: 0.012, costTrend: 0.028 },
  { rank: 36, name: "Taiwan",         region: "Asia-Pacific",  baseQuads: 4.4,   baseCost: 8.90, renewable: 0.08, growth: 0.018, costTrend: 0.022 },
  { rank: 37, name: "Romania",        region: "Europe",        baseQuads: 1.5,   baseCost: 8.20, renewable: 0.28, growth: 0.008, costTrend: 0.010 },
  { rank: 38, name: "Czech Republic", region: "Europe",        baseQuads: 1.7,   baseCost: 9.40, renewable: 0.19, growth: 0.003, costTrend: 0.009 },
  { rank: 39, name: "Israel",         region: "Middle East",   baseQuads: 1.2,   baseCost: 8.70, renewable: 0.09, growth: 0.024, costTrend: 0.015 },
  { rank: 40, name: "Norway",         region: "Europe",        baseQuads: 2.2,   baseCost: 7.80, renewable: 0.75, growth: 0.003, costTrend: 0.008 },
  { rank: 41, name: "Sweden",         region: "Europe",        baseQuads: 2.0,   baseCost: 8.60, renewable: 0.58, growth: -0.002, costTrend: 0.007 },
  { rank: 42, name: "Finland",        region: "Europe",        baseQuads: 1.4,   baseCost: 9.20, renewable: 0.45, growth: -0.003, costTrend: 0.007 },
  { rank: 43, name: "Denmark",        region: "Europe",        baseQuads: 0.9,   baseCost: 10.40, renewable: 0.55, growth: -0.012, costTrend: 0.006 },
  { rank: 44, name: "Belgium",        region: "Europe",        baseQuads: 2.3,   baseCost: 11.60, renewable: 0.20, growth: -0.004, costTrend: 0.008 },
  { rank: 45, name: "Austria",        region: "Europe",        baseQuads: 1.5,   baseCost: 10.80, renewable: 0.38, growth: -0.002, costTrend: 0.007 },
  { rank: 46, name: "Switzerland",    region: "Europe",        baseQuads: 1.3,   baseCost: 9.80, renewable: 0.62, growth: 0.001, costTrend: 0.006 },
  { rank: 47, name: "Qatar",          region: "Middle East",   baseQuads: 2.8,   baseCost: 3.20, renewable: 0.01, growth: 0.028, costTrend: 0.015 },
  { rank: 48, name: "Kazakhstan",     region: "Asia-Pacific",  baseQuads: 3.1,   baseCost: 3.60, renewable: 0.07, growth: 0.021, costTrend: 0.025 },
  { rank: 49, name: "Uzbekistan",     region: "Asia-Pacific",  baseQuads: 1.7,   baseCost: 2.80, renewable: 0.08, growth: 0.036, costTrend: 0.022 },
  { rank: 50, name: "Nigeria",        region: "Africa",        baseQuads: 2.6,   baseCost: 3.90, renewable: 0.07, growth: 0.049, costTrend: 0.028 },
];

const RISK_FILTERS = [
  { id: "ALL",      label: "All Nations" },
  { id: "HIGH",     label: "High Risk (6+)" },
  { id: "CONFLICT", label: "Conflict Zones" },
  { id: "TRADE",    label: "Trade Disputes" },
  { id: "SANCTION", label: "Sanctions Regimes" },
  { id: "POLICY",   label: "Policy Risk" },
];

const SORT_OPTIONS = [
  { id: "RISK",   label: "Risk Score" },
  { id: "QUADS",  label: "Projected Quads" },
  { id: "COST",   label: "Projected Cost" },
  { id: "GEO",    label: "Geo Cost Impact" },
  { id: "RANK",   label: "Original Rank" },
];

const VIEWS = ["OVERVIEW", "PREDICTIVE", "GLOBAL", "GEO RISK"];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getRiskColor(score) {
  if (score >= 7.5) return COLORS.red;
  if (score >= 5.0) return COLORS.orange;
  if (score >= 3.0) return COLORS.blue;
  return COLORS.green;
}

function getRiskLevel(score) {
  if (score >= 7.5) return "CRITICAL";
  if (score >= 5.0) return "HIGH";
  if (score >= 3.0) return "ELEVATED";
  return "STABLE";
}

function getGeoProfile(name) {
  return GEO_RISKS[name] || null;
}

function calcGeoMultipliers(name) {
  const profile = getGeoProfile(name);
  if (!profile) return { costMult: 1.0, supplyMult: 1.0 };
  const factors = profile.factors;
  const totalWeight = factors.reduce((s, f) => s + f.severity * f.prob, 0);
  if (totalWeight === 0) return { costMult: 1.0, supplyMult: 1.0 };
  const costMult = factors.reduce((s, f) => s + f.costMult * (f.severity * f.prob), 0) / totalWeight;
  const supplyMult = factors.reduce((s, f) => s + f.supplyMult * (f.severity * f.prob), 0) / totalWeight;
  return { costMult, supplyMult };
}

function projectNation(nation, yearOffset) {
  const { costMult, supplyMult } = calcGeoMultipliers(nation.name);
  const growthFactor = Math.pow(1 + nation.growth, yearOffset);
  const renewableDiscount = 1 - nation.renewable * 0.05 * yearOffset;
  const supplyDampen = 1 - (1 - supplyMult) * Math.min(yearOffset / 5, 1);
  const projectedQuads = nation.baseQuads * growthFactor * renewableDiscount * supplyDampen;
  const projectedCostPerUnit = nation.baseCost * Math.pow(1 + nation.costTrend, yearOffset) * costMult;
  const projectedTotalCost = projectedQuads * projectedCostPerUnit * 1e15 / 1e12;
  return {
    quads: Math.max(0, projectedQuads),
    costPerUnit: projectedCostPerUnit,
    totalCostB: Math.max(0, projectedTotalCost),
    geoCostPct: ((costMult - 1) * 100).toFixed(1),
    costMult,
    supplyMult,
  };
}

// ─── RiskMeter Component ──────────────────────────────────────────────────────
function RiskMeter({ score, size = 60 }) {
  const pct = Math.min(score / 10, 1);
  const r = (size / 2) * 0.72;
  const cx = size / 2;
  const cy = size / 2 + size * 0.08;
  const startAngle = -Math.PI * 0.85;
  const endAngle = Math.PI * 0.85;
  const sweepAngle = endAngle - startAngle;
  const arcAngle = startAngle + sweepAngle * pct;
  const color = getRiskColor(score);

  const describeArc = (from, to) => {
    const x1 = cx + r * Math.cos(from);
    const y1 = cy + r * Math.sin(from);
    const x2 = cx + r * Math.cos(to);
    const y2 = cy + r * Math.sin(to);
    const large = to - from > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleX = cx + (r * 0.78) * Math.cos(arcAngle);
  const needleY = cy + (r * 0.78) * Math.sin(arcAngle);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={describeArc(startAngle, endAngle)} fill="none" stroke="#1e293b" strokeWidth={size * 0.08} strokeLinecap="round" />
      <path d={describeArc(startAngle, arcAngle)} fill="none" stroke={color} strokeWidth={size * 0.08} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={size * 0.04} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} />
      <text x={cx} y={cy + r * 0.42} textAnchor="middle" fill={color} fontSize={size * 0.18} fontFamily="monospace" fontWeight="bold">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

// ─── RiskTag Component ────────────────────────────────────────────────────────
function RiskTag({ category, small }) {
  const tc = TAG_COLORS[category] || TAG_COLORS.STABLE;
  return (
    <span style={{
      display: "inline-block",
      background: tc.bg,
      color: tc.text,
      border: `1px solid ${tc.border}`,
      borderRadius: 3,
      padding: small ? "1px 5px" : "2px 7px",
      fontSize: small ? 9 : 10,
      fontFamily: "monospace",
      fontWeight: 600,
      letterSpacing: "0.04em",
      marginRight: 3,
    }}>
      {category}
    </span>
  );
}

// ─── Main EnergyModel Component ───────────────────────────────────────────────
export default function EnergyModel() {
  const [view, setView] = useState("OVERVIEW");
  const [selectedNation, setSelectedNation] = useState(null);
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("RISK");
  const [projYear, setProjYear] = useState(2029);

  const BASE_YEAR = 2024;

  // Enrich nations with geo risk and projections
  const enrichedNations = useMemo(() => {
    return NATIONS.map((n) => {
      const geo = getGeoProfile(n.name);
      const riskScore = geo ? geo.score : 0;
      const yearOffset = projYear - BASE_YEAR;
      const proj = projectNation(n, yearOffset);
      const { costMult } = calcGeoMultipliers(n.name);
      return {
        ...n,
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        geoProfile: geo,
        proj,
        geoCostPct: parseFloat(((costMult - 1) * 100).toFixed(1)),
        topCategories: geo ? [...new Set(geo.factors.map((f) => f.category))].slice(0, 3) : [],
      };
    });
  }, [projYear]);

  // Summary stats
  const avgRisk = useMemo(() => {
    const withRisk = enrichedNations.filter((n) => n.riskScore > 0);
    return withRisk.length ? (withRisk.reduce((s, n) => s + n.riskScore, 0) / withRisk.length).toFixed(2) : "0.00";
  }, [enrichedNations]);

  const highRiskCount = useMemo(() => enrichedNations.filter((n) => n.riskScore >= 6).length, [enrichedNations]);

  // Filter
  const filtered = useMemo(() => {
    return enrichedNations.filter((n) => {
      if (riskFilter === "ALL") return true;
      if (riskFilter === "HIGH") return n.riskScore >= 6;
      if (!n.geoProfile) return false;
      const cats = n.geoProfile.factors.map((f) => f.category);
      if (riskFilter === "CONFLICT") return cats.includes("CONFLICT");
      if (riskFilter === "TRADE") return cats.includes("TRADE");
      if (riskFilter === "SANCTION") return cats.includes("SANCTION");
      if (riskFilter === "POLICY") return cats.includes("POLICY");
      return true;
    });
  }, [enrichedNations, riskFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "RISK") return b.riskScore - a.riskScore;
      if (sortBy === "QUADS") return b.proj.quads - a.proj.quads;
      if (sortBy === "COST") return b.proj.totalCostB - a.proj.totalCostB;
      if (sortBy === "GEO") return b.geoCostPct - a.geoCostPct;
      return a.rank - b.rank;
    });
  }, [filtered, sortBy]);

  const styles = {
    root: { background: COLORS.bg, minHeight: "100vh", fontFamily: "monospace", color: COLORS.text, padding: "16px" },
    header: { background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 16 },
    card: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "12px 16px" },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 },
    viewBtn: (active) => ({
      background: active ? COLORS.accent : "transparent",
      color: active ? "#000" : COLORS.textMuted,
      border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
      borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: 600,
    }),
    filterBtn: (active) => ({
      background: active ? "#1e3a5f" : "transparent",
      color: active ? COLORS.blue : COLORS.textMuted,
      border: `1px solid ${active ? COLORS.blue : COLORS.border}`,
      borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
    }),
    sortBtn: (active) => ({
      background: active ? "#1a2332" : "transparent",
      color: active ? COLORS.accentAlt : COLORS.textDim,
      border: `1px solid ${active ? COLORS.accentAlt : COLORS.border}`,
      borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
    }),
    tableRow: (selected) => ({
      display: "grid", gridTemplateColumns: view === "GEO RISK" ? "34px 140px 80px 120px 80px 90px" : "34px 140px 90px 90px 90px",
      gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}`,
      background: selected ? COLORS.surfaceHover : "transparent", alignItems: "center",
    }),
    tableHead: {
      display: "grid", gridTemplateColumns: view === "GEO RISK" ? "34px 140px 80px 120px 80px 90px" : "34px 140px 90px 90px 90px",
      gap: 8, padding: "6px 12px", borderBottom: `1px solid ${COLORS.border}`,
      fontSize: 9, color: COLORS.textDim, letterSpacing: "0.08em",
    },
  };

  const fmt = (v, d = 1) => Number(v).toFixed(d);

  // ── Render Summary Cards ──
  const renderCards = () => (
    <div style={styles.grid4}>
      {[
        { label: "TOTAL NATIONS", value: NATIONS.length, sub: "tracked" },
        { label: "AVG GEO RISK", value: avgRisk, sub: "composite score", color: getRiskColor(parseFloat(avgRisk)) },
        { label: "HIGH RISK NATIONS", value: highRiskCount, sub: "risk ≥ 6.0", color: COLORS.red },
        { label: "RISK PROFILES", value: Object.keys(GEO_RISKS).length, sub: "detailed assessments", color: COLORS.purple },
      ].map(({ label, value, sub, color }) => (
        <div key={label} style={styles.card}>
          <div style={{ fontSize: 9, color: COLORS.textDim, letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: color || COLORS.accent }}>{value}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted }}>{sub}</div>
        </div>
      ))}
    </div>
  );

  // ── Render Nation Table ──
  const renderTable = () => (
    <div style={{ ...styles.card, overflow: "hidden" }}>
      <div style={{ ...styles.tableHead }}>
        <span>#</span>
        <span>NATION</span>
        {view === "GEO RISK" ? (
          <>
            <span>RISK SCORE</span>
            <span>RISK FACTORS</span>
            <span>PROJ QUADS</span>
            <span>GEO COST Δ%</span>
          </>
        ) : (
          <>
            <span>PROJ QUADS</span>
            <span>COST/MMBTU</span>
            <span>TOTAL $B</span>
          </>
        )}
      </div>
      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        {sorted.map((n) => (
          <div
            key={n.name}
            style={styles.tableRow(selectedNation?.name === n.name)}
            onClick={() => setSelectedNation(selectedNation?.name === n.name ? null : n)}
          >
            <span style={{ color: COLORS.textDim, fontSize: 11 }}>{n.rank}</span>
            <span style={{ fontSize: 11, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
            {view === "GEO RISK" ? (
              <>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <RiskMeter score={n.riskScore} size={32} />
                </span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {n.topCategories.map((c) => <RiskTag key={c} category={c} small />)}
                </span>
                <span style={{ fontSize: 11, color: COLORS.accentAlt }}>{fmt(n.proj.quads)}</span>
                <span style={{ fontSize: 11, color: n.geoCostPct > 5 ? COLORS.red : n.geoCostPct > 2 ? COLORS.orange : COLORS.green }}>
                  +{fmt(n.geoCostPct)}%
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 11, color: COLORS.accentAlt }}>{fmt(n.proj.quads)}</span>
                <span style={{ fontSize: 11, color: COLORS.orange }}>${fmt(n.proj.costPerUnit, 2)}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>${fmt(n.proj.totalCostB, 0)}B</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render Detail Panel ──
  const renderDetail = () => {
    if (!selectedNation) {
      return (
        <div style={{ ...styles.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, color: COLORS.textDim }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌍</div>
          <div style={{ fontSize: 12 }}>Select a nation to view details</div>
        </div>
      );
    }
    const n = selectedNation;
    const geo = n.geoProfile;
    return (
      <div style={{ ...styles.card, overflowY: "auto", maxHeight: 520 }}>
        <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {geo && <RiskMeter score={geo.score} size={72} />}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{n.name}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{n.region} · Rank #{n.rank}</div>
              {geo && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: getRiskColor(geo.score), fontWeight: 700 }}>
                    {getRiskLevel(geo.score)}
                  </span>
                  <span style={{ fontSize: 10, color: COLORS.textDim }}>GEO RISK</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projection Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { label: `PROJ QUADS (${projYear})`, value: `${fmt(n.proj.quads)} Q`, color: COLORS.accentAlt },
            { label: "COST/MMBTU", value: `$${fmt(n.proj.costPerUnit, 2)}`, color: COLORS.orange },
            { label: "TOTAL COST", value: `$${fmt(n.proj.totalCostB, 0)}B`, color: COLORS.text },
            { label: "GEO COST PREMIUM", value: `+${fmt(n.geoCostPct)}%`, color: n.geoCostPct > 5 ? COLORS.red : COLORS.orange },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: COLORS.surfaceAlt, borderRadius: 4, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: COLORS.textDim, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Risk Factors */}
        {geo && (
          <div>
            <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "0.08em", marginBottom: 8 }}>RISK FACTORS</div>
            {geo.factors.map((f, i) => (
              <div key={i} style={{ background: COLORS.surfaceAlt, borderRadius: 4, padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${TAG_COLORS[f.category]?.border || "#444"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.text }}>{f.type}</span>
                  <RiskTag category={f.category} small />
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, lineHeight: 1.4 }}>{f.desc}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                  {[
                    { label: "SEV", value: `${f.severity}/10`, color: getRiskColor(f.severity) },
                    { label: "PROB", value: `${(f.prob * 100).toFixed(0)}%`, color: COLORS.orange },
                    { label: "COST Δ", value: `+${((f.costMult - 1) * 100).toFixed(0)}%`, color: COLORS.red },
                    { label: "SUPPLY", value: `${(f.supplyMult * 100).toFixed(0)}%`, color: f.supplyMult < 0.85 ? COLORS.red : COLORS.textMuted },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: "center", background: COLORS.bg, borderRadius: 3, padding: "4px 0" }}>
                      <div style={{ fontSize: 8, color: COLORS.textDim }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Base Stats */}
        <div style={{ marginTop: 12, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 8 }}>BASE PARAMETERS ({BASE_YEAR})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "Base Quads", value: `${n.baseQuads} Q` },
              { label: "Base Cost", value: `$${n.baseCost}/MMBTU` },
              { label: "Renewable Share", value: `${(n.renewable * 100).toFixed(0)}%` },
              { label: "Growth Trend", value: `${(n.growth * 100).toFixed(1)}%/yr` },
            ].map(({ label, value }) => (
              <div key={label} style={{ fontSize: 10 }}>
                <span style={{ color: COLORS.textDim }}>{label}: </span>
                <span style={{ color: COLORS.text }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── GEO RISK View: Risk Factor Detail Cards ──
  const renderGeoRiskView = () => {
    const riskSorted = [...enrichedNations]
      .filter((n) => n.riskScore > 0)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 12);

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
          {riskSorted.map((n) => (
            <div
              key={n.name}
              onClick={() => setSelectedNation(n)}
              style={{
                ...styles.card,
                cursor: "pointer",
                borderLeft: `3px solid ${getRiskColor(n.riskScore)}`,
                background: selectedNation?.name === n.name ? COLORS.surfaceHover : COLORS.surface,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{n.name}</div>
                  <div style={{ fontSize: 9, color: COLORS.textDim }}>{n.region}</div>
                </div>
                <RiskMeter score={n.riskScore} size={48} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
                {n.topCategories.map((c) => <RiskTag key={c} category={c} small />)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: COLORS.textDim }}>Cost Premium:</span>
                <span style={{ color: n.geoCostPct > 10 ? COLORS.red : COLORS.orange, fontWeight: 700 }}>+{fmt(n.geoCostPct)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 2 }}>
                <span style={{ color: COLORS.textDim }}>Proj Quads ({projYear}):</span>
                <span style={{ color: COLORS.accentAlt }}>{fmt(n.proj.quads)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent, letterSpacing: "0.05em" }}>
              ⚡ PREDICTIVE EFFICIENCY ENGINE
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>
              Global Energy Consumption Model with Geopolitical Risk Overlay · {BASE_YEAR}–{projYear}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {VIEWS.map((v) => (
              <button key={v} style={styles.viewBtn(view === v)} onClick={() => setView(v)}>
                {v === "GEO RISK" ? "🌐 " : ""}{v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {renderCards()}

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RISK_FILTERS.map(({ id, label }) => (
            <button key={id} style={styles.filterBtn(riskFilter === id)} onClick={() => setRiskFilter(id)}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: COLORS.textDim }}>SORT:</span>
          {SORT_OPTIONS.map(({ id, label }) => (
            <button key={id} style={styles.sortBtn(sortBy === id)} onClick={() => setSortBy(id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Projection Year Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 10, color: COLORS.textDim }}>PROJECTION YEAR:</span>
        {[2025, 2026, 2027, 2028, 2029].map((yr) => (
          <button
            key={yr}
            onClick={() => setProjYear(yr)}
            style={{
              background: projYear === yr ? COLORS.surfaceAlt : "transparent",
              color: projYear === yr ? COLORS.text : COLORS.textDim,
              border: `1px solid ${projYear === yr ? COLORS.border : "transparent"}`,
              borderRadius: 3, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontFamily: "monospace",
            }}
          >
            {yr}
          </button>
        ))}
      </div>

      {/* GEO RISK View */}
      {view === "GEO RISK" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12, letterSpacing: "0.06em" }}>
            TOP RISK NATIONS — GEOPOLITICAL ASSESSMENT DASHBOARD
          </div>
          {renderGeoRiskView()}
        </div>
      )}

      {/* Main Grid: Table + Detail */}
      <div style={styles.grid2}>
        <div>
          {view !== "GEO RISK" && (
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, letterSpacing: "0.06em" }}>
              {sorted.length} NATIONS · {view} VIEW · SORTED BY {SORT_OPTIONS.find((s) => s.id === sortBy)?.label.toUpperCase()}
            </div>
          )}
          {renderTable()}
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, letterSpacing: "0.06em" }}>
            {selectedNation ? "NATION DETAIL" : "SELECT A NATION"}
          </div>
          {renderDetail()}
        </div>
      </div>
    </div>
  );
}
