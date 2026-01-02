import { Clock, FileText, Building2, Link2, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Market } from "@/lib/types";
import { getMarketVenue, createQuoteSnapshot } from "@/lib/venues";
import { useMemo } from "react";

interface ReceiptPreviewProps {
  market: Market;
  side: "YES" | "NO";
  amount?: number;
  children: React.ReactNode;
  className?: string;
}

export function ReceiptPreview({ market, side, amount = 10, children }: ReceiptPreviewProps) {
  // Get venue for this market
  const venue = useMemo(() => getMarketVenue(market.sourceLabel), [market.sourceLabel]);
  
  // Create quote snapshot
  const price = side === "YES" ? market.yesProb : market.noProb;
  const snapshot = useMemo(
    () => createQuoteSnapshot(venue, market.id, side, price, amount),
    [venue, market.id, side, price, amount]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Trade Receipt Preview
            </h4>
            <Badge variant="outline" className="text-xs">
              Preview
            </Badge>
          </div>

          <Separator />

          {/* Venue & Timestamp - CRITICAL for trust */}
          <div className="space-y-2 p-2 rounded-md bg-muted/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Venue
              </span>
              <Badge variant="secondary" className="font-mono text-xs">
                {venue.name}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Chain
              </span>
              <span className="font-mono text-xs">{venue.chainLabel}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Quote Snapshot
              </span>
              <span className="font-mono text-xs">
                {new Date(snapshot.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Market info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market</span>
              <span className="text-right font-medium max-w-[180px] truncate">{market.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Side</span>
              <Badge variant={side === "YES" ? "default" : "outline"} className="text-xs">
                {side}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Quote details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quote Price</span>
              <span className="font-mono">{Math.round(snapshot.price * 100)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Shares</span>
              <span className="font-mono">{snapshot.expectedShares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Fees ({(venue.fees.trading * 100).toFixed(1)}%)</span>
              <span className="font-mono">${snapshot.fees.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Est. Total</span>
            <span className="font-mono font-bold text-lg">${snapshot.total.toFixed(2)}</span>
          </div>

          {/* Price disclaimer */}
          <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
            <span>
              Trades execute on {venue.name}. Final price may vary from this estimate.
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
