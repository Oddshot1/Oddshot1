import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EVOpportunity {
  // Unique ID for this opportunity record in the UI (not necessarily the Polymarket market id)
  id: string;
  // The actual Polymarket market id (used for in-app Market Detail + trading)
  polymarketMarketId?: string;
  slug: string;
  question: string;
  category: string;
  sport: string;
  league: string;
  teams: { home: string; away: string } | null;
  betOn: string;
  betType: string;
  polyPrice: number;
  fairPrice: number;
  edge: number;
  evPercent: number;
  maxBet: number;
  liquidity: number;
  volume: number;
  endDate: string;
  updatedAt: string;
  matchStartsIn: string;
  sharpBook: string;
}

interface PolymarketSportsResponse {
  opportunities: EVOpportunity[];
  totalScanned: number;
  timestamp: string;
  error?: string;
}

// Calculate time until from ISO string
function getTimeUntil(dateStr: string): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return "started";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `in ${mins} minute${mins > 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in about ${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days > 1 ? 's' : ''}`;
}

// Fetch from database first, fallback to edge function
async function fetchPolymarketSports(): Promise<PolymarketSportsResponse> {
  // First try to get from database (faster, cached)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: dbData, error: dbError } = await supabase
      .from("odds_snapshots")
      .select("*")
      .gte("expected_value_updated_at", oneHourAgo)
      .order("ev_percent", { ascending: false })
      .limit(100);
    
    if (!dbError && dbData && dbData.length > 0) {
      const opportunities: EVOpportunity[] = dbData.map((row: any) => {
        const marketIdRaw = String(row.market_id ?? "");
        const polymarketMarketId = marketIdRaw.match(/^\d+/)?.[0] || undefined;

        return {
          id: marketIdRaw,
          polymarketMarketId,
          slug: row.slug || "",
          question: row.question,
          category: "Sports",
          sport: row.sport,
          league: row.league,
          teams: { home: row.home_team, away: row.away_team },
          betOn: row.bet_on,
          betType: row.bet_type,
          polyPrice: parseFloat(row.poly_price),
          fairPrice: parseFloat(row.fair_price),
          edge: parseFloat(row.edge),
          evPercent: parseFloat(row.ev_percent),
          maxBet: parseFloat(row.max_bet) || 1000,
          liquidity: parseFloat(row.liquidity) || 0,
          volume: parseFloat(row.volume) || 0,
          endDate: row.commence_time || "",
          updatedAt: row.expected_value_updated_at,
          matchStartsIn: getTimeUntil(row.commence_time),
          sharpBook: row.sharp_book || "Pinnacle",
        };
      });
      
      return {
        opportunities,
        totalScanned: dbData.length,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (dbErr) {
    // DB fetch error, continue to fallback
  }
  
  // Fallback to edge function
  const { data, error } = await supabase.functions.invoke("polymarket-sports");
  
  if (error) {
    throw error;
  }
  
  return data as PolymarketSportsResponse;
}

// Trigger a background refresh of the data
async function triggerRefresh(): Promise<void> {
  try {
    await supabase.functions.invoke("polymarket-sports");
  } catch (err) {
    console.warn("[use-polymarket-sports] Refresh trigger failed:", err);
  }
}

export function usePolymarketSports() {
  const query = useQuery({
    queryKey: ["polymarket-sports"],
    queryFn: fetchPolymarketSports,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 2,
  });
  
  return {
    ...query,
    triggerRefresh,
  };
}

// Calculate time ago from ISO string
export function timeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "just now";
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `about ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
