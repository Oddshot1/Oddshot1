// ODDSHOT Polymarket Profile Discovery
// Gets user's Polymarket profile and proxy wallet from Gamma API
// Official Docs: https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileResponse {
  hasProfile: boolean;
  proxyWallet?: string;
  name?: string;
  pseudonym?: string;
  profileImage?: string;
  bio?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

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
    // Get EVM address from query params
    const url = new URL(req.url);
    const evmAddress = url.searchParams.get('address');

    if (!evmAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing address parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[poly-profile] Fetching profile for ${evmAddress}`);

    // Call official Polymarket Gamma API endpoint
    // Docs: https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address
    const response = await fetch(
      `https://gamma-api.polymarket.com/public-profile?address=${evmAddress}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ODDSHOT/1.0',
        },
      }
    );

    // If 404, user doesn't have a Polymarket profile yet
    if (response.status === 404) {
      console.log(`[poly-profile] No profile found for ${evmAddress}`);
      return new Response(
        JSON.stringify({ 
          hasProfile: false,
          message: 'Create a Polymarket profile to start trading at polymarket.com'
        } as ProfileResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If 400 or other error
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[poly-profile] API error ${response.status}:`, errorText);
      throw new Error(`Polymarket API error: ${response.status} - ${errorText}`);
    }

    const profileData = await response.json();

    // Extract relevant fields according to official API response
    const result: ProfileResponse = {
      hasProfile: true,
      proxyWallet: profileData.proxyWallet,
      name: profileData.name,
      pseudonym: profileData.pseudonym,
      profileImage: profileData.profileImage,
      bio: profileData.bio,
      xUsername: profileData.xUsername,
      verifiedBadge: profileData.verifiedBadge,
    };

    console.log(`[poly-profile] Profile found for ${evmAddress}:`, {
      hasProfile: true,
      proxyWallet: result.proxyWallet,
      name: result.name || result.pseudonym,
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        } 
      }
    );
  } catch (error: unknown) {
    console.error('[poly-profile] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message,
        hasProfile: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
