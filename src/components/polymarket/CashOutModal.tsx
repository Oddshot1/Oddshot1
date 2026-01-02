import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingDown, CheckCircle, XCircle, Info } from 'lucide-react';
import { usePolymarketSell } from '@/hooks/use-polymarket-sell';
import { usePolymarketOrder } from '@/hooks/use-polymarket-order';
import { formatUSD } from '@/lib/format';
import type { PolymarketPosition } from '@/hooks/use-polymarket-portfolio';

interface CashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PolymarketPosition;
  onSuccess?: () => void;
}

export function CashOutModal({
  open,
  onOpenChange,
  position,
  onSuccess,
}: CashOutModalProps) {
  const queryClient = useQueryClient();
  const { needsL2Auth, initializeL2Credentials } = usePolymarketOrder();
  const { sellState, getQuote, sellPosition, reset } = usePolymarketSell();
  
  const [size, setSize] = useState(position?.size?.toString() || '0');
  const [showL2Auth, setShowL2Auth] = useState(false);

  // Update size when position changes
  useEffect(() => {
    if (position?.size) {
      setSize(position.size.toString());
    }
  }, [position]);

  // Get quote when modal opens
  useEffect(() => {
    if (open && position && position.tokenId && position.size && position.currentPrice) {
      getQuote(position.tokenId, position.size, position.currentPrice);
    }
  }, [open, position]);

  const handleCashOut = async () => {
    if (!position) {
      console.error('[CashOutModal] No position data');
      return;
    }
    
    // Validate required position data
    if (!position.tokenId) {
      console.error('[CashOutModal] Missing tokenId in position:', position);
      alert('Cannot cash out: Missing token ID. Please refresh and try again.');
      return;
    }
    
    const sellSize = parseFloat(size);
    if (sellSize <= 0 || sellSize > (position.size || 0)) return;

    // Check if L2 auth is needed
    if (needsL2Auth) {
      setShowL2Auth(true);
      const success = await initializeL2Credentials();
      if (!success) {
        return;
      }
      setShowL2Auth(false);
    }

    // Get L2 creds from session storage
    const stored = sessionStorage.getItem('oddshot-poly-l2-creds');
    if (!stored) {
      alert('Please sign in to enable trading');
      return;
    }

    const { creds } = JSON.parse(stored);
    const l2Creds = {
      apiKey: creds.apiKey,
      secret: creds.secret,
      passphrase: creds.passphrase,
    };

    // Need proxy wallet - get from position or profile
    const proxyWallet = position.proxyWallet;
    if (!proxyWallet) {
      alert('Proxy wallet not found');
      return;
    }

    console.log('[CashOutModal] Selling position:', {
      tokenId: position.tokenId,
      size: sellSize,
      proxyWallet,
    });

    const success = await sellPosition(
      position.tokenId,
      sellSize,
      undefined, // tickSize - will be fetched from market
      undefined, // negRisk - will be fetched from market
      l2Creds,
      proxyWallet
    );

    if (success) {
      onSuccess?.();
      
      // ✅ Invalidate and refetch ALL portfolio data after a delay
      // Polymarket API needs time to update (typically 5-10 seconds)
      console.log('[CashOutModal] Cash out complete - scheduling data refresh in 5 seconds...');
      
      // Immediate invalidation (marks data as stale)
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
      
      // Delayed aggressive refetch (gives Polymarket API time to update)
      setTimeout(() => {
        console.log('[CashOutModal] Forcing aggressive portfolio refresh...');
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
      
      setTimeout(() => {
        handleClose();
      }, 3000);
    }
  };

  const handleClose = () => {
    reset();
    if (position?.size) {
      setSize(position.size.toString());
    }
    onOpenChange(false);
  };

  const handleMaxClick = () => {
    if (position?.size) {
      setSize(position.size.toString());
    }
  };

  const isProcessing = ['signing', 'submitted'].includes(sellState.status);
  const isQuoting = sellState.status === 'quoting';
  const isSuccess = sellState.status === 'confirmed';
  const isFailed = sellState.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-purple-400" />
            Cash Out Position
          </DialogTitle>
          <DialogDescription>
            Sell your {position?.outcome || 'position'} shares at current market price
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sold Successfully!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your position has been sold
                </p>
                {sellState.orderId && (
                  <p className="text-xs text-purple-400 mt-2 font-mono">
                    Order: {sellState.orderId.slice(0, 16)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : isFailed ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {(() => {
                    const error = (sellState.error || '').toLowerCase();
                    if (error.includes('insufficient')) return 'Insufficient Balance';
                    if (error.includes('authentication') || error.includes('credentials')) return 'Authentication Failed';
                    if (error.includes('cancelled') || error.includes('rejected')) return 'Cancelled';
                    if (error.includes('no order id')) return 'Sale Failed';
                    return 'Sale Failed';
                  })()}
                </h3>
                <p className="text-sm text-red-400 mt-1">
                  {(() => {
                    const error = (sellState.error || '').toLowerCase();
                    if (error.includes('insufficient')) return 'You don\'t have enough shares to sell this amount.';
                    if (error.includes('authentication') || error.includes('credentials')) return 'Please go to Portfolio and click "Enable Trading" again.';
                    if (error.includes('cancelled') || error.includes('rejected')) return 'You cancelled the transaction in your wallet.';
                    if (error.includes('no order id')) return 'The sale could not be processed. Please try again.';
                    return sellState.error || 'Please try again';
                  })()}
                </p>
              </div>
            </div>
            <Button
              onClick={reset}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Position Info */}
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position Size</span>
                <span className="font-mono">{(position?.size || 0).toFixed(2)} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-mono">{Math.round((position?.currentPrice || 0) * 100)}¢</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Value</span>
                <span className="font-mono">{formatUSD((position?.size || 0) * (position?.currentPrice || 0))}</span>
              </div>
            </div>

            {/* Size Input */}
            <div className="space-y-2">
              <Label htmlFor="size">Size to Sell (shares)</Label>
              <div className="flex gap-2">
                <Input
                  id="size"
                  type="number"
                  placeholder="0.00"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isProcessing || isQuoting}
                  min="0"
                  max={position?.size || 0}
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={handleMaxClick}
                  disabled={isProcessing || isQuoting}
                  className="shrink-0"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Quote */}
            {sellState.quote && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Proceeds</span>
                  <span className="font-mono">{formatUSD(sellState.quote.estimatedProceeds)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Fees (2%)</span>
                  <span className="font-mono text-red-400">-{formatUSD(sellState.quote.estimatedFees)}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-white/10 pt-2">
                  <span>Net Proceeds</span>
                  <span className="font-mono text-green-400">{formatUSD(sellState.quote.netProceeds)}</span>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  This will sell your shares at the current market price. The proceeds will be added to your trading balance.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCashOut}
                disabled={
                  !size ||
                  parseFloat(size) <= 0 ||
                  parseFloat(size) > (position?.size || 0) ||
                  isProcessing ||
                  isQuoting
                }
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {showL2Auth ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Initializing...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {sellState.status === 'signing' && 'Signing...'}
                    {sellState.status === 'submitted' && 'Submitting...'}
                  </>
                ) : isQuoting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Getting quote...
                  </>
                ) : (
                  'Sell Now'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

