# 🎯 ODDSHOT Decision Cockpit

A modern Polymarket trading interface with Phantom wallet integration.

## ✅ Features

### Trading
- ✅ Browse markets from Polymarket
- ✅ Real-time price quotes
- ✅ Place orders (Buy YES/NO positions)
- ✅ L2 authentication with signature
- ✅ Order confirmation and tracking

### Portfolio Management
- ✅ View all open positions
- ✅ Live P&L tracking
- ✅ Balance display (USDC)
- ✅ Position details (outcome, shares, value)
- ✅ **Trading history with P&L**

### Actions
- ✅ **Fund:** Deposit USDC via Phantom wallet
- ✅ **Cash Out:** Sell positions back to market
- ✅ **Withdraw:** Redirect to Polymarket.com for secure withdrawals
- ✅ **History:** View all past trades, buys, sells, wins, and losses

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file:
```env
VITE_SUPABASE_URL=https://xbwapzyivpqjvovcgnja.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: **http://localhost:8082**

---

## 📊 How It Works

### Wallet Connection
- Uses **Phantom Wallet** with EVM compatibility
- Connects to Polygon network
- Fetches Polymarket profile and proxy wallet

### Trading
- Fetches markets from Polymarket Gamma API
- Places orders via CLOB API
- Handles L2 authentication automatically

### Portfolio
- Fetches positions from Polymarket Data API
- Calculates real-time P&L
- Displays balance from proxy wallet

### History
- Uses **Polymarket's public Data API** (no auth required!)
- Fetches all trades directly from `https://data-api.polymarket.com/activity`
- Shows: Bought, Sold, Won, Lost with P&L

### Withdrawals
- Opens Polymarket.com with clear instructions
- Gasless withdrawals via official interface
- Secure Gnosis Safe proxy wallet

---

## 🎨 UI Features

- 🎨 Beautiful gradient cards
- 📊 Live P&L indicators (green/red)
- 💰 Balance display with funding CTA
- 📋 Tab navigation (Positions/History)
- 🔗 Direct links to markets
- ⚡ Real-time HMR updates
- 📱 Responsive design

---

## 🔧 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Wallet:** Phantom (Solana + EVM)
- **APIs:** Polymarket CLOB, Gamma, Data APIs
- **Backend:** Supabase Edge Functions (for portfolio/orders only)
- **State:** TanStack Query

---

## 📁 Project Structure

```
src/
├── hooks/
│   ├── use-polymarket-order.ts       # Trading
│   ├── use-polymarket-sell.ts        # Cash out
│   ├── use-polymarket-history.ts     # History (public API)
│   ├── use-polymarket-portfolio.ts   # Portfolio
│   └── use-phantom-evm.ts            # Wallet
├── components/
│   ├── market/TradeTicket.tsx        # Trading UI
│   ├── polymarket/
│   │   ├── CashOutModal.tsx          # Sell positions
│   │   └── WithdrawModal.tsx         # Withdrawal redirect
│   └── shared/
│       └── WalletButton.tsx          # Connect wallet
└── pages/
    ├── Portfolio.tsx                 # Main portfolio page
    └── MarketDetail.tsx              # Market detail page
```

---

## 🎉 Status

**100% Complete and Working!** 🚀

| Feature | Status | Notes |
|---------|--------|-------|
| Wallet Connection | ✅ Live | Phantom EVM |
| Market Browsing | ✅ Live | Real-time data |
| Trading | ✅ Live | Buy/Sell with L2 auth |
| Portfolio | ✅ Live | Positions + P&L |
| Funding | ✅ Live | USDC deposits |
| Cash Out | ✅ Live | Sell positions |
| Withdrawal | ✅ Live | Via polymarket.com |
| **History** | ✅ **Live** | **Public Data API** |

---

## � Security

- ✅ JWT Authentication enabled on all Edge Functions
- ✅ CORS restricted to whitelisted origins
- ✅ Rate limiting: 10 requests/minute per IP
- ✅ All trading requires wallet signatures
- ✅ L2 credentials stored in sessionStorage (24h TTL)
- ✅ No private keys stored on server
- ✅ Secrets managed via Supabase Secrets
- ✅ Withdrawals via official Polymarket interface

**See [SECURITY.md](SECURITY.md) for complete security policy and deployment checklist.**

---

## 🎯 Future Enhancements

- [ ] Direct withdrawals (requires Relayer API access)
- [ ] Advanced charting
- [ ] Price alerts
- [ ] Multi-position trading
