# ODDSHOT

**Find the trade before it's obvious.**

ODDSHOT scans top prediction market venues for mispriced odds, sharp flow, momentum shifts, arbitrage, and near-expiry yield. Get one clear plan per market: what to do, why it works, what breaks it, and when to exit.

---

## 🎯 What is ODDSHOT?

ODDSHOT is a multi-venue prediction market intelligence platform that helps traders find and execute opportunities across:

- **Polymarket** - Crypto/macro markets
- **Kalshi** - Real economic events
- **PredictIt** - Political forecasting
- **Pinnacle, FanDuel, BetMGM, Betfair** - Sports betting
- **+30 other sportsbooks** - Additional venues

With real-time scanning, edge detection, and a Solana-first execution layer. Built for beginners (Guided Mode) and professionals (Terminal Mode).

---

## 📊 Live Stats

- **500+** Markets Tracked
- **24/7** Real-time Signals
- **12K+** Edge Alerts Sent

---

## ✨ What You Get in One Cockpit

### 🔍 Signals
Spot where attention and money move first.
- Flow spikes, momentum shifts, unusual activity
- Filtered to high-signal markets only
- Confidence scoring with clear invalidation

### 🎯 Edge Detection
Know when the odds are off.
- Market vs model comparisons
- Market vs venue price discrepancies
- Mispriced probabilities identified
- Confidence and invalidation levels included

### 💰 Arbitrage +EV
Cross-venue and intra-market setups.
- YES/NO imbalance arbitrage
- Multi-outcome arbitrage (2+ correlated markets)
- Venue arbitrage opportunities
- Clear execution paths with expected EV

### 📈 Yield
Near-expiry positions with measurable implied return.
- APR preview for quick evaluation
- Risk labels and settlement probabilities
- Time-to-resolution countdown
- Built for "hold to settle" strategies

### 🤖 AI Assistant
Ask about any market like you'd ask a sharp friend.
- Explains what matters and what's priced in
- Summarizes news and context
- Connects macro events to market odds
- Real-time analysis

### 🎮 Guided + Terminal Modes
Same engine, two ways to trade.
- **Guided Mode**: One "Best Opportunity Now" with a clear plan
- **Terminal Mode**: Dense tables, scanners, and raw data for speed

---

## 🧠 Proof on Every Call

ODDSHOT doesn't throw picks at you. Every signal is tied to:
- ✅ **Timestamped** - See when the setup appeared and when it changed
- ✅ **Source + Snapshot** - Know which venue and quote the call is based on
- ✅ **Invalidation** - Know what would break the setup before you click trade

---

## ⚡ Solana-First Execution

Most opportunity lives across different venues and rails. ODDSHOT bridges Solana users across venues:

- Deposit SOL or USDC once
- Auto-swap and bridge behind the scenes
- Trade from the ODDSHOT flow, not ten tabs
- One wallet. One flow. No chain switching.

*Execution availability depends on venue and region.*

---

## 🚀 Getting Started

### Prerequisites
- [Phantom Wallet](https://phantom.app) with EVM enabled
- SOL or USDC for trading

### Installation

```bash
# Clone repository
git clone https://github.com/Oddshot1/Oddshot1.git
cd Oddshot1

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Fill in your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your_key

# Start development server
npm run dev
```

Open [http://localhost:8082](http://localhost:8082)

### Deploy

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Pages** - Markets, Portfolio, Signals, Edge, Yield, Assistant
- **Hooks** - Custom React hooks for multi-venue data fetching
- **Components** - Reusable UI components (shadcn/ui + Tailwind)
- **State** - TanStack Query for server state, Context for client state

### Backend (Supabase Edge Functions)
- `poly-markets` → Polymarket markets
- `kalshi-markets` → Kalshi markets
- `predictit-markets` → PredictIt markets
- `polymarket-sports` → Sports prediction on Polymarket
- `odds-api` → The Odds API (sportsbooks)
- `rundown-odds` → Rundown odds aggregation
- `poly-portfolio` → User positions and P&L
- `poly-order` → Trade execution with builder attribution
- `poly-balance` → USDC balance queries
- `poly-profile` → User profile and proxy wallet
- `trade-assistant` → AI chat with market context
- `poly-geoblock` → Trading eligibility checks
- And more...

### Multi-Venue Integration
- **Polymarket** - CLOB API, Gamma API, Data API
- **Kalshi** - Markets API
- **PredictIt** - Markets endpoint
- **The Odds API** - 200+ sportsbooks
- **Phantom Wallet** - Solana/EVM execution

---

## 🔒 Security

- ✅ **JWT Authentication** - All Edge Functions require valid tokens
- ✅ **CORS Protection** - Whitelisted origins only
- ✅ **Rate Limiting** - 10 requests/minute per IP
- ✅ **No Private Keys** - Wallet signing happens client-side only
- ✅ **Secure Secrets** - API keys stored in Supabase, never in code
- ✅ **Phantom Integration** - User controls all transaction signing

**See [SECURITY.md](SECURITY.md) for complete security details.**

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| **State** | TanStack Query, Context API |
| **Wallet** | Phantom + Solana Wallet Adapter |
| **Backend** | Supabase Edge Functions (Deno) |
| **APIs** | Polymarket, Kalshi, PredictIt, The Odds API |
| **AI** | OpenAI (configurable via env vars) |
| **Deployment** | Vercel, Supabase |

---

## 📁 Project Structure

```
src/
├── pages/              # Route pages (Markets, Portfolio, Signals, etc.)
├── components/         # Reusable React components
│   ├── market/        # Market display and trading
│   ├── polymarket/    # Polymarket-specific components
│   ├── signals/       # Signal display
│   ├── ui/            # Base UI components (shadcn)
│   └── shared/        # Header, wallet, navigation
├── hooks/             # Custom React hooks for data fetching
├── contexts/          # React Context providers
├── lib/               # Utilities, formatters, types
└── integrations/      # External service clients

supabase/
├── functions/         # 20+ Edge Functions (multi-venue support)
├── migrations/        # Database schemas
└── config.toml        # Supabase configuration
```

---

## 🎮 Development

### Scripts
```bash
npm run dev          # Start dev server (port 8082)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Environment Variables

See `.env.example` for all options:

```env
# Frontend
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key

# Supabase Secrets (set in dashboard)
AI_PROVIDER                    # openai, groq, anthropic, etc
AI_API_KEY                     # Your AI provider API key
AI_MODEL                       # Model to use
ODDS_API_KEY                   # The Odds API key
```

### Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Run linter: `npm run lint`
4. Commit: `git commit -m "feat: description"`
5. Push and create PR

---

## License

Code is available under MIT license. Services integrated (Polymarket, Kalshi, Phantom, Supabase) retain their respective terms.
