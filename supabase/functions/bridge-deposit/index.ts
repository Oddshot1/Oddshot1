// ODDSHOT Polymarket Bridge - Create Deposit Address
// Creates a deposit address for user's proxy wallet
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositResponse {
  svmDepositAddress?: string;
  note?: string;
  addresses?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { proxyWallet } = body;

    if (!proxyWallet) {
      return new Response(
        JSON.stringify({ error: 'Missing proxyWallet parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[bridge-deposit] Creating deposit address for ${proxyWallet}`);

    // Call Polymarket Bridge API to create deposit address
    const response = await fetch('https://bridge.polymarket.com/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ODDSHOT/1.0',
      },
      body: JSON.stringify({
        address: proxyWallet,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create deposit address: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Extract Solana deposit address
    const result: DepositResponse = {
      svmDepositAddress: data.address?.svm || data.addresses?.svm,
      note: data.note,
      addresses: data.address || data.addresses, // Full list for debugging
    };

    if (!result.svmDepositAddress) {
      console.error('[bridge-deposit] No Solana address in response:', data);
      throw new Error('No Solana deposit address returned');
    }

    console.log(`[bridge-deposit] Deposit address created: ${result.svmDepositAddress}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error: unknown) {
    console.error('[bridge-deposit] Error:', error);
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

