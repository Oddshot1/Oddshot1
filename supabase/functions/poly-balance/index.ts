// ODDSHOT Polymarket Balance Check
// Gets USDC.e (bridged USDC) balance on Polygon for user's proxy wallet
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USDC.e (bridged USDC) on Polygon
const USDC_E_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const POLYGON_RPC = 'https://polygon-rpc.com';

// ERC20 balanceOf ABI
const BALANCE_OF_ABI = {
  inputs: [{ name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
};

interface BalanceResponse {
  balance: string; // Human-readable USD amount
  raw: string; // Raw wei amount
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
    // Get proxy wallet address from query params
    const url = new URL(req.url);
    const proxyWallet = url.searchParams.get('address');

    if (!proxyWallet) {
      return new Response(
        JSON.stringify({ error: 'Missing address parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[poly-balance] Checking balance for ${proxyWallet}`);

    // Encode balanceOf(address) call
    const functionSignature = '0x70a08231'; // balanceOf(address)
    const paddedAddress = proxyWallet.slice(2).padStart(64, '0');
    const data = functionSignature + paddedAddress;

    // Call Polygon RPC
    const response = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: USDC_E_ADDRESS,
            data: data,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC call failed: ${response.statusText}`);
    }

    const rpcResult = await response.json();

    if (rpcResult.error) {
      throw new Error(`RPC error: ${rpcResult.error.message}`);
    }

    // Parse balance (USDC has 6 decimals)
    const rawBalance = BigInt(rpcResult.result || '0x0');
    const balance = Number(rawBalance) / 1e6; // Convert to human-readable

    const result: BalanceResponse = {
      balance: balance.toFixed(2),
      raw: rawBalance.toString(),
    };

    console.log(`[poly-balance] Balance: $${result.balance}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10', // Cache for 10 seconds
        } 
      }
    );
  } catch (error: unknown) {
    console.error('[poly-balance] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message,
        balance: '0.00',
        raw: '0',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

