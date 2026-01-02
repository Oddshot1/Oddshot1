import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, ComposedChart } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { usePriceHistory, PricePoint } from "@/hooks/use-price-history";

interface ProbabilityChartProps {
  marketId: string;
  yesTokenId?: string | null;
}

type TimeframeType = "1h" | "6h" | "1d" | "1w" | "max";

export function ProbabilityChart({ marketId, yesTokenId }: ProbabilityChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>("1d");

  // Fetch real price history using yesTokenId for CLOB API
  const { data: realHistory, isLoading, error } = usePriceHistory(marketId, timeframe, yesTokenId);

  // Use real data only - no synthetic fallback
  const candles = realHistory || [];
  const hasData = candles.length > 0;

  // Calculate dynamic Y-axis domain based on data
  const { minProb, maxProb } = useMemo(() => {
    if (candles.length === 0) return { minProb: 0, maxProb: 1 };
    const probs = candles.map(c => c.yesProb);
    const min = Math.min(...probs);
    const max = Math.max(...probs);
    const padding = (max - min) * 0.1 || 0.05;
    return {
      minProb: Math.max(0, min - padding),
      maxProb: Math.min(1, max + padding)
    };
  }, [candles]);

  const formatTime = (t: number) => {
    const date = new Date(t);
    if (timeframe === "1h" || timeframe === "6h") {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (timeframe === "1d") {
      return date.toLocaleTimeString("en-US", { hour: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PricePoint;
      return (
        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            {new Date(data.t).toLocaleString()}
          </p>
          <p className="text-lg font-mono font-semibold">
            {Math.round(data.yesProb * 100)}¢ <span className="text-sm text-muted-foreground">YES</span>
          </p>
          {data.volume > 0 && (
            <p className="text-sm text-muted-foreground">
              Vol: ${data.volume.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeType)}>
          <TabsList className="bg-secondary/50 h-8">
            <TabsTrigger value="1h" className="text-xs px-3">1H</TabsTrigger>
            <TabsTrigger value="6h" className="text-xs px-3">6H</TabsTrigger>
            <TabsTrigger value="1d" className="text-xs px-3">24H</TabsTrigger>
            <TabsTrigger value="1w" className="text-xs px-3">7D</TabsTrigger>
            <TabsTrigger value="max" className="text-xs px-3">MAX</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {hasData && (
            <span className="text-xs text-muted-foreground font-mono">
              {Math.round(candles[candles.length - 1].yesProb * 100)}¢
            </span>
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="h-[200px] w-full flex flex-col items-center justify-center bg-secondary/20 rounded-lg">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No price history available</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different timeframe</p>
        </div>
      ) : (
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candles} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                tickFormatter={formatTime}
                stroke="hsl(0, 0%, 40%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="prob"
                domain={[minProb, maxProb]}
                tickFormatter={(v) => `${Math.round(v * 100)}¢`}
                stroke="hsl(0, 0%, 40%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                hide
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="volume"
                fill="hsl(0, 0%, 30%)"
                opacity={0.3}
                yAxisId="volume"
              />
              <Area
                type="monotone"
                dataKey="yesProb"
                stroke="rgb(168, 85, 247)"
                strokeWidth={2}
                fill="url(#probGradient)"
                yAxisId="prob"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
