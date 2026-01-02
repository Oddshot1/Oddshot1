import { useState } from "react";
import { Activity, Zap, Clock, TrendingUp, RefreshCw, Filter, EyeOff } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SignalCard } from "@/components/signals/SignalCard";
import { GuidedHighlight } from "@/components/shared/GuidedHighlight";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";
import { EmptyState } from "@/components/shared/EmptyState";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { usePolymarketMarkets, generateSignalsFromMarkets } from "@/hooks/use-polymarket-markets";
import { useViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Signals() {
  const { isGuided } = useViewMode();
  const [activeTab, setActiveTab] = useState("all");
  const [hideWait, setHideWait] = useState(false);

  const { data: markets, isLoading, error, refetch } = usePolymarketMarkets(200);
  const allSignals = markets ? generateSignalsFromMarkets(markets) : [];

  const getFilteredSignals = () => {
    let filtered = allSignals;
    
    // Apply tab filter
    switch (activeTab) {
      case "high":
        filtered = filtered.filter((s) => s.confidence === "High");
        break;
      case "flow":
        filtered = filtered.filter((s) => s.type === "FLOW_SPIKE");
        break;
      case "late":
        filtered = filtered.filter((s) => s.type === "LATE_SWING" || s.timeframe === "15m");
        break;
      case "actionable":
        filtered = filtered.filter((s) => s.suggestedAction !== "WAIT");
        break;
    }
    
    // Apply hide WAIT filter
    if (hideWait) {
      filtered = filtered.filter((s) => s.suggestedAction !== "WAIT");
    }
    
    // Sort: actionable signals first, then by confidence
    return filtered.sort((a, b) => {
      // Actionable first
      const aActionable = a.suggestedAction !== "WAIT" ? 1 : 0;
      const bActionable = b.suggestedAction !== "WAIT" ? 1 : 0;
      if (bActionable !== aActionable) return bActionable - aActionable;
      
      // Then by confidence
      const confOrder = { High: 3, Med: 2, Low: 1 };
      return (confOrder[b.confidence as keyof typeof confOrder] || 0) - (confOrder[a.confidence as keyof typeof confOrder] || 0);
    });
  };

  const signals = getFilteredSignals();
  const actionableCount = allSignals.filter(s => s.suggestedAction !== "WAIT").length;

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Get top signal for Guided highlight - prioritize actionable signals
  const topSignal = allSignals.find(s => s.confidence === "High" && s.suggestedAction !== "WAIT")
    || allSignals.find(s => s.confidence === "Med" && s.suggestedAction !== "WAIT")
    || allSignals.find(s => s.suggestedAction !== "WAIT")
    || allSignals[0]; // Fallback to first if all are WAIT
  const topMarket = markets?.find(m => m.id === topSignal?.marketId);

  // TERMINAL MODE - Dense table view
  if (!isGuided) {
    return (
      <>
        <SEOHead title={seoContent.signals.title} description={seoContent.signals.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              SIGNALS
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              Real-time market intelligence → action
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container space-y-8">
            {/* Compact Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-[#1A1A1A] border border-border h-11">
                    <TabsTrigger value="all" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">All</TabsTrigger>
                    <TabsTrigger value="actionable" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Actionable ({actionableCount})</TabsTrigger>
                    <TabsTrigger value="flow" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Flow Spikes</TabsTrigger>
                    <TabsTrigger value="late" className="text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">Late Swings</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHideWait(!hideWait)}
                  className={cn(
                    "h-9 gap-2 bg-[#1A1A1A] hover:bg-background/50 transition-colors",
                    hideWait ? "text-purple-400" : "text-foreground hover:text-purple-400"
                  )}
                >
                  <EyeOff className="h-4 w-4" />
                  {hideWait ? "WAIT hidden" : "Hide WAIT"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => refetch()} 
                  className="h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
                  {signals.length} Active
                </Badge>
              </div>
            </div>

            {/* Dense Table */}
            <Card className="border-white/10 bg-[#0A0A0A] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent bg-[#1A1A1A]/50">
                    <TableHead className="w-[250px] py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
                    <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Type</TableHead>
                    <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Signal</TableHead>
                    <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Confidence</TableHead>
                    <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Action</TableHead>
                    <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Trade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map((signal, index) => {
                    const market = markets?.find(m => m.id === signal.marketId);
                    if (!market) return null;

                    return (
                      <TableRow 
                        key={signal.id} 
                        className={cn(
                          "border-white/5 hover:bg-purple-500/5 transition-colors text-sm",
                          index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                        )}
                      >
                        <TableCell className="py-5">
                          <Link to={`/app/market/${market.id}`} className="flex items-center gap-2 hover:text-purple-400 transition-colors group">
                            <MarketThumbnail thumbnail={market.thumbnail} category={market.category} size="sm" />
                            <span className="font-medium truncate max-w-[180px] group-hover:text-purple-400 transition-colors">{market.title}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] px-2 py-1 bg-[#1A1A1A] border-0 font-medium">{signal.type.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground truncate max-w-[150px] block">{signal.headline}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] px-2 py-1 border-0 font-semibold hover:bg-green-500/10 pointer-events-none",
                            signal.confidence === "High" ? "bg-green-500/10 text-green-400" :
                            signal.confidence === "Med" ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/10" :
                            "bg-white/5 text-muted-foreground hover:bg-white/5"
                          )}>
                            {signal.confidence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px] px-2 py-1 border-0 font-semibold pointer-events-none",
                            signal.suggestedAction === "BUY_YES" ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" :
                            signal.suggestedAction === "BUY_NO" ? "bg-red-500/10 text-red-400 hover:bg-red-500/10" :
                            "bg-white/5 text-muted-foreground hover:bg-white/5"
                          )}>
                            {signal.suggestedAction.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/app/market/${market.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30">
                              <Zap className="h-3.5 w-3.5 text-white" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>
      </>
    );
  }

  // GUIDED MODE
  return (
    <>
      <SEOHead title={seoContent.signals.title} description={seoContent.signals.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            SIGNALS
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Real-time market intelligence → action
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">
          {/* Header Badge */}
          <div className="flex justify-end">
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-0">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
              {allSignals.length} Active
            </Badge>
          </div>

          {/* Guided Mode: Top Signal Highlight */}
          {topSignal && topMarket && (
            <GuidedHighlight
              type="signal"
              title={topMarket.title}
              market={topMarket as any}
              signal={topSignal as any}
              whyBullets={topSignal.whyBullets}
              invalidation={topSignal.invalidation}
              confidence={topSignal.confidence as any}
              suggestedAction={topSignal.suggestedAction.replace("_", " ")}
              actionLabel={`Trade ${topSignal.suggestedAction.replace("BUY_", "")}`}
            />
          )}

          {/* Tabs and Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto">
                  <TabsList className="bg-[#1A1A1A] border border-border h-11 w-full lg:w-auto inline-flex">
                    <TabsTrigger value="all" className="gap-2 text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="actionable" className="gap-2 text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">
                      <Zap className="h-3 w-3" />
                      Actionable ({actionableCount})
                    </TabsTrigger>
                    <TabsTrigger value="flow" className="gap-2 text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">
                      <TrendingUp className="h-3 w-3" />
                      Flow Spikes
                    </TabsTrigger>
                    <TabsTrigger value="late" className="gap-2 text-xs lg:text-sm h-9 px-3 lg:px-5 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-medium whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      Late Swings
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideWait(!hideWait)}
                className={cn(
                  "gap-2 w-fit shrink-0 h-11 px-5 bg-[#1A1A1A] hover:bg-background/50 transition-colors",
                  hideWait ? "text-purple-400" : "text-foreground hover:text-purple-400"
                )}
              >
                <EyeOff className="h-4 w-4" />
                {hideWait ? "Showing Actionable Only" : "Hide WAIT Signals"}
              </Button>
            </div>

            {/* Signal Grid */}
            <div className="mt-4">
              {signals.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No signals in this category"
                  description="Check back later for new trading signals"
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {signals.slice(0, 8).map((signal) => {
                    const market = markets?.find((m) => m.id === signal.marketId);
                    if (!market) return null;
                    return <SignalCard key={signal.id} signal={signal as any} market={market as any} />;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
