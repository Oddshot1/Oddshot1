// ODDSHOT Mock Data - 30+ markets across categories

import type { Market, Signal, EdgeRow, Position, Candle } from "./types";

const now = new Date();
const addHours = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const addMinutes = (minutes: number) => new Date(now.getTime() + minutes * 60 * 1000).toISOString();
const subtractMinutes = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const mockMarkets: Market[] = [
  // Sports
  {
    id: "mkt-001",
    title: "Lakers vs Celtics - Lakers Win",
    category: "Sports",
    expiresAt: addHours(4),
    yesProb: 0.42,
    noProb: 0.58,
    change15m: 0.02,
    change1h: 0.05,
    change24h: -0.03,
    volume1h: 45000,
    volume24h: 320000,
    liquidityLabel: "High",
    qualityScore: 92,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Lakers win the game",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "sport-team" }
  },
  {
    id: "mkt-002",
    title: "Super Bowl LVIX - Chiefs Win",
    category: "Sports",
    expiresAt: addHours(720),
    yesProb: 0.28,
    noProb: 0.72,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.02,
    volume1h: 12000,
    volume24h: 890000,
    liquidityLabel: "High",
    qualityScore: 95,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Chiefs win Super Bowl",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "sport-league" }
  },
  {
    id: "mkt-003",
    title: "Man City vs Arsenal - Over 2.5 Goals",
    category: "Sports",
    expiresAt: addHours(26),
    yesProb: 0.61,
    noProb: 0.39,
    change15m: -0.01,
    change1h: 0.03,
    change24h: 0.08,
    volume1h: 28000,
    volume24h: 156000,
    liquidityLabel: "High",
    qualityScore: 88,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if total goals > 2",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "sport-team" }
  },
  // Crypto
  {
    id: "mkt-004",
    title: "BTC above $150k by Dec 31",
    category: "Crypto",
    expiresAt: addHours(168),
    yesProb: 0.35,
    noProb: 0.65,
    change15m: 0.01,
    change1h: 0.02,
    change24h: 0.12,
    volume1h: 89000,
    volume24h: 1200000,
    liquidityLabel: "High",
    qualityScore: 97,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if BTC spot price >= $150,000 on Dec 31",
    lastUpdatedAt: subtractMinutes(0.5),
    thumbnail: { type: "crypto" }
  },
  {
    id: "mkt-005",
    title: "ETH flips BTC market cap in 2025",
    category: "Crypto",
    expiresAt: addHours(4320),
    yesProb: 0.08,
    noProb: 0.92,
    change15m: 0.00,
    change1h: -0.01,
    change24h: -0.02,
    volume1h: 15000,
    volume24h: 230000,
    liquidityLabel: "Med",
    qualityScore: 85,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if ETH mcap > BTC mcap any time in 2025",
    lastUpdatedAt: subtractMinutes(3),
    thumbnail: { type: "crypto" }
  },
  {
    id: "mkt-006",
    title: "Solana ATH before ETH ATH",
    category: "Crypto",
    expiresAt: addHours(720),
    yesProb: 0.67,
    noProb: 0.33,
    change15m: 0.03,
    change1h: 0.08,
    change24h: 0.15,
    volume1h: 67000,
    volume24h: 450000,
    liquidityLabel: "High",
    qualityScore: 91,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if SOL hits new ATH before ETH",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "crypto" }
  },
  // Politics
  {
    id: "mkt-007",
    title: "Trump wins 2028 Republican Primary",
    category: "Politics",
    expiresAt: addHours(8760),
    yesProb: 0.15,
    noProb: 0.85,
    change15m: 0.00,
    change1h: 0.00,
    change24h: -0.01,
    volume1h: 8000,
    volume24h: 120000,
    liquidityLabel: "Med",
    qualityScore: 82,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Trump wins GOP primary",
    lastUpdatedAt: subtractMinutes(5),
    thumbnail: { type: "politics" }
  },
  {
    id: "mkt-008",
    title: "Fed cuts rates in January 2025",
    category: "Politics",
    expiresAt: addHours(720),
    yesProb: 0.22,
    noProb: 0.78,
    change15m: -0.02,
    change1h: -0.05,
    change24h: -0.08,
    volume1h: 34000,
    volume24h: 280000,
    liquidityLabel: "High",
    qualityScore: 94,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if FOMC cuts rates at Jan meeting",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "macro" }
  },
  {
    id: "mkt-009",
    title: "California Governor Recall 2025",
    category: "Politics",
    expiresAt: addHours(2160),
    yesProb: 0.31,
    noProb: 0.69,
    change15m: 0.01,
    change1h: 0.02,
    change24h: 0.04,
    volume1h: 12000,
    volume24h: 89000,
    liquidityLabel: "Med",
    qualityScore: 78,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if recall succeeds",
    lastUpdatedAt: subtractMinutes(4),
    thumbnail: { type: "politics" }
  },
  // Culture
  {
    id: "mkt-010",
    title: "Taylor Swift announces new album Q1 2025",
    category: "Culture",
    expiresAt: addHours(1440),
    yesProb: 0.55,
    noProb: 0.45,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.03,
    volume1h: 18000,
    volume24h: 145000,
    liquidityLabel: "Med",
    qualityScore: 80,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if official announcement in Q1",
    lastUpdatedAt: subtractMinutes(3),
    thumbnail: { type: "culture" }
  },
  {
    id: "mkt-011",
    title: "Oscar Best Picture - Wicked",
    category: "Culture",
    expiresAt: addHours(1800),
    yesProb: 0.18,
    noProb: 0.82,
    change15m: 0.02,
    change1h: 0.04,
    change24h: 0.06,
    volume1h: 22000,
    volume24h: 178000,
    liquidityLabel: "Med",
    qualityScore: 83,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Wicked wins Best Picture",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "culture" }
  },
  // Macro
  {
    id: "mkt-012",
    title: "S&P 500 above 6000 EOY 2025",
    category: "Macro",
    expiresAt: addHours(4320),
    yesProb: 0.72,
    noProb: 0.28,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.02,
    volume1h: 45000,
    volume24h: 560000,
    liquidityLabel: "High",
    qualityScore: 96,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if S&P 500 >= 6000 on Dec 31",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "macro" }
  },
  {
    id: "mkt-013",
    title: "US Recession officially declared 2025",
    category: "Macro",
    expiresAt: addHours(8760),
    yesProb: 0.25,
    noProb: 0.75,
    change15m: 0.00,
    change1h: -0.01,
    change24h: -0.02,
    volume1h: 28000,
    volume24h: 340000,
    liquidityLabel: "High",
    qualityScore: 93,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if NBER declares recession in 2025",
    lastUpdatedAt: subtractMinutes(3),
    thumbnail: { type: "macro" }
  },
  // More Sports
  {
    id: "mkt-014",
    title: "Warriors make NBA Finals 2025",
    category: "Sports",
    expiresAt: addHours(3600),
    yesProb: 0.19,
    noProb: 0.81,
    change15m: 0.01,
    change1h: 0.02,
    change24h: 0.05,
    volume1h: 15000,
    volume24h: 120000,
    liquidityLabel: "Med",
    qualityScore: 84,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Warriors reach Finals",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "sport-team" }
  },
  {
    id: "mkt-015",
    title: "Djokovic wins Australian Open 2025",
    category: "Sports",
    expiresAt: addHours(720),
    yesProb: 0.33,
    noProb: 0.67,
    change15m: -0.01,
    change1h: -0.02,
    change24h: -0.04,
    volume1h: 25000,
    volume24h: 210000,
    liquidityLabel: "High",
    qualityScore: 90,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Djokovic wins",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "sport-team" }
  },
  // More Crypto
  {
    id: "mkt-016",
    title: "XRP above $5 by March 2025",
    category: "Crypto",
    expiresAt: addHours(2160),
    yesProb: 0.28,
    noProb: 0.72,
    change15m: 0.02,
    change1h: 0.05,
    change24h: 0.12,
    volume1h: 52000,
    volume24h: 380000,
    liquidityLabel: "High",
    qualityScore: 87,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if XRP >= $5",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "crypto" }
  },
  {
    id: "mkt-017",
    title: "Bitcoin ETF daily inflow > $1B in Jan",
    category: "Crypto",
    expiresAt: addHours(720),
    yesProb: 0.58,
    noProb: 0.42,
    change15m: 0.01,
    change1h: 0.03,
    change24h: 0.08,
    volume1h: 78000,
    volume24h: 620000,
    liquidityLabel: "High",
    qualityScore: 94,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if any single day > $1B inflow",
    lastUpdatedAt: subtractMinutes(0.5),
    thumbnail: { type: "crypto" }
  },
  // More Politics
  {
    id: "mkt-018",
    title: "UK General Election before 2026",
    category: "Politics",
    expiresAt: addHours(8760),
    yesProb: 0.12,
    noProb: 0.88,
    change15m: 0.00,
    change1h: 0.00,
    change24h: 0.01,
    volume1h: 8000,
    volume24h: 95000,
    liquidityLabel: "Med",
    qualityScore: 79,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if election held before Jan 1 2026",
    lastUpdatedAt: subtractMinutes(6),
    thumbnail: { type: "politics" }
  },
  {
    id: "mkt-019",
    title: "TikTok banned in US by July 2025",
    category: "Politics",
    expiresAt: addHours(4320),
    yesProb: 0.45,
    noProb: 0.55,
    change15m: -0.01,
    change1h: -0.03,
    change24h: -0.06,
    volume1h: 42000,
    volume24h: 520000,
    liquidityLabel: "High",
    qualityScore: 91,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if TikTok unavailable in US",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "politics" }
  },
  // More Culture
  {
    id: "mkt-020",
    title: "GTA 6 releases in 2025",
    category: "Culture",
    expiresAt: addHours(8760),
    yesProb: 0.78,
    noProb: 0.22,
    change15m: 0.00,
    change1h: 0.00,
    change24h: -0.02,
    volume1h: 35000,
    volume24h: 420000,
    liquidityLabel: "High",
    qualityScore: 89,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if GTA 6 ships in 2025",
    lastUpdatedAt: subtractMinutes(4),
    thumbnail: { type: "culture" }
  },
  // Near expiry - movers
  {
    id: "mkt-021",
    title: "Bitcoin above $100k in next 4 hours",
    category: "Crypto",
    expiresAt: addHours(4),
    yesProb: 0.68,
    noProb: 0.32,
    change15m: 0.05,
    change1h: 0.12,
    change24h: 0.18,
    volume1h: 156000,
    volume24h: 890000,
    liquidityLabel: "High",
    qualityScore: 98,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if BTC >= $100,000",
    lastUpdatedAt: subtractMinutes(0.2),
    thumbnail: { type: "crypto" }
  },
  {
    id: "mkt-022",
    title: "Eagles vs Cowboys - Eagles cover -3.5",
    category: "Sports",
    expiresAt: addMinutes(90),
    yesProb: 0.52,
    noProb: 0.48,
    change15m: 0.04,
    change1h: 0.08,
    change24h: 0.06,
    volume1h: 89000,
    volume24h: 450000,
    liquidityLabel: "High",
    qualityScore: 95,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Eagles win by 4+",
    lastUpdatedAt: subtractMinutes(0.3),
    thumbnail: { type: "sport-team" }
  },
  // Split crowd
  {
    id: "mkt-023",
    title: "Apple announces AI hardware Q1 2025",
    category: "Culture",
    expiresAt: addHours(1440),
    yesProb: 0.51,
    noProb: 0.49,
    change15m: 0.00,
    change1h: 0.01,
    change24h: -0.01,
    volume1h: 28000,
    volume24h: 340000,
    liquidityLabel: "High",
    qualityScore: 86,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Apple announces dedicated AI device",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "culture" }
  },
  {
    id: "mkt-024",
    title: "First Mars landing 2025",
    category: "Culture",
    expiresAt: addHours(8760),
    yesProb: 0.05,
    noProb: 0.95,
    change15m: 0.00,
    change1h: 0.00,
    change24h: 0.00,
    volume1h: 5000,
    volume24h: 45000,
    liquidityLabel: "Low",
    qualityScore: 72,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if any crewed Mars landing in 2025",
    lastUpdatedAt: subtractMinutes(10),
    thumbnail: { type: "culture" }
  },
  {
    id: "mkt-025",
    title: "Euro/USD above 1.10 by Feb 2025",
    category: "Macro",
    expiresAt: addHours(1080),
    yesProb: 0.38,
    noProb: 0.62,
    change15m: -0.01,
    change1h: -0.02,
    change24h: -0.04,
    volume1h: 32000,
    volume24h: 280000,
    liquidityLabel: "High",
    qualityScore: 92,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if EUR/USD >= 1.10",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "macro" }
  },
  // New markets
  {
    id: "mkt-026",
    title: "OpenAI IPO announced 2025",
    category: "Culture",
    expiresAt: addHours(8760),
    yesProb: 0.42,
    noProb: 0.58,
    change15m: 0.01,
    change1h: 0.02,
    change24h: 0.05,
    volume1h: 45000,
    volume24h: 380000,
    liquidityLabel: "High",
    qualityScore: 88,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if OpenAI announces IPO plans",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "culture" }
  },
  {
    id: "mkt-027",
    title: "Japan raises interest rates Q1 2025",
    category: "Macro",
    expiresAt: addHours(1440),
    yesProb: 0.62,
    noProb: 0.38,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.03,
    volume1h: 22000,
    volume24h: 195000,
    liquidityLabel: "Med",
    qualityScore: 90,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if BoJ raises rates in Q1",
    lastUpdatedAt: subtractMinutes(2),
    thumbnail: { type: "macro" }
  },
  {
    id: "mkt-028",
    title: "Mavericks win NBA Championship 2025",
    category: "Sports",
    expiresAt: addHours(4320),
    yesProb: 0.14,
    noProb: 0.86,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.02,
    volume1h: 18000,
    volume24h: 165000,
    liquidityLabel: "Med",
    qualityScore: 85,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if Mavericks win title",
    lastUpdatedAt: subtractMinutes(3),
    thumbnail: { type: "sport-team" }
  },
  {
    id: "mkt-029",
    title: "Dogecoin above $1 in 2025",
    category: "Crypto",
    expiresAt: addHours(8760),
    yesProb: 0.22,
    noProb: 0.78,
    change15m: 0.01,
    change1h: 0.03,
    change24h: 0.08,
    volume1h: 68000,
    volume24h: 520000,
    liquidityLabel: "High",
    qualityScore: 86,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if DOGE >= $1.00",
    lastUpdatedAt: subtractMinutes(1),
    thumbnail: { type: "crypto" }
  },
  {
    id: "mkt-030",
    title: "Netflix stock above $1000 EOY 2025",
    category: "Macro",
    expiresAt: addHours(8760),
    yesProb: 0.35,
    noProb: 0.65,
    change15m: 0.00,
    change1h: 0.01,
    change24h: 0.02,
    volume1h: 15000,
    volume24h: 125000,
    liquidityLabel: "Med",
    qualityScore: 83,
    isInitialized: true,
    sourceLabel: "Polymarket",
    resolutionRuleShort: "Resolves YES if NFLX >= $1000",
    lastUpdatedAt: subtractMinutes(4),
    thumbnail: { type: "macro" }
  }
];

