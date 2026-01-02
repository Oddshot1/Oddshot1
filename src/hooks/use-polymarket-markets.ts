import { useQuery } from "@tanstack/react-query";

import type { MarketCategory, LiquidityLabel } from "@/lib/types";

export interface PolymarketMarket {
  id: string;
  title: string;
  slug: string;
  thumbnail: {
    imageUrl: string | null;
    iconUrl: string | null;
    imageOptimizedUrl: string | null;
    resolvedUrl: string | null;
    type: "polymarket";
  };
  category: MarketCategory;
  yesProb: number;
  noProb: number;
  change15m: number;
  change1h: number;
  change24h: number;
  volume1h: number;
  volume24h: number;
  liquidity: number;
  liquidityLabel: LiquidityLabel;
  qualityScore: number;
  endDate: string;
  expiresAt: string;
  active: boolean;
  isInitialized: boolean;
  sourceLabel: string;
  resolutionRuleShort: string;
  lastUpdatedAt: string;
  // CLOB token IDs for price history
  clobTokenIds?: string[];
  yesTokenId?: string | null;
}

// Helper function to delay between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPolymarketMarketsBatch(limit: number, offset: number): Promise<PolymarketMarket[]> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-markets?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.status}`);
  }

  return response.json();
}

async function fetchPolymarketMarkets(limit = 50, offset = 0): Promise<PolymarketMarket[]> {
  // If requesting more than 200 markets, use batch fetching (2x200)
  if (limit > 200) {
    // Fetch first batch (200 markets, offset 0)
    const batch1 = await fetchPolymarketMarketsBatch(200, 0);
    
    // Wait 1 second between requests to avoid rate limiting
    await sleep(1000);
    
    // Fetch second batch (200 markets, offset 200)
    const batch2 = await fetchPolymarketMarketsBatch(200, 200);
    
    // Combine and return
    const combined = [...batch1, ...batch2];
    return combined;
  }
  
  // For 200 or fewer, fetch normally
  return fetchPolymarketMarketsBatch(limit, offset);
}

async function fetchPolymarketMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-markets?slug=${encodeURIComponent(slug)}&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.status}`);
  }

  const markets = await response.json();
  return Array.isArray(markets) && markets.length ? markets[0] : null;
}

async function fetchPolymarketMarketById(id: string): Promise<PolymarketMarket | null> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-markets?id=${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.status}`);
  }

  const raw = await response.json();
  if (Array.isArray(raw)) return raw.length ? raw[0] : null;
  return raw ?? null;
}

