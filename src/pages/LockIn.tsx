import { useMemo, useState, useEffect, useRef } from "react";
import { Lock, AlertTriangle, Info, ShieldCheck, TrendingUp, Zap, RefreshCw, ExternalLink, ArrowRightLeft, Layers, Trophy, Clock, DollarSign, Sparkles, Filter, ArrowUpRight, Star, Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewMode } from "@/hooks/use-view-mode";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";
import { useKalshiMarkets } from "@/hooks/use-kalshi-markets";
import { usePredictItMarkets } from "@/hooks/use-predictit-markets";
import { useRundownOdds, type RundownEvent } from "@/hooks/use-rundown-odds";
import { usePolymarketSports, timeAgo, type EVOpportunity } from "@/hooks/use-polymarket-sports";
import { findCrossVenueArbitrage, findIntraPolymarketArbitrage, findVolatilityOpportunities, type CrossVenueArbitrage, type IntraMarketArbitrage, type PriceGapOpportunity, type SportsArbitrage } from "@/lib/arbitrage";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { QuickTradeModal } from "@/components/market/QuickTradeModal";
import { useOpportunityAlerts } from "@/hooks/use-opportunity-alerts";
import { useWatchlist } from "@/hooks/use-watchlist";
import { toast } from "sonner";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";

type SortMode = "ev-heavy" | "fresh" | "both";

function getProfitColor(profit: number) {
  if (profit > 0.05) return "text-oddshot-success";
  if (profit > 0.02) return "text-primary";
  return "text-muted-foreground";
}

