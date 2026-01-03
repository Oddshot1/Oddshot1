import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS Configuration - Restrict to your production domain
const ALLOWED_ORIGINS = [
  'http://localhost:8082',
  'http://localhost:3000',
  'https://oddshot1.vercel.app',
];

const corsHeaders = (origin?: string) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[2];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// The Odds API - 500 requests/month free tier
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

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
  source: "odds-api";
}

// Convert American odds to probability
function americanToProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

// Convert American odds to decimal
function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

// Simple in-memory cache
let cachedData: { events: ProcessedOddsEvent[]; sharpOdds: Map<string, any>; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes to conserve API quota

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cached data if fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log("[odds-api] Returning cached data");
      return new Response(
        JSON.stringify({ 
          events: cachedData.events, 
          sharpOdds: Object.fromEntries(cachedData.sharpOdds),
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ODDS_API_KEY");
    
    if (!apiKey) {
      console.error("[odds-api] No ODDS_API_KEY configured");
      return new Response(
        JSON.stringify({ events: [], sharpOdds: {}, error: "API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[odds-api] Fetching from The Odds API...");

    const allEvents: ProcessedOddsEvent[] = [];
    const sharpOdds = new Map<string, any>();
    
    // Sports to fetch - using sport keys from The Odds API
    const sportsToFetch = [
      { key: "basketball_nba", name: "NBA" },
      { key: "americanfootball_nfl", name: "NFL" },
      { key: "americanfootball_ncaaf", name: "NCAAF" },
      { key: "icehockey_nhl", name: "NHL" },
      { key: "soccer_epl", name: "EPL" },
      { key: "soccer_england_efl_champ", name: "Championship" },
    ];

    // Only fetch games within next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    for (const sport of sportsToFetch) {
      try {
        // Fetch h2h (moneyline), spreads, and totals
        const url = `${ODDS_API_BASE}/sports/${sport.key}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=pinnacle,draftkings,fanduel,betmgm`;
        
        console.log(`[odds-api] Fetching ${sport.name}...`);
        
        const response = await fetch(url, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          console.warn(`[odds-api] ${sport.name} error:`, response.status, await response.text().catch(() => ""));
          continue;
        }

        // Log remaining requests
        const remaining = response.headers.get("x-requests-remaining");
        console.log(`[odds-api] Requests remaining: ${remaining}`);

        const events = await response.json();
        
        console.log(`[odds-api] ${sport.name}: ${events.length} events`);

        for (const event of events) {
          // Filter to only games within 3 days
          const commenceTime = new Date(event.commence_time);
          if (commenceTime > threeDaysFromNow) {
            continue;
          }

          if (!event.bookmakers || event.bookmakers.length < 2) continue;
          
          const homeTeam = event.home_team;
          const awayTeam = event.away_team;
          
          const processedBookmakers: ProcessedBookmaker[] = [];
          let bestHome = { bookmaker: "", odds: -Infinity, prob: 1 };
          let bestAway = { bookmaker: "", odds: -Infinity, prob: 1 };
          let pinnacleData: any = null;

          for (const book of event.bookmakers) {
            const h2hMarket = book.markets.find((m: any) => m.key === "h2h");
            const spreadsMarket = book.markets.find((m: any) => m.key === "spreads");
            const totalsMarket = book.markets.find((m: any) => m.key === "totals");
            
            if (!h2hMarket) continue;

            const homeOutcome = h2hMarket.outcomes.find((o: any) => o.name === homeTeam);
            const awayOutcome = h2hMarket.outcomes.find((o: any) => o.name === awayTeam);

            if (!homeOutcome || !awayOutcome) continue;

            const homeOdds = homeOutcome.price;
            const awayOdds = awayOutcome.price;

            const bookmaker: ProcessedBookmaker = {
              key: book.key,
              title: book.title,
              homeOdds,
              awayOdds,
              homeProb: americanToProb(homeOdds),
              awayProb: americanToProb(awayOdds),
              lastUpdate: book.last_update,
            };

            processedBookmakers.push(bookmaker);

            // Track best odds
            if (homeOdds > bestHome.odds) {
              bestHome = { bookmaker: book.title, odds: homeOdds, prob: bookmaker.homeProb };
            }
            if (awayOdds > bestAway.odds) {
              bestAway = { bookmaker: book.title, odds: awayOdds, prob: bookmaker.awayProb };
            }

            // Store Pinnacle as sharp odds reference with spreads and totals
            if (book.key === "pinnacle") {
              pinnacleData = { 
                homeOdds, 
                awayOdds,
                spreads: spreadsMarket?.outcomes || null,
                totals: totalsMarket?.outcomes || null,
              };
            }
          }

          if (processedBookmakers.length < 2) continue;

          // Calculate arbitrage using best odds from different books
          const decimalHome = americanToDecimal(bestHome.odds);
          const decimalAway = americanToDecimal(bestAway.odds);
          const impliedTotal = (1 / decimalHome) + (1 / decimalAway);
          const hasArbitrage = impliedTotal < 1;
          const arbitrageProfit = hasArbitrage ? (1 - impliedTotal) * 100 : 0;
          
          // Cap at 10% (anything higher is likely stale data)
          const cappedProfit = Math.min(arbitrageProfit, 10);
          const isRealArbitrage = hasArbitrage && arbitrageProfit <= 10;

          allEvents.push({
            id: event.id,
            sportKey: sport.key,
            sportTitle: sport.name,
            commenceTime: event.commence_time,
            homeTeam,
            awayTeam,
            title: `${homeTeam} vs ${awayTeam}`,
            bookmakers: processedBookmakers.slice(0, 5),
            bestHomeOdds: bestHome,
            bestAwayOdds: bestAway,
            arbitrageProfit: cappedProfit,
            hasArbitrage: isRealArbitrage,
            source: "odds-api",
          });

          // Store sharp odds from Pinnacle if available
          if (pinnacleData) {
            const teamKey = `${normalizeTeamName(homeTeam)}_${normalizeTeamName(awayTeam)}`;
            
            // Process spreads
            let spreadData = null;
            if (pinnacleData.spreads) {
              const homeSpread = pinnacleData.spreads.find((o: any) => o.name === homeTeam);
              const awaySpread = pinnacleData.spreads.find((o: any) => o.name === awayTeam);
              if (homeSpread && awaySpread) {
                spreadData = {
                  homeLine: homeSpread.point,
                  homePrice: americanToDecimal(homeSpread.price),
                  homeProb: americanToProb(homeSpread.price),
                  awayLine: awaySpread.point,
                  awayPrice: americanToDecimal(awaySpread.price),
                  awayProb: americanToProb(awaySpread.price),
                };
              }
            }
            
            // Process totals
            let totalsData = null;
            if (pinnacleData.totals) {
              const over = pinnacleData.totals.find((o: any) => o.name === "Over");
              const under = pinnacleData.totals.find((o: any) => o.name === "Under");
              if (over && under) {
                totalsData = {
                  line: over.point,
                  overPrice: americanToDecimal(over.price),
                  overProb: americanToProb(over.price),
                  underPrice: americanToDecimal(under.price),
                  underProb: americanToProb(under.price),
                };
              }
            }
            
            sharpOdds.set(teamKey, {
              home: homeTeam,
              away: awayTeam,
              commenceTime: event.commence_time,
              homePrice: americanToDecimal(pinnacleData.homeOdds),
              awayPrice: americanToDecimal(pinnacleData.awayOdds),
              homeProb: americanToProb(pinnacleData.homeOdds),
              awayProb: americanToProb(pinnacleData.awayOdds),
              bookmaker: "Pinnacle",
              spread: spreadData,
              totals: totalsData,
            });
          }
        }
      } catch (err) {
        console.error(`[odds-api] Error fetching ${sport.name}:`, err);
      }
    }

    // Sort by commence time (soonest first)
    allEvents.sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());

    // Cache results
    cachedData = { events: allEvents, sharpOdds, timestamp: Date.now() };

    const arbCount = allEvents.filter(e => e.hasArbitrage).length;
    console.log(`[odds-api] Total: ${allEvents.length} events, ${arbCount} with arbitrage, ${sharpOdds.size} sharp odds`);

    return new Response(
      JSON.stringify({ 
        events: allEvents, 
        sharpOdds: Object.fromEntries(sharpOdds),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[odds-api] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        events: [],
        sharpOdds: {},
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(fc|sc|cf|afc|united|city|town)$/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
