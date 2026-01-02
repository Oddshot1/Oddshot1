import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POLY_GAMMA_API = "https://gamma-api.polymarket.com";
const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

interface SharpOdds {
  home: string;
  away: string;
  commenceTime: string;
  homeProb: number;
  awayProb: number;
  spread?: { homeLine: number; homeProb: number; awayLine: number; awayProb: number };
  totals?: { line: number; overProb: number; underProb: number };
  sport: string;
  league: string;
}

interface EVOpportunity {
  event_id: string;
  market_id: string;
  slug: string;
  question: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  bet_on: string;
  bet_type: string;
  poly_price: number;
  fair_price: number;
  edge: number;
  ev_percent: number;
  max_bet: number;
  liquidity: number;
  volume: number;
  commence_time: string;
  sharp_book: string;
  poly_url: string;
}

// Build reverse lookup: nickname -> canonical name
const NICKNAME_TO_CANONICAL: Record<string, string> = {
  // NBA
  "hawks": "atlanta hawks", "celtics": "boston celtics", "nets": "brooklyn nets",
  "hornets": "charlotte hornets", "bulls": "chicago bulls", "cavaliers": "cleveland cavaliers",
  "cavs": "cleveland cavaliers", "mavericks": "dallas mavericks", "mavs": "dallas mavericks",
  "nuggets": "denver nuggets", "pistons": "detroit pistons", "warriors": "golden state warriors",
  "rockets": "houston rockets", "pacers": "indiana pacers", "clippers": "los angeles clippers",
  "lakers": "los angeles lakers", "grizzlies": "memphis grizzlies", "heat": "miami heat",
  "bucks": "milwaukee bucks", "timberwolves": "minnesota timberwolves", "wolves": "minnesota timberwolves",
  "pelicans": "new orleans pelicans", "knicks": "new york knicks", "thunder": "oklahoma city thunder",
  "magic": "orlando magic", "76ers": "philadelphia 76ers", "sixers": "philadelphia 76ers",
  "suns": "phoenix suns", "blazers": "portland trail blazers", "trail blazers": "portland trail blazers",
  "kings": "sacramento kings", "spurs": "san antonio spurs", "raptors": "toronto raptors",
  "jazz": "utah jazz", "wizards": "washington wizards",
  // NFL
  "cardinals": "arizona cardinals", "falcons": "atlanta falcons", "ravens": "baltimore ravens",
  "bills": "buffalo bills", "panthers": "carolina panthers", "bears": "chicago bears",
  "bengals": "cincinnati bengals", "browns": "cleveland browns", "cowboys": "dallas cowboys",
  "broncos": "denver broncos", "lions": "detroit lions", "packers": "green bay packers",
  "texans": "houston texans", "colts": "indianapolis colts", "jaguars": "jacksonville jaguars",
  "chiefs": "kansas city chiefs", "raiders": "las vegas raiders", "chargers": "los angeles chargers",
  "rams": "los angeles rams", "dolphins": "miami dolphins", "vikings": "minnesota vikings",
  "patriots": "new england patriots", "saints": "new orleans saints", "giants": "new york giants",
  "jets": "new york jets", "eagles": "philadelphia eagles", "steelers": "pittsburgh steelers",
  "49ers": "san francisco 49ers", "niners": "san francisco 49ers", "seahawks": "seattle seahawks",
  "buccaneers": "tampa bay buccaneers", "bucs": "tampa bay buccaneers", "titans": "tennessee titans",
  "commanders": "washington commanders",
  // NHL
  "ducks": "anaheim ducks", "bruins": "boston bruins", "sabres": "buffalo sabres",
  "flames": "calgary flames", "hurricanes": "carolina hurricanes", "blackhawks": "chicago blackhawks",
  "avalanche": "colorado avalanche", "blue jackets": "columbus blue jackets", "stars": "dallas stars",
  "red wings": "detroit red wings", "oilers": "edmonton oilers", "wild": "minnesota wild",
  "canadiens": "montreal canadiens", "predators": "nashville predators", "devils": "new jersey devils",
  "islanders": "new york islanders", "rangers": "new york rangers", "senators": "ottawa senators",
  "flyers": "philadelphia flyers", "penguins": "pittsburgh penguins", "sharks": "san jose sharks",
  "kraken": "seattle kraken", "blues": "st louis blues", "lightning": "tampa bay lightning",
  "maple leafs": "toronto maple leafs", "leafs": "toronto maple leafs", "canucks": "vancouver canucks",
  "golden knights": "vegas golden knights", "capitals": "washington capitals",
};

function americanToProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function getCanonical(name: string): string {
  const n = normalize(name);
  // Check if it's already a canonical name
  if (Object.values(NICKNAME_TO_CANONICAL).includes(n)) return n;
  // Check nicknames
  for (const [nick, canonical] of Object.entries(NICKNAME_TO_CANONICAL)) {
    if (n.includes(nick) || n.endsWith(nick)) return canonical;
  }
  return n;
}

function teamsMatch(t1: string, t2: string): boolean {
  const c1 = getCanonical(t1);
  const c2 = getCanonical(t2);
  return c1 === c2;
}

// Fetch sharp odds
async function fetchSharpOdds(apiKey: string): Promise<Map<string, SharpOdds>> {
  const sharpMap = new Map<string, SharpOdds>();
  
  const sports = [
    { key: "basketball_nba", sport: "Basketball", league: "USA - NBA" },
    { key: "americanfootball_nfl", sport: "American Football", league: "USA - NFL" },
    { key: "americanfootball_ncaaf", sport: "American Football", league: "USA - NCAA" },
    { key: "icehockey_nhl", sport: "Ice Hockey", league: "USA - NHL" },
    { key: "soccer_epl", sport: "Football", league: "England - Premier League" },
  ];
  
  for (const sportInfo of sports) {
    try {
      const url = `${ODDS_API_BASE}/sports/${sportInfo.key}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&bookmakers=pinnacle`;
      
      console.log(`[sports] Fetching ${sportInfo.league}...`);
      
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      
      const remaining = response.headers.get("x-requests-remaining");
      console.log(`[sports] Remaining: ${remaining}`);
      
      const events = await response.json();
      console.log(`[sports] ${sportInfo.league}: ${events.length} events`);
      
      for (const event of events) {
        const pinnacle = event.bookmakers?.find((b: any) => b.key === "pinnacle");
        if (!pinnacle) continue;
        
        const h2h = pinnacle.markets.find((m: any) => m.key === "h2h");
        if (!h2h) continue;
        
        const homeOutcome = h2h.outcomes.find((o: any) => o.name === event.home_team);
        const awayOutcome = h2h.outcomes.find((o: any) => o.name === event.away_team);
        if (!homeOutcome || !awayOutcome) continue;
        
        const entry: SharpOdds = {
          home: event.home_team,
          away: event.away_team,
          commenceTime: event.commence_time,
          homeProb: americanToProb(homeOutcome.price),
          awayProb: americanToProb(awayOutcome.price),
          sport: sportInfo.sport,
          league: sportInfo.league,
        };
        
        // Spreads
        const spreads = pinnacle.markets.find((m: any) => m.key === "spreads");
        if (spreads) {
          const hs = spreads.outcomes.find((o: any) => o.name === event.home_team);
          const as = spreads.outcomes.find((o: any) => o.name === event.away_team);
          if (hs && as) {
            entry.spread = {
              homeLine: hs.point,
              homeProb: americanToProb(hs.price),
              awayLine: as.point,
              awayProb: americanToProb(as.price),
            };
          }
        }
        
        // Totals
        const totals = pinnacle.markets.find((m: any) => m.key === "totals");
        if (totals) {
          const over = totals.outcomes.find((o: any) => o.name === "Over");
          const under = totals.outcomes.find((o: any) => o.name === "Under");
          if (over && under) {
            entry.totals = {
              line: over.point,
              overProb: americanToProb(over.price),
              underProb: americanToProb(under.price),
            };
          }
        }
        
        // Store by canonical team names
        const homeCanon = getCanonical(event.home_team);
        const awayCanon = getCanonical(event.away_team);
        sharpMap.set(`${homeCanon}|${awayCanon}`, entry);
        sharpMap.set(`${awayCanon}|${homeCanon}`, entry);
      }
    } catch (err) {
      console.warn(`[sports] Error:`, err);
    }
  }
  
  console.log(`[sports] Total sharp: ${sharpMap.size}`);
  return sharpMap;
}