export const mockSignals: Signal[] = [
  {
    id: "sig-001",
    marketId: "mkt-021",
    type: "FLOW_SPIKE",
    timeframe: "1h",
    severity: "High",
    headline: "Massive YES flow on BTC $100k",
    whyBullets: [
      "$156k volume in last hour, 3x normal",
      "Large limit orders stacking at 65-68¢"
    ],
    suggestedAction: "BUY_YES",
    invalidation: "If BTC drops below $98k",
    confidence: "High",
    source: "Polymarket CLOB",
    sourceUpdatedAt: subtractMinutes(2)
  },
  {
    id: "sig-002",
    marketId: "mkt-006",
    type: "ODDS_JUMP",
    timeframe: "1h",
    severity: "High",
    headline: "SOL ATH market jumping +8%",
    whyBullets: [
      "SOL broke $260 resistance, momentum building",
      "ETH struggling at $4k, correlation diverging"
    ],
    suggestedAction: "BUY_YES",
    invalidation: "If SOL drops below $250",
    confidence: "Med",
    source: "Price action + orderbook",
    sourceUpdatedAt: subtractMinutes(5)
  },
  {
    id: "sig-003",
    marketId: "mkt-022",
    type: "LATE_SWING",
    timeframe: "15m",
    severity: "High",
    headline: "Eagles spread moving late",
    whyBullets: [
      "Sharp money coming in on Eagles -3.5",
      "90 minutes to kickoff, line movement accelerating"
    ],
    suggestedAction: "BUY_YES",
    invalidation: "If line moves back to -3",
    confidence: "High",
    source: "Sportsbook consensus",
    sourceUpdatedAt: subtractMinutes(1)
  },
  {
    id: "sig-004",
    marketId: "mkt-008",
    type: "ODDS_JUMP",
    timeframe: "24h",
    severity: "Med",
    headline: "Fed cut odds dropping sharply",
    whyBullets: [
      "Jobs report stronger than expected",
      "Inflation expectations ticking up"
    ],
    suggestedAction: "BUY_NO",
    invalidation: "If CPI comes in soft",
    confidence: "Med",
    source: "Fed funds futures",
    sourceUpdatedAt: subtractMinutes(30)
  },
  {
    id: "sig-005",
    marketId: "mkt-023",
    type: "SPLIT_CROWD",
    timeframe: "24h",
    severity: "Med",
    headline: "Apple AI hardware - perfect 50/50 split",
    whyBullets: [
      "Market hovering at 51% for days",
      "High volume but no directional conviction"
    ],
    suggestedAction: "WAIT",
    invalidation: "Wait for news catalyst",
    confidence: "Low",
    source: "Orderbook analysis",
    sourceUpdatedAt: subtractMinutes(10)
  },
  {
    id: "sig-006",
    marketId: "mkt-004",
    type: "FLOW_SPIKE",
    timeframe: "24h",
    severity: "High",
    headline: "BTC $150k seeing renewed interest",
    whyBullets: [
      "Whale wallet accumulated 500 BTC today",
      "Options market pricing higher probability"
    ],
    suggestedAction: "BUY_YES",
    invalidation: "If BTC drops below $95k",
    confidence: "Med",
    source: "On-chain + derivatives",
    sourceUpdatedAt: subtractMinutes(15)
  }
];

