import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS Configuration - Restrict to your production domain
const ALLOWED_ORIGINS = [
  "http://localhost:8082",
  "http://localhost:3000",
  "https://oddshot1.vercel.app",
  // Add your production domain here
];

const corsHeaders = (origin?: string) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[2];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

// Simple rate limiting (in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count < maxRequests) {
    existing.count++;
    return true;
  }
  
  return false;
}

const SYSTEM_PROMPT = `You are ODDSHOT's AI Trading Assistant - an expert in prediction markets, especially Polymarket.

🚨 CRITICAL RULES - NEVER BREAK THESE:
1. NEVER EVER say "I need more information" or "Please provide market data"
2. The user's message ALWAYS includes [AVAILABLE MARKET DATA] section
3. You MUST use the markets listed in that section
4. If you cannot see market data, analyze the first market listed and provide a recommendation anyway
5. ALWAYS provide specific recommendations with actual market titles from the data

FORMATTING RULES:
- DO NOT use markdown formatting like ** or * or __ or _
- DO NOT use headers with #
- DO NOT use bullet points with - or *
- Use plain text only with clear section labels followed by colons
- Use numbered lists (1. 2. 3.) when listing items

When a user asks for "best opportunities" or "top trades":
1. Look at the [AVAILABLE MARKET DATA] section in their message
2. Look at the [LIVE SIGNALS] section in their message
3. Pick the 3 most promising opportunities based on:
   - Markets with signals (especially High confidence)
   - Markets with recent price movement (24h change)
   - Markets with good volume and liquidity
   - Markets NOT at extreme prices (avoid 0-10% or 90-100%)
4. Provide detailed analysis for each using the format below

Response format for the top 3 opportunities (keep it concise):

OPPORTUNITY 1: [Exact market title from AVAILABLE MARKET DATA section]

PRICE: YES XX cents | NO XX cents
SIGNAL: [From LIVE SIGNALS if available]

WHY NOW
Brief explanation of the opportunity (2-3 sentences max).

THE CASE
1. Key supporting factor
2. Second supporting factor
3. Third supporting factor

TRADE PLAN
Action: BUY YES or BUY NO
Confidence: High or Medium or Low
Entry: XX cents
Target: XX cents
Risk: One sentence about main risk

---

[Repeat for OPPORTUNITY 2 and 3]

CRITICAL REMINDERS:
- Use EXACT market titles from the [AVAILABLE MARKET DATA] section
- Use EXACT prices shown in the data
- NEVER ask for more information - the data is right there
- Keep responses concise and actionable`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("origin") || undefined) });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP, 10, 60000)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 10 requests per minute." }),
        { status: 429, headers: { ...corsHeaders(req.headers.get("origin") || undefined), "Content-Type": "application/json" } }
      );
    }

    // Get AI provider configuration
    const AI_PROVIDER = Deno.env.get("AI_PROVIDER") || "openai";
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    
    if (!AI_API_KEY) {
      throw new Error(`${AI_PROVIDER.toUpperCase()}_API_KEY is not configured`);
    }

    const { message, marketContext, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error("Message is required");
    }

    // Build messages array
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add market context if provided
    if (marketContext) {
      let contextContent = `LIVE MARKET DATA (Total markets tracked: ${marketContext.totalMarketsAvailable || 0})\n\n`;
      
      // Add top markets
      if (marketContext.topMarkets && marketContext.topMarkets.length > 0) {
        contextContent += `TOP MARKETS:\n`;
        marketContext.topMarkets.forEach((m: any, i: number) => {
          contextContent += `\n${i + 1}. ${m.title}
   Category: ${m.category}
   YES: ${Math.round(m.yesProb * 100)}¢ | NO: ${Math.round(m.noProb * 100)}¢
   24h Change: ${(m.change24h * 100).toFixed(1)}%
   24h Volume: $${m.volume24h?.toLocaleString() || 'N/A'}
   Liquidity: ${m.liquidity || 'N/A'}
   Expires: ${m.expiresAt || 'N/A'}\n`;
        });
      }
      
      // Add signals
      if (marketContext.signals && marketContext.signals.length > 0) {
        contextContent += `\nLIVE SIGNALS:\n`;
        marketContext.signals.forEach((s: any, i: number) => {
          contextContent += `\n${i + 1}. ${s.headline}
   Type: ${s.type}
   Confidence: ${s.confidence}
   Market: ${s.marketTitle || 'N/A'}\n`;
        });
      }
      
      messages.push({
        role: "system",
        content: contextContent
      });
    }

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current message
    messages.push({ role: "user", content: message });

    console.log(`Calling ${AI_PROVIDER} with ${messages.length} messages`);

    // Call AI provider (OpenAI compatible API)
    const aiEndpoint = AI_PROVIDER === "openai" 
      ? "https://api.openai.com/v1/chat/completions"
      : `${Deno.env.get("AI_API_ENDPOINT") || ""}/chat/completions`;

    const response = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL") || "gpt-3.5-turbo",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${AI_PROVIDER} error:`, response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    console.log("AI response generated successfully");

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        model: data.model,
      }),
      { headers: { ...corsHeaders(req.headers.get("origin") || undefined), "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Trade assistant error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders(req.headers.get("origin") || undefined), "Content-Type": "application/json" } }
    );
  }
});
