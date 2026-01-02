import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
}

export function SEOHead({ title, description, path = "" }: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", title);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute("content", description);
    }

  }, [title, description, path]);

  return null;
}

// SEO content for each page
export const seoContent = {
  landing: {
    title: "Oddshot – Smarter Prediction Market Trading",
    description: "Trade prediction markets with AI-powered signals, edge detection, and yield opportunities. Get smarter insights on Polymarket and more.",
  },
  markets: {
    title: "Markets – Oddshot",
    description: "Browse live prediction markets from Polymarket. Real-time prices, volume, and AI-powered trading signals.",
  },
  signals: {
    title: "Trading Signals – Oddshot",
    description: "Real-time trading signals for prediction markets. Flow spikes, odds jumps, and late swings detected automatically.",
  },
  edge: {
    title: "Edge Table – Oddshot",
    description: "Find mispriced prediction markets. Compare market odds to benchmark probabilities and spot profitable opportunities.",
  },
  yield: {
    title: "Yield Opportunities – Oddshot",
    description: "Carry-style returns from prediction markets. Find high-probability markets with attractive yields to expiry.",
  },
  lockIn: {
    title: "Lock-In Scanner – Oddshot",
    description: "Cross-venue arbitrage opportunities for prediction markets. Risk-free profit from price differences.",
  },
  assistant: {
    title: "AI Trading Assistant – Oddshot",
    description: "Get AI-powered trade recommendations for prediction markets. Structured analysis with clear reasoning.",
  },
  watchlist: {
    title: "Watchlist – Oddshot",
    description: "Track your favorite prediction markets. Set price alerts and monitor real-time changes.",
  },
  portfolio: {
    title: "Portfolio – Oddshot",
    description: "Track your prediction market positions. View P&L, manage risk, and optimize your trading.",
  },
  settings: {
    title: "Settings – Oddshot",
    description: "Customize your Oddshot experience. Switch between Guided and Terminal modes.",
  },
  legal: {
    title: "Legal & Disclaimers – Oddshot",
    description: "Terms of service, privacy policy, and risk disclosures for Oddshot prediction market platform.",
  },
  marketDetail: {
    title: (market: string) => `${market} – Oddshot`,
    description: (market: string) => `Trade ${market} on Oddshot. Live prices, charts, and AI-powered analysis.`,
  },
};
