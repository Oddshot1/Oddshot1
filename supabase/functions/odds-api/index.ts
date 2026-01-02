import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The Odds API - covers 40+ sportsbooks
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

interface OddsOutcome {
  name: string;
  price: number;
}

interface OddsMarket {
  key: string;
  last_update: string;
  outcomes: OddsOutcome[];
}

interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

interface ProcessedBookmaker {
  key: string;
  title: string;
  homeOdds: number;
  awayOdds: number;
  homeProb: number;
  awayProb: number;
  lastUpdate: string;
}

interface ProcessedOddsEvent {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  title: string;
  bookmakers: ProcessedBookmaker[];
  bestHomeOdds: { bookmaker: string; odds: number; prob: number };
  bestAwayOdds: { bookmaker: string; odds: number; prob: number };
  arbitrageProfit: number;
  hasArbitrage: boolean;
  source: "theodds";
}

// Convert American odds to probability
function americanToProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

// Convert American odds to decimal odds
function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

// Simple in-memory cache (resets on cold start, ~5 min)
let cachedData: { events: ProcessedOddsEvent[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cached data if fresh (saves API quota)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log("[odds-api] Returning cached data");
      return new Response(
        JSON.stringify({ events: cachedData.events, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ODDS_API_KEY");
    
    if (!apiKey) {
      console.error("[odds-api] No API key configured");
      return new Response(
        JSON.stringify({ events: [], error: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[odds-api] Fetching fresh sports odds...");

    // Expanded sports coverage - popular sports worldwide
    // Each sport = 1 API call, cache for 5 min to reduce quota usage
    const sports = [
      // US Major Sports
      "basketball_nba",
      "americanfootball_nfl",
      "americanfootball_ncaaf",
      "icehockey_nhl",
      "baseball_mlb",
      // Soccer / Football
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_italy_serie_a",
      "soccer_germany_bundesliga",
      "soccer_france_ligue_one",
      "soccer_uefa_champs_league",
      // Tennis
      "tennis_atp_aus_open",
      "tennis_wta_aus_open",
      // MMA / Boxing
      "mma_mixed_martial_arts",
      // Basketball International
      "basketball_euroleague",
      // Cricket
      "cricket_ipl",
    ];
    const allEvents: ProcessedOddsEvent[] = [];

    // Fetch sports in parallel for speed
    const sportPromises = sports.map(async (sport) => {
      try {
        const url = `${ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          headers: { "Accept": "application/json" },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[odds-api] ${sport} API error:`, response.status);
          return [];
        }

        const events: OddsEvent[] = await response.json();
        console.log(`[odds-api] ${sport}: ${events.length} events`);
        return { sport, events };
      } catch (err) {
        console.error(`[odds-api] Error fetching ${sport}:`, err);
        return [];
      }
    });

    const results = await Promise.all(sportPromises);

    for (const result of results) {
      if (!result || !("events" in result)) continue;
      const { events } = result;

      for (const event of events) {
        if (!event.bookmakers || event.bookmakers.length < 2) continue;
        
        // CRITICAL: Filter out events that have already started or are too old
        const commenceDate = new Date(event.commence_time);
        const now = new Date();
        const hoursSinceStart = (now.getTime() - commenceDate.getTime()) / (1000 * 60 * 60);
        
        // Skip events that started more than 1 hour ago (likely stale odds)
        if (hoursSinceStart > 1) {
          console.log(`[odds-api] Skipping stale event: ${event.home_team} vs ${event.away_team} (started ${hoursSinceStart.toFixed(1)}h ago)`);
          continue;
        }

        const processedBookmakers: ProcessedBookmaker[] = [];
        
        for (const b of event.bookmakers) {
          const h2h = b.markets?.find(m => m.key === "h2h");
          if (!h2h || h2h.outcomes.length < 2) continue;

          const homeOutcome = h2h.outcomes.find(o => o.name === event.home_team);
          const awayOutcome = h2h.outcomes.find(o => o.name === event.away_team);

          if (!homeOutcome || !awayOutcome) continue;

          processedBookmakers.push({
            key: b.key,
            title: b.title,
            homeOdds: homeOutcome.price,
            awayOdds: awayOutcome.price,
            homeProb: americanToProb(homeOutcome.price),
            awayProb: americanToProb(awayOutcome.price),
            lastUpdate: b.last_update,
          });
        }

        if (processedBookmakers.length < 2) continue;

        // Find best odds for each side
        let bestHome = { bookmaker: "", odds: -Infinity, prob: 1 };
        let bestAway = { bookmaker: "", odds: -Infinity, prob: 1 };

        for (const b of processedBookmakers) {
          if (b.homeOdds > bestHome.odds) {
            bestHome = { bookmaker: b.title, odds: b.homeOdds, prob: b.homeProb };
          }
          if (b.awayOdds > bestAway.odds) {
            bestAway = { bookmaker: b.title, odds: b.awayOdds, prob: b.awayProb };
          }
        }

        // Calculate arbitrage
        const decimalHome = americanToDecimal(bestHome.odds);
        const decimalAway = americanToDecimal(bestAway.odds);
        const impliedTotal = (1 / decimalHome) + (1 / decimalAway);
        const hasArbitrage = impliedTotal < 1;
        const arbitrageProfit = hasArbitrage ? (1 - impliedTotal) * 100 : 0;
        
        // CRITICAL: Cap arbitrage at 10% - anything higher is likely stale/erroneous data
        // Real arbitrage opportunities are typically 0.5-3%
        const cappedProfit = Math.min(arbitrageProfit, 10);
        const isRealArbitrage = hasArbitrage && arbitrageProfit <= 10;

        // Only include top 5 bookmakers to reduce payload
        const topBookmakers = processedBookmakers
          .sort((a, b) => Math.max(b.homeOdds, b.awayOdds) - Math.max(a.homeOdds, a.awayOdds))
          .slice(0, 5);

        allEvents.push({
          id: event.id,
          sportKey: event.sport_key,
          sportTitle: event.sport_title,
          commenceTime: event.commence_time,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          title: `${event.home_team} vs ${event.away_team}`,
          bookmakers: topBookmakers,
          bestHomeOdds: bestHome,
          bestAwayOdds: bestAway,
          arbitrageProfit: cappedProfit,
          hasArbitrage: isRealArbitrage,
          source: "theodds",
        });
      }
    }

    // Sort by arbitrage profit
    allEvents.sort((a, b) => b.arbitrageProfit - a.arbitrageProfit);

    // Cache the results
    cachedData = { events: allEvents, timestamp: Date.now() };

    const arbCount = allEvents.filter(e => e.hasArbitrage).length;
    console.log(`[odds-api] Total: ${allEvents.length} events, ${arbCount} with arbitrage`);

    return new Response(
      JSON.stringify({ events: allEvents }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[odds-api] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        events: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
