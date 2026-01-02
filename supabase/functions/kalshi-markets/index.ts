import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kalshi public API endpoint for election/prediction markets
const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

// In-memory cache to prevent failures from blocking the app
let cachedMarkets: ProcessedKalshiMarket[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (longer to handle API outages)

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  close_time: string;
  result: string | null;
  category: string;
}

interface ProcessedKalshiMarket {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const now = Date.now();

  // Return cached data if available and fresh
  if (cachedMarkets.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    console.log(`[kalshi-markets] Returning ${cachedMarkets.length} cached markets (age: ${Math.round((now - cacheTimestamp) / 1000)}s)`);
    return new Response(
      JSON.stringify({ markets: cachedMarkets, cached: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("[kalshi-markets] Fetching markets from Kalshi API...");

    // Fetch active markets from Kalshi with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    
    const response = await fetch(`${KALSHI_API_BASE}/markets?limit=200&status=open`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "OddshotApp/1.0",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[kalshi-markets] Kalshi API error:", response.status, errorText.slice(0, 200));
      
      // Return cached data if available on API error
      if (cachedMarkets.length > 0) {
        console.log(`[kalshi-markets] API error, returning ${cachedMarkets.length} stale cached markets`);
        return new Response(
          JSON.stringify({ markets: cachedMarkets, cached: true, stale: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Kalshi API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`[kalshi-markets] Received ${data.markets?.length || 0} markets from Kalshi`);

    if (!data.markets || !Array.isArray(data.markets)) {
      console.error("[kalshi-markets] Unexpected response structure");
      
      if (cachedMarkets.length > 0) {
        return new Response(
          JSON.stringify({ markets: cachedMarkets, cached: true, stale: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(JSON.stringify({ markets: [], error: "No markets in response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process and normalize markets
    const processedMarkets: ProcessedKalshiMarket[] = data.markets
      .filter((m: KalshiMarket) => m.status === "active" || m.status === "open")
      .map((market: KalshiMarket) => {
        // Kalshi prices are in cents (0-100)
        const yesBid = (market.yes_bid || 0) / 100;
        const yesAsk = (market.yes_ask || 0) / 100;
        const noBid = (market.no_bid || 0) / 100;
        const noAsk = (market.no_ask || 0) / 100;
        const midPrice = (yesBid + yesAsk) / 2 || (market.last_price || 50) / 100;

        return {
          id: market.ticker,
          eventId: market.event_ticker,
          title: market.title,
          subtitle: market.subtitle || "",
          status: market.status,
          yesBid,
          yesAsk,
          noBid,
          noAsk,
          lastPrice: (market.last_price || 50) / 100,
          midPrice,
          volume: market.volume || 0,
          volume24h: market.volume_24h || 0,
          openInterest: market.open_interest || 0,
          closeTime: market.close_time,
          category: market.category || "other",
          source: "kalshi" as const,
        };
      });

    // Update cache
    cachedMarkets = processedMarkets;
    cacheTimestamp = now;
    
    console.log(`[kalshi-markets] Processed and cached ${processedMarkets.length} active markets`);

    return new Response(JSON.stringify({ markets: processedMarkets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[kalshi-markets] Error:", error);
    
    // Return cached data on any error
    if (cachedMarkets.length > 0) {
      console.log(`[kalshi-markets] Error occurred, returning ${cachedMarkets.length} stale cached markets`);
      return new Response(
        JSON.stringify({ markets: cachedMarkets, cached: true, stale: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        markets: [] 
      }),
      {
        status: 200, // Return 200 even on error to prevent frontend crash
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