export const mockEdgeRows: EdgeRow[] = [
  {
    marketId: "mkt-021",
    marketProb: 0.68,
    benchmarkProb: 0.75,
    edge: 0.07,
    confidence: "High",
    whyLabel: "Venue lag - spot price leading",
    inputs: { volume1h: 156000, spread: 0.02, timeToExpiryMinutes: 240, liquidityScore: 95, velocity: 0.12 },
    updatedAt: subtractMinutes(1),
    source: "Spot price + derivatives"
  },
  {
    marketId: "mkt-006",
    marketProb: 0.67,
    benchmarkProb: 0.72,
    edge: 0.05,
    confidence: "Med",
    whyLabel: "Flow spike - smart money loading",
    inputs: { volume1h: 67000, spread: 0.03, timeToExpiryMinutes: 43200, liquidityScore: 88, velocity: 0.08 },
    updatedAt: subtractMinutes(3),
    source: "Orderbook imbalance"
  },
  {
    marketId: "mkt-022",
    marketProb: 0.52,
    benchmarkProb: 0.58,
    edge: 0.06,
    confidence: "High",
    whyLabel: "Sharp money divergence",
    inputs: { volume1h: 89000, spread: 0.01, timeToExpiryMinutes: 90, liquidityScore: 92, velocity: 0.04 },
    updatedAt: subtractMinutes(0.5),
    source: "Sportsbook consensus"
  },
  {
    marketId: "mkt-017",
    marketProb: 0.58,
    benchmarkProb: 0.65,
    edge: 0.07,
    confidence: "Med",
    whyLabel: "Historical pattern - Jan inflows",
    inputs: { volume1h: 78000, spread: 0.02, timeToExpiryMinutes: 43200, liquidityScore: 90, velocity: 0.03 },
    updatedAt: subtractMinutes(5),
    source: "Historical ETF data"
  }
];

