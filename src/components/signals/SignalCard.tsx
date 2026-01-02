import { Clock, Zap, Eye, Star, TrendingUp, TrendingDown, AlertTriangle, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Signal, Market } from "@/lib/types";
import { formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";

interface SignalCardProps {
  signal: Signal;
  market: Market;
}

const actionIcons: Record<string, React.ReactNode> = {
  BUY_YES: <TrendingUp className="h-3 w-3" />,
  BUY_NO: <TrendingDown className="h-3 w-3" />,
  WAIT: <Pause className="h-3 w-3" />,
  HEDGE: <AlertTriangle className="h-3 w-3" />,
  AVOID: <AlertTriangle className="h-3 w-3" />,
};

const actionColors: Record<string, string> = {
  BUY_YES: "bg-green-500/10 text-green-400",
  BUY_NO: "bg-red-500/10 text-red-400",
  WAIT: "bg-yellow-500/10 text-yellow-400",
  HEDGE: "bg-yellow-500/10 text-yellow-400",
  AVOID: "bg-white/5 text-muted-foreground",
};

const severityColors: Record<string, string> = {
  High: "bg-green-500/10 text-green-400 border-0",
  Med: "bg-yellow-500/10 text-yellow-400 border-0",
  Low: "bg-white/5 text-muted-foreground border-0",
};

export function SignalCard({ signal, market }: SignalCardProps) {
  return (
    <Card className="p-4 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer">
      <div className="space-y-3">
        {/* Header with Thumbnail */}
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <MarketThumbnail 
            thumbnail={market.thumbnail} 
            category={market.category} 
            size="md" 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 pointer-events-none", severityColors[signal.severity])}>
                {signal.severity}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] border-0">
                {signal.type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-[#1A1A1A] border-0">
                {signal.timeframe}
              </Badge>
            </div>
            
            {/* Headline */}
            <h3 className="font-medium text-sm">{signal.headline}</h3>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            {formatTimestamp(signal.sourceUpdatedAt)}
          </div>
        </div>

        {/* Market Reference */}
        <Link to={`/app/market/${market.id}`} className="text-sm text-muted-foreground hover:text-purple-400 transition-colors line-clamp-1">
          {market.title}
        </Link>

        {/* Why Bullets */}
        <ul className="space-y-1 text-sm text-muted-foreground">
          {signal.whyBullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              {bullet}
            </li>
          ))}
        </ul>

        {/* Suggested Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn("gap-1 text-[10px] px-2 py-1 border-0 pointer-events-none", actionColors[signal.suggestedAction])}>
            {actionIcons[signal.suggestedAction]}
            {signal.suggestedAction.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-400 border-0 pointer-events-none">
            {signal.confidence} confidence
          </Badge>
        </div>

        {/* Invalidation */}
        <div className="text-xs text-yellow-400/80">
          <span className="font-medium">Invalidation: </span>
          {signal.invalidation}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 justify-end">
          <Link to={`/app/market/${market.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 h-9 px-4 text-xs bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <Zap className="h-3 w-3 text-white" />
              </div>
              Trade
            </Button>
          </Link>
          <Link to={`/app/market/${market.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 h-9 px-4 text-xs bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <Eye className="h-3 w-3 text-white" />
              </div>
              View
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
