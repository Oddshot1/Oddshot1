// ODDSHOT Polymarket Bridge - Supported Assets
// Gets list of supported chains/tokens and minimum deposit amounts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('[bridge-supported-assets] Fetching supported assets');

    // Call Polymarket Bridge API
    const response = await fetch('https://bridge.polymarket.com/supported-assets', {
      headers: {
        'User-Agent': 'ODDSHOT/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch supported assets: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('[bridge-supported-assets] Supported assets:', {
      chains: data.chains?.length || 0,
      minCheckoutUsd: data.minCheckoutUsd,
    });

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
        } 
      }
    );
  } catch (error: unknown) {
    console.error('[bridge-supported-assets] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