export function usePolymarketMarketBySlug(slug?: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["polymarket-market-slug", slug],
    queryFn: () => fetchPolymarketMarketBySlug(slug!),
    enabled: opts?.enabled ?? !!slug,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function usePolymarketMarketById(id?: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["polymarket-market-id", id],
    queryFn: () => fetchPolymarketMarketById(id!),
    enabled: opts?.enabled ?? !!id,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function usePolymarketMarkets(limit = 50) {
  return useQuery({
    queryKey: ["polymarket-markets", limit],
    queryFn: () => fetchPolymarketMarkets(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

// Paginated version for load more functionality
export function usePolymarketMarketsInfinite(pageSize = 50) {
  const { data, ...rest } = useQuery({
    queryKey: ["polymarket-markets-all"],
    queryFn: () => fetchPolymarketMarkets(200), // Fetch more for client-side pagination
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  return { data, ...rest };
}

// Filter out resolved/near-resolved markets (100%/0%) for opportunities display
function filterActiveMarkets(markets: PolymarketMarket[]): PolymarketMarket[] {
  return markets.filter((m) => m.yesProb > 0.02 && m.yesProb < 0.98 && m.active);
}

// Derived hooks for filtered data
export function useFilteredMarkets(
  markets: PolymarketMarket[] | undefined,
  filter: "trending" | "movers" | "today" | "split" | "new",
  limit?: number
) {
  if (!markets) return [];

  // First filter out resolved/near-resolved markets
  const activeMarkets = filterActiveMarkets(markets);

  let result: PolymarketMarket[];
  switch (filter) {
    case "movers":
      // Sort by absolute real change, filter out 0% changes
      result = [...activeMarkets]
        .filter((m) => m.change1h !== 0 || m.change24h !== 0)
        .sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h));
      break;
    case "today":
      result = activeMarkets.filter((m) => {
        if (!m.expiresAt) return false;
        const hours = (new Date(m.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
        return hours > 0 && hours <= 24;
      });
      break;
    case "split":
      result = activeMarkets.filter((m) => m.yesProb >= 0.45 && m.yesProb <= 0.55);
      break;
    case "new":
      // Take markets from the end (newest) that aren't resolved
      result = [...activeMarkets].reverse().slice(0, 20);
      break;
    case "trending":
    default:
      result = [...activeMarkets].sort((a, b) => b.volume24h - a.volume24h);
      break;
  }

  return limit ? result.slice(0, limit) : result;
}

// Generate signals from REAL market data - only when we have meaningful changes
export function generateSignalsFromMarkets(markets: PolymarketMarket[]) {
  // Filter out resolved markets and those with no real data
  const activeMarkets = filterActiveMarkets(markets);
  
  return activeMarkets
    .filter((m) => {
      // Only generate signals for markets with real price movement - NO synthetic data
      const hasRealChange = m.change1h !== 0 || m.change24h !== 0;
      const isSplit = m.yesProb >= 0.45 && m.yesProb <= 0.55;
      const hasHighVolume = m.volume24h > 10000;
      // Require REAL changes or 50/50 split WITH high volume
      return (hasRealChange || isSplit) && hasHighVolume;
    })
    .slice(0, 15)
    .map((market) => {
      const isPositive = market.change1h > 0 || (market.change1h === 0 && market.change24h > 0);
      const isSplit = market.yesProb >= 0.45 && market.yesProb <= 0.55;
      const change = market.change1h !== 0 ? market.change1h : market.change24h;
      const isBigMove = Math.abs(change) > 0.05; // 5%+ is a big move
      
      let signalType: "FLOW_SPIKE" | "ODDS_JUMP" | "LATE_SWING" | "SPLIT_CROWD" = "ODDS_JUMP";
      if (isSplit) signalType = "SPLIT_CROWD";
      else if (isBigMove) signalType = "FLOW_SPIKE";
      else if (market.expiresAt) {
        const hours = (new Date(market.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hours < 24 && hours > 0) signalType = "LATE_SWING";
      }

      // Confidence based on liquidity AND real price movement
      let confidence: "High" | "Med" | "Low" = "Low";
      if ((isBigMove || isSplit) && market.liquidityLabel === "High") confidence = "High";
      else if (Math.abs(change) > 0.02 || (isSplit && market.liquidityLabel !== "Low")) confidence = "Med";

      const suggestedAction = isPositive && confidence !== "Low" ? "BUY_YES" : 
                              !isPositive && Math.abs(change) > 0.03 ? "BUY_NO" : "WAIT";

      // Format the actual change percentage
      const changeDisplay = market.change1h !== 0 
        ? `${market.change1h > 0 ? '+' : ''}${(market.change1h * 100).toFixed(1)}% (1h)`
        : `${market.change24h > 0 ? '+' : ''}${(market.change24h * 100).toFixed(1)}% (24h)`;

      // Format volume consistently (K/M notation)
      const formattedVolume = market.volume24h >= 1000000 
        ? `$${(market.volume24h / 1000000).toFixed(1)}M`
        : market.volume24h >= 1000 
        ? `$${Math.round(market.volume24h / 1000)}K`
        : `$${market.volume24h}`;
      
      return {
        id: `sig-${market.id}`,
        marketId: market.id,
        type: signalType,
        timeframe: isBigMove ? "15m" : "1h" as const,
        severity: confidence,
        headline: isBigMove 
          ? `${isPositive ? "Surge" : "Drop"} detected: ${changeDisplay}`
          : isSplit 
          ? "Market evenly split - high uncertainty"
          : `Momentum: ${changeDisplay}`,
        whyBullets: [
          `Price movement: ${changeDisplay}`,
          `Current price: ${Math.round(market.yesProb * 100)}¢ YES`,
          `24h volume: ${formattedVolume}`,
          `Liquidity: ${market.liquidityLabel}`,
        ],
        suggestedAction,
        invalidation: isPositive 
          ? "If price drops below entry by 5%+"
          : "If price recovers above entry",
        confidence,
        source: "Polymarket",
        sourceUpdatedAt: market.lastUpdatedAt,
      };
    });
}

// Generate edge opportunities from real market data - based on REAL price momentum only
// Edge = difference between momentum-implied fair value vs current price
// This helps identify potentially mispriced markets based on recent movement
export function generateEdgeFromMarkets(markets: PolymarketMarket[]) {
  const activeMarkets = filterActiveMarkets(markets);
  
  return activeMarkets
    // Only include markets with REAL price movement data (non-zero changes) and meaningful edge
    .filter((m) => m.liquidityLabel !== "Low" && m.qualityScore > 60 && (m.change1h !== 0 || m.change24h !== 0))
    .map((market) => {
      // Benchmark calculation: if price is trending up, momentum suggests fair value is higher
      // We use weighted momentum to project where the "fair" price might be
      // This is a simple mean-reversion signal: strong moves may overshoot or undershoot
      const momentum1h = market.change1h;
      const momentum24h = market.change24h;
      
      // If momentum is positive, current price may be below fair value (underpriced YES)
      // If momentum is negative, current price may be above fair value (overpriced YES)
      // We scale by 0.5 because momentum often overshoots - fair value is usually halfway
      const projectedMove = momentum1h * 0.5;
      
      // Calculate raw benchmark for display (clamped to valid probability range 1%-99%)
      const rawBenchmark = market.yesProb + projectedMove;
      const benchmarkProb = Math.max(0.01, Math.min(0.99, rawBenchmark));
      
      // Edge = the actual projected move from momentum (NOT affected by display clamping)
      // This represents the true momentum-implied mispricing
      const edge = projectedMove;
      
      // Confidence based on volume, consistency, and magnitude
      let confidence: "High" | "Med" | "Low" = "Low";
      const sameDirection = (momentum1h >= 0) === (momentum24h >= 0);
      const strongMove = Math.abs(momentum1h) > 0.03;
      
      if (strongMove && sameDirection && market.volume24h > 100000) confidence = "High";
      else if (Math.abs(momentum1h) > 0.01 && market.volume24h > 50000) confidence = "Med";

      // Format the why label correctly based on actual direction
      const changeSign = momentum1h > 0 ? "+" : "";
      const changeDisplay = `${changeSign}${(momentum1h * 100).toFixed(1)}%`;

      return {
        marketId: market.id,
        marketProb: market.yesProb,
        benchmarkProb,
        edge,
        confidence,
        whyLabel: momentum1h !== 0 
          ? `1h momentum: ${changeDisplay} → ${edge > 0 ? "YES may be underpriced" : "YES may be overpriced"}`
          : `24h change: ${(momentum24h * 100).toFixed(1)}%`,
        inputs: {
          volume1h: market.volume1h,
          spread: 0.02,
          timeToExpiryMinutes: market.expiresAt 
            ? Math.max(0, (new Date(market.expiresAt).getTime() - Date.now()) / 60000)
            : 4320,
          liquidityScore: market.qualityScore,
          velocity: momentum1h,
        },
        updatedAt: market.lastUpdatedAt,
        source: "Momentum Analysis",
      };
    })
    // Filter out near-zero edge opportunities (not actionable)
    .filter((row) => Math.abs(row.edge) >= 0.001)
    // Sort by absolute edge value descending (best opportunities first)
    .sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))
    .slice(0, 15);
}
