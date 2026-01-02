import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  image?: string;
  icon?: string;
  twitterCardImage?: string;
  category?: string;
  liquidity?: string;
  volume?: string;
  volume24hr?: string;
  outcomePrices?: string;
  outcomes?: string;
  endDate?: string;
  active?: boolean;
  createdAt?: string;
  spread?: number;
  clobTokenIds?: string; // JSON array of token IDs for CLOB API
  // Real price change fields from Gamma (when available)
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
  oneWeekPriceChange?: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Support both query params and body for limit
    let limit = url.searchParams.get("limit") || "50";

    // Also check request body for POST requests
    if (req.method === "POST" || req.method === "GET") {
      try {
        const body = await req.json().catch(() => ({}));
        if (body.limit) limit = String(body.limit);
      } catch {
        // No body, use query params
      }
    }

    const offset = url.searchParams.get("offset") || "0";
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    const active = url.searchParams.get("active") || "true";
    const order = url.searchParams.get("order") || "volume24hr";
    const ascending = url.searchParams.get("ascending") || "false";

    console.log(
      `[polymarket-markets] Request: limit=${limit}, offset=${offset}, active=${active}, order=${order}, id=${id ?? "-"}, slug=${slug ?? "-"}`
    );

    const endpoint = id
      ? `https://gamma-api.polymarket.com/markets/${encodeURIComponent(id)}`
      : slug
        ? `https://gamma-api.polymarket.com/markets/slug/${encodeURIComponent(slug)}`
        : `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=${offset}&active=${active}&closed=false&order=${order}&ascending=${ascending}`;

    // Fetch from Polymarket Gamma API
    const response = await fetch(endpoint, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const raw = await response.json();
    const markets: PolymarketMarket[] = Array.isArray(raw) ? raw : [raw];
    console.log(`[polymarket-markets] Fetched ${markets.length} market(s) from Polymarket`);

    // Map category to our types
    const categoryMap: Record<string, string> = {
      "sports": "Sports",
      "crypto": "Crypto",
      "politics": "Politics",
      "pop-culture": "Culture",
      "business": "Macro",
      "science": "Culture",
      "tech": "Culture",
      "other": "Macro",
    };

    // Transform to our format with all needed fields
    const transformed = markets.map((market, index) => {
      let yesPrice = 0.5;
      let noPrice = 0.5;
      
      // Parse outcome prices if available
      if (market.outcomePrices) {
        try {
          const prices = JSON.parse(market.outcomePrices);
          if (Array.isArray(prices) && prices.length >= 2) {
            yesPrice = parseFloat(prices[0]) || 0.5;
            noPrice = parseFloat(prices[1]) || 0.5;
          }
        } catch {
          // Keep defaults
        }
      }

      // Parse clobTokenIds - these are needed for price history
      let clobTokenIds: string[] = [];
      if (market.clobTokenIds) {
        try {
          clobTokenIds = JSON.parse(market.clobTokenIds);
        } catch {
          // Keep empty
        }
      }

      const volume24h = parseFloat(market.volume24hr || "0");
      const liquidity = parseFloat(market.liquidity || "0");
      const category = categoryMap[(market.category || "other").toLowerCase()] || "Macro";
      
      // Use real price change values from Gamma API (defaults to 0 if unavailable)
      // These are real values provided by Polymarket when available
      const change24h = market.oneDayPriceChange ?? 0;
      const change1h = market.oneHourPriceChange ?? 0;
      const change15m = change1h * 0.25; // Estimate if not provided

      // Calculate liquidity label
      let liquidityLabel = "Low";
      if (liquidity > 100000) liquidityLabel = "High";
      else if (liquidity > 20000) liquidityLabel = "Med";

      // Quality score based on liquidity and volume
      const qualityScore = Math.min(100, Math.round(50 + (liquidity / 10000) + (volume24h / 50000)));

      return {
        id: market.id,
        title: market.question,
        slug: market.slug,
        thumbnail: {
          imageUrl: market.image || null,
          iconUrl: market.icon || null,
          imageOptimizedUrl: market.twitterCardImage || null,
          resolvedUrl: market.image || market.icon || null,
          type: "polymarket" as const,
        },
        category,
        yesProb: yesPrice,
        noProb: noPrice,
        change15m,
        change1h,
        change24h,
        volume1h: Math.round(volume24h / 24),
        volume24h,
        liquidity,
        liquidityLabel,
        qualityScore,
        endDate: market.endDate,
        expiresAt: market.endDate,
        active: market.active,
        isInitialized: true,
        sourceLabel: "Polymarket",
        resolutionRuleShort: `Resolves based on Polymarket oracle`,
        lastUpdatedAt: new Date().toISOString(),
        // Include CLOB token IDs for price history - first token is YES
        clobTokenIds,
        yesTokenId: clobTokenIds[0] || null,
      };
    });

    return new Response(JSON.stringify(transformed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching Polymarket markets:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
