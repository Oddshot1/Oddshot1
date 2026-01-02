import { useQuery } from "@tanstack/react-query";

export interface KalshiMarket {
  id: string;
  eventId: string;
  title: string;
  subtitle: string;
  status: string;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  lastPrice: number;
  midPrice: number;
  volume: number;
  volume24h: number;
  openInterest: number;
  closeTime: string;
  category: string;
  source: "kalshi";
}

interface KalshiResponse {
  markets: KalshiMarket[];
  error?: string;
}

// Local cache for resilience against API failures
let cachedMarkets: KalshiMarket[] = [];

async function fetchKalshiMarkets(): Promise<KalshiMarket[]> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kalshi-markets`,
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data: KalshiResponse = await response.json();
    
    if (data.error) {
      console.warn("[use-kalshi-markets] API returned error:", data.error);
    }
    
    const markets = data.markets || [];
    
    // Cache successful responses
    if (markets.length > 0) {
      cachedMarkets = markets;
    }
    
    // Return cached data if current request returned empty
    if (markets.length === 0 && cachedMarkets.length > 0) {
      return cachedMarkets;
    }
    
    return markets;
  } catch (error) {
    // Return cached data on error
    if (cachedMarkets.length > 0) {
      return cachedMarkets;
    }
    
    throw error;
  }
}

export function useKalshiMarkets() {
  return useQuery({
    queryKey: ["kalshi-markets"],
    queryFn: fetchKalshiMarkets,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    retry: 2,
  });
}
