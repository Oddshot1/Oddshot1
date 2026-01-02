import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, TrendingUp, TrendingDown, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProbabilityChart } from "@/components/market/ProbabilityChart";
import { TradeTicket } from "@/components/market/TradeTicket";
import { OddshotRating } from "@/components/market/OddshotRating";
import { ActivityFeed } from "@/components/market/ActivityFeed";
import { WhyOddsMoved } from "@/components/market/WhyOddsMoved";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";
import { TradeAIChat } from "@/components/market/TradeAIChat";
import { ShareDialog } from "@/components/market/ShareDialog";
import { WalletButton } from "@/components/shared/WalletButton";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { usePolymarketMarkets, usePolymarketMarketBySlug, usePolymarketMarketById, generateSignalsFromMarkets, generateEdgeFromMarkets } from "@/hooks/use-polymarket-markets";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";
import { formatTimeLeft, formatChange, formatVolume, formatExpiryTimestamp, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [chatOpen, setChatOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const { toast } = useToast();
  const { isWatched, toggle: toggleWatchlist } = useWatchlist();

  const { data: markets, isLoading: isLoadingMarkets } = usePolymarketMarkets(200);

  // Find the market from live data (by id or slug)
  const marketFromList = markets?.find((m) => m.id === id || m.slug === id);

  const looksLikeNumericId = !!id && /^\d+$/.test(id);

  // If not present in the top list, fetch directly by id/slug
  const { data: marketById, isLoading: isLoadingById } = usePolymarketMarketById(id, {
    enabled: !!id && !marketFromList && looksLikeNumericId,
  });

  const { data: marketBySlug, isLoading: isLoadingBySlug } = usePolymarketMarketBySlug(id, {
    enabled: !!id && !marketFromList && !looksLikeNumericId,
  });

  const market = marketFromList ?? marketById ?? marketBySlug ?? undefined;
  const marketId = market?.id;

  const signals = markets ? generateSignalsFromMarkets(markets) : [];
  const edgeRows = markets ? generateEdgeFromMarkets(markets) : [];
  const signal = marketId ? signals.find((s) => s.marketId === marketId) : undefined;
  const edge = marketId ? edgeRows.find((e) => e.marketId === marketId) : undefined;

  const isLoading = isLoadingMarkets || (!marketFromList && ((looksLikeNumericId && isLoadingById) || (!looksLikeNumericId && isLoadingBySlug)));

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-6 w-24 bg-white/5" />
        <Card className="p-6 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-1/3 bg-white/5" />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Skeleton className="h-12 w-32 bg-white/5" />
            <Skeleton className="h-12 w-24 bg-white/5" />
          </div>
          <Skeleton className="mt-4 h-3 w-full rounded-full bg-white/5" />
        </Card>
        <Card className="p-4 border-white/10 bg-[#0A0A0A]">
          <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
          <Skeleton className="h-48 w-full bg-white/5" />
        </Card>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Market Not Found</h1>
        <Link to="/app">
          <Button className="bg-[#1A1A1A] text-white hover:bg-background/50 hover:text-purple-400 transition-colors border-0">Back to Markets</Button>
        </Link>
      </div>
    );
  }

  const isPositive = market.change24h >= 0;

  return (
    <div className="container py-6">
      <SEOHead 
        title={seoContent.marketDetail.title(market.title)} 
        description={seoContent.marketDetail.description(market.title)} 
      />
      {/* Back */}
      <Link to="/app" className="inline-flex items-center gap-2 text-sm bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors rounded-md px-3 py-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Live + Category badges + Watchlist */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 border-0 gap-1 pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            LIVE
          </Badge>
          <Badge className="bg-[#1A1A1A] text-white border-0 pointer-events-none">{market.category}</Badge>
          <Badge className="bg-[#1A1A1A] text-white border-0 pointer-events-none">{market.sourceLabel}</Badge>
        </div>
        <Button
          size="sm"
          onClick={() => {
            toggleWatchlist(market.id);
            toast({
              title: isWatched(market.id) ? "Removed from watchlist" : "Added to watchlist",
              duration: 2000,
            });
          }}
          className="gap-2 h-9 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 text-white"
        >
          <Star className={cn("h-4 w-4", isWatched(market.id) && "fill-purple-400 text-purple-400")} />
          {isWatched(market.id) ? "Watching" : "Watch"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header with thumbnail */}
          <Card className="p-6 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm">
            <div className="flex gap-4">
              <MarketThumbnail thumbnail={market.thumbnail} category={market.category} size="lg" />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold">{market.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatTimeLeft(market.expiresAt)} left
                  <span className="text-xs font-mono">• {market.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            {/* Large Odds Display */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-lg px-3 py-1 pointer-events-none">YES</Badge>
                <span className="text-4xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{Math.round(market.yesProb * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#1A1A1A] text-white border-0 text-lg px-3 py-1 pointer-events-none">NO</Badge>
                <span className="text-2xl font-mono text-muted-foreground">{Math.round(market.noProb * 100)}%</span>
              </div>
            </div>

            {/* Odds Bar */}
            <div className="mt-4 h-3 w-full rounded-full overflow-hidden flex">
              <div
                className="h-full bg-purple-400/50 transition-all duration-300"
                style={{ width: `${market.yesProb * 100}%` }}
              />
              <div
                className="h-full bg-red-400/40"
                style={{ width: `${market.noProb * 100}%` }}
              />
            </div>

            {/* Meta Row */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm border-t border-white/10 pt-4">
              <div>
                <span className="text-muted-foreground block text-xs">Source</span>
                <span className="font-semibold">{market.sourceLabel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Market ID</span>
                <span className="font-mono text-xs font-semibold">{market.id.slice(0, 12)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Last update</span>
                <span className="font-semibold">{formatTimestamp(market.lastUpdatedAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Expiry</span>
                <span className="font-semibold">{formatExpiryTimestamp(market.expiresAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Resolution</span>
                <span className="text-xs font-semibold">{market.resolutionRuleShort?.slice(0, 30)}...</span>
              </div>
            </div>
          </Card>

          {/* Chart */}
          <Card className="p-4 border-white/10 bg-[#0A0A0A]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Probability</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="text-xs h-7 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400">1H</Button>
                <Button size="sm" className="text-xs h-7 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-0">24H</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400">7D</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">YES probability over time</p>
            <ProbabilityChart marketId={market.id} yesTokenId={market.yesTokenId} />
          </Card>

          {/* Why Odds Moved */}
          <WhyOddsMoved market={market as any} signal={signal as any} />

          {/* Activity Feed */}
          <ActivityFeed market={market as any} />

          {/* Receipt */}
          <Card className="p-4 border-white/10 bg-[#0A0A0A]">
            <h4 className="text-sm font-semibold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Receipt</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-semibold">{market.sourceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market ID</span>
                <span className="font-mono text-xs font-semibold">{market.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last update</span>
                <span className="font-semibold">{formatTimestamp(market.lastUpdatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry</span>
                <span className="font-semibold">{formatExpiryTimestamp(market.expiresAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality</span>
                <Badge className={cn(
                  "text-xs border-0 pointer-events-none",
                  market.qualityScore >= 80 ? "bg-green-500/20 text-green-400" : "bg-[#1A1A1A] text-white"
                )}>
                  {market.qualityScore >= 80 ? "High quality" : "Standard"}
                </Badge>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Numbers are snapshots of live market data.
            </p>
          </Card>

          {/* How it resolves */}
          <Card className="p-4 border-white/10 bg-[#0A0A0A]">
            <h4 className="text-sm font-semibold mb-2 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">How it resolves</h4>
            <p className="text-sm text-muted-foreground">Settlement follows the market's published rules.</p>
            <Collapsible open={ruleOpen} onOpenChange={setRuleOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto text-purple-400 hover:text-purple-300 gap-1 mt-2">
                  Read full rule
                  <ChevronDown className={cn("h-3 w-3 transition-transform", ruleOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-sm text-muted-foreground">
                {market.resolutionRuleShort}
              </CollapsibleContent>
            </Collapsible>
            <p className="text-[10px] text-muted-foreground mt-3">Availability varies by region.</p>
          </Card>
        </div>

        {/* Right Column - Desktop */}
        <div className="hidden lg:block space-y-4">
          <div className="sticky top-20 space-y-4">
            {/* ODDSHOT Rating */}
            <OddshotRating 
              market={market as any} 
              signal={signal as any} 
              edge={edge as any}
              onAskClick={() => setChatOpen(true)}
            />

            {/* Trade Panel - Real TradeTicket */}
            <TradeTicket market={market as any} />

            {/* Share */}
            <ShareDialog 
              market={market}
              trigger={
                <Button className="w-full gap-2 bg-[#1A1A1A] text-white hover:bg-background/50 hover:text-purple-400 transition-colors border-0">
                  Share
                </Button>
              }
            />
          </div>
        </div>

        {/* Mobile Trade Ticket */}
        <div className="lg:hidden mt-6">
          <TradeTicket market={market as any} />
        </div>
      </div>

      {/* AI Trade Assistant */}
      <TradeAIChat 
        market={market as any} 
        signal={signal as any} 
        edge={edge as any}
      />
    </div>
  );
}
