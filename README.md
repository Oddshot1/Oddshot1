# ODDSHOT

**Find → Decide → Execute**

A comprehensive prediction market trading platform built for Polymarket. Find opportunities through signals and analysis, make informed decisions with AI assistance, and execute trades with confidence.

---

## 🎯 What is ODDSHOT?

ODDSHOT is an advanced trading interface for prediction markets that helps traders:

- **Spot opportunities** through real-time signals (flow spikes, momentum shifts, unusual activity)
- **Understand the edge** with market analysis, confidence scoring, and invalidation levels
- **Identify arbitrage** across venues and markets
- **Find yield plays** in near-expiry positions with measurable returns
- **Get AI insights** by asking questions about markets like talking to an experienced trader
- **Execute efficiently** through intuitive guided mode or advanced terminal views

---

## ✨ Core Features

### 🔍 Signals
Real-time market scanning that identifies:
- **Flow Spikes** - Unusual trading activity and volume concentration
- **Momentum Shifts** - Price movement acceleration and trend changes
- **Late Swings** - Last-minute market moves with analysis depth
- Confidence scoring (High/Medium/Low) with clear invalidation levels

### 🎯 Edge Detection
Market opportunity analysis including:
- **Market vs Model** - Comparing odds against fair probability
- **Market vs Venue** - Cross-venue price discrepancies
- **Distortion Detection** - Mispriced probabilities and arb setups
- Execution plans with position sizing guidance

### 💰 Arbitrage Finder
Cross-venue opportunity identification:
- Intra-market arbitrage (YES/NO imbalances)
- Multi-outcome arbs (2+ correlated markets)
- Venue arbs (Polymarket vs other prediction markets)
- Clear execution paths with expected EV

### 📈 Yield Scanner
Near-expiry position analysis:
- **APR Preview** - Annualized returns if position settles in your favor
- **Risk Labels** - Clear invalidation and settlement risks
- **Time Value** - Days/hours remaining with settlement probabilities
- Built for hold-to-settlement strategies

### 🤖 AI Assistant
Conversational trading insights:
- Ask questions about any market and get contextual analysis
- Summarize what's priced in vs what's missing
- Connect news/events to odds implications
- Explain market dynamics from multiple angles

### 📊 Portfolio Management
Complete position and P&L tracking:
- **Open Positions** - All active bets with live P&L
- **Trading History** - Complete record of all trades with settlement outcomes
- **Balance Display** - Real-time USDC balance in proxy wallet
- **Quick Actions** - Fund, Withdraw, Cash out directly from interface

### 🎮 Dual Mode Interface
- **Guided Mode** - Focused view showing the single best opportunity now
- **Terminal Mode** - Dense tables, scanners, and raw data for power users

---

## 🚀 Getting Started

### Prerequisites
- [Phantom Wallet](https://phantom.app) with EVM enabled
- Some USDC on Polygon to start trading

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

### Deployment

```bash
npm run build
npm run preview
```

Deploy to Vercel, Netlify, or any static host.

---

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Pages** - Markets, Portfolio, Signals, Assistant, Yield, Edge, etc.
- **Hooks** - Custom React hooks for market data, trading, portfolio
- **Components** - Reusable UI components (shadcn/ui + Tailwind)
- **State** - TanStack Query for server state, Context for client state

### Backend (Supabase Edge Functions)
```
poly-markets        → Fetch and filter Polymarket markets
poly-portfolio      → Get user positions and P&L
poly-order          → Execute trades with builder attribution
poly-balance        → Query USDC balance via blockchain RPC
poly-profile        → Get Polymarket profile and proxy wallet
trade-assistant     → AI chat with market context
poly-geoblock       → Check trading eligibility
odds-api            → Fetch sports odds (for correlation analysis)
polymarket-sports   → Sports outcome prediction analysis
rundown-odds        → Gather odds from multiple sportsbooks
```

### External Integrations
- **Polymarket** - Markets, CLOB API, Gamma API, Data API
- **Phantom Wallet** - EVM signing, balance queries
- **Supabase** - Edge functions, secrets management
- **OpenAI** (or compatible) - AI assistant backend
- **The Odds API** - Sports odds aggregation

---

## 🔒 Security

- ✅ **JWT Authentication** - All Edge Functions require valid tokens
- ✅ **CORS Protection** - Whitelisted origins only
- ✅ **Rate Limiting** - 10 requests/minute per IP to prevent abuse
- ✅ **No Private Keys** - Wallet signing happens client-side only
- ✅ **Secure Secrets** - API keys stored in Supabase, never in code
- ✅ **Phantom Integration** - User controls all transaction signing

**See [SECURITY.md](SECURITY.md) for complete security details and deployment checklist.**

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| **State** | TanStack Query, Context API |
| **Wallet** | Phantom + Solana Wallet Adapter |
| **Backend** | Supabase Edge Functions (Deno) |
| **APIs** | Polymarket CLOB/Gamma/Data, The Odds API |
| **AI** | OpenAI (configurable via env vars) |
| **Deployment** | Vercel/Netlify, Supabase Edge Functions |

---

## 📁 Project Structure

```
src/
├── pages/              # Route pages (Markets, Portfolio, etc.)
├── components/         # Reusable React components
│   ├── market/        # Market card, chart, trading ticket
│   ├── polymarket/    # Trading modals, integration
│   ├── signals/       # Signal cards and display
│   ├── ui/            # Base UI components (shadcn)
│   └── shared/        # Header, wallet, navigation
├── hooks/             # Custom React hooks for data fetching
├── contexts/          # React Context providers
├── lib/               # Utilities, formatters, types
└── integrations/      # External service clients (Supabase)

supabase/
├── functions/         # 20+ Edge Functions (deno)
├── migrations/        # Database schema (if using)
└── config.toml        # Supabase configuration
```

---

## 🎯 Development

### Scripts
```bash
npm run dev          # Start dev server (port 8082)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Environment Variables

See `.env.example` for all available options. Key variables:

```env
# Frontend
VITE_SUPABASE_URL              # Your Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key

# Supabase Secrets (set in dashboard)
AI_PROVIDER                    # openai, groq, anthropic, etc
AI_API_KEY                     # Your AI provider API key
AI_MODEL                       # Model to use (gpt-3.5-turbo, etc)
ODDS_API_KEY                   # The Odds API key
```

### Making Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run linter: `npm run lint`
4. Commit with semantic messages: `git commit -m "feat: Add new feature"`
5. Push and create PR

---

## 🎯 Roadmap

- [ ] Direct gasless withdrawals (Relayer integration)
- [ ] Advanced charting with technical indicators
- [ ] Price alerts and notifications
- [ ] Multi-position automated strategies
- [ ] Market creation and custom markets
- [ ] Mobile app (React Native)

---

## 📞 Support & Contributing

- **Issues**: [GitHub Issues](https://github.com/Oddshot1/Oddshot1/issues)
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting
- **Documentation**: See [SECURITY.md](SECURITY.md) for deployment guides

---

## 📄 Attribution

This project integrates with:
- **Polymarket** - Prediction markets infrastructure
- **Phantom Wallet** - Solana/EVM wallet
- **Supabase** - Backend infrastructure
- **OpenAI/compatible** - AI capabilities

All rights to those services remain with their respective owners.
