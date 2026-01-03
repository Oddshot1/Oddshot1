# 🔒 ODDSHOT Security Policy

## Overview

This document outlines the security measures implemented in ODDSHOT and guidelines for secure deployment and usage.

---

## ✅ Security Improvements (Latest)

### JWT Authentication
- **Status**: ✅ **Enabled on all Edge Functions**
- All Supabase Edge Functions now require valid JWT tokens
- Configured in `supabase/config.toml`

### CORS Protection
- **Status**: ✅ **Restricted to whitelisted origins**
- Only allows requests from:
  - `http://localhost:8082` (Development)
  - `http://localhost:3000` (Development)
  - `https://oddshot1.vercel.app` (Production)
- Update these origins in each function as needed
- Removed wildcard `*` origin access

### Rate Limiting
- **Status**: ✅ **Implemented**
- 10 requests per minute per client IP
- Prevents API abuse and quota exhaustion
- Configured in Edge Functions

### Secrets Management
- ✅ API Keys stored in Supabase Secrets (not in code)
- ✅ Private keys never stored on server
- ✅ `.env` files excluded from git
- ✅ Example `.env.example` provided for developers

---

## 🚀 Deployment Checklist

Before deploying to production, ensure:

### 1. Environment Variables

Set these in your Supabase project secrets:

```bash
# AI Provider Configuration (choose one)
AI_PROVIDER=openai                    # or: groq, anthropic, etc
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-3.5-turbo               # or your chosen model
# AI_API_ENDPOINT=https://...        # Optional: for custom endpoints

# Trading APIs
ODDS_API_KEY=your_odds_api_key
```

### 2. CORS Origins

Update `ALLOWED_ORIGINS` in each Edge Function:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8082',           // Dev
  'http://localhost:3000',           // Dev
  'https://your-production-domain.com',  // Production
];
```

### 3. Vercel/Production Settings

Update `.env.production`:
```env
VITE_SUPABASE_URL=https://xbwapzyivpqjvovcgnja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key
```

### 4. Test JWT Protection

Verify that Edge Functions reject unauthenticated requests:
```bash
# Should fail (no token)
curl https://your-function-url

# Should succeed (with token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://your-function-url
```

---

## 🛡️ Security Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # ✅ Good
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   
   # ❌ Bad
   git add .env  # Never do this!
   ```

2. **Use environment variables**
   ```typescript
   // ✅ Good
   const apiKey = Deno.env.get("API_KEY");
   
   // ❌ Bad
   const apiKey = "sk_live_xxx";  // Hardcoded!
   ```

3. **Test locally before deploying**
   ```bash
   npm run dev
   # Test all features locally first
   ```

4. **Rotate API keys regularly**
   - Update in Supabase Secrets quarterly
   - Revoke old keys immediately

### For Users

1. **Connect only your Phantom wallet**
   - ODDSHOT never stores private keys
   - All trades require your signature
   
2. **Session Security**
   - L2 credentials expire after 24 hours
   - Automatically removed from browser storage
   
3. **Verify transactions**
   - Check order confirmation before executing
   - Use order history to track all trades

---

## 🔍 What We Monitor

### Error Logging
All Edge Functions log errors to Supabase:
```
- Function failures
- Rate limit violations
- Invalid API key usage
- CORS rejections
```

Check logs in Supabase Dashboard → Edge Functions → Logs

### Metrics to Monitor
```
- Request rate by origin
- Error rate per function
- Rate limit violations
- Response times
```

---

## 🚨 Incident Response

### If an API Key is Exposed

1. **Immediately**
   - Go to Supabase Dashboard
   - Update the exposed key in Secrets
   - Restart all Edge Functions

2. **Notify users** (if applicable)
   - Clear any cached credentials
   - Request users reconnect wallets

3. **Document the incident**
   - Date and time discovered
   - Scope of exposure
   - Remediation steps taken

### If a User's Wallet is Compromised

1. **ODDSHOT cannot help recover funds** (by design)
2. Users should:
   - Disconnect wallet from ODDSHOT
   - Revoke Polygon permissions
   - Use Polymarket's official interface to withdraw

---

## 📊 Security Audit Results

| Component | Status | Details |
|-----------|--------|---------|
| **JWT Authentication** | ✅ Enabled | All functions require JWT |
| **CORS Protection** | ✅ Restricted | Whitelisted origins only |
| **Rate Limiting** | ✅ Implemented | 10 req/min per IP |
| **Secrets Management** | ✅ Secure | No hardcoded keys |
| **Private Keys** | ✅ Safe | Never stored server-side |
| **.env Exclusion** | ✅ Configured | Excluded from git |
| **HTTPS Enforcement** | ✅ Enabled | Production only |

---

## 🔗 References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Polymarket Documentation](https://polymarket.com)
- [Phantom Wallet Documentation](https://phantom.app)

---

## 📧 Security Contact

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email the maintainers directly (configure in your .env.local)
3. Provide:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact

---

## 📝 Changelog

### v1.1.0 - January 3, 2026
- ✅ Enabled JWT verification on all Edge Functions
- ✅ Added CORS whitelisting
- ✅ Implemented rate limiting (10 req/min)
- ✅ Migrated to provider-agnostic AI integration
- ✅ Added comprehensive security documentation

### v1.0.0 - Previous Release
- Initial deployment

---

**Last Updated**: January 3, 2026  
**Status**: ✅ Production Ready (with checklist completed)
