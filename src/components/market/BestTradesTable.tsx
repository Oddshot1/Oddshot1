import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { PolymarketMarket } from "@/hooks/use-polymarket-markets";

interface BestTradesTableProps {
  markets: PolymarketMarket[];
}

export function BestTradesTable({ markets }: BestTradesTableProps) {
  // Get top 5 by momentum (require both activity AND movement)
  // Filter: must have real price change AND not be resolved (0-100%)
  const bestTrades = [...markets]
    .filter(m => 
      m.active && 
      m.yesProb > 0.02 && m.yesProb < 0.98 && // Not resolved
      (Math.abs(m.change1h) >= 0.005 || Math.abs(m.change24h) >= 0.01) && // Has real movement
      m.volume24h > 10000 // Minimum volume
    )
    .sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h)) // Sort by momentum, not just volume
    .slice(0, 5);

  if (bestTrades.length === 0) return null;

  return (
    <Card className="border-white/10 bg-[#0A0A0A] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Best Trades Now
        </h3>
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-0">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse mr-2" />
          Live
        </Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent bg-[#1A1A1A]/50">
            <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Market</TableHead>
            <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Odds</TableHead>
            <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Change</TableHead>
            <TableHead className="text-right py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Liq</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bestTrades.map((market, index) => {
            const isPositive = market.change1h >= 0;
            return (
              <TableRow 
                key={market.id} 
                className={cn(
                  "border-white/5 hover:bg-purple-500/5 transition-colors text-sm",
                  index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                )}
              >
                <TableCell className="py-5">
                  <Link to={`/app/market/${market.id}`} className="hover:text-purple-400 transition-colors group">
                    <span className="font-semibold line-clamp-1 max-w-[300px] group-hover:text-purple-400 transition-colors">{market.title}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-base bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(market.yesProb * 100)}¢
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-mono font-semibold px-2 py-1 rounded inline-flex items-center gap-1",
                    isPositive ? "text-green-400 bg-green-500/5" : "text-red-400 bg-red-500/5"
                  )}>
                    {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {isPositive ? "+" : ""}{(market.change1h * 100).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn(
                    "text-[10px] px-2 py-1 border-0 font-semibold",
                    market.liquidityLabel === "High" ? "bg-green-500/10 text-green-400" :
                    market.liquidityLabel === "Med" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-white/5 text-muted-foreground"
                  )}>
                    {market.liquidityLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
