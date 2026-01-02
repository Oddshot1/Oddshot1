import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OddsBookmaker {
  key: string;
  title: string;
  homeOdds: number;
  awayOdds: number;
  homeProb: number;
  awayProb: number;
  lastUpdate: string;
}

export interface OddsEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  title: string;
  bookmakers: OddsBookmaker[];
  bestHomeOdds: { bookmaker: string; odds: number; prob: number };
  bestAwayOdds: { bookmaker: string; odds: number; prob: number };
  arbitrageProfit: number;
  hasArbitrage: boolean;
  source: "theodds";
}

interface OddsApiResponse {
  events: OddsEvent[];
  error?: string;
  cached?: boolean;
}

async function fetchOddsEvents(): Promise<OddsEvent[]> {
  const { data, error } = await supabase.functions.invoke<OddsApiResponse>("odds-api");
  
  if (error) {
    console.error("[use-odds-events] Error:", error);
    throw error;
  }
  
  if (data?.error) {
    console.warn("[use-odds-events] API returned error:", data.error);
  }
  
  return data?.events || [];
}

export function useOddsEvents() {
  return useQuery({
    queryKey: ["odds-events"],
    queryFn: fetchOddsEvents,
    staleTime: 2 * 60 * 1000, // 2 minutes (to conserve API credits)
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 1,
  });
}

// Get only events with arbitrage opportunities
export function useArbitrageEvents() {
  const { data: events, ...rest } = useOddsEvents();
  
  const arbitrageEvents = events?.filter(e => e.hasArbitrage) || [];
  
  return { data: arbitrageEvents, ...rest };
}
