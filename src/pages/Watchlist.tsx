import { useState, useEffect } from "react";
import { Star, Trash2, Bell, Plus, Wallet, Cloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";

import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import type { AlertRule } from "@/lib/types";
import { formatTimeLeft } from "@/lib/format";
import { Link } from "react-router-dom";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Watchlist() {
  const { watchlist, remove, add, syncing, connected } = useWatchlist();
  const { data: markets } = usePolymarketMarkets(200);
  const { setVisible } = useWalletModal();

  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  // Load alerts from localStorage
  useEffect(() => {
    const storedAlerts = localStorage.getItem("oddshot-alerts");
    if (storedAlerts) setAlerts(JSON.parse(storedAlerts));
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem("oddshot-alerts", JSON.stringify(alerts));
  }, [alerts]);

  const removeFromWatchlist = (marketId: string) => {
    remove(marketId);
  };

  const addAlert = (marketId: string, type: AlertRule["type"], threshold: number) => {
    const newAlert: AlertRule = {
      id: Date.now().toString(),
      marketId,
      type,
      threshold,
      enabled: true,
    };
    setAlerts((prev) => [...prev, newAlert]);
  };

  const toggleAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const watchedMarkets = (markets || [])
    .filter((m) => watchlist.some((w) => w.marketId === m.id));

  return (
    <>
      <SEOHead title={seoContent.watchlist.title} description={seoContent.watchlist.description} />
      
      {/* Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            Watchlist
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            {connected ? (
              <span className="flex items-center justify-center gap-2 text-base lg:text-xl">
                <Cloud className="h-4 w-4 text-purple-400" />
                <span className="text-purple-400">{syncing ? "Syncing..." : "Synced"}</span>
              </span>
            ) : (
              "Your saved markets and price alerts"
            )}
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient background effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-6">

      {watchlist.length === 0 ? (
        <div className="p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] mx-auto mb-4">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-medium mb-2">No markets watched</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Add markets to your watchlist to track them here
          </p>
          <Link to="/app">
            <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-md">
              Browse Markets
            </button>
          </Link>
        </div>
      ) : !markets ? (
        <div className="p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] mx-auto mb-4">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-medium mb-2">Loading live markets…</h2>
          <p className="text-muted-foreground text-sm">
            Your watchlist is saved. Markets will appear here once data loads.
          </p>
        </div>
      ) : watchedMarkets.length === 0 ? (
        <div className="p-12 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] mx-auto mb-4">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-medium mb-2">No watched markets found</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Try adding markets again from the Markets page.
          </p>
          <Link to="/app">
            <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-md">
              Browse Markets
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl lg:rounded-[2rem] border border-white/10 overflow-hidden">
          {watchedMarkets.map((market, index) => {
            const marketAlerts = alerts.filter((a) => a.marketId === market.id);
            const isLeftColumn = index % 2 === 0;
            const isLast = index === watchedMarkets.length - 1;
            const hasItemBelow = index + 2 < watchedMarkets.length;

            return (
              <div 
                key={market.id} 
                className={cn(
                  "p-5 lg:p-8 cursor-pointer hover:bg-purple-500/5 transition-colors",
                  // Mobile: bottom border on all but last
                  !isLast && "border-b border-white/10 md:border-b-0",
                  // Desktop: bottom border if item 2 rows below exists
                  hasItemBelow && "md:border-b md:border-white/10",
                  // Desktop: right border on left column
                  isLeftColumn && "md:border-r md:border-white/10"
                )}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/app/market/${market.id}`} className="flex-1 min-w-0">
                      <h3 className="font-medium hover:text-purple-400 transition-colors">{market.title}</h3>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 hover:bg-purple-500/10 hover:text-purple-400">
                            <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                              <Bell className="h-3 w-3 text-white" />
                            </div>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0A0A0A] border-white/10">
                          <DialogHeader>
                            <DialogTitle className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent">Add Alert</DialogTitle>
                          </DialogHeader>
                          <AlertForm
                            marketId={market.id}
                            onAdd={(type, threshold) => addAlert(market.id, type, threshold)}
                          />
                        </DialogContent>
                      </Dialog>
                      <button
                        onClick={() => removeFromWatchlist(market.id)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                          <Trash2 className="h-3 w-3 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                      {Math.round(market.yesProb * 100)}¢
                    </div>
                    <Badge variant="outline" className="bg-[#1A1A1A] border-white/10">{formatTimeLeft(market.expiresAt)}</Badge>
                  </div>

                  {/* Alerts */}
                  {marketAlerts.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="text-xs text-purple-400 font-medium">Alerts</div>
                      {marketAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between text-sm bg-[#1A1A1A]/50 p-2 rounded-lg">
                          <span>
                            {alert.type.replace("_", " ")} {alert.threshold}%
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={alert.enabled}
                              onCheckedChange={() => toggleAlert(alert.id)}
                              className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-[#1A1A1A]"
                            />
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-7 rounded-md px-2 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </section>
    </>
  );
}

function AlertForm({
  marketId,
  onAdd,
}: {
  marketId: string;
  onAdd: (type: AlertRule["type"], threshold: number) => void;
}) {
  const [type, setType] = useState<AlertRule["type"]>("CROSS_ABOVE");
  const [threshold, setThreshold] = useState(50);

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm text-purple-400 font-medium">Alert Type</label>
        <Select value={type} onValueChange={(v) => setType(v as AlertRule["type"])}>
          <SelectTrigger className="bg-[#1A1A1A] border-white/10 focus:ring-purple-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A0A] border-white/10">
            <SelectItem value="CROSS_ABOVE" className="hover:bg-purple-500/10">Cross Above</SelectItem>
            <SelectItem value="CROSS_BELOW" className="hover:bg-purple-500/10">Cross Below</SelectItem>
            <SelectItem value="MOVE_PCT" className="hover:bg-purple-500/10">Move %</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-purple-400 font-medium">Threshold (%)</label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="bg-[#1A1A1A] border-white/10 focus:ring-purple-500"
        />
      </div>
      <button 
        onClick={() => onAdd(type, threshold)} 
        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-md"
      >
        <Plus className="h-4 w-4" />
        Add Alert
      </button>
    </div>
  );
}
