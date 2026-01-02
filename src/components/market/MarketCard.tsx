import { TrendingUp, TrendingDown, Zap, Star, Share2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarketThumbnail } from "./MarketThumbnail";
import { ShareDialog } from "./ShareDialog";
import type { Market, Signal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { formatTimeLeft } from "@/lib/format";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";

interface MarketCardProps {
  market: Market;
  signal?: Signal;
  onTrade?: () => void;
}

export function MarketCard({ market, signal, onTrade }: MarketCardProps) {
  const { isWatched, toggle } = useWatchlist();
  const { toast } = useToast();

  const watched = isWatched(market.id);
  const change24h = market.change24h;
  const isPositive = change24h >= 0;
  // Use 1 decimal for small changes, 0 decimals for larger moves
  const changePercent = Math.abs(change24h * 100);
  const changeDisplay = changePercent < 1 ? changePercent.toFixed(1) : Math.round(changePercent).toString();

  return (
    <Card className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer">
      {/* Quick action icons - top right */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const willAdd = !watched;
                  toggle(market.id);
                  toast({ title: willAdd ? "Added to watchlist" : "Removed from watchlist" });
                }}
              >
                <Star
                  className={cn("h-3 w-3 text-white", watched && "text-purple-400")}
                  fill={watched ? "currentColor" : "none"}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{watched ? "Remove from watchlist" : "Add to watchlist"}</TooltipContent>
          </Tooltip>
        <ShareDialog 
          market={market}
          trigger={
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30">
              <Share2 className="h-3 w-3 text-white" />
            </Button>
          }
        />
      </div>

      {/* Top section with thumbnail and title */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <MarketThumbnail thumbnail={market.thumbnail} category={market.category} size="md" />
          <div className="flex-1 min-w-0">
            {/* Category badges */}
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[#1A1A1A] border-0">
                {market.category}
              </Badge>
              {signal && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-400 border-0">
                  Signal
                </Badge>
              )}
            </div>
            {/* Title */}
            <Link to={`/app/market/${market.id}`}>
              <h3 className="font-medium text-sm leading-tight line-clamp-2 hover:text-purple-400 transition-colors">
                {market.title}
              </h3>
            </Link>
          </div>
        </div>
      </div>

      {/* Large change indicator - main visual focus */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div className={cn(
            "text-3xl font-mono font-bold flex items-center gap-1",
            isPositive ? "text-green-400" : "text-red-400"
          )}>
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {isPositive ? "+" : "-"}{changeDisplay}%
          </div>
          <div className="text-right">
            <div className="text-lg font-mono font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {Math.round(market.yesProb * 100)}¢
            </div>
            <div className="text-xs text-muted-foreground">YES</div>
          </div>
        </div>
      </div>

      {/* Meta row with more info */}
      <div className="px-4 pb-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTimeLeft(market.expiresAt)}</span>
        </div>
        <span>•</span>
        <span>${(market.volume24h / 1000).toFixed(0)}k vol</span>
        <span>•</span>
        <Badge className={cn(
          "text-[10px] px-1.5 py-0.5 border-0 pointer-events-none",
          market.liquidityLabel === "High" ? "bg-green-500/10 text-green-400 hover:bg-green-500/10" :
          market.liquidityLabel === "Med" ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/10" :
          "bg-purple-500/10 text-purple-400 hover:bg-purple-500/10"
        )}>
          {market.liquidityLabel}
        </Badge>
        <Badge className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border-0 hover:bg-purple-500/10 pointer-events-none">
          Q{market.qualityScore}
        </Badge>
      </div>

      {/* Odds bar */}
      <div className="h-2 w-full flex">
        <div
          className="h-full bg-purple-400/50 transition-all duration-300"
          style={{ width: `${market.yesProb * 100}%` }}
        />
        <div
          className="h-full bg-red-400/40"
          style={{ width: `${market.noProb * 100}%` }}
        />
      </div>

      {/* Quick trade buttons */}
      <div className="p-3 flex gap-2 bg-[#1A1A1A]/50">
        <Link to={`/app/market/${market.id}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-xs bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors h-9">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <Zap className="h-3 w-3 text-white" />
            </div>
            Trade
          </Button>
        </Link>
        <Link to={`/app/market/${market.id}`}>
          <Button variant="ghost" size="sm" className="text-xs bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors h-9">
            View
          </Button>
        </Link>
      </div>
    </Card>
  );
}
