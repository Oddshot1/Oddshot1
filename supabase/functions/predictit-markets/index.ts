import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PredictIt public API - no auth required
const PREDICTIT_API = "https://www.predictit.org/api/marketdata/all/";

interface PredictItContract {
  id: number;
  name: string;
  shortName: string;
  status: string;
  lastTradePrice: number;
  bestBuyYesCost: number | null;
  bestBuyNoCost: number | null;
  bestSellYesCost: number | null;
  bestSellNoCost: number | null;
  lastClosePrice: number;
  displayOrder: number;
}

interface PredictItMarket {
  id: number;
  name: string;
  shortName: string;
  url: string;
  contracts: PredictItContract[];
  status: string;
}

interface PredictItResponse {
  markets: PredictItMarket[];
}

interface ProcessedContract {
  id: string;
  marketId: string;
  marketName: string;
  title: string;
  status: string;
  yesBid: number; // Best price to buy YES
  yesAsk: number; // Best price to sell YES
  noBid: number;  // Best price to buy NO
  noAsk: number;  // Best price to sell NO
  lastPrice: number;
  midPrice: number;
  source: "predictit";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[predictit-markets] Fetching markets from PredictIt API...");

    const response = await fetch(PREDICTIT_API, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "OddshotApp/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[predictit-markets] PredictIt API error:", response.status, errorText);
      throw new Error(`PredictIt API returned ${response.status}`);
    }

    const data: PredictItResponse = await response.json();
    console.log(`[predictit-markets] Received ${data.markets?.length || 0} markets from PredictIt`);

    if (!data.markets || !Array.isArray(data.markets)) {
      return new Response(JSON.stringify({ markets: [], error: "No markets in response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process markets - flatten contracts into individual tradeable items
    const processedMarkets: ProcessedContract[] = [];

    for (const market of data.markets) {
      if (market.status !== "Open") continue;

      for (const contract of market.contracts) {
        if (contract.status !== "Open") continue;

        // PredictIt prices are decimals 0-1 (e.g., 0.52 = 52¢)
        // bestBuyYesCost = price to BUY YES
        // bestBuyNoCost = price to BUY NO
        // bestSellYesCost = price to SELL YES (what you get)
        // bestSellNoCost = price to SELL NO (what you get)
        const yesBid = contract.bestBuyYesCost || contract.lastTradePrice || 0.5;
        const noBid = contract.bestBuyNoCost || (1 - (contract.lastTradePrice || 0.5));
        const yesAsk = contract.bestSellYesCost || contract.lastTradePrice || 0.5;
        const noAsk = contract.bestSellNoCost || (1 - (contract.lastTradePrice || 0.5));
        const midPrice = (yesBid + yesAsk) / 2;

        processedMarkets.push({
          id: `pi-${contract.id}`,
          marketId: `pi-market-${market.id}`,
          marketName: market.name,
          title: contract.name || contract.shortName,
          status: contract.status,
          yesBid,
          yesAsk,
          noBid,
          noAsk,
          lastPrice: contract.lastTradePrice || 0.5,
          midPrice,
          source: "predictit",
        });
      }
    }

    console.log(`[predictit-markets] Processed ${processedMarkets.length} contracts from ${data.markets.length} markets`);

    return new Response(JSON.stringify({ markets: processedMarkets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[predictit-markets] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        markets: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});