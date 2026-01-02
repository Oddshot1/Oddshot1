import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, ChevronDown, Wallet, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useToast } from "@/hooks/use-toast";
import { usePolymarketOrder } from "@/hooks/use-polymarket-order";
import { usePhantomEVM } from "@/hooks/use-phantom-evm";
import { usePolymarketProfile } from "@/hooks/use-polymarket-profile";
import type { Market } from "@/lib/types";
import { getMarketVenue, createQuoteSnapshot } from "@/lib/venues";
import { cn } from "@/lib/utils";

interface TradeTicketProps {
  market: Market;
}

const QUICK_AMOUNTS = [5, 10, 25, 100];

export function TradeTicket({ market }: TradeTicketProps) {
  const queryClient = useQueryClient();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const { evmAddress, evmConnected, evmAvailable, connectEVM, error: evmError } = usePhantomEVM();
  const { 
    status, 
    orderId, 
    error: orderError, 
    quote, 
    needsL2Auth,
    isInitializingL2,
    initializeL2Credentials,
    fetchQuote, 
    placeOrder, 
    reset 
  } = usePolymarketOrder();
  const { profile, loading: profileLoading, message: profileMessage } = usePolymarketProfile(evmAddress);
  
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showL2AuthDialog, setShowL2AuthDialog] = useState(false);

  // Get venue for this market (always Polymarket for in-app execution)
  const venue = useMemo(() => getMarketVenue(market.sourceLabel), [market.sourceLabel]);

  const price = side === "YES" ? market.yesProb : market.noProb;
  const yesTokenId = (market as any).yesTokenId ?? (market as any).clobTokenIds?.[0] ?? null;
  const noTokenId = (market as any).noTokenId ?? (market as any).clobTokenIds?.[1] ?? null;
  const selectedTokenId = side === "YES" ? yesTokenId : noTokenId;

  const expectedShares = amount > 0 && price > 0 ? amount / price : 0;
  const fees = amount * venue.fees.trading;
  const total = amount + fees;

  // Buying power is unknown until we implement a real USDC balance fetch.
  const buyingPower: number | null = null;

  const handleTrade = async () => {
    if (amount <= 0) return;

    if (!selectedTokenId) {
      toast({
        title: "Trading Unavailable",
        description: "This market outcome cannot be traded at the moment. Please try a different outcome.",
        variant: "destructive",
      });
      return;
    }

    // Only enforce buying power when we actually have a real balance.
    if (buyingPower !== null && buyingPower < total) {
      setShowFundingModal(true);
      return;
    }

    // Check EVM connection for Polymarket
    if (!evmConnected) {
      if (evmAvailable) {
        await connectEVM();
        return;
      } else {
        toast({
          title: "EVM Required",
          description: "Please enable EVM/Multichain in your Phantom wallet settings to trade on Polymarket.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if L2 authentication is needed
    if (needsL2Auth) {
      setShowL2AuthDialog(true);
      return;
    }

    // Get quote from CLOB
    await fetchQuote({
      tokenId: selectedTokenId,
      outcome: side,
      amountUsd: amount,
      tickSize: "0.01" as const,
      negRisk: false,
    });
  };

  const handleConfirmOrder = async () => {
    if (!evmAddress) return;

    const result = await placeOrder();

    if (result?.status === 'confirmed') {
      // Create quote snapshot for receipt
      const snapshot = createQuoteSnapshot(venue, market.id, side, price, amount);

      toast({
        title: "Trade Confirmed",
        description: `Successfully placed ${side} order for ${expectedShares.toFixed(2)} shares at ${price}¢`,
      });

      // ✅ Invalidate and refetch ALL portfolio data after a delay
      // Polymarket API needs time to update (typically 5-10 seconds)
      console.log('[TradeTicket] Order confirmed - scheduling data refresh in 5 seconds...');
      
      // Immediate invalidation (marks data as stale)
      queryClient.invalidateQueries({ 
        queryKey: ['polymarket-portfolio'],
        refetchType: 'all' // Invalidate all matching queries
      });
      queryClient.invalidateQueries({ 
        queryKey: ['polymarket-history'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['polymarket-pnl'],
        refetchType: 'all'
      });
      
      // Delayed aggressive refetch (gives Polymarket API time to update)
      setTimeout(() => {
        console.log('[TradeTicket] Forcing aggressive portfolio refresh...');
        queryClient.invalidateQueries({ 
          queryKey: ['polymarket-portfolio'],
          refetchType: 'all'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['polymarket-history'],
          refetchType: 'all'
        });
        queryClient.invalidateQueries({ 
          queryKey: ['polymarket-pnl'],
          refetchType: 'all'
        });
      }, 5000);
    }
  };

  const handleReset = () => {
    reset();
    setAmount(0);
    setSide("YES");
  };

  const handleL2AuthConfirm = async () => {
    const success = await initializeL2Credentials();
    if (success) {
      setShowL2AuthDialog(false);
      toast({
        title: "Trading Enabled",
        description: "Your trading credentials are set up. You can now place orders on Polymarket.",
      });
    } else {
      toast({
        title: "Authentication Failed",
        description: orderError || "Failed to set up trading credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isProcessing = ["quoting", "signing", "submitted"].includes(status);
  const canTrade = connected && amount > 0 && !!selectedTokenId && !isProcessing;

  return (
    <>
      <Card className="p-4 space-y-4 border-white/10 bg-[#0A0A0A]">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Trade</div>
          <div className="flex items-center gap-2">
            {/* Venue Badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 bg-[#1A1A1A] border-white/10">
                    {venue.name}
                    <span className="text-muted-foreground">({venue.chainLabel})</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>In-app execution via {venue.name}</p>
                  <p className="text-xs text-muted-foreground">Builder attribution: ODDSHOT</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {connected && publicKey && (
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </Badge>
            )}
          </div>
        </div>

        {/* EVM Status Banner */}
        {connected && !evmConnected && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs">
            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1">
              <span className="text-muted-foreground">
                {evmAvailable
                  ? "Connect EVM to trade on Polymarket"
                  : "Enable multichain/EVM in Phantom settings to trade"}
              </span>
              {evmAvailable && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-2 text-xs"
                  onClick={connectEVM}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        )}

        {/* No Polymarket Profile Banner */}
        {connected && evmConnected && profile && !profile.hasProfile && profileMessage && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-purple-500/10 border border-purple-500/30 text-xs">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-purple-400" />
            <div className="flex-1">
              <p className="font-medium text-purple-300 mb-1">Polymarket Profile Required</p>
              <p className="text-white/80 mb-2">{profileMessage}</p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-purple-400 hover:text-purple-300 text-xs"
                onClick={() => window.open('https://polymarket.com', '_blank')}
              >
                Create Profile on Polymarket →
              </Button>
            </div>
          </div>
        )}

        {/* Buying Power Section */}
        <div className="flex items-center justify-between p-2 rounded-md bg-[#1A1A1A]/50 border border-white/10 text-xs">
          <span className="text-muted-foreground">Buying Power</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">
              {buyingPower === null ? "—" : `$${buyingPower.toFixed(2)}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
              onClick={() => setShowFundingModal(true)}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === "YES" ? "default" : "outline"}
            className={cn(
              side === "YES" 
                ? "bg-green-500 text-white hover:bg-green-600 border-0" 
                : "bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border border-white/10 transition-colors"
            )}
            onClick={() => setSide("YES")}
            disabled={isProcessing}
          >
            {connected ? "BUY " : ""}YES {Math.round(market.yesProb * 100)}¢
          </Button>
          <Button
            variant={side === "NO" ? "default" : "outline"}
            className={cn(
              side === "NO" 
                ? "bg-red-500 text-white hover:bg-red-600 border-0" 
                : "bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border border-white/10 transition-colors"
            )}
            onClick={() => setSide("NO")}
            disabled={isProcessing}
          >
            {connected ? "BUY " : ""}NO {Math.round(market.noProb * 100)}¢
          </Button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="0.00"
              value={amount || ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="pl-7 font-mono text-lg bg-[#1A1A1A] border-white/10 focus-visible:ring-purple-500"
              disabled={isProcessing}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">USDC</span>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                variant="ghost"
                size="sm"
                className="flex-1 text-xs bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border border-white/10 transition-colors"
                onClick={() => setAmount(amt)}
                disabled={isProcessing}
              >
                ${amt}
              </Button>
            ))}
          </div>
        </div>

        {/* Quote Output */}
        {amount > 0 && (
          <div className="space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected shares</span>
              <span className="font-mono">{expectedShares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg price</span>
              <span className="font-mono">{Math.round(price * 100)}¢</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fees ({(venue.fees.trading * 100).toFixed(1)}%)</span>
              <span className="font-mono">${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t border-border">
              <span>Total Cost</span>
              <span className="font-mono">${total.toFixed(2)}</span>
            </div>
            {/* Potential Profit Display */}
            <div className="flex justify-between font-medium text-oddshot-success bg-oddshot-success/10 p-2 rounded-md">
              <span>Potential Profit (if {side} wins)</span>
              <span className="font-mono">${(expectedShares - total).toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Win: ${expectedShares.toFixed(2)} payout • Lose: ${total.toFixed(2)} loss
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border border-white/10 transition-colors">
              Advanced
              <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", showAdvanced && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Execution venue</span>
              <Badge variant="outline">{venue.name}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Chain</span>
              <Badge variant="outline">{venue.chainLabel}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Builder</span>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">ODDSHOT</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Data source</span>
              <Badge variant="outline" className="bg-[#1A1A1A] border-white/10">{market.sourceLabel}</Badge>
            </div>
            {evmAddress && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">EVM Address</span>
                <span className="font-mono text-xs">{evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}</span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* CTA */}
        {status === "confirmed" ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-12 w-12 rounded-full bg-oddshot-success/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-oddshot-success" />
            </div>
            <p className="text-sm font-medium">Trade Confirmed</p>
            {orderId && (
              <p className="text-xs text-muted-foreground font-mono">
                {orderId.length > 20 ? `${orderId.slice(0, 6)}...${orderId.slice(-4)}` : orderId}
              </p>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10 transition-colors">
              New Trade
            </Button>
          </div>
        ) : status === "submitted" ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
            </div>
            <p className="text-sm font-medium">Trade Submitted</p>
            <p className="text-xs text-muted-foreground">Awaiting confirmation...</p>
            {orderId && (
              <p className="text-xs text-muted-foreground font-mono">
                {orderId.length > 20 ? `${orderId.slice(0, 6)}...${orderId.slice(-4)}` : orderId}
              </p>
            )}
          </div>
        ) : status === "failed" ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-12 w-12 rounded-full bg-oddshot-danger/20 flex items-center justify-center">
              <X className="h-6 w-6 text-oddshot-danger" />
            </div>
            <p className="text-sm font-medium">
              {(() => {
                const error = (orderError || evmError || '').toLowerCase();
                if (error.includes('insufficient')) return 'Insufficient Balance';
                if (error.includes('authentication') || error.includes('credentials')) return 'Authentication Failed';
                if (error.includes('cancelled') || error.includes('rejected')) return 'Cancelled';
                if (error.includes('minimum')) return 'Order Too Small';
                return 'Trade Failed';
              })()}
            </p>
            <p className="text-xs text-muted-foreground text-center px-4">
              {(() => {
                const error = (orderError || evmError || '').toLowerCase();
                if (error.includes('insufficient')) return 'You don\'t have enough funds. Please fund your account in Portfolio.';
                if (error.includes('authentication') || error.includes('credentials')) return 'Please go to Portfolio and click "Enable Trading" again.';
                if (error.includes('cancelled') || error.includes('rejected')) return 'You cancelled the transaction in your wallet.';
                if (error.includes('minimum')) return 'Order amount is below minimum. Please increase the amount.';
                if (error.includes('no order id')) return 'Order failed to process. Please try again.';
                return orderError || evmError || 'Please try again';
              })()}
            </p>
            <Button variant="outline" size="sm" onClick={handleReset} className="bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10 transition-colors">
              Try Again
            </Button>
          </div>
        ) : status === "ready" && quote ? (
          <div className="space-y-2">
            <div className="p-3 rounded-md bg-muted/50 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Price</span>
                <span className="font-mono">{(quote.bestAsk * 100).toFixed(1)}¢</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Shares</span>
                <span className="font-mono">{quote.estShares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Cost</span>
                <span className="font-mono">${quote.totalUsd.toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
              size="lg"
              onClick={handleConfirmOrder}
            >
              Confirm {side} Order
            </Button>
            <Button
              variant="outline"
              className="w-full bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10 transition-colors"
              size="sm"
              onClick={handleReset}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Primary CTA: In-app execution */}
            {connected ? (
              <Button
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                size="lg"
                onClick={handleTrade}
                disabled={!canTrade}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {status === "quoting" && "Getting quote..."}
                    {status === "signing" && "Confirm in wallet..."}
                  </>
                ) : (
                  `Buy ${side}`
                )}
              </Button>
            ) : (
              <div className="relative rounded-full p-[2px] w-full h-11">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-[-100%] animate-spin-slow"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                    }}
                  />
                </div>
                <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                <div className="relative h-full w-full rounded-full bg-background">
                  <Button
                    className="w-full h-full gap-2 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                    onClick={() => setVisible(true)}
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Phantom
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Funding Modal */}
      <Dialog open={showFundingModal} onOpenChange={setShowFundingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund Your Trading Account</DialogTitle>
            <DialogDescription>
              To trade on Polymarket through ODDSHOT, you need USDC on Polygon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <h4 className="font-medium text-sm">How to add funds:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Bridge USDC to Polygon network</li>
                <li>Ensure your Phantom wallet has Polygon enabled</li>
                <li>Your USDC balance will appear as buying power</li>
              </ol>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 text-xs">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <span className="text-muted-foreground">
                ODDSHOT executes trades in-app. Your funds stay in your wallet until trade confirmation.
              </span>
            </div>
            <Button 
              className="w-full bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10 transition-colors" 
              variant="outline"
              onClick={() => setShowFundingModal(false)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* L2 Authentication Dialog */}
      <Dialog open={showL2AuthDialog} onOpenChange={setShowL2AuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Trading on Polymarket</DialogTitle>
            <DialogDescription>
              Before you can place orders, you need to sign a one-time message to enable trading.
              This creates secure API credentials for your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">You'll be asked to sign a message in your Phantom wallet.</p>
                  <p className="text-xs">This is a free signature and does not cost any gas.</p>
                </div>
              </div>
            </div>
            {orderError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-400">
                    {orderError}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowL2AuthDialog(false)}
                disabled={isInitializingL2}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={handleL2AuthConfirm}
                disabled={isInitializingL2}
              >
                {isInitializingL2 ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Initializing...
                  </>
                ) : (
                  "Sign to Enable Trading"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
