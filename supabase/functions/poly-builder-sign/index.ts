// ODDSHOT Polymarket Builder Signing Service
// Securely signs CLOB API requests with builder credentials
// This keeps builder credentials server-side and never exposes them to the browser

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC-SHA256 signature builder (matching Polymarket's expected format)
async function buildHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  path: string,
  body: string
): Promise<string> {
  const message = `${timestamp}${method}${path}${body}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // Convert to base64
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { method, path, body } = await req.json();
    
    console.log('[poly-builder-sign] Signing request:', {
      method,
      path: path?.substring(0, 50),
      hasBody: !!body
    });
    
    // Get builder credentials from secure environment variables
    const key = Deno.env.get('POLY_BUILDER_API_KEY');
    const secret = Deno.env.get('POLY_BUILDER_SECRET');
    const passphrase = Deno.env.get('POLY_BUILDER_PASSPHRASE');
    
    if (!key || !secret || !passphrase) {
      console.error('[poly-builder-sign] Builder credentials not configured');
      throw new Error('Builder credentials not configured on server');
    }
    
    // Generate timestamp and signature
    const timestamp = Date.now().toString();
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    
    const signature = await buildHmacSignature(
      secret,
      parseInt(timestamp),
      method.toUpperCase(),
      path,
      bodyString
    );
    
    console.log('[poly-builder-sign] Signature generated successfully');
    
    // Return builder authentication headers
    return new Response(JSON.stringify({
      POLY_BUILDER_API_KEY: key,
      POLY_BUILDER_TIMESTAMP: timestamp,
      POLY_BUILDER_PASSPHRASE: passphrase,
      POLY_BUILDER_SIGNATURE: signature,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[poly-builder-sign] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error signing request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

