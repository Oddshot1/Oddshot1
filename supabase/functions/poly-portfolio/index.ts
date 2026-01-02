// ODDSHOT Polymarket Data API - Portfolio/Holdings (Read-only)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  conditionId: string;
  tokenId: string;
  marketId?: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  marketTitle?: string;
  title?: string;
}

interface PortfolioResponse {
  address: string;
  positions: Position[];
  totalValue: number;
  totalPnl: number;
  activity: { type: string; timestamp: string; amount: number }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const evmAddress = url.searchParams.get('evm');

    if (!evmAddress) {
      return new Response(
        JSON.stringify({ error: 'evm address parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[poly-portfolio] Fetching portfolio for ${evmAddress}`);

    // Fetch user positions from Polymarket Data API
    const positions: Position[] = [];
    let totalValue = 0;
    let totalPnl = 0;

    try {
      // Use Polymarket Data API positions endpoint (proxy wallet should be used)
      const positionsRes = await fetch(
        `https://data-api.polymarket.com/positions?user=${evmAddress.toLowerCase()}`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );

      console.log(`[poly-portfolio] Positions API status: ${positionsRes.status}`);

      if (positionsRes.ok) {
        const data = await positionsRes.json();
        console.log(`[poly-portfolio] Raw positions data:`, JSON.stringify(data).slice(0, 500));
        
        if (Array.isArray(data)) {
          for (const pos of data) {
            console.log(`[poly-portfolio] Processing position:`, {
              conditionId: pos.conditionId || pos.condition_id,
              tokenId: pos.tokenId || pos.asset_id || pos.assetId || pos.token_id,
              outcome: pos.outcome,
            });

            const size = parseFloat(pos.size || '0');
            const avgPrice = parseFloat(pos.avgPrice || '0.5');
            const currentPrice = parseFloat(pos.currentPrice || pos.avgPrice || '0.5');
            const pnl = (currentPrice - avgPrice) * size;
            const pnlPct = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
            
            // Try to get tokenId from various possible fields
            let tokenId = pos.tokenId || pos.asset_id || pos.assetId || pos.token_id;
            let marketSlug = pos.market_slug || pos.slug;
            
            // If no tokenId, try to fetch from market data using conditionId
            if (!tokenId && (pos.conditionId || pos.condition_id)) {
              try {
                const condId = pos.conditionId || pos.condition_id;
                console.log(`[poly-portfolio] Fetching market for conditionId: ${condId}`);
                
                // Use the correct Gamma API endpoint with condition_id parameter
                const marketRes = await fetch(
                  `https://gamma-api.polymarket.com/markets?condition_id=${encodeURIComponent(condId)}&closed=false`,
                  { headers: { 'Accept': 'application/json' } }
                );
                
                if (marketRes.ok) {
                  const marketData = await marketRes.json();
                  console.log(`[poly-portfolio] Market API response status: ${marketRes.status}`);
                  
                  if (Array.isArray(marketData) && marketData.length > 0) {
                    const market = marketData[0];
                    console.log(`[poly-portfolio] Found market: ${market.question || market.title}`);
                    
                    // Store the market slug for future use
                    if (market.slug) {
                      marketSlug = market.slug;
                    }
                    
                    // Get tokenId for the specific outcome
                    if (market.tokens && Array.isArray(market.tokens)) {
                      // Find the token that matches the outcome
                      const outcomeIndex = (pos.outcome || 'YES').toUpperCase() === 'YES' ? 0 : 1;
                      const token = market.tokens[outcomeIndex];
                      
                      if (token && token.token_id) {
                        tokenId = token.token_id;
                        console.log(`[poly-portfolio] ✅ Found tokenId: ${tokenId} for outcome ${pos.outcome} at index ${outcomeIndex}`);
                      } else {
                        console.log(`[poly-portfolio] ❌ Token not found at index ${outcomeIndex}`, market.tokens);
                      }
                    } else {
                      console.log(`[poly-portfolio] ❌ No tokens array in market data`);
                    }
                  } else {
                    console.log(`[poly-portfolio] ❌ No markets returned for conditionId ${condId}`);
                  }
                } else {
                  const errorText = await marketRes.text();
                  console.log(`[poly-portfolio] Market API error: ${marketRes.status} - ${errorText.slice(0, 200)}`);
                }
              } catch (err) {
                console.log(`[poly-portfolio] Failed to fetch tokenId for ${pos.conditionId}:`, err);
              }
            }
            
            console.log(`[poly-portfolio] Final tokenId for position: ${tokenId || 'MISSING'}`);
            
            positions.push({
              conditionId: pos.conditionId || pos.condition_id || pos.marketId,
              tokenId: tokenId || '', // Token ID for trading
              marketId: marketSlug || pos.marketId || pos.market_slug || pos.conditionId,
              outcome: pos.outcome || 'YES',
              size,
              avgPrice,
              currentPrice,
              pnl,
              pnlPct,
              marketTitle: pos.marketTitle || pos.title || pos.question,
              title: pos.title || pos.marketTitle || pos.question,
            });
            
            totalValue += size * currentPrice;
            totalPnl += pnl;
          }
        }
      }
    } catch (err) {
      console.log('[poly-portfolio] Positions fetch failed:', err);
    }

    // Fetch activity/trades
    const activity: { type: string; timestamp: string; amount: number }[] = [];

    try {
      const activityRes = await fetch(
        `https://gamma-api.polymarket.com/user-activity?user=${evmAddress.toLowerCase()}&limit=20`,
        {
          headers: { 'Accept': 'application/json' }
        }
      );

      if (activityRes.ok) {
        const data = await activityRes.json();
        if (Array.isArray(data)) {
          for (const act of data) {
            activity.push({
              type: act.type || 'trade',
              timestamp: act.timestamp || new Date().toISOString(),
              amount: parseFloat(act.amount || '0'),
            });
          }
        }
      }
    } catch (err) {
      console.log('[poly-portfolio] Activity fetch failed:', err);
    }

    const portfolio: PortfolioResponse = {
      address: evmAddress,
      positions,
      totalValue,
      totalPnl,
      activity,
    };

    console.log(`[poly-portfolio] Found ${positions.length} positions, total value: ${totalValue}`);

    return new Response(
      JSON.stringify(portfolio),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[poly-portfolio] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
