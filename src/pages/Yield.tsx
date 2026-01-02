import { useMemo } from "react";
import { Percent, Info, Clock, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { formatTimeLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";

interface YieldOpp {
  id: string;
  marketId: string;
  title: string;
  direction: "YES" | "NO";
  price: number;
  returnToExpiryPct: number;
  annualizedAprPct: number;
  timeToExpiryHours: number;
  riskNote: string;
  expiresAt: string;
}

function generateYieldOpps(markets: any[]): YieldOpp[] {
  if (!markets || markets.length === 0) return [];

  const now = Date.now();
  const opps: YieldOpp[] = [];

  for (const m of markets) {
    // Skip if no valid expiry date
    if (!m.expiresAt) continue;
    
    const expiryTime = new Date(m.expiresAt).getTime();
    
    // Skip if expiry date is invalid (NaN check)
    if (isNaN(expiryTime)) continue;
    
    const hoursToExpiry = (expiryTime - now) / (1000 * 60 * 60);
    const daysToExpiry = hoursToExpiry / 24;

    // Skip markets expiring in less than 6h (too short) or more than 2 years
    // Also skip if hoursToExpiry is negative (already expired)
    if (hoursToExpiry < 6 || hoursToExpiry > 17520) continue;

    // Skip low liquidity
    if (m.liquidity < 10000) continue;

    // Check YES side opportunity (buy YES, get $1 if YES wins)
    const yesPrice = m.yesProb;
    if (yesPrice > 0.6 && yesPrice < 0.98) {
      const returnPct = (1 - yesPrice) / yesPrice;
      const annualized = returnPct * (365 / Math.max(daysToExpiry, 0.25)); // Min 6 hours for APR calc
      
      if (returnPct > 0.03) { // At least 3% return
        opps.push({
          id: `yield-yes-${m.id}`,
          marketId: m.id,
          title: m.title,
          direction: "YES",
          price: yesPrice,
          returnToExpiryPct: returnPct,
          annualizedAprPct: annualized,
          timeToExpiryHours: hoursToExpiry,
          riskNote: generateRiskNote(m, "YES", yesPrice),
          expiresAt: m.expiresAt
        });
      }
    }

    // Check NO side opportunity (buy NO, get $1 if NO wins)
    const noPrice = m.noProb;
    if (noPrice > 0.6 && noPrice < 0.98) {
      const returnPct = (1 - noPrice) / noPrice;
      const annualized = returnPct * (365 / Math.max(daysToExpiry, 0.25)); // Min 6 hours for APR calc
      
      if (returnPct > 0.03) {
        opps.push({
          id: `yield-no-${m.id}`,
          marketId: m.id,
          title: m.title,
          direction: "NO",
          price: noPrice,
          returnToExpiryPct: returnPct,
          annualizedAprPct: annualized,
          timeToExpiryHours: hoursToExpiry,
          riskNote: generateRiskNote(m, "NO", noPrice),
          expiresAt: m.expiresAt
        });
      }
    }
  }

  // Sort by return to expiry (best first), limit to 12
  return opps.sort((a, b) => b.returnToExpiryPct - a.returnToExpiryPct).slice(0, 12);
}

function generateRiskNote(market: any, direction: "YES" | "NO", price: number): string {
  const prob = Math.round(price * 100);
  const daysLeft = Math.round((new Date(market.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft > 180) {
    return `Long duration (${daysLeft}d). Outcome remains uncertain over extended period.`;
  }
  if (prob > 90) {
    return `High confidence (${prob}%), but upset still possible. Low return reflects low risk.`;
  }
  if (prob > 80) {
    return `Market favors ${direction} at ${prob}%. Unexpected events could flip outcome.`;
  }
  return `${direction} priced at ${prob}%. Market conditions can shift before expiry.`;
}

export default function Yield() {

  const { data: markets, isLoading } = usePolymarketMarkets(400);

  const yieldOpps = useMemo(() => {
    return generateYieldOpps(markets || []);
  }, [markets]);

  return (
    <>
      <SEOHead title={seoContent.yield.title} description={seoContent.yield.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            YIELD OPPORTUNITIES
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Carry-style returns to expiry from live markets
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">
          {/* Header Actions */}
          <div className="flex items-center justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors"
                >
                  <Info className="h-4 w-4" />
                  About APR
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">Annualized APR Warning</p>
                <p className="mt-1 text-muted-foreground">
                  Short-dated markets can show extreme APRs. Always focus on "Return to Expiry" as the primary metric.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Info Banner */}
          <Card className="p-4 border-white/10 bg-[#0A0A0A]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Yield is Not Guaranteed</p>
                <p className="text-muted-foreground mt-1">
                  These opportunities assume the predicted outcome occurs. If the market resolves against your position, you lose your stake.
                </p>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent animate-pulse">
                  <div className="space-y-4">
                    <div className="h-6 bg-white/5 rounded w-16" />
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-8 bg-white/5 rounded w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && yieldOpps.length === 0 && (
            <Card className="p-12 text-center border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
              <h2 className="text-lg font-medium mb-2">No yield opportunities right now</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Check back later — opportunities depend on market conditions
              </p>
              <Link to="/app">
                <Button className="gap-2 bg-[#1A1A1A] text-white hover:bg-background/50 hover:text-purple-400 transition-colors">Browse Markets</Button>
              </Link>
            </Card>
          )}

          {/* Opportunities */}
          {!isLoading && yieldOpps.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4 auto-rows-fr">
              {yieldOpps.map((opp) => {
                const hoursLeft = opp.timeToExpiryHours;
                const timeDisplay = hoursLeft < 24 
                  ? `${Math.round(hoursLeft)}h` 
                  : `${Math.round(hoursLeft / 24)}d`;
                
                // Find the market for thumbnail
                const market = markets?.find(m => m.id === opp.marketId);

                return (
                  <Card key={opp.id} className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer flex flex-col h-full">
                    <div className="space-y-4 flex-1 flex flex-col">
                      {/* Header with thumbnail */}
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        {market && (
                          <MarketThumbnail 
                            thumbnail={market.thumbnail} 
                            category={market.category} 
                            size="md" 
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <Badge 
                            className={cn(
                              "text-[10px] px-2 py-0.5 border-0 pointer-events-none",
                              opp.direction === "YES" ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" : "bg-red-500/10 text-red-400 hover:bg-red-500/10"
                            )}
                          >
                            {opp.direction}
                          </Badge>
                          <Link to={`/app/market/${opp.marketId}`}>
                            <h3 className="font-medium text-sm mt-2 hover:text-purple-400 transition-colors line-clamp-2">
                              {opp.title}
                            </h3>
                          </Link>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                            {(opp.returnToExpiryPct * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">to expiry</div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Entry Price</span>
                          <p className="font-mono text-lg font-semibold">{Math.round(opp.price * 100)}¢</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Time Left</span>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold">{timeDisplay}</span>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                APR
                                <Info className="h-3 w-3" />
                              </span>
                              <p className="font-mono text-yellow-400 font-semibold">
                                {(opp.annualizedAprPct * 100).toFixed(0)}%
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            Annualized; short-dated markets can look extreme.
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Spacer to push content to bottom */}
                      <div className="flex-1"></div>

                      {/* Risk Note */}
                      <div className="text-xs text-muted-foreground p-2 rounded bg-[#1A1A1A]/50 border border-white/10">
                        <span className="font-medium text-yellow-400">Risk: </span>
                        {opp.riskNote}
                      </div>

                      {/* CTA */}
                      <div className="pt-2">
                        <Link to={`/app/market/${opp.marketId}`}>
                          <Button className="w-full gap-2 bg-[#1A1A1A] text-white hover:bg-background/50 hover:text-purple-400 transition-colors border-0">
                            <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                              <Zap className="h-3 w-3 text-white" />
                            </div>
                            Trade {opp.direction}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
