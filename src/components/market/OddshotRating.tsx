import { TrendingUp, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Market, Signal, EdgeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OddshotRatingProps {
  market: Market;
  signal?: Signal;
  edge?: EdgeRow;
  onAskClick?: () => void;
}

export function OddshotRating({ market, signal, edge, onAskClick }: OddshotRatingProps) {
  // Determine confidence and suggested action
  const confidence = signal?.confidence || edge?.confidence || "Med";
  const suggestedAction = signal?.suggestedAction || (edge && edge.edge > 0 ? "BUY_YES" : "WAIT");
  const isLeanYes = suggestedAction === "BUY_YES";
  const isLeanNo = suggestedAction === "BUY_NO";

  // Build why chips
  const whyChips: string[] = [];
  if (signal) {
    if (signal.type === "FLOW_SPIKE") whyChips.push("Strong momentum");
    if (signal.type === "ODDS_JUMP") whyChips.push("Rapid movement");
    if (signal.type === "LATE_SWING") whyChips.push("Late swing");
    if (signal.type === "SPLIT_CROWD") whyChips.push("Split opinion");
  }
  if (market.volume24h > 100000) whyChips.push("High volume");
  else if (market.volume24h > 30000) whyChips.push("Increased volume");
  if (market.liquidityLabel === "High") whyChips.push("High liquidity");
  if (market.qualityScore >= 85) whyChips.push("High quality");
  else if (market.qualityScore >= 70) whyChips.push("Good quality");

  // Invalidation text
  const invalidation = signal?.invalidation || 
    (isLeanYes ? "Invalidated if odds reverse sharply" : "Invalidated if momentum continues against position");

  return (
    <Card className="border-white/10 bg-[#0A0A0A] overflow-hidden">
      {/* Header with confidence */}
      <div className="flex items-center justify-between p-4 pb-0">
        <h4 className="text-sm font-semibold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">ODDSHOT Rating</h4>
        <Badge 
          className={cn(
            "text-xs border-0 pointer-events-none",
            confidence === "High" ? "bg-green-500/20 text-green-400" :
            confidence === "Med" ? "bg-yellow-500/20 text-yellow-400" :
            "bg-white/5 text-white"
          )}
        >
          {confidence} confidence
        </Badge>
      </div>

      {/* Suggested Action */}
      <div className={cn(
        "mx-4 mt-3 p-3 rounded-lg border",
        isLeanYes ? "bg-green-500/10 border-green-500/30" : isLeanNo ? "bg-red-500/10 border-red-500/30" : "bg-[#1A1A1A] border-white/10"
      )}>
        <div className="flex items-center gap-2">
          <TrendingUp className={cn(
            "h-4 w-4",
            isLeanYes ? "text-green-400" : isLeanNo ? "text-red-400" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-semibold",
            isLeanYes ? "text-green-400" : isLeanNo ? "text-red-400" : "text-white"
          )}>
            {isLeanYes ? "Lean YES" : isLeanNo ? "Lean NO" : "Hold / Wait"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Suggested action</p>
      </div>

      {/* Why chips */}
      <div className="p-4 pb-2">
        <p className="text-xs text-muted-foreground mb-2">Why:</p>
        <div className="flex flex-wrap gap-1.5">
          {whyChips.length > 0 ? whyChips.map((chip, i) => (
            <Badge key={i} className="text-xs bg-purple-500/10 text-purple-400 border-0 pointer-events-none">
              {chip}
            </Badge>
          )) : (
            <span className="text-xs text-muted-foreground">No strong signals detected</span>
          )}
        </div>
      </div>

      {/* Invalidation */}
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">Invalidation:</p>
        <p className="text-xs text-yellow-400">{invalidation}</p>
      </div>

      {/* Ask ODDSHOT button */}
      <div className="px-4 pb-4">
        <Button 
          size="sm" 
          className="w-full gap-2 bg-[#1A1A1A] text-white hover:bg-background/50 hover:text-purple-400 transition-colors border-0"
          onClick={onAskClick}
        >
          <MessageSquare className="h-4 w-4" />
          Ask ODDSHOT
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-4 text-[10px] text-muted-foreground">
        Informational. Verify the receipt and resolution rule before trading.
      </div>
    </Card>
  );
}