export const mockPositions: Position[] = [
  {
    marketId: "mkt-004",
    title: "BTC above $150k by Dec 31",
    side: "YES",
    entryProb: 0.28,
    currentProb: 0.35,
    amountUSDC: 500,
    estValueUSDC: 625,
    pnlUSDC: 125,
    pnlPct: 0.25,
    expiresAt: addHours(168),
    status: "OPEN",
    lastUpdatedAt: subtractMinutes(1)
  },
  {
    marketId: "mkt-006",
    title: "Solana ATH before ETH ATH",
    side: "YES",
    entryProb: 0.55,
    currentProb: 0.67,
    amountUSDC: 250,
    estValueUSDC: 305,
    pnlUSDC: 55,
    pnlPct: 0.22,
    expiresAt: addHours(720),
    status: "OPEN",
    lastUpdatedAt: subtractMinutes(2)
  },
  {
    marketId: "mkt-008",
    title: "Fed cuts rates in January 2025",
    side: "NO",
    entryProb: 0.72,
    currentProb: 0.78,
    amountUSDC: 300,
    estValueUSDC: 325,
    pnlUSDC: 25,
    pnlPct: 0.08,
    expiresAt: addHours(720),
    status: "OPEN",
    lastUpdatedAt: subtractMinutes(3)
  }
];

