import { Clock, ExternalLink, FileText, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Market, Signal, EdgeRow } from "@/lib/types";
import { formatTimestamp, formatExpiryTimestamp } from "@/lib/format";

interface ReceiptsPanelProps {
  market: Market;
  signal?: Signal;
  edge?: EdgeRow;
}

export function ReceiptsPanel({ market, signal, edge }: ReceiptsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Why This is Moving */}
      {signal && (
        <Card className="p-4 border-border bg-card">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-oddshot-warning" />
            Why this is moving
          </h4>
          <p className="text-sm font-medium mb-2">{signal.headline}</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {signal.whyBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Updated {formatTimestamp(signal.sourceUpdatedAt)}
          </div>
        </Card>
      )}

      {/* Edge Panel */}
      {edge && (
        <Card className="p-4 border-border bg-card">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Edge Analysis
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Edge</span>
              <p className="text-xl font-mono font-semibold text-oddshot-success">
                +{(edge.edge * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence</span>
              <p className="text-lg font-medium">{edge.confidence}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm">
              <span className="text-muted-foreground">Why: </span>
              {edge.whyLabel}
            </p>
          </div>
          {signal && (
            <div className="mt-2 text-xs text-oddshot-warning">
              <span className="font-medium">Invalidation: </span>
              {signal.invalidation}
            </div>
          )}
        </Card>
      )}

      {/* Receipt Details */}
      <Card className="p-4 border-border bg-card">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Receipt
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Source</span>
            <span className="flex items-center gap-1">
              {market.sourceLabel}
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last updated</span>
            <span>{formatTimestamp(market.lastUpdatedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires</span>
            <span>{formatExpiryTimestamp(market.expiresAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Liquidity</span>
            <Badge variant="outline" className="text-xs">{market.liquidityLabel}</Badge>
          </div>
        </div>

        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="resolution" className="border-border">
            <AccordionTrigger className="text-sm py-2">Resolution Rule</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {market.resolutionRuleShort}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Availability Notice */}
      <div className="text-xs text-muted-foreground p-3 rounded-lg bg-secondary/50">
        <p className="font-medium mb-1">Availability Notice</p>
        <p>This market data is provided for informational purposes. Trading availability may vary by jurisdiction.</p>
      </div>
    </div>
  );
}
