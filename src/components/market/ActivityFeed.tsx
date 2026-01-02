import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@/lib/types";

interface ActivityFeedProps {
  market: Market;
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ market }: ActivityFeedProps) {
  // Show real data we have - volume and price changes
  const hasRealActivity = market.volume24h > 0 || market.change1h !== 0 || market.change24h !== 0;

  if (!hasRealActivity) {
    return (
      <Card className="p-4 border-white/10 bg-[#0A0A0A]">
        <h4 className="text-sm font-semibold mb-3 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Activity</h4>
        <p className="text-sm text-muted-foreground">No recent activity data available.</p>
      </Card>
    );
  }

  // Build activity items from real data only
  const activities: { label: string; value: string; type: "volume" | "change" }[] = [];

  if (market.volume24h > 0) {
    activities.push({
      label: "24h Volume",
      value: `$${market.volume24h.toLocaleString()}`,
      type: "volume",
    });
  }

  if (market.volume1h > 0) {
    activities.push({
      label: "1h Volume",
      value: `$${market.volume1h.toLocaleString()}`,
      type: "volume",
    });
  }

  if (market.change1h !== 0) {
    activities.push({
      label: "1h Change",
      value: `${market.change1h > 0 ? "+" : ""}${(market.change1h * 100).toFixed(1)}%`,
      type: "change",
    });
  }

  if (market.change24h !== 0) {
    activities.push({
      label: "24h Change",
      value: `${market.change24h > 0 ? "+" : ""}${(market.change24h * 100).toFixed(1)}%`,
      type: "change",
    });
  }

  return (
    <Card className="p-4 border-white/10 bg-[#0A0A0A]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Market Activity</h4>
        <Badge className="text-xs bg-green-500/20 text-green-400 border-0 pointer-events-none">Live</Badge>
      </div>
      <div className="space-y-2">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{activity.label}</span>
            <span className={activity.type === "change" 
              ? activity.value.startsWith("+") 
                ? "text-green-400 font-mono font-semibold" 
                : "text-red-400 font-mono font-semibold"
              : "font-mono font-semibold"
            }>
              {activity.value}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">
        Updated {formatTimeAgo(new Date(market.lastUpdatedAt).getTime())}
      </p>
    </Card>
  );
}
