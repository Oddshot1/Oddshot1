// ODDSHOT Polymarket Order Execution with Builder Attribution
// Accepts user-signed orders and forwards with builder HMAC authentication
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// CORS Configuration - Restrict to your production domain
const ALLOWED_ORIGINS = [
  'http://localhost:8082',
  'http://localhost:3000',
  'https://oddshot1.vercel.app',
];

const corsHeaders = (origin?: string) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[2];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, poly-api-key, poly-signature, poly-timestamp, poly-passphrase',
  };
};

const CLOB_API = 'https://clob.polymarket.com';

interface OrderRequest {
  signedOrder: any; // User-signed order payload
  orderType?: string; // GTC, FOK, etc
  userApiKey?: string; // User's L2 API key
  userSignature?: string; // User's L2 signature
  userTimestamp?: string; // User's L2 timestamp
  userPassphrase?: string; // User's L2 passphrase
}

interface OrderResponse {
  orderId?: string;
  orderID?: string;
  status?: 'submitted' | 'confirmed' | 'failed' | 'live' | 'matched' | 'delayed' | 'unmatched';
  error?: string;
  success?: boolean;
  errorMsg?: string;
  transactionsHashes?: string[];
  orderHashes?: string[];
}

// Build builder HMAC signature (from @polymarket/builder-signing-sdk logic)
function buildHmacSignature(
  secret: string,
  timestamp: string,
  method: string,
  requestPath: string,
  body?: string
): string {
  const message = timestamp + method + requestPath + (body || '');
  const hmac = createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('base64');
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
    const body: OrderRequest = await req.json();
    const { signedOrder, orderType, userApiKey, userSignature, userTimestamp, userPassphrase } = body;

    // Validate required fields
    if (!signedOrder) {
      return new Response(
        JSON.stringify({ error: 'Missing signedOrder' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[poly-order] Submitting user-signed order with builder attribution');

    // Get builder credentials from secrets
    const builderApiKey = Deno.env.get('POLY_BUILDER_API_KEY');
    const builderSecret = Deno.env.get('POLY_BUILDER_SECRET');
    const builderPassphrase = Deno.env.get('POLY_BUILDER_PASSPHRASE');

    console.log('[poly-order] Checking builder credentials:', {
      hasApiKey: !!builderApiKey,
      hasSecret: !!builderSecret,
      hasPassphrase: !!builderPassphrase,
    });

    const useBuilderAttribution = builderApiKey && builderSecret && builderPassphrase;
    
    if (!useBuilderAttribution) {
      console.warn('[poly-order] Builder credentials not configured - submitting without builder attribution');
    }

    // Prepare order payload according to Polymarket API spec
    // https://docs.polymarket.com/developers/CLOB/orders/create-order
    const orderPayload = {
      order: signedOrder,
      owner: userApiKey || builderApiKey || '', // API key of order owner
      orderType: orderType || 'GTC',
    };

    const bodyString = JSON.stringify(orderPayload);
    const timestamp = Date.now().toString();
    const method = 'POST';
    const requestPath = '/order';

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useBuilderAttribution) {
      // Build builder HMAC signature
      const builderSignature = buildHmacSignature(
        builderSecret!,
        timestamp,
        method,
        requestPath,
        bodyString
      );

      // Add builder authentication headers
      headers['POLY-API-KEY'] = builderApiKey!;
      headers['POLY-SIGNATURE'] = builderSignature;
      headers['POLY-TIMESTAMP'] = timestamp;
      headers['POLY-PASSPHRASE'] = builderPassphrase!;

      // Add user L2 auth headers if provided
      if (userApiKey && userSignature && userTimestamp && userPassphrase) {
        headers['X-USER-API-KEY'] = userApiKey;
        headers['X-USER-SIGNATURE'] = userSignature;
        headers['X-USER-TIMESTAMP'] = userTimestamp;
        headers['X-USER-PASSPHRASE'] = userPassphrase;
      }
    } else {
      // Without builder attribution, use user L2 credentials directly
      if (!userApiKey || !userSignature || !userTimestamp || !userPassphrase) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing user L2 credentials. Orders require either builder or user authentication.',
            status: 'failed',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      headers['POLY-API-KEY'] = userApiKey;
      headers['POLY-SIGNATURE'] = userSignature;
      headers['POLY-TIMESTAMP'] = userTimestamp;
      headers['POLY-PASSPHRASE'] = userPassphrase;
    }

    console.log('[poly-order] Forwarding to CLOB with builder + user auth');
    console.log('[poly-order] Request headers:', Object.keys(headers));
    console.log('[poly-order] Request body preview:', bodyString.substring(0, 200));

    // Forward to Polymarket CLOB
    const response = await fetch(`${CLOB_API}/order`, {
      method: 'POST',
      headers,
      body: bodyString,
    });

    const responseText = await response.text();
    console.log('[poly-order] Raw CLOB response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseText: responseText.substring(0, 500), // First 500 chars
    });

    let responseData: OrderResponse;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = {
        status: response.ok ? 'submitted' : 'failed',
        error: responseText,
      };
    }

    console.log('[poly-order] Parsed CLOB response:', {
      status: response.status,
      ok: response.ok,
      orderId: responseData.orderID || responseData.orderId,
      fullResponse: responseData,
    });

    // Check for Polymarket API errors
    if (!response.ok || responseData.success === false) {
      console.error('[poly-order] Polymarket API error:', responseData);
      return new Response(
        JSON.stringify({
          success: false,
          errorMsg: responseData.errorMsg || responseData.error || `CLOB error: ${response.status}`,
          status: 'failed',
          error: responseData.errorMsg || responseData.error || `CLOB error: ${response.status}`,
        }),
        { 
          status: response.status || 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        
      );
    }

    // Return Polymarket's response directly (no mocking)
    return new Response(
      JSON.stringify({
        success: responseData.success !== undefined ? responseData.success : true,
        errorMsg: responseData.errorMsg || responseData.error || '',
        orderId: responseData.orderID || responseData.orderId,
        transactionsHashes: responseData.transactionsHashes || responseData.orderHashes || [],
        status: responseData.status || 'submitted',
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('[poly-order] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message, 
        status: 'failed',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
