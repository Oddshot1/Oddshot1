# Polymarket Builder Integration - ODDSHOT

## Overview

ODDSHOT is a prediction market trading platform that integrates with Polymarket to provide users with seamless access to prediction markets. This document outlines our implementation of the Polymarket Builder Program and our eligibility for the Builder Badge.

---

## 🎯 Builder Program Compliance

### ✅ Implemented Features

#### 1. **Order Attribution** (Required)
**Status:** ✅ Fully Implemented

We have integrated builder attribution across our entire trading flow using the official Polymarket SDKs:

**Implementation:**
- Using `@polymarket/clob-client` v5.1.3 for order placement
- Using `@polymarket/builder-signing-sdk` v0.0.8 for authentication
- Builder credentials configured with remote signing for security

**Code Locations:**
```typescript
// src/hooks/use-polymarket-order.ts
import { BuilderConfig } from '@polymarket/builder-signing-sdk';

const BUILDER_CONFIG = new BuilderConfig({
  remoteBuilderConfig: {
    url: `${SUPABASE_URL}/functions/v1/poly-builder-sign`
  }
});

const client = new ClobClient(
  'https://clob.polymarket.com',
  137,
  signer,
  userCredentials,
  signatureType,
  proxyWallet,
  undefined,
  undefined,
  BUILDER_CONFIG // ✅ Builder attribution enabled
);
```

**All Order Types Attributed:**
- ✅ Buy orders (8 ClobClient instances)
- ✅ Sell orders (cash-out functionality)
- ✅ Market orders (FOK/FAK)

#### 2. **Secure Remote Signing** (Best Practice)
**Status:** ✅ Fully Implemented

We follow Polymarket's recommended remote signing architecture:

**Server-Side Signing Service:**
```typescript
// supabase/functions/poly-builder-sign/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// HMAC-SHA256 signature generation
async function buildHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  path: string,
  body: string
): Promise<string>

serve(async (req) => {
  const { method, path, body } = await req.json();
  
  const key = Deno.env.get('POLY_BUILDER_API_KEY');
  const secret = Deno.env.get('POLY_BUILDER_SECRET');
  const passphrase = Deno.env.get('POLY_BUILDER_PASSPHRASE');
  
  const timestamp = Date.now().toString();
  const signature = await buildHmacSignature(...);
  
  return {
    POLY_BUILDER_API_KEY: key,
    POLY_BUILDER_TIMESTAMP: timestamp,
    POLY_BUILDER_PASSPHRASE: passphrase,
    POLY_BUILDER_SIGNATURE: signature,
  };
});
```

**Security Features:**
- ✅ Builder credentials stored server-side only (Supabase secrets)
- ✅ Never exposed in client-side code
- ✅ HMAC-SHA256 signature generation per request
- ✅ Request-level authentication

#### 3. **CLOB Integration** (Required)
**Status:** ✅ Fully Implemented

Complete integration with Polymarket's Central Limit Order Book:

**Features:**
- ✅ Off-chain order signing (EIP712)
- ✅ Market order placement (`createAndPostMarketOrder`)
- ✅ Real-time order book quotes
- ✅ Tick size and negRisk parameter handling
- ✅ Balance checking before orders
- ✅ L2 API credential management

**Order Flow:**
```
User → ClobClient (with BuilderConfig) → CLOB API → Blockchain Settlement
```

#### 4. **Fee Share** (Automatic)
**Status:** ✅ Enabled

By implementing builder attribution, we automatically qualify for fee share on all routed orders.

---

## ❌ Not Implemented (Optional)

### Gasless Transactions via RelayClient

**Status:** Not Implemented

**What this means:**
- Users currently use standard Polymarket proxy wallets
- Settlement gas fees handled by Polymarket's standard flow
- Users may pay gas fees (standard Polymarket behavior)

**Why not implemented:**
- Not required for Builder Badge
- Would require `RelayClient` implementation (4-7 hours additional work)
- Current implementation focuses on order attribution (badge requirement)

**Package status:**
- ✅ `@polymarket/builder-relayer-client` installed (v0.0.8)
- ❌ Not imported or used in codebase

---

## 🏗️ Technical Architecture

