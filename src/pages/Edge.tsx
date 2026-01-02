import { useState } from "react";
import { Shield, Eye, Zap, Info, ChevronDown, RefreshCw, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GuidedHighlight } from "@/components/shared/GuidedHighlight";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";
import { EmptyState } from "@/components/shared/EmptyState";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { usePolymarketMarkets, generateEdgeFromMarkets } from "@/hooks/use-polymarket-markets";
import { useViewMode } from "@/hooks/use-view-mode";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Edge() {
  const { isGuided } = useViewMode();
  const [selectedRow, setSelectedRow] = useState<ReturnType<typeof generateEdgeFromMarkets>[0] | null>(null);

  const { data: markets, isLoading, error, refetch } = usePolymarketMarkets(200);
  const edgeRows = markets ? generateEdgeFromMarkets(markets) : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Get top edge for Guided highlight - prioritize actionable edges (High/Med confidence)
  // Sort: High confidence first, then Med, then by absolute edge value
  const topEdge = [...edgeRows]
    .filter(e => Math.abs(e.edge) > 0)
    .sort((a, b) => {
      const confOrder = { High: 0, Med: 1, Low: 2 };
      const confDiff = confOrder[a.confidence] - confOrder[b.confidence];
      if (confDiff !== 0) return confDiff;
      return Math.abs(b.edge) - Math.abs(a.edge);
    })[0];
  const topMarket = markets?.find(m => m.id === topEdge?.marketId);

  // edgeRows is already sorted by the hook
  const sortedEdgeRows = edgeRows;

  return (
    <>
      <SEOHead title={seoContent.edge.title} description={seoContent.edge.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            EDGE TABLE
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Momentum-based mispricing signals
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">
          {/* Header Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              className="h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 h-9 bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors"
                >
                  <Info className="h-4 w-4" />
                  How it works
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Edge = Estimated mispricing based on recent momentum.</p>
                <p className="mt-1">Positive edge = momentum suggests YES is underpriced.</p>
                <p className="mt-1 text-muted-foreground">This is NOT guaranteed - it's a signal based on price trends.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Guided Mode: Top Edge Highlight */}
          {isGuided && topEdge && topMarket && (
            <GuidedHighlight
              type="edge"
              title={topMarket.title}
              market={topMarket as any}
              edge={topEdge as any}
              whyBullets={[
                `Current: ${Math.round(topEdge.marketProb * 100)}¢, Momentum suggests: ${Math.round(topEdge.benchmarkProb * 100)}¢`,
                topEdge.whyLabel,
                `Quality score: ${topMarket.qualityScore}/100`
              ]}
              invalidation="If momentum reverses direction"
              confidence={topEdge.confidence as any}
              suggestedAction={topEdge.edge > 0 ? "BUY YES" : "BUY NO"}
              actionLabel="Trade Edge"
            />
          )}

          {/* Empty State */}
          {sortedEdgeRows.length === 0 && (
            <EmptyState
              icon={TrendingUp}
              title="No edge opportunities found"
              description="Markets are currently fairly priced against benchmarks. Check back later!"
              actionLabel="Browse Markets"
              actionHref="/app"
            />
          )}

          {/* Table */}
          {sortedEdgeRows.length > 0 && (
          <Card className="border-white/10 bg-[#0A0A0A] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent bg-[#1A1A1A]/50">
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
                  <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
                  <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Implied Fair</TableHead>
                  <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Edge</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Confidence</TableHead>
                  <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Why</TableHead>
                  <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Updated</TableHead>
                  <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEdgeRows.map((row, index) => {
                  const market = markets?.find((m) => m.id === row.marketId);
                  if (!market) return null;

                  return (
                    <TableRow 
                      key={row.marketId} 
                      className={cn(
                        "border-white/5 hover:bg-purple-500/5 transition-colors text-sm",
                        index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                      )}
                    >
                      <TableCell className="py-5">
                        <Link to={`/app/market/${market.id}`} className="flex items-center gap-2 hover:text-purple-400 transition-colors group">
                          <MarketThumbnail thumbnail={market.thumbnail} category={market.category} size="sm" />
                          <div className="max-w-[200px] truncate font-medium group-hover:text-purple-400 transition-colors">{market.title}</div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {Math.round(row.marketProb * 100)}¢
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-muted-foreground/70">
                        {Math.round(row.benchmarkProb * 100)}¢
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-mono font-bold text-base",
                          row.edge > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {row.edge > 0 ? "+" : ""}{(row.edge * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[10px] px-2 py-1 border-0 font-semibold pointer-events-none",
                          row.confidence === "High" ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" :
                          row.confidence === "Med" ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/10" :
                          "bg-white/5 text-muted-foreground hover:bg-white/5"
                        )}>
                          {row.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{row.whyLabel}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatTimestamp(row.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedRow(row)}
                                className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30"
                              >
                                <ChevronDown className="h-3.5 w-3.5 text-white" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-[#0A0A0A] border-white/10">
                              <SheetHeader>
                                <SheetTitle className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Model Inputs</SheetTitle>
                              </SheetHeader>
                              {selectedRow && (
                                <div className="mt-6 space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Volume 1h</span>
                                      <p className="font-mono font-semibold mt-1">${selectedRow.inputs.volume1h.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Spread</span>
                                      <p className="font-mono font-semibold mt-1">{(selectedRow.inputs.spread * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Time to Expiry</span>
                                      <p className="font-mono font-semibold mt-1">{Math.round(selectedRow.inputs.timeToExpiryMinutes / 60)}h</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Liquidity Score</span>
                                      <p className="font-mono font-semibold mt-1">{selectedRow.inputs.liquidityScore}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Velocity</span>
                                      <p className="font-mono font-semibold mt-1">{(selectedRow.inputs.velocity * 100).toFixed(1)}%/h</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10">
                                      <span className="text-muted-foreground text-xs">Source</span>
                                      <p className="font-semibold mt-1">{selectedRow.source}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
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
          )}
        </div>
      </section>
    </>
  );
}
