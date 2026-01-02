// ODDSHOT Type Definitions

export type MarketCategory = "Sports" | "Crypto" | "Politics" | "Culture" | "Macro";
export type LiquidityLabel = "High" | "Med" | "Low";
export type Confidence = "High" | "Med" | "Low";
export type SignalType = "FLOW_SPIKE" | "ODDS_JUMP" | "SPREAD_WIDEN" | "VENUE_LAG" | "LATE_SWING" | "SPLIT_CROWD";
export type Timeframe = "15m" | "1h" | "24h";
export type SuggestedAction = "BUY_YES" | "BUY_NO" | "WAIT" | "HEDGE" | "AVOID";
export type PositionStatus = "OPEN" | "CLOSED" | "REDEEMABLE";
export type AlertType = "CROSS_ABOVE" | "CROSS_BELOW" | "MOVE_PCT";
export type ExecutionRisk = "Low" | "Med" | "High";
export type LockInStatus = "EXECUTABLE" | "NOT_EXECUTABLE" | "PREVIEW";

export interface MarketThumbnail {
  imageUrl?: string | null;
  iconUrl?: string | null;
  imageOptimizedUrl?: string | null;
  resolvedUrl?: string | null;
  type: "sport-team" | "sport-league" | "crypto" | "politics" | "macro" | "culture" | "fallback";
}

export interface Market {
  id: string;
  title: string;
  category: MarketCategory;
  expiresAt: string;
  yesProb: number;
  noProb: number;
  change15m: number;
  change1h: number;
  change24h: number;
  volume1h: number;
  volume24h: number;
  liquidityLabel: LiquidityLabel;
  qualityScore: number;
  isInitialized: boolean;
  sourceLabel: string;
  resolutionRuleShort: string;
  lastUpdatedAt: string;
  thumbnail: MarketThumbnail;
}

export interface Candle {
  t: number;
  yesProb: number;
  volume: number;
}

export interface Signal {
  id: string;
  marketId: string;
  type: SignalType;
  timeframe: Timeframe;
  severity: Confidence;
  headline: string;
  whyBullets: string[];
  suggestedAction: SuggestedAction;
  invalidation: string;
  confidence: Confidence;
  source: string;
  sourceUpdatedAt: string;
}

export interface EdgeRow {
  marketId: string;
  marketProb: number;
  benchmarkProb: number;
  edge: number;
  confidence: Confidence;
  whyLabel: string;
  inputs: {
    volume1h: number;
    spread: number;
    timeToExpiryMinutes: number;
    liquidityScore: number;
    velocity: number;
  };
  updatedAt: string;
  source: string;
}

export interface LockInOpp {
  id: string;
  marketId: string;
  marketTitle?: string;
  profitUsd: number;
  profitPct: number;
  costUsd: number;
  legs: { side: "YES" | "NO"; price: number; venue: string }[];
  feesEstimateUsd: number;
  slippageBufferPct: number;
  executionRisk: ExecutionRisk;
  status: LockInStatus;
  updatedAt: string;
  disclaimer: string;
}

export interface YieldOpp {
  id: string;
  marketId: string;
  direction: "YES" | "NO";
  price: number;
  returnToExpiryPct: number;
  annualizedAprPct: number;
  timeToExpiryHours: number;
  riskNote: string;
  updatedAt: string;
}

export interface Position {
  marketId: string;
  title: string;
  side: "YES" | "NO";
  entryProb: number;
  currentProb: number;
  amountUSDC: number;
  estValueUSDC: number;
  pnlUSDC: number;
  pnlPct: number;
  expiresAt: string;
  status: PositionStatus;
  lastUpdatedAt: string;
}

export interface AlertRule {
  id: string;
  marketId: string;
  type: AlertType;
  threshold: number;
  enabled: boolean;
}

export interface WatchlistItem {
  marketId: string;
  addedAt: string;
}

// UI State types
export type ViewMode = "guided" | "terminal";

export interface TradeTicketState {
  status: "idle" | "quoting" | "ready" | "signing" | "pending" | "confirmed" | "failed";
  side: "YES" | "NO";
  amount: number;
  quote?: {
    expectedShares: number;
    avgPrice: number;
    fees: number;
    total: number;
  };
  error?: string;
}
