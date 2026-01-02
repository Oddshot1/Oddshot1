import { useQuery } from "@tanstack/react-query";

export interface PredictItMarket {
  id: string;
  marketId: string;
  marketName: string;
  title: string;
  status: string;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  lastPrice: number;
  midPrice: number;
  source: "predictit";
}

interface PredictItResponse {
  markets: PredictItMarket[];
  error?: string;
}

async function fetchPredictItMarkets(): Promise<PredictItMarket[]> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predictit-markets`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch PredictIt markets: ${response.status}`);
  }

  const data: PredictItResponse = await response.json();

  if (data.error) {
    console.warn("[use-predictit-markets] API returned error:", data.error);
  }

  return data.markets || [];
}

export function usePredictItMarkets() {
  return useQuery({
    queryKey: ["predictit-markets"],
    queryFn: fetchPredictItMarkets,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    retry: 2,
  });
}