### Order Placement Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. User Places Order in ODDSHOT UI                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 2. Fetch Market Params (tickSize, negRisk)         │
│    via ClobClient.getTickSize/getNegRisk           │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 3. Request Builder Signature                        │
│    POST /poly-builder-sign                          │
│    Returns: HMAC signature + headers                │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 4. Create ClobClient with BuilderConfig            │
│    Includes builder authentication headers          │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 5. Sign Order with User's EOA                       │
│    EIP712 signature (off-chain)                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 6. Submit to CLOB API                               │
│    createAndPostMarketOrder()                       │
│    WITH builder attribution headers                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────┐
│ 7. CLOB Matches & Settles On-Chain                 │
│    Order attributed to ODDSHOT builder account      │
└─────────────────────────────────────────────────────┘
```

### Builder Authentication Headers

Every order submitted includes:
```typescript
{
  POLY_BUILDER_API_KEY: "our-builder-key",
  POLY_BUILDER_TIMESTAMP: "1704123456789",
  POLY_BUILDER_PASSPHRASE: "our-passphrase",
  POLY_BUILDER_SIGNATURE: "hmac-sha256-signature"
}
```

---

## 📦 Dependencies Used

### Polymarket Official SDKs

```json
{
  "@polymarket/clob-client": "^5.1.3",
  "@polymarket/builder-signing-sdk": "^0.0.8",
  "@polymarket/builder-relayer-client": "^0.0.8"
}
```

### Usage Status

| Package | Installed | Used | Purpose |
|---------|-----------|------|---------|
| `@polymarket/clob-client` | ✅ | ✅ | Order placement & trading |
| `@polymarket/builder-signing-sdk` | ✅ | ✅ | Builder authentication |
| `@polymarket/builder-relayer-client` | ✅ | ❌ | Gasless transactions (optional) |

---

## 🔐 Security Implementation

### Credential Management

**Builder Credentials:**
- Stored in Supabase secrets (server-side)
- Never exposed to client
- Accessed only by edge function

**Environment Variables:**
```bash
# Server-side only (Supabase)
POLY_BUILDER_API_KEY=<our-key>
POLY_BUILDER_SECRET=<our-secret>
POLY_BUILDER_PASSPHRASE=<our-passphrase>
```

**User Credentials:**
- Generated per user via `createOrDeriveApiKey()`
- Stored in sessionStorage (24h TTL)
- Used for L2 API authentication

---

## 📊 Order Attribution Verification

### How to Verify Our Orders

```bash
# Check builder stats
curl "https://clob.polymarket.com/builders/stats"

# Check builder leaderboard
curl "https://clob.polymarket.com/builders/leaderboard?period=week"

# Look for ODDSHOT's builder ID in the response
```

### Console Logs to Confirm Attribution

When placing orders, our console shows:
```
[usePolymarketOrder] ✅ ClobClient initialized with builder attribution
[poly-builder-sign] Signature generated successfully
[usePolymarketOrder] Submitting MARKET order to Polymarket CLOB...
```

---

## 🎯 Badge Eligibility Summary

### Required Features

| Feature | Status | Evidence |
|---------|--------|----------|
| **Builder Credentials** | ✅ Complete | Configured in Supabase secrets |
| **Order Attribution** | ✅ Complete | BuilderConfig in all ClobClient instances |
| **CLOB Integration** | ✅ Complete | Using official SDK methods |
| **Security Best Practices** | ✅ Complete | Remote signing implementation |
| **Fee Share** | ✅ Automatic | Enabled via attribution |

### Optional Features

| Feature | Status | Notes |
|---------|--------|-------|
| **Gasless Transactions** | ❌ Not Implemented | Optional for badge |
| **Relayer Access** | ❌ Not Implemented | Optional for badge |

---

## 📝 Code Modifications

### Files Modified for Builder Integration

1. **`supabase/functions/poly-builder-sign/index.ts`** (NEW)
   - Remote signing server
   - HMAC signature generation
   
2. **`src/hooks/use-builder-headers.ts`** (NEW)
   - Client hook for fetching builder headers

3. **`src/hooks/use-polymarket-order.ts`** (MODIFIED)
   - Added BuilderConfig to 5 ClobClient instances
   - Order attribution for buy orders

4. **`src/hooks/use-polymarket-sell.ts`** (MODIFIED)
   - Added BuilderConfig to 1 ClobClient instance
   - Order attribution for sell orders

5. **`src/hooks/use-polymarket-clob.ts`** (MODIFIED)
   - Builder config initialization
   - Remote signing configuration

---

## 🚀 Deployment

### Current Status

- ✅ Edge function deployed: `poly-builder-sign`
- ✅ Secrets configured in Supabase
- ✅ Builder credentials secured
- ✅ Production ready

### Testing

Orders can be placed through our platform at:
- Production URL: [Your production URL]
- Market trading: Fully functional
- Attribution: Active

---

## 📞 Contact & Support

**Platform:** ODDSHOT
**Builder Account:** [Your Builder ID if known]
**Contact:** [Your contact email]
**GitHub:** [Your GitHub repo]

---

## 🎉 Conclusion

**ODDSHOT meets all required criteria for the Polymarket Builder Badge:**

✅ **Order Attribution:** Fully implemented with remote signing
✅ **Security:** Best practices followed (server-side credentials)
✅ **CLOB Integration:** Complete using official SDKs
✅ **Fee Share:** Enabled automatically
✅ **Production Ready:** Deployed and functional

**Optional features not implemented:**
- Gasless transactions (not required for badge)
- RelayClient usage (future enhancement)

We believe ODDSHOT qualifies for the Builder Badge and request consideration for approval.

---

## 📚 References

- [Polymarket Builder Program](https://docs.polymarket.com/developers/builders/builder-intro)
- [CLOB Client Documentation](https://docs.polymarket.com/api-reference)
- [Builder Signing SDK](https://github.com/Polymarket/builder-signing-sdk)
- [Example Applications](https://github.com/Polymarket/builder-examples)

