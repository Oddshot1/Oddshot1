import { useQuery } from "@tanstack/react-query";

export interface PricePoint {
  t: number;
  yesProb: number;
  volume: number;
}

interface PriceHistoryResponse {
  history: PricePoint[];
  synthetic?: boolean;
  source?: string;
}

async function fetchPriceHistory(
  marketId: string,
  tokenId: string | null,
  interval: string,
  fidelity: string
): Promise<PricePoint[]> {
  // Prefer tokenId for CLOB API, fall back to marketId for lookup
  const params = new URLSearchParams({
    interval,
    fidelity,
  });
  
  if (tokenId) {
    params.set("tokenId", tokenId);
  } else {
    params.set("marketId", marketId);
  }
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polymarket-prices?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.status}`);
  }

  const result: PriceHistoryResponse = await response.json();
  return result.history || [];
}

export function usePriceHistory(
  marketId: string,
  interval: "1h" | "6h" | "1d" | "1w" | "max" = "1d",
  yesTokenId?: string | null
) {
  const fidelityMap: Record<string, string> = {
    "1h": "1", // 1 minute resolution
    "6h": "5", // 5 minute resolution
    "1d": "15", // 15 minute resolution
    "1w": "60", // 1 hour resolution
    "max": "1440", // 1 day resolution
  };

  return useQuery({
    queryKey: ["priceHistory", marketId, interval, yesTokenId],
    queryFn: () => fetchPriceHistory(marketId, yesTokenId || null, interval, fidelityMap[interval]),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !!marketId,
  });
}
