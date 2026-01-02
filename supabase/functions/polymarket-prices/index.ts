import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PricePoint {
  t: number;
  p: number;
}

interface TimestampedPrice {
  t: number;
  yesProb: number;
  volume: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tokenId = url.searchParams.get("tokenId"); // YES token ID for CLOB API
    const marketId = url.searchParams.get("marketId"); // Gamma market ID (fallback for looking up token)
    const interval = url.searchParams.get("interval") || "1d";
    const fidelity = url.searchParams.get("fidelity") || "60";

    // Prefer tokenId for CLOB API (this is the YES token ID)
    let clobTokenId = tokenId;
    
    // If only marketId provided, try to get tokenId from Gamma
    if (!clobTokenId && marketId) {
      console.log(`No tokenId provided, fetching market ${marketId} to get token IDs...`);
      try {
        const marketResponse = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);
        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          if (marketData.clobTokenIds) {
            const tokenIds = JSON.parse(marketData.clobTokenIds);
            clobTokenId = tokenIds[0]; // First token is YES
            console.log(`Got YES token ID from market: ${clobTokenId?.substring(0, 20)}...`);
          }
        }
      } catch (e) {
        console.log(`Failed to fetch market for token lookup: ${e}`);
      }
    }

    if (!clobTokenId) {
      console.log("No token ID available, returning empty history (no synthetic data)");
      return new Response(JSON.stringify({ history: [], error: "No token ID available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching CLOB price history for token: ${clobTokenId.substring(0, 30)}..., interval: ${interval}, fidelity: ${fidelity}`);

    // Call CLOB API with the token ID
    const clobUrl = `https://clob.polymarket.com/prices-history?market=${clobTokenId}&interval=${interval}&fidelity=${fidelity}`;
    console.log(`CLOB URL: ${clobUrl.substring(0, 80)}...`);
    
    const clobResponse = await fetch(clobUrl, {
      headers: { "Accept": "application/json" },
    });

    if (clobResponse.ok) {
      const clobData = await clobResponse.json();
      console.log(`CLOB returned ${clobData.history?.length || 0} price points`);
      
      if (clobData.history && clobData.history.length > 0) {
        const history: TimestampedPrice[] = clobData.history.map((point: PricePoint) => ({
          t: point.t * 1000, // Convert seconds to milliseconds
          yesProb: point.p,
          volume: 0,
        }));

        return new Response(JSON.stringify({ history, source: "clob" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`CLOB failed or empty: ${clobResponse.status}, returning empty history (no synthetic data)`);

    // Return empty history instead of synthetic data
    return new Response(JSON.stringify({ history: [], error: "No price history available from CLOB" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching price history:", message);
    return new Response(
      JSON.stringify({ error: message, history: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