// Fetch Polymarket sports
async function fetchPolymarketSports(): Promise<any[]> {
  const markets: any[] = [];
  
  try {
    console.log("[sports] Fetching Polymarket...");
    
    const response = await fetch(`${POLY_GAMMA_API}/events?active=true&closed=false&limit=300&order=volume&ascending=false`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    
    if (!response.ok) return [];
    
    const events = await response.json();
    console.log(`[sports] Polymarket: ${events.length} events`);
    
    // Keywords to identify sports
    const keywords = Object.keys(NICKNAME_TO_CANONICAL);
    
    for (const event of events) {
      const title = (event.title || '').toLowerCase();
      
      // Must have "vs" and a team keyword
      if (!title.includes(' vs')) continue;
      if (!keywords.some(k => title.includes(k))) continue;
      
      if (event.markets?.length) {
        for (const m of event.markets) {
          markets.push({ ...m, eventTitle: event.title, eventSlug: event.slug });
        }
      } else {
        markets.push(event);
      }
    }
    
    console.log(`[sports] Sports markets: ${markets.length}`);
  } catch (err) {
    console.error("[sports] Fetch error:", err);
  }
  
  return markets;
}

// Parse market
function parseMarket(market: any): { home: string; away: string; betType: string } | null {
  const title = normalize(market.question || market.title || market.eventTitle || '');
  
  const vsMatch = title.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s|$|:|\?)/);
  if (!vsMatch) return null;
  
  let team1 = vsMatch[1].replace(/^(will\s+)?/, '').trim();
  let team2 = vsMatch[2].split(/[:\s]/)[0].trim();
  
  let betType = "Moneyline";
  if (title.includes("spread")) betType = "Spread";
  else if (title.includes("over") || title.includes("under") || title.includes("o/u")) betType = "Totals";
  else if (title.includes("1h") || title.includes("half")) betType = "Totals HT";
  
  return { home: team1, away: team2, betType };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[sports] Starting scan...");
    
    const apiKey = Deno.env.get("ODDS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ opportunities: [], error: "No API key" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const [sharpMap, polyMarkets] = await Promise.all([
      fetchSharpOdds(apiKey),
      fetchPolymarketSports(),
    ]);
    
    const opportunities: EVOpportunity[] = [];
    
    for (const market of polyMarkets) {
      const parsed = parseMarket(market);
      if (!parsed) continue;
      
      // Find matching sharp odds
      const homeCanon = getCanonical(parsed.home);
      const awayCanon = getCanonical(parsed.away);
      
      const sharp = sharpMap.get(`${homeCanon}|${awayCanon}`) || sharpMap.get(`${awayCanon}|${homeCanon}`);
      if (!sharp) continue;
      
      // Get poly price
      let polyPrice = 0.5;
      if (market.outcomePrices) {
        try {
          const prices = typeof market.outcomePrices === 'string' ? JSON.parse(market.outcomePrices) : market.outcomePrices;
          polyPrice = parseFloat(prices[0]) || 0.5;
        } catch {}
      } else if (market.tokens?.length) {
        polyPrice = market.tokens[0]?.price || 0.5;
      }
      
      if (polyPrice < 0.05 || polyPrice > 0.95) continue;
      
      // Determine fair price
      let fairPrice = polyPrice;
      let betOn = parsed.home;
      
      const title = normalize(market.question || market.title || '');
      
      if (parsed.betType === "Totals" && sharp.totals) {
        fairPrice = title.includes("under") ? sharp.totals.underProb : sharp.totals.overProb;
        betOn = title.includes("under") ? "Under" : "Over";
      } else if (parsed.betType === "Spread" && sharp.spread) {
        if (teamsMatch(parsed.home, sharp.home)) {
          fairPrice = sharp.spread.homeProb;
          betOn = sharp.home;
        } else {
          fairPrice = sharp.spread.awayProb;
          betOn = sharp.away;
        }
      } else {
        // Moneyline or HT
        if (teamsMatch(parsed.home, sharp.home)) {
          fairPrice = sharp.homeProb;
          betOn = sharp.home;
        } else {
          fairPrice = sharp.awayProb;
          betOn = sharp.away;
        }
      }
      
      const edge = fairPrice - polyPrice;
      const evPercent = (edge / polyPrice) * 100;
      
      // Only 1-20% EV
      if (evPercent < 1 || evPercent > 20) continue;
      
      opportunities.push({
        event_id: market.conditionId || market.id || "",
        market_id: `${market.id}-${parsed.betType}-${betOn}`.replace(/\s+/g, '-'),
        slug: market.slug || market.eventSlug || "",
        question: market.question || market.title || market.eventTitle || "",
        sport: sharp.sport,
        league: sharp.league,
        home_team: sharp.home,
        away_team: sharp.away,
        bet_on: betOn,
        bet_type: parsed.betType,
        poly_price: polyPrice,
        fair_price: fairPrice,
        edge,
        ev_percent: evPercent,
        max_bet: parseFloat(market.liquidityAmount || "1000") || 1000,
        liquidity: parseFloat(market.liquidityAmount || "0") || 0,
        volume: parseFloat(market.volumeAmount || "0") || 0,
        commence_time: sharp.commenceTime,
        sharp_book: "Pinnacle",
        poly_url: `https://polymarket.com/event/${market.slug || market.eventSlug || ""}`,
      });
    }
    
    opportunities.sort((a, b) => b.ev_percent - a.ev_percent);
    
    console.log(`[sports] Found ${opportunities.length} +EV opportunities`);
    
    // Store in DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseKey && opportunities.length > 0) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.from("odds_snapshots").upsert(
          opportunities.map(o => ({ ...o, expected_value_updated_at: new Date().toISOString() })),
          { onConflict: "market_id,bet_type,bet_on" }
        );
        
        console.log(`[sports] Stored ${opportunities.length} in DB`);
        
        // Clean old
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        await supabase.from("odds_snapshots").delete().lt("expected_value_updated_at", oneHourAgo);
      } catch (e) {
        console.error("[sports] DB error:", e);
      }
    }
    
    // Format response
    const response = opportunities.slice(0, 50).map(o => ({
      id: o.market_id,
      slug: o.slug,
      question: o.question,
      category: "Sports",
      sport: o.sport,
      league: o.league,
      teams: { home: o.home_team, away: o.away_team },
      betOn: o.bet_on,
      betType: o.bet_type,
      polyPrice: o.poly_price,
      fairPrice: o.fair_price,
      edge: o.edge,
      evPercent: o.ev_percent,
      maxBet: o.max_bet,
      liquidity: o.liquidity,
      volume: o.volume,
      endDate: o.commence_time,
      updatedAt: new Date().toISOString(),
      matchStartsIn: getTimeUntil(o.commence_time),
      sharpBook: o.sharp_book,
    }));
    
    return new Response(
      JSON.stringify({
        opportunities: response,
        totalScanned: polyMarkets.length,
        sportsScanned: polyMarkets.length,
        sharpEventsMatched: opportunities.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sports] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error), opportunities: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getTimeUntil(dateStr: string): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return "started";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `in ${days}d`;
}