// Generate candles for a market
export function generateCandles(marketId: string, hours: number = 24): Candle[] {
  const market = mockMarkets.find(m => m.id === marketId);
  if (!market) return [];
  
  const candles: Candle[] = [];
  const intervals = hours * 4; // 15-min candles
  let prob = market.yesProb - (market.change24h * (hours / 24));
  
  for (let i = 0; i < intervals; i++) {
    const t = now.getTime() - (intervals - i) * 15 * 60 * 1000;
    const change = (Math.random() - 0.48) * 0.02;
    prob = Math.max(0.01, Math.min(0.99, prob + change));
    const volume = Math.floor(Math.random() * 10000) + 1000;
    candles.push({ t, yesProb: prob, volume });
  }
  
  // Make sure last candle matches current prob
  if (candles.length > 0) {
    candles[candles.length - 1].yesProb = market.yesProb;
  }
  
  return candles;
}

// Helper to get market by ID
export function getMarketById(id: string): Market | undefined {
  return mockMarkets.find(m => m.id === id);
}

// Get signals for a market
export function getSignalsForMarket(marketId: string): Signal[] {
  return mockSignals.filter(s => s.marketId === marketId);
}

// Get edge for a market
export function getEdgeForMarket(marketId: string): EdgeRow | undefined {
  return mockEdgeRows.find(e => e.marketId === marketId);
}
