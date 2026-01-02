import { useState } from "react";
import { ArrowUpRight, Wallet, AlertCircle, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useWalletIdentity } from "@/hooks/use-wallet-identity";
import { toast } from "sonner";
import type { EVOpportunity } from "@/hooks/use-polymarket-sports";

interface QuickTradeModalProps {
  opp: EVOpportunity | null;
  open: boolean;
  onClose: () => void;
}

export function QuickTradeModal({ opp, open, onClose }: QuickTradeModalProps) {
  const { walletAddress, connected } = useWalletIdentity();
  const [amount, setAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConnected = connected && walletAddress;

  if (!opp) return null;

  const potentialPayout = amount / opp.polyPrice;
  const expectedProfit = amount * (opp.evPercent / 100);

  const handleTrade = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate trade execution - in production this would call the poly-order edge function
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Trade submitted: $${amount} on ${opp.betOn}`, {
        description: `Expected payout: $${potentialPayout.toFixed(2)}`,
      });
      onClose();
    } catch (error) {
      toast.error("Trade failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Quick Trade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Market Info */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
                +{opp.evPercent.toFixed(1)}% EV
              </Badge>
              <span className="text-xs text-muted-foreground">{opp.sport} • {opp.league}</span>
            </div>
            {opp.teams ? (
              <p className="font-medium">{opp.teams.home} vs {opp.teams.away}</p>
            ) : (
              <p className="font-medium line-clamp-2">{opp.question}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Bet on: <span className="text-foreground font-medium">{opp.betOn}</span>
            </p>
          </div>

          {/* Trade Amount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.min(Number(e.target.value), opp.maxBet)))}
                className="w-24 text-right font-mono"
                min={1}
                max={opp.maxBet}
              />
            </div>
            <Slider
              value={[amount]}
              onValueChange={([v]) => setAmount(v)}
              min={1}
              max={Math.min(500, opp.maxBet)}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$1</span>
              <span>${Math.min(500, opp.maxBet)}</span>
            </div>
          </div>

          {/* Trade Summary */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You pay</span>
              <span className="font-mono font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per share</span>
              <span className="font-mono">{Math.round(opp.polyPrice * 100)}¢</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares</span>
              <span className="font-mono">{potentialPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-primary/20">
              <span className="text-muted-foreground">If you win</span>
              <span className="font-mono text-oddshot-success font-bold">${potentialPayout.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected profit (+EV)</span>
              <span className="font-mono text-primary">+${expectedProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet Status */}
          {!isConnected ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-oddshot-warning/10 border border-oddshot-warning/30 text-oddshot-warning text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Connect your wallet to trade</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-oddshot-success/10 border border-oddshot-success/30 text-oddshot-success text-sm">
              <Check className="h-4 w-4 shrink-0" />
              <span className="font-mono text-xs truncate">{walletAddress}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleTrade} 
              disabled={!isConnected || isSubmitting}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Trade ${amount}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
