import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RundownBookmaker {
  key: string;
  title: string;
  homeOdds: number;
  awayOdds: number;
  homeProb: number;
  awayProb: number;
  lastUpdate: string;
}

export interface RundownEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  title: string;
  bookmakers: RundownBookmaker[];
  bestHomeOdds: { bookmaker: string; odds: number; prob: number };
  bestAwayOdds: { bookmaker: string; odds: number; prob: number };
  arbitrageProfit: number;
  hasArbitrage: boolean;
  source: "odds-api";
}

export interface SharpOdds {
  home: string;
  away: string;
  homePrice: number;
  awayPrice: number;
  homeProb: number;
  awayProb: number;
  bookmaker: string;
  spread?: { line: number; homePrice: number; awayPrice: number };
  total?: { line: number; overPrice: number; underPrice: number };
}

interface RundownResponse {
  events: RundownEvent[];
  sharpOdds: Record<string, SharpOdds>;
  error?: string;
  cached?: boolean;
}

async function fetchRundownOdds(): Promise<RundownResponse> {
  const { data, error } = await supabase.functions.invoke<RundownResponse>("rundown-odds");
  
  if (error) {
    console.error("[use-rundown-odds] Error:", error);
    throw error;
  }
  
  if (data?.error) {
    console.warn("[use-rundown-odds] API returned error:", data.error);
  }
  
  return {
    events: data?.events || [],
    sharpOdds: data?.sharpOdds || {},
    cached: data?.cached,
  };
}

export function useRundownOdds() {
  return useQuery({
    queryKey: ["rundown-odds"],
    queryFn: fetchRundownOdds,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes (to conserve quota)
    retry: 1,
  });
}

// Get only events with arbitrage opportunities
export function useRundownArbitrage() {
  const { data, ...rest } = useRundownOdds();
  
  const arbitrageEvents = data?.events?.filter(e => e.hasArbitrage) || [];
  
  return { data: arbitrageEvents, sharpOdds: data?.sharpOdds || {}, ...rest };
}
