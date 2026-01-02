import { Sparkles, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { Market, Signal, EdgeRow, Position } from "@/lib/types";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";

interface GuidedHighlightProps {
  type: "opportunity" | "signal" | "edge" | "action";
  title: string;
  market?: Market;
  signal?: Signal;
  edge?: EdgeRow;
  position?: Position;
  whyBullets: string[];
  invalidation: string;
  confidence: "High" | "Med" | "Low";
  suggestedAction: string;
  actionLabel: string;
  onAction?: () => void;
  className?: string;
}

const confidenceColors = {
  High: "bg-green-500/10 text-green-400 border-0",
  Med: "bg-yellow-500/10 text-yellow-400 border-0",
  Low: "bg-white/5 text-muted-foreground border-0",
};

export function GuidedHighlight({
  type,
  title,
  market,
  signal,
  edge,
  whyBullets,
  invalidation,
  confidence,
  suggestedAction,
  actionLabel,
  onAction,
  className,
}: GuidedHighlightProps) {
  const isPositive = suggestedAction.includes("YES");
  const isNegative = suggestedAction.includes("NO");
  const isWait = suggestedAction === "WAIT" || suggestedAction.includes("WAIT");

  return (
    <Card className={cn(
      "relative overflow-hidden p-6 lg:p-8 rounded-2xl border border-white/10",
      className
    )}>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex items-start gap-4 flex-1">
          {/* Thumbnail */}
          {market && (
            <MarketThumbnail 
              thumbnail={market.thumbnail} 
              category={market.category} 
              size="lg" 
              className="shrink-0"
            />
          )}
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-500 hover:to-purple-600 pointer-events-none">
                <Sparkles className="h-3 w-3 mr-1" />
                {type === "opportunity" && "Best Opportunity Now"}
                {type === "signal" && "Most Important Move"}
                {type === "edge" && "Top Mispricing"}
                {type === "action" && "Recommended Action"}
              </Badge>
              <Badge variant="outline" className={cn("hover:bg-green-500/10 pointer-events-none", confidenceColors[confidence])}>
                {confidence} Confidence
              </Badge>
              {signal && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-[#1A1A1A] border-0">
                  {signal.type.replace("_", " ")}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold">{title}</h2>

            {/* Price/Edge info */}
            {market && (
              <div className="flex items-center gap-4">
                <div className="text-5xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(market.yesProb * 100)}¢
                </div>
                <Badge className={cn(
                  "border-0 pointer-events-none",
                  market.change1h >= 0 
                    ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" 
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/10"
                )}>
                  {market.change1h >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {market.change1h >= 0 ? "+" : ""}{(market.change1h * 100).toFixed(1)}% 1h
                </Badge>
              </div>
            )}

            {edge && (
              <div className="flex items-center gap-4">
                <div className={cn(
                  "text-4xl font-mono font-bold",
                  edge.edge >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {edge.edge >= 0 ? "+" : ""}{(edge.edge * 100).toFixed(1)}%
                </div>
                <span className="text-muted-foreground">edge vs benchmark</span>
              </div>
            )}

            {/* Why bullets */}
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{signal?.headline || "Why this matters:"}</p>
              <ul className="space-y-1 text-muted-foreground">
                {whyBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Invalidation */}
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 shrink-0" />
              <span>
                <span className="text-yellow-400 font-medium">Invalidation: </span>
                <span className="text-muted-foreground">{invalidation}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 justify-center lg:min-w-[200px]">
          {market ? (
            <Link to={`/app/market/${market.id}`}>
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
                    onClick={onAction}
                  >
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <Zap className="h-3 w-3 text-white" />
                    </div>
                    {isWait ? "View Market" : actionLabel}
                  </Button>
                </div>
              </div>
            </Link>
          ) : (
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
                  onClick={onAction}
                >
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  {isWait ? "View Market" : actionLabel}
                </Button>
              </div>
            </div>
          )}
          {market && (
            <Link to={`/app/market/${market.id}`}>
              <Button variant="ghost" size="lg" className="gap-2 w-full bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Eye className="h-3 w-3 text-white" />
                </div>
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
