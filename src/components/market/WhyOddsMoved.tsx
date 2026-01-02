import { Card } from "@/components/ui/card";
import type { Market, Signal } from "@/lib/types";

interface WhyOddsMovedProps {
  market: Market;
  signal?: Signal;
}

export function WhyOddsMoved({ market, signal }: WhyOddsMovedProps) {
  // Generate explanation based on market data
  let explanation = "Price is updating with recent trades.";
  
  if (signal) {
    if (signal.type === "FLOW_SPIKE") {
      explanation = "Large buy orders detected in the last hour, pushing price up.";
    } else if (signal.type === "ODDS_JUMP") {
      explanation = "Rapid price movement triggered by increased trading activity.";
    } else if (signal.type === "LATE_SWING") {
      explanation = "Late-stage volatility as expiry approaches.";
    } else if (signal.type === "SPLIT_CROWD") {
      explanation = "Market is evenly split, causing price fluctuation around 50%.";
    }
  } else if (Math.abs(market.change1h) > 0.05) {
    explanation = market.change1h > 0 
      ? "Strong buying pressure in the last hour."
      : "Selling pressure driving price down.";
  } else if (market.volume1h > 50000) {
    explanation = "High volume activity with balanced buy/sell orders.";
  }

  return (
    <Card className="p-4 border-white/10 bg-[#0A0A0A]">
      <h4 className="text-sm font-semibold mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Why odds moved</h4>
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </Card>
  );
}