function getConfidenceColor(confidence: number) {
  if (confidence > 0.7) return "bg-oddshot-success/20 text-oddshot-success border-oddshot-success/30";
  if (confidence > 0.5) return "bg-primary/20 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}

export default function LockIn() {
  const { isGuided } = useViewMode();
  const [sortMode, setSortMode] = useState<SortMode>("ev-heavy");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [quickTradeOpp, setQuickTradeOpp] = useState<EVOpportunity | null>(null);
  
  
  const { data: polymarkets, isLoading: polyLoading, refetch: refetchPoly, dataUpdatedAt: polyUpdatedAt } = usePolymarketMarkets(400);
  const { data: kalshiMarkets, isLoading: kalshiLoading, refetch: refetchKalshi, error: kalshiError } = useKalshiMarkets();
  const { data: predictitMarkets, isLoading: predictitLoading, refetch: refetchPredictIt, error: predictitError } = usePredictItMarkets();
  const { data: rundownData, isLoading: rundownLoading, refetch: refetchRundown, error: rundownError } = useRundownOdds();
  const { data: polySportsData, isLoading: polySportsLoading, refetch: refetchPolySports, error: polySportsError, dataUpdatedAt: sportsUpdatedAt } = usePolymarketSports();

  const isLoading = polyLoading || kalshiLoading || predictitLoading || rundownLoading || polySportsLoading;
  
  // Watchlist integration
  const { watchlist, add: addToWatchlist, remove: removeFromWatchlist, isWatched } = useWatchlist();

  

  // Find real cross-venue arbitrage opportunities
  const crossVenueOpps = useMemo((): CrossVenueArbitrage[] => {
    if (!polymarkets) return [];
    return findCrossVenueArbitrage(polymarkets, kalshiMarkets || [], predictitMarkets || []);
  }, [polymarkets, kalshiMarkets, predictitMarkets]);

  // Find intra-Polymarket arbitrage opportunities
  const intraOpps = useMemo((): IntraMarketArbitrage[] => {
    if (!polymarkets) return [];
    return findIntraPolymarketArbitrage(polymarkets);
  }, [polymarkets]);

  // Find volatility-based opportunities
  const volatilityOpps = useMemo((): PriceGapOpportunity[] => {
    if (!polymarkets) return [];
    return findVolatilityOpportunities(polymarkets);
  }, [polymarkets]);

  // Find sports betting arbitrage opportunities from Rundown API
  const sportsOpps = useMemo((): SportsArbitrage[] => {
    const events = rundownData?.events || [];
    if (events.length === 0) return [];
    
    return events
      .filter(e => e.hasArbitrage && e.arbitrageProfit > 0)
      .map(e => ({
        type: "sports-arbitrage" as const,
        id: `sports-${e.id}`,
        eventId: e.id,
        title: e.title,
        sportTitle: e.sportTitle,
        homeTeam: e.homeTeam,
        awayTeam: e.awayTeam,
        commenceTime: e.commenceTime,
        bestHomeBookmaker: e.bestHomeOdds.bookmaker,
        bestAwayBookmaker: e.bestAwayOdds.bookmaker,
        homeOdds: e.bestHomeOdds.odds,
        awayOdds: e.bestAwayOdds.odds,
        profitPercent: e.arbitrageProfit,
        strategy: `${e.homeTeam} @ ${e.bestHomeOdds.bookmaker} + ${e.awayTeam} @ ${e.bestAwayOdds.bookmaker}`,
        riskNote: e.arbitrageProfit > 3 
          ? `🔥 ${e.arbitrageProfit.toFixed(2)}% guaranteed profit!`
          : `${e.arbitrageProfit.toFixed(2)}% profit. Verify odds.`,
        isGuaranteed: e.arbitrageProfit > 0.5,
        bookmakersCount: e.bookmakers.length,
      }))
      .slice(0, 15);
  }, [rundownData]);

  // Get +EV opportunities from Polymarket sports
  const evOpportunities = useMemo((): EVOpportunity[] => {
    const opps = polySportsData?.opportunities || [];
    
    // Sort based on mode
    if (sortMode === "ev-heavy") {
      return [...opps].sort((a, b) => b.evPercent - a.evPercent);
    } else if (sortMode === "fresh") {
      return [...opps].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      // Both - weighted score
      return [...opps].sort((a, b) => {
        const aScore = a.evPercent * 0.7 + (1 / (Date.now() - new Date(a.updatedAt).getTime())) * 0.3;
        const bScore = b.evPercent * 0.7 + (1 / (Date.now() - new Date(b.updatedAt).getTime())) * 0.3;
        return bScore - aScore;
      });
    }
  }, [polySportsData, sortMode]);

  // Enable opportunity alerts
  useOpportunityAlerts({
    opportunities: evOpportunities,
    enabled: alertsEnabled,
    threshold: 5, // Alert on +5% EV or higher
  });

  // Combine all for stats
  type AllOpportunity = CrossVenueArbitrage | IntraMarketArbitrage | PriceGapOpportunity | SportsArbitrage;
  const allOpportunities: AllOpportunity[] = [...sportsOpps, ...crossVenueOpps, ...intraOpps, ...volatilityOpps];

  const handleScan = () => {
    refetchPoly();
    refetchKalshi();
    refetchPredictIt();
    refetchRundown();
    refetchPolySports();
    setLastUpdate(new Date());
  };

  const totalCrossVenue = crossVenueOpps.length;
  const totalIntra = intraOpps.length;
  const totalVolatility = volatilityOpps.length;
  const totalSports = sportsOpps.length;
  const totalEV = evOpportunities.length;
  
  // Calculate avg profit
  const avgProfit = allOpportunities.length > 0 
    ? allOpportunities.reduce((sum, opp) => {
        if ('profitPerDollar' in opp) return sum + opp.profitPerDollar;
        if ('profitPercent' in opp) return sum + opp.profitPercent / 100;
        if ('potentialProfit' in opp) return sum + opp.potentialProfit / 100;
        return sum;
      }, 0) / allOpportunities.length 
    : 0;
    
  const avgEV = evOpportunities.length > 0 
    ? evOpportunities.reduce((sum, opp) => sum + opp.evPercent, 0) / evOpportunities.length 
    : 0;
    
  const highValueCount = [...allOpportunities, ...evOpportunities].filter(opp => {
    if ('profitPerDollar' in opp) return opp.profitPerDollar > 0.03;
    if ('profitPercent' in opp) return opp.profitPercent > 1;
    if ('potentialProfit' in opp) return opp.potentialProfit > 3;
    if ('evPercent' in opp) return opp.evPercent > 5;
    return false;
  }).length;
  
  return (
    <>
      <SEOHead title={seoContent.lockIn.title} description={seoContent.lockIn.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            Lock-In Profits
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Arbitrage & +EV opportunities across prediction markets
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Alert toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center transition-colors ${alertsEnabled ? 'border-purple-400/30' : ''}`}
                onClick={() => {
                  setAlertsEnabled(!alertsEnabled);
                  toast.success(alertsEnabled ? "Alerts disabled" : "Alerts enabled for +5% EV opportunities");
                }}
              >
                {alertsEnabled ? <Bell className="h-4 w-4 text-purple-400" /> : <BellOff className="h-4 w-4 text-white" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{alertsEnabled ? "Disable alerts" : "Enable alerts"}</TooltipContent>
          </Tooltip>
          
          <Button 
            variant="ghost"
            size="sm" 
            onClick={handleScan}
            disabled={isLoading}
            className="gap-2 h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 border-0 transition-colors"
          >
            <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <RefreshCw className={`h-3 w-3 text-white ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            {isLoading ? 'Scanning...' : 'Scan Now'}
          </Button>
          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-400 border-0">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Quick Trade Modal */}
      <QuickTradeModal
        opp={quickTradeOpp}
        open={!!quickTradeOpp}
        onClose={() => setQuickTradeOpp(null)}
      />

      {/* Stats Summary - Updated with +EV */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            +EV Bets
          </div>
          <p className="text-2xl font-mono font-bold mt-1 text-purple-400">
            {totalEV}
          </p>
          <p className="text-xs text-muted-foreground">Polymarket sports</p>
        </Card>
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            Sports Arb
          </div>
          <p className="text-2xl font-mono font-bold mt-1 text-green-400">
            {totalSports}
          </p>
          <p className="text-xs text-muted-foreground">Sportsbook</p>
        </Card>
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <ArrowRightLeft className="h-4 w-4 text-white" />
            </div>
            Cross-Venue
          </div>
          <p className="text-2xl font-mono font-bold mt-1">
            {totalCrossVenue}
          </p>
          <p className="text-xs text-muted-foreground">Prediction mkts</p>
        </Card>
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Layers className="h-4 w-4 text-white" />
            </div>
            Intra-Market
          </div>
          <p className="text-2xl font-mono font-bold mt-1">
            {totalIntra}
          </p>
          <p className="text-xs text-muted-foreground">Multi-outcome</p>
        </Card>
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Avg +EV
          </div>
          <p className={`text-2xl font-mono font-bold mt-1 ${avgEV > 5 ? 'text-green-400' : 'text-purple-400'}`}>
            +{avgEV.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            High Value
          </div>
          <p className="text-2xl font-mono font-bold text-green-400 mt-1">
            {highValueCount}
          </p>
          <p className="text-xs text-muted-foreground">&gt;5% edge</p>
        </Card>
      </div>

      {/* API Error Banners */}
      {(kalshiError || predictitError || rundownError || polySportsError) && (
        <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-500">API Connection Issues</p>
              <p className="text-muted-foreground mt-1">
                {kalshiError && `Kalshi: Connection failed. `}
                {predictitError && `PredictIt: Connection failed. `}
                {rundownError && `Sports Odds: ${rundownError instanceof Error ? rundownError.message : "Failed"}. `}
                {polySportsError && `Polymarket Sports: ${polySportsError instanceof Error ? polySportsError.message : "Failed"}. `}
                Showing available data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="ev-feed" className="space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between flex-wrap gap-4">
          <div className="overflow-x-auto w-full lg:w-auto">
            <TabsList className="bg-[#1A1A1A] border border-border h-11 inline-flex">
              <TabsTrigger value="ev-feed" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium gap-2 whitespace-nowrap">
              <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              +EV Feed ({totalEV})
            </TabsTrigger>
            <TabsTrigger value="arbitrage" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium gap-2 whitespace-nowrap">
              <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <Lock className="h-3 w-3 text-white" />
              </div>
              Arbitrage ({totalSports + totalCrossVenue + totalIntra})
            </TabsTrigger>
            <TabsTrigger value="movers" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium gap-2 whitespace-nowrap">
              <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              Movers ({totalVolatility})
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Sorting - only show on EV tab */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sorted:</span>
            <ToggleGroup type="single" value={sortMode} onValueChange={(v) => v && setSortMode(v as SortMode)} className="gap-2">
              <ToggleGroupItem value="both" size="sm" className="text-xs gap-1.5 data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400">
                <div className="h-5 w-5 rounded bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10">
                  <Filter className="h-3 w-3 text-white" />
                </div>
                Both
              </ToggleGroupItem>
              <ToggleGroupItem value="fresh" size="sm" className="text-xs gap-1.5 data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400">
                <div className="h-5 w-5 rounded bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                Fresh
              </ToggleGroupItem>
              <ToggleGroupItem value="ev-heavy" size="sm" className="text-xs gap-1.5 data-[state=on]:bg-purple-500/20 data-[state=on]:text-purple-400">
                <div className="h-5 w-5 rounded bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10">
                  <DollarSign className="h-3 w-3 text-white" />
                </div>
                +EV Heavy
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* +EV Feed Tab */}
        <TabsContent value="ev-feed" className="space-y-4">
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-4 border-white/10 bg-[#0A0A0A] animate-pulse">
                  <div className="space-y-4">
                    <div className="h-6 bg-purple-500/20 rounded w-24" />
                    <div className="h-5 bg-purple-500/10 rounded w-3/4" />
                    <div className="h-8 bg-purple-500/20 rounded w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && evOpportunities.length === 0 && (
            <Card className="p-12 text-center border-white/10 bg-[#0A0A0A]">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-lg font-medium mb-2">No +EV opportunities right now</h2>
              <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                Scanning Polymarket sports markets for mispriced odds. Check back soon!
              </p>
              <div className="relative rounded-full p-[2px] h-10 inline-block">
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
                    onClick={handleScan} 
                    disabled={isLoading}
                    className="h-full w-full gap-2 px-6 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full text-xs transition-colors"
                  >
                    Scan Again
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!isLoading && evOpportunities.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evOpportunities.map((opp) => (
                <EVCard 
                  key={opp.id} 
                  opp={opp}
                  polymarkets={polymarkets}
                  onQuickTrade={setQuickTradeOpp}
                  isWatched={isWatched(opp.id)}
                  onToggleWatch={() => {
                    if (isWatched(opp.id)) {
                      removeFromWatchlist(opp.id);
                      toast.success("Removed from watchlist");
                    } else {
                      addToWatchlist(opp.id);
                      toast.success("Added to watchlist");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Arbitrage Tab */}
        <TabsContent value="arbitrage" className="space-y-4">
          {/* Sub-tabs for arbitrage types */}
          <Tabs defaultValue="all-arb" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="bg-[#1A1A1A] border border-border h-10 inline-flex">
                <TabsTrigger value="all-arb" className="text-xs lg:text-sm h-8 px-3 lg:px-4 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">All ({totalSports + totalCrossVenue + totalIntra})</TabsTrigger>
                <TabsTrigger value="sports" className="text-xs lg:text-sm h-8 px-3 lg:px-4 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Sports ({totalSports})</TabsTrigger>
                <TabsTrigger value="cross-venue" className="text-xs lg:text-sm h-8 px-3 lg:px-4 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Cross-Venue ({totalCrossVenue})</TabsTrigger>
                <TabsTrigger value="intra" className="text-xs lg:text-sm h-8 px-3 lg:px-4 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Intra-Market ({totalIntra})</TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="all-arb" className="space-y-4">
              {!isLoading && allOpportunities.length === 0 ? (
                <Card className="p-12 text-center border-white/10 bg-[#0A0A0A]">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-lg font-medium mb-2">No arbitrage opportunities right now</h2>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                    Scanned {(polymarkets?.length || 0) + (kalshiMarkets?.length || 0) + (predictitMarkets?.length || 0)} prediction markets and {rundownData?.events?.length || 0} sports events. 
                    True arbitrage is rare—markets are efficient. Check the +EV feed for value bets.
                  </p>
                  <Button 
                    onClick={handleScan} 
                    variant="ghost"
                    size="sm" 
                    className="gap-2 h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 border-0 transition-colors"
                  >
                    <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <RefreshCw className="h-3 w-3 text-white" />
                    </div>
                    Refresh Data
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {allOpportunities.slice(0, 12).map((opp) => {
                    if (opp.type === "sports-arbitrage") return <SportsCard key={opp.id} opp={opp} />;
                    if (opp.type === "cross-venue") return <CrossVenueCard key={opp.id} opp={opp} polymarkets={polymarkets} />;
                    if (opp.type === "intra-polymarket") return <IntraMarketCard key={opp.id} opp={opp} />;
                    return null;
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sports" className="space-y-4">
              {sportsOpps.length === 0 ? (
                <Card className="p-8 text-center border-white/10 bg-[#0A0A0A]">
                  <Trophy className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No sports arbitrage found</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Scanned {rundownData?.events?.length || 0} events across {4} bookmakers. Odds are currently too efficient for arbitrage.
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {sportsOpps.map((opp) => <SportsCard key={opp.id} opp={opp} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cross-venue" className="space-y-4">
              {crossVenueOpps.length === 0 ? (
                <Card className="p-8 text-center border-white/10 bg-[#0A0A0A]">
                  <ArrowRightLeft className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No cross-venue opportunities</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Compared {polymarkets?.length || 0} Polymarket + {kalshiMarkets?.length || 0} Kalshi + {predictitMarkets?.length || 0} PredictIt markets. 
                    Prices are currently aligned across venues.
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {crossVenueOpps.map((opp) => <CrossVenueCard key={opp.id} opp={opp} polymarkets={polymarkets} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="intra" className="space-y-4">
              {intraOpps.length === 0 ? (
                <Card className="p-8 text-center border-white/10 bg-[#0A0A0A]">
                  <Layers className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No intra-market opportunities</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Analyzed multi-outcome markets (e.g., tweet ranges, price brackets). 
                    Current probabilities sum correctly to ~100%.
                  </p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {intraOpps.map((opp) => <IntraMarketCard key={opp.id} opp={opp} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Movers Tab */}
        <TabsContent value="movers" className="space-y-4">
          {volatilityOpps.length === 0 ? (
            <Card className="p-8 text-center border-white/10 bg-[#0A0A0A]">
              <TrendingUp className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No significant price movements detected</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {volatilityOpps.map((opp) => <VolatilityCard key={opp.id} opp={opp} polymarkets={polymarkets} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* How It Works - Guided Mode */}
      {isGuided && (
        <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 gap-1">
                  <Info className="h-3 w-3" />
                  How It Works
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-purple-400 mb-2">+EV Betting (Expected Value)</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Compare Polymarket odds to "fair" sharp lines</li>
                    <li>• When Polymarket is cheaper → positive edge</li>
                    <li>• Profitable over many bets, not guaranteed per bet</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-green-400 mb-2">Arbitrage (Guaranteed)</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Bet both sides at different books</li>
                    <li>• If combined cost &lt; payout → profit locked</li>
                    <li>• Rare but risk-free when found</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Data Sources */}
      <Card className="p-4 border-white/10 bg-[#0A0A0A]">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-foreground">Live Data Sources</p>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                <span className="font-medium">Polymarket:</span> {polymarkets?.length || 0} + {polySportsData?.totalScanned || 0} sports
                {polymarkets && <span className="text-green-400 ml-1">✓</span>}
              </span>
              <span>
                <span className="font-medium">Kalshi:</span> {kalshiMarkets?.length || 0}
                {kalshiMarkets && kalshiMarkets.length > 0 && <span className="text-green-400 ml-1">✓</span>}
              </span>
              <span>
                <span className="font-medium">PredictIt:</span> {predictitMarkets?.length || 0}
                {predictitMarkets && predictitMarkets.length > 0 && <span className="text-green-400 ml-1">✓</span>}
              </span>
              <span>
                <span className="font-medium">Sportsbooks:</span> 900+
                <span className="text-green-400 ml-1">✓</span>
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
      </section>
    </>
  );
}

// +EV Card Component with Quick Trade and Watchlist
function EVCard({ 
  opp, 
  polymarkets,
  onQuickTrade,
  isWatched,
  onToggleWatch 
}: { 
  opp: EVOpportunity; 
  polymarkets: any[];
  onQuickTrade: (opp: EVOpportunity) => void;
  isWatched: boolean;
  onToggleWatch: () => void;
}) {
  const sharpBookName = opp.sharpBook || "Sharp Line";
  const isPinnacle = sharpBookName.toLowerCase().includes("pinnacle");
  
  // Find matching market for thumbnail
  const market = polymarkets?.find(m => m.id === opp.polymarketMarketId);
  
  return (
    <Card className="p-4 border-primary/30 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all">
      <div className="space-y-3">
        {/* Header with thumbnail, EV badge and watchlist */}
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
                +{opp.evPercent.toFixed(1)}% EV
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo(opp.updatedAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {opp.sport} • {opp.league}
            </p>
          </div>
          
          {/* Watchlist star */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 ${isWatched ? 'text-yellow-500' : 'text-muted-foreground'}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWatch();
            }}
          >
            <Star className={`h-4 w-4 ${isWatched ? 'fill-yellow-500' : ''}`} />
          </Button>
        </div>

        {/* Title */}
        <div>
          {opp.teams ? (
            <h3 className="font-medium">{opp.teams.home} vs {opp.teams.away}</h3>
          ) : (
            <h3 className="font-medium line-clamp-2">{opp.question}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Bet on: <span className="text-foreground font-medium">{opp.betOn}</span>
            <span className="ml-2 text-primary">{opp.betType}</span>
          </p>
        </div>

        {/* The Edge - competitor style */}
        <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">The Edge:</p>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isPinnacle ? "🎯 " : ""}{sharpBookName} thinks it's
            </span>
            <span className="font-mono font-medium text-foreground">
              {Math.round(opp.fairPrice * 100)}¢
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">But Polymarket has it at</span>
            <span className="font-mono font-medium text-primary">
              {Math.round(opp.polyPrice * 100)}¢
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-sm text-muted-foreground">Difference</span>
            <span className="font-mono text-oddshot-success font-bold">
              +{Math.round(opp.edge * 100)}¢
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Max bet</span>
            <span className="font-mono">${opp.maxBet.toLocaleString()}</span>
          </div>
        </div>

        {/* Action buttons - Trade Now + Quick Trade */}
        <div className="flex gap-2">
          <Button asChild className="flex-1 gap-2" size="sm">
            <Link to={`/app/market/${encodeURIComponent(opp.polymarketMarketId || opp.slug || opp.id)}`}>
              <ArrowUpRight className="h-4 w-4" />
              Trade Now
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickTrade(opp);
            }}
          >
            <Zap className="h-4 w-4" />
            Quick Trade
          </Button>
        </div>

        {/* Time to match */}
        <p className="text-xs text-muted-foreground text-center">
          Match starts {opp.matchStartsIn}
        </p>
      </div>
    </Card>
  );
}

// Existing card components with improved UX
function CrossVenueCard({ opp, polymarkets }: { opp: CrossVenueArbitrage; polymarkets: any[] }) {
  const polymarketId = opp.venue1 === "Polymarket" ? opp.market1Id : 
                       opp.venue2 === "Polymarket" ? opp.market2Id : null;
  
  // Find matching market for thumbnail
  const market = polymarkets?.find(m => m.id === polymarketId);
  
  return (
    <Card className="p-4 border-oddshot-success/30 bg-card transition-all duration-200 hover:border-oddshot-success/50 hover:shadow-lg hover:shadow-oddshot-success/10">
      <div className="space-y-4">
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="text-xs gap-1 bg-oddshot-success/20 text-oddshot-success border-oddshot-success/30">
                <ArrowRightLeft className="h-3 w-3" />
                Cross-Venue
              </Badge>
              <Badge variant="outline" className={`text-xs ${getConfidenceColor(opp.matchConfidence)}`}>
                {Math.round(opp.matchConfidence * 100)}% match
              </Badge>
            </div>
            {polymarketId ? (
              <Link to={`/app/market/${polymarketId}`}>
                <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">{opp.title}</h3>
              </Link>
            ) : (
              <h3 className="font-medium line-clamp-2">{opp.title}</h3>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-mono font-bold text-oddshot-success">
              {(opp.profitPerDollar * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">guaranteed</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 rounded bg-secondary/50">
            <div className="text-xs text-muted-foreground mb-1">{opp.venue1}</div>
            <div className="font-mono">
              YES {Math.round(opp.venue1YesBuy * 100)}¢ / NO {Math.round(opp.venue1NoBuy * 100)}¢
            </div>
          </div>
          <div className="p-2 rounded bg-secondary/50">
            <div className="text-xs text-muted-foreground mb-1">{opp.venue2}</div>
            <div className="font-mono">
              YES {Math.round(opp.venue2YesBuy * 100)}¢ / NO {Math.round(opp.venue2NoBuy * 100)}¢
            </div>
          </div>
        </div>

        <div className="text-xs p-2 rounded bg-oddshot-success/10 text-oddshot-success border border-oddshot-success/20">
          <span className="font-medium">Strategy:</span> {opp.strategy}
        </div>

        <div className="text-xs text-muted-foreground p-2 rounded bg-secondary/30 flex items-start gap-2">
          <ShieldCheck className="h-3 w-3 shrink-0 mt-0.5 text-oddshot-success" />
          {opp.riskNote}
        </div>
      </div>
    </Card>
  );
}

function IntraMarketCard({ opp }: { opp: IntraMarketArbitrage }) {
  // Use first market's thumbnail since all markets are related
  const firstMarket = opp.markets[0];
  
  return (
    <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail from first market */}
          {firstMarket && (
            <MarketThumbnail 
              thumbnail={firstMarket.thumbnail} 
              category={firstMarket.category} 
              size="md" 
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] border-0">
                <Layers className="h-3 w-3 mr-1" />
                Intra-Market
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] border-0">
                {opp.markets.length} outcomes
              </Badge>
            </div>
            <h3 className="font-medium line-clamp-2">{opp.eventTitle}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-mono font-bold ${getProfitColor(opp.profitPerDollar)}`}>
              {(opp.profitPerDollar * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">profit</div>
          </div>
        </div>

        <div className="p-2 rounded bg-secondary/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Combined probability:</span>
            <span className={`font-mono font-medium ${opp.totalProbability < 1 ? "text-oddshot-success" : "text-oddshot-warning"}`}>
              {(opp.totalProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Should be 100% for mutually exclusive outcomes
          </div>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {opp.markets.map((m) => (
            <Link key={m.id} to={`/app/market/${m.id}`} className="block">
              <div className="flex justify-between text-xs p-1.5 rounded hover:bg-secondary/50 transition-colors">
                <span className="truncate flex-1 mr-2">{m.title}</span>
                <span className="font-mono text-primary">{Math.round(m.yesProb * 100)}¢</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-xs p-2 rounded bg-primary/10 text-primary border border-primary/20">
          {opp.strategy}
        </div>

        <div className="text-xs text-muted-foreground p-2 rounded bg-secondary/30 flex items-start gap-2">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          {opp.riskNote}
        </div>
      </div>
    </Card>
  );
}

function VolatilityCard({ opp, polymarkets }: { opp: PriceGapOpportunity; polymarkets: any[] }) {
  const changeAmount = Math.round((opp.polymarketPrice - opp.kalshiPrice) * 100);
  const isUp = changeAmount > 0;
  
  // Find matching market for thumbnail
  const market = polymarkets?.find(m => m.id === opp.polymarketId);
  
  return (
    <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer">
      <div className="space-y-4">
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                Momentum Alert
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 border-0 ${isUp ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                {isUp ? "↑ Rising" : "↓ Falling"}
              </Badge>
            </div>
            <Link to={`/app/market/${opp.polymarketId}`}>
              <h3 className="font-medium line-clamp-2 hover:text-purple-400 transition-colors">{opp.title}</h3>
            </Link>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-mono font-bold ${isUp ? "text-oddshot-success" : "text-oddshot-warning"}`}>
              {isUp ? "+" : ""}{changeAmount}¢
            </div>
            <div className="text-xs text-muted-foreground">recent move</div>
          </div>
        </div>

        <div className="p-2 rounded bg-secondary/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-mono font-medium">{Math.round(opp.polymarketPrice * 100)}¢ YES</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Before move:</span>
            <span className="font-mono">{Math.round(opp.kalshiPrice * 100)}¢</span>
          </div>
        </div>

        <div className="text-xs p-2 rounded bg-muted/50 text-muted-foreground flex items-start gap-2">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>Not arbitrage</strong> – This is a momentum signal showing recent price movement.
          </span>
        </div>

        <Link to={`/app/market/${opp.polymarketId}`}>
          <Button variant="outline" className="w-full gap-2" size="sm">
            <Zap className="h-4 w-4" />
            View Market
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function SportsCard({ opp }: { opp: SportsArbitrage }) {
  const gameTime = new Date(opp.commenceTime);
  const now = new Date();
  const diffMs = gameTime.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const timeUntil = diffMs < 0 ? "started" : 
    diffHours >= 24 ? `in ${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''}` :
    diffHours > 0 ? `in about ${diffHours} hour${diffHours > 1 ? 's' : ''}` :
    `in ${diffMins} minutes`;

  // Sportsbook URLs - best effort links to their main sports pages
  const sportsbookLinks: Record<string, string> = {
    "FanDuel": "https://sportsbook.fanduel.com",
    "DraftKings": "https://sportsbook.draftkings.com",
    "BetMGM": "https://sports.betmgm.com",
    "Bovada": "https://www.bovada.lv/sports",
    "BetOnline.ag": "https://www.betonline.ag/sportsbook",
    "BetRivers": "https://betrivers.com",
    "BetUS": "https://www.betus.com.pa/sportsbook",
    "LowVig.ag": "https://www.lowvig.ag",
    "Pinnacle": "https://www.pinnacle.com",
    "Betfair": "https://www.betfair.com/exchange/plus/",
  };

  const getBookLink = (bookmaker: string) => {
    return sportsbookLinks[bookmaker] || `https://www.google.com/search?q=${encodeURIComponent(bookmaker + " sportsbook")}`;
  };
  
  return (
    <Card className={`p-4 border-border bg-card transition-all duration-200 ${opp.isGuaranteed ? 'border-oddshot-success/50 hover:shadow-lg hover:shadow-oddshot-success/10' : 'hover:border-primary/30'}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs gap-1 ${opp.isGuaranteed ? 'bg-oddshot-success/20 text-oddshot-success border-oddshot-success/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                <Trophy className="h-3 w-3" />
                {opp.sportTitle}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {opp.bookmakersCount} books
              </Badge>
            </div>
            <h3 className="font-medium line-clamp-2">{opp.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Match starts {timeUntil}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-mono font-bold ${opp.isGuaranteed ? 'text-oddshot-success' : 'text-primary'}`}>
              {opp.profitPercent.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">{opp.isGuaranteed ? 'guaranteed' : 'potential'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <a 
            href={getBookLink(opp.bestHomeBookmaker)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded bg-secondary/50 hover:bg-secondary/80 transition-colors group cursor-pointer"
          >
            <div className="text-xs text-muted-foreground mb-1">{opp.homeTeam}</div>
            <div className="font-mono font-medium">
              {opp.homeOdds > 0 ? '+' : ''}{opp.homeOdds}
            </div>
            <div className="text-xs text-primary flex items-center gap-1">
              {opp.bestHomeBookmaker}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
          <a 
            href={getBookLink(opp.bestAwayBookmaker)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 rounded bg-secondary/50 hover:bg-secondary/80 transition-colors group cursor-pointer"
          >
            <div className="text-xs text-muted-foreground mb-1">{opp.awayTeam}</div>
            <div className="font-mono font-medium">
              {opp.awayOdds > 0 ? '+' : ''}{opp.awayOdds}
            </div>
            <div className="text-xs text-primary flex items-center gap-1">
              {opp.bestAwayBookmaker}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        </div>

        <div className={`text-xs p-2 rounded flex items-start gap-2 ${opp.isGuaranteed ? 'bg-oddshot-success/10 text-oddshot-success' : 'bg-secondary/30 text-muted-foreground'}`}>
          <ShieldCheck className="h-3 w-3 shrink-0 mt-0.5" />
          {opp.riskNote}
        </div>

        {/* Action hint */}
        <p className="text-xs text-muted-foreground text-center">
          Click each side to open the sportsbook
        </p>
      </div>
    </Card>
  );
}
