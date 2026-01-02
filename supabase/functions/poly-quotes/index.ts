// ODDSHOT Polymarket CLOB Quotes - Top-of-book pricing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookSummary {
  tokenId: string;
  side: string;
  bestBid: number;
  bestAsk: number;
  midpoint: number;
  spread: number;
  bidSize: number;
  askSize: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tokenIds = url.searchParams.get('tokenIds');

    if (!tokenIds) {
      return new Response(
        JSON.stringify({ error: 'tokenIds parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenIdList = tokenIds.split(',').map(id => id.trim());
    console.log(`[poly-quotes] Fetching quotes for ${tokenIdList.length} tokens`);

    const quotes: BookSummary[] = [];

    for (const tokenId of tokenIdList) {
      try {
        // Fetch orderbook from Polymarket CLOB
        const bookRes = await fetch(
          `https://clob.polymarket.com/book?token_id=${tokenId}`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (bookRes.ok) {
          const book = await bookRes.json();
          
          // Extract best bid/ask from orderbook
          const bids = book.bids || [];
          const asks = book.asks || [];
          
          const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
          const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 1;
          const bidSize = bids.length > 0 ? parseFloat(bids[0].size) : 0;
          const askSize = asks.length > 0 ? parseFloat(asks[0].size) : 0;
          
          quotes.push({
            tokenId,
            side: 'YES',
            bestBid,
            bestAsk,
            midpoint: (bestBid + bestAsk) / 2,
            spread: bestAsk - bestBid,
            bidSize,
            askSize,
          });
        } else {
          console.log(`[poly-quotes] Failed to fetch book for ${tokenId}: ${bookRes.status}`);
        }
      } catch (err) {
        console.error(`[poly-quotes] Error fetching quote for ${tokenId}:`, err);
      }
    }

    console.log(`[poly-quotes] Returning ${quotes.length} quotes`);

    return new Response(
      JSON.stringify({ quotes, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[poly-quotes] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
