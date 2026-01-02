import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, TrendingUp, TrendingDown, Sparkles, Eye, RefreshCw, ChevronDown, Flame, BarChart3, Lock } from "lucide-react";
import { MarketCard } from "@/components/market/MarketCard";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";
import { BestTradesTable } from "@/components/market/BestTradesTable";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { usePolymarketMarkets, useFilteredMarkets, generateSignalsFromMarkets } from "@/hooks/use-polymarket-markets";
import { useViewMode } from "@/hooks/use-view-mode";
import { formatVolume, formatChange, formatTimeLeft } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Markets() {
  const { isGuided } = useViewMode();
  const [activeTab, setActiveTab] = useState<"trending" | "movers" | "today" | "split" | "new">("trending");
  const [displayCount, setDisplayCount] = useState(20);
  
  // Fetch more markets for better filtering
  const { data: markets, isLoading, error, refetch, isFetching } = usePolymarketMarkets(200);
  
  // Apply intelligent filtering (excludes 100%/0% resolved markets)
  const filteredMarkets = useFilteredMarkets(markets, activeTab);
  const displayedMarkets = isGuided ? filteredMarkets.slice(0, 6) : filteredMarkets.slice(0, displayCount);
  const hasMore = filteredMarkets.length > displayCount;
  
  const signals = markets ? generateSignalsFromMarkets(markets) : [];
  
  // Get top signal for hero (must have real momentum AND an actionable signal, not WAIT)
  const topSignal = signals.find(s => 
    s.confidence !== "Low" && 
    (s.suggestedAction === "BUY_YES" || s.suggestedAction === "BUY_NO")
  );
  const heroMarket = topSignal ? markets?.find(m => m.id === topSignal.marketId) : undefined;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Failed to load markets</p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // GUIDED MODE - Curated, beginner-friendly experience
  if (isGuided) {
    return (
      <>
        <SEOHead title={seoContent.markets.title} description={seoContent.markets.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              LIVE MARKETS
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              Real-time opportunities across prediction markets
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container space-y-8">

        {/* Best Trades Now - Compact Table */}
        {markets && markets.length > 0 && (
          <BestTradesTable markets={markets} />
        )}

        {/* Hero - Best Opportunity */}
        {heroMarket && topSignal && (
            <div className="relative overflow-hidden p-6 lg:p-8 rounded-2xl border border-white/10">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex items-start gap-4 flex-1">
                <MarketThumbnail thumbnail={heroMarket.thumbnail} category={heroMarket.category} size="lg" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-500 hover:to-purple-600 pointer-events-none">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Opportunity Now
                    </Badge>
                      <Badge className="bg-green-500/10 text-green-400 border-0 hover:bg-green-500/10 pointer-events-none">
                      {topSignal.confidence} Confidence
                    </Badge>
                  </div>

                  <h2 className="text-2xl font-semibold">{heroMarket.title}</h2>

                  <div className="flex items-center gap-4">
                      <div className="text-5xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                      {Math.round(heroMarket.yesProb * 100)}¢
                    </div>
                      <Badge className={cn(
                        "border-0 pointer-events-none",
                      heroMarket.change1h >= 0 
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" 
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/10"
                    )}>
                      {heroMarket.change1h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatChange(heroMarket.change1h)} 1h
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">{topSignal.headline}</p>
                    <ul className="space-y-1 text-muted-foreground">
                      {topSignal.whyBullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 justify-center lg:min-w-[200px]">
                <Link to={`/app/market/${heroMarket.id}`}>
                    <div className="relative rounded-full p-[2px] h-12 w-full">
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-[-100%] animate-spin-slow"
                          style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                      <div className="relative h-full w-full rounded-full bg-background">
                        <Button 
                          size="lg" 
                          className="h-full w-full gap-2 text-base bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                        >
                          <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                            <Zap className="h-3 w-3 text-white" />
                          </div>
                    Trade {topSignal.suggestedAction.replace("BUY_", "")}
                  </Button>
                      </div>
                    </div>
                </Link>
                <Link to={`/app/market/${heroMarket.id}`}>
                    <Button variant="ghost" size="lg" className="gap-2 w-full bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
            </div>
        )}

        {/* Curated Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              Top Opportunities
            </h3>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
              Live from Polymarket
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMarkets.map((market) => {
              const signal = signals.find(s => s.marketId === market.id);
              return (
                <MarketCard 
                  key={market.id} 
                  market={{
                    ...market,
                    thumbnail: market.thumbnail as any,
                  }} 
                  signal={signal as any}
                />
              );
            })}
          </div>
        </div>

        {/* Quick Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl lg:rounded-[2rem] border border-white/10 overflow-hidden">
            <Link to="/app/signals" className="block">
              <div className="p-5 lg:p-8 border-b sm:border-b-0 sm:border-r border-white/10 cursor-pointer">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Flame className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Active Signals</h3>
                    <p className="text-xs lg:text-sm text-white/60 leading-relaxed">{signals.filter(s => s.confidence === "High").length} high-confidence signals right now</p>
                  </div>
                </div>
              </div>
          </Link>
            <Link to="/app/edge" className="block">
              <div className="p-5 lg:p-8 border-b sm:border-b-0 sm:border-r border-white/10 cursor-pointer">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Edge Opportunities</h3>
                    <p className="text-xs lg:text-sm text-white/60 leading-relaxed">{markets?.filter(m => m.liquidityLabel !== "Low").length || 0} markets with detected mispricing</p>
                  </div>
                </div>
              </div>
          </Link>
            <Link to="/app/lock-in" className="block">
              <div className="p-5 lg:p-8 cursor-pointer">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Lock className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Lock-In Profits</h3>
                    <p className="text-xs lg:text-sm text-white/60 leading-relaxed">Risk-free arbitrage opportunities</p>
                  </div>
                </div>
              </div>
          </Link>
        </div>

        <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Want to see all markets with full data?</p>
            <div className="relative rounded-full p-[2px] h-10 inline-block">
              {/* Rotating border beam */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-[-100%] animate-spin-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                  }}
                />
              </div>
              {/* Static border background */}
              <div className="absolute inset-0 rounded-full border border-purple-500/30" />
              {/* Button content */}
              <div className="relative h-full w-full rounded-full bg-background">
                <Button 
                  variant="ghost"
                  onClick={() => {
            const stored = localStorage.getItem("oddshot-view-mode");
            if (stored !== "terminal") {
              localStorage.setItem("oddshot-view-mode", "terminal");
              window.location.reload();
            }
                  }}
                  className="h-full w-full gap-2 px-6 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full text-xs transition-colors"
                >
            Switch to Terminal Mode
          </Button>
        </div>
      </div>
          </div>
        </div>
        </section>
      </>
    );
  }

  // TERMINAL MODE - Dense data table for pros
  return (
    <>
      <SEOHead title={seoContent.markets.title} description={seoContent.markets.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            LIVE MARKETS
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Real-time opportunities across prediction markets
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">

      {/* Compact Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="bg-[#1A1A1A] border border-border h-11">
                <TabsTrigger value="trending" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Trending</TabsTrigger>
                <TabsTrigger value="movers" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Movers</TabsTrigger>
                <TabsTrigger value="today" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Expiring</TabsTrigger>
                <TabsTrigger value="split" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">50/50</TabsTrigger>
                <TabsTrigger value="new" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">New</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()} 
            className="h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors"
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-0">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
              {displayedMarkets.length}/{filteredMarkets.length} markets
          </Badge>
        </div>
      </div>

        {/* Professional Data Table */}
        <Card className="border-white/10 bg-[#0A0A0A] overflow-hidden">
        <Table>
          <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent bg-[#1A1A1A]/50">
                <TableHead className="w-[300px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">YES</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">NO</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">1h</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">24h</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Vol 24h</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Expires</TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Liq</TableHead>
                <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {displayedMarkets.map((market, index) => {
              const signal = signals.find(s => s.marketId === market.id);
              const hasEdge = market.liquidityLabel !== "Low" && market.qualityScore > 75;
              const is1hPositive = market.change1h >= 0;
              const is24hPositive = market.change24h >= 0;

              return (
                  <TableRow 
                    key={market.id} 
                    className={cn(
                      "border-white/5 hover:bg-purple-500/5 transition-colors text-sm",
                      index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                    )}
                  >
                    <TableCell className="py-5">
                      <Link to={`/app/market/${market.id}`} className="flex items-center gap-3 hover:text-purple-400 transition-colors group">
                      <MarketThumbnail thumbnail={market.thumbnail} category={market.category} size="sm" />
                      <div className="min-w-0">
                          <div className="font-semibold truncate max-w-[220px] group-hover:text-purple-400 transition-colors">{market.title}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#1A1A1A] border-0 font-medium">{market.category}</Badge>
                            {signal && <Badge className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border-0 font-medium">Signal</Badge>}
                            {hasEdge && <Badge className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border-0 font-medium">Edge</Badge>}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                    <TableCell className="text-right font-mono font-bold text-base bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    {Math.round(market.yesProb * 100)}¢
                  </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-muted-foreground/70">
                    {Math.round(market.noProb * 100)}¢
                  </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono font-semibold px-2 py-1 rounded",
                        is1hPositive ? "text-green-400 bg-green-500/5" : "text-red-400 bg-red-500/5"
                  )}>
                    {formatChange(market.change1h)}
                      </span>
                  </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-mono font-semibold px-2 py-1 rounded",
                        is24hPositive ? "text-green-400 bg-green-500/5" : "text-red-400 bg-red-500/5"
                  )}>
                    {formatChange(market.change24h)}
                      </span>
                  </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground/90">
                    {formatVolume(market.volume24h)}
                  </TableCell>
                    <TableCell className="text-right text-muted-foreground/80 font-medium">
                    {market.expiresAt ? formatTimeLeft(market.expiresAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                        "text-[10px] px-2 py-1 border-0 font-semibold",
                        market.liquidityLabel === "High" ? "bg-green-500/10 text-green-400" :
                        market.liquidityLabel === "Med" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-white/5 text-muted-foreground"
                    )}>
                      {market.liquidityLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="flex gap-1.5 justify-end">
                      <Link to={`/app/market/${market.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30">
                            <Eye className="h-3.5 w-3.5 text-white" />
                        </Button>
                      </Link>
                      <Link to={`/app/market/${market.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30">
                            <Zap className="h-3.5 w-3.5 text-white" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
            <div className="relative rounded-full p-[2px] h-10">
              {/* Rotating border beam */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-[-100%] animate-spin-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                  }}
                />
              </div>
              {/* Static border background */}
              <div className="absolute inset-0 rounded-full border border-purple-500/30" />
              {/* Button content */}
              <div className="relative h-full w-full rounded-full bg-background">
          <Button 
                  variant="ghost"
            onClick={handleLoadMore}
                  className="h-full w-full gap-2 px-6 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full text-xs transition-colors"
          >
                  <ChevronDown className="h-3.5 w-3.5" />
            Load More ({filteredMarkets.length - displayCount} remaining)
          </Button>
              </div>
            </div>
        </div>
      )}
    </div>
      </section>
    </>
  );
}
