// ODDSHOT Polymarket Geoblock Check
// Checks if user's region is blocked by Polymarket
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoblockResponse {
  blocked: boolean;
  country?: string;
  region?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Call Polymarket's geoblock endpoint
    // This endpoint checks the request's IP address
    const response = await fetch('https://polymarket.com/api/geoblock', {
      headers: {
        'User-Agent': 'ODDSHOT/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geoblock check failed: ${response.statusText}`);
    }

    const data: GeoblockResponse = await response.json();

    console.log('[poly-geoblock] Result:', data);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        } 
      }
    );
  } catch (error: unknown) {
    console.error('[poly-geoblock] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message,
        blocked: true, // Fail safe - assume blocked if check fails
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

