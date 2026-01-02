// ODDSHOT Polymarket Funding Modal
// Handles SOL/USDC deposits to Polymarket via bridge
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle, Wallet, ArrowRight } from 'lucide-react';
import { usePolymarketFunding } from '@/hooks/use-polymarket-funding';
import { usePolymarketBalance } from '@/hooks/use-polymarket-balance';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FundingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proxyWallet: string;
  currentBalance?: string;
}

export function FundingModal({ open, onOpenChange, proxyWallet, currentBalance }: FundingModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [token, setToken] = useState<'SOL' | 'USDC'>('SOL');
  const [amount, setAmount] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'confirming' | 'confirmed' | 'bridging' | 'complete'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  const {
    supportedAssets,
    depositAddress,
    isCreatingAddress,
    isSending,
    error: fundingError,
    getSupportedAssets,
    createDepositAddress,
    sendSOL,
    sendUSDC,
  } = usePolymarketFunding();

  const { balance, refetch: refetchBalance } = usePolymarketBalance(proxyWallet, bridgeStatus === 'bridging' ? 5000 : undefined);

  // Load supported assets and create deposit address on mount
  useEffect(() => {
    if (open && proxyWallet) {
      getSupportedAssets();
      createDepositAddress(proxyWallet);
    }
  }, [open, proxyWallet]);

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    const amountNum = parseFloat(amount);

    // Check minimum
    if (supportedAssets?.minCheckoutUsd && amountNum < supportedAssets.minCheckoutUsd) {
      toast({
        title: 'Amount too low',
        description: `Minimum deposit is $${supportedAssets.minCheckoutUsd}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setBridgeStatus('confirming');
      
      const signature = token === 'SOL' 
        ? await sendSOL(amountNum)
        : await sendUSDC(amountNum);

      // Transaction confirmed on Solana
      setTxSignature(signature);
      setBridgeStatus('confirmed');

      toast({
        title: 'Confirmed on Solana ✓',
        description: 'Your funds are being bridged to Polygon...',
      });

      // Wait a moment to show "confirmed" state
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBridgeStatus('bridging');

      // Poll balance for 10 minutes
      const startBalance = parseFloat(currentBalance || '0');
      const startTime = Date.now();
      const maxWaitTime = 10 * 60 * 1000; // 10 minutes

      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        pollCount++;
        
        console.log(`[FundingModal] Polling balance (attempt ${pollCount}): start=${startBalance.toFixed(2)}`);
        
        if (elapsed > maxWaitTime) {
          clearInterval(pollInterval);
          setBridgeStatus('idle');
          toast({
            title: 'Bridge taking longer than expected',
            description: 'Your funds are still being processed. Check back in a few minutes.',
          });
          return;
        }

        // Refetch balance and get fresh data from the return value
        const freshBalance = await refetchBalance();
        const newBalance = parseFloat(freshBalance);
        
        console.log(`[FundingModal] Fresh balance: $${newBalance.toFixed(2)} vs start: $${startBalance.toFixed(2)}`);
        
        if (newBalance > startBalance) {
          clearInterval(pollInterval);
          setBridgeStatus('complete');
          
          // ✅ Force refetch portfolio and history data
          console.log('[FundingModal] Funding complete - refetching portfolio data');
          await queryClient.refetchQueries({ queryKey: ['polymarket-portfolio'] });
          await queryClient.refetchQueries({ queryKey: ['polymarket-history'] });
          
          toast({
            title: 'Funds arrived! ✓',
            description: `Your trading balance is now $${newBalance.toFixed(2)}`,
          });
          
          // Close modal after 3 seconds
          setTimeout(() => {
            onOpenChange(false);
            setBridgeStatus('idle');
            setAmount('');
            setTxSignature(null);
          }, 3000);
        }
      }, 5000); // Check every 5 seconds

      } catch (err) {
      console.error('[FundingModal] Send error:', err);
      setBridgeStatus('idle');
      
      // Extract user-friendly error message
      let errorTitle = 'Transaction Failed';
      let errorDescription = 'Failed to send transaction';
      
      if (err instanceof Error) {
        const msg = err.message;
        const lowerMsg = msg.toLowerCase();
        
        // Customize title and description based on error type
        if (lowerMsg.includes('insufficient') || 
            lowerMsg.includes('program error') ||
            lowerMsg.includes('custom program error: 1')) {
          errorTitle = 'Insufficient Balance';
          errorDescription = msg;
        } else if (lowerMsg.includes('cancelled') || lowerMsg.includes('rejected')) {
          errorTitle = 'Transaction Cancelled';
          errorDescription = 'You cancelled the transaction in your wallet.';
        } else if (lowerMsg.includes('no usdc') || lowerMsg.includes('no sol') || lowerMsg.includes('no account')) {
          errorTitle = 'No Funds Found';
          errorDescription = msg;
        } else if (lowerMsg.includes('minimum')) {
          errorTitle = 'Amount Too Low';
          errorDescription = msg;
        } else {
          errorDescription = msg;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  };

  const minDeposit = supportedAssets?.minCheckoutUsd || 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-white/10 bg-[#0A0A0A]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Fund Polymarket Trading
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Send SOL or USDC from Solana. Funds will be bridged to Polygon automatically (~1-2 minutes).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Minimum Deposit Notice */}
          {supportedAssets && (
            <Alert className="border-purple-500/30 bg-purple-500/10">
              <Wallet className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-white/80">
                Minimum deposit: <span className="font-bold">${minDeposit}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Token Selection */}
          <Tabs value={token} onValueChange={(v) => setToken(v as 'SOL' | 'USDC')}>
            <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1A] border border-white/10">
                    <TabsTrigger 
                      value="SOL" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                    >
                      SOL
                    </TabsTrigger>
                    <TabsTrigger 
                      value="USDC" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
                    >
                      USDC (Solana)
                    </TabsTrigger>
                  </TabsList>

              {/* Amount Input */}
            <TabsContent value={token} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {token === 'SOL' ? '◎' : '$'}
                  </span>
                  <Input
                    type="number"
                    placeholder={`${minDeposit.toFixed(2)}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 font-mono text-lg bg-[#1A1A1A] border-white/10 focus-visible:ring-purple-500"
                    disabled={isSending || bridgeStatus !== 'idle'}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {token}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ~${token === 'SOL' ? (parseFloat(amount || '0') * 150).toFixed(2) : amount} will be credited to Polygon
                  </p>
              </div>

              {/* Error */}
              {fundingError && (
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fundingError}</AlertDescription>
                </Alert>
              )}

              {/* Primary Action: Send with Phantom Button */}
              {isCreatingAddress ? (
                <Card className="p-4 border-white/10 bg-[#1A1A1A]">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Preparing deposit address...</span>
                  </div>
                </Card>
              ) : (
              <Button
                  onClick={handleSend}
                  disabled={!amount || parseFloat(amount) <= 0 || isSending || bridgeStatus !== 'idle' || !depositAddress}
                  className="w-full gap-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 h-14 text-base font-semibold"
                size="lg"
                >
                  {bridgeStatus === 'confirming' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Confirm in Phantom...
                    </>
                  ) : bridgeStatus === 'confirmed' ? (
                    <>
                      <Check className="h-5 w-5" />
                      Confirmed on Solana
                    </>
                  ) : bridgeStatus === 'bridging' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Bridging to Polygon...
                    </>
                  ) : bridgeStatus === 'complete' ? (
                    <>
                      <Check className="h-5 w-5" />
                      Complete!
                  </>
                ) : (
                  <>
                      <Wallet className="h-5 w-5" />
                      Send with Phantom
                      <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
              )}
            </TabsContent>
          </Tabs>

          {/* Bridge Progress */}
          {(bridgeStatus === 'confirmed' || bridgeStatus === 'bridging') && (
            <Card className="p-6 border-purple-500/30 bg-purple-500/5">
              <div className="space-y-4">
                {/* Step 1: Confirmed on Solana */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                    bridgeStatus === 'confirmed' || bridgeStatus === 'bridging' ? "bg-green-500" : "bg-white/10"
                  )}>
                    {(bridgeStatus === 'confirmed' || bridgeStatus === 'bridging') && <Check className="h-4 w-4 text-white" />}
              </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Confirmed on Solana</p>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:underline"
                >
                        View transaction →
                </a>
              )}
            </div>
                </div>

                {/* Step 2: Bridging + Swapping */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                    bridgeStatus === 'bridging' ? "bg-purple-500" : "bg-white/10"
                  )}>
                    {bridgeStatus === 'bridging' && <Loader2 className="h-4 w-4 text-white animate-spin" />}
              </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Bridging + Swapping</p>
                    <p className="text-xs text-white/70">Converting to USDC.e on Polygon...</p>
              </div>
            </div>

                {/* Step 3: Crediting Trading Balance */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-white/10">
                    {/* Will show check when complete */}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/50">Crediting Trading Balance</p>
                    <p className="text-xs text-white/50">Waiting for bridge completion...</p>
                  </div>
              </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <p className="text-xs text-white/60">
                    This usually takes 1-2 minutes. You can close this window and the funds will arrive automatically.
                  </p>
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      setBridgeStatus('idle');
                      setAmount('');
                      setTxSignature(null);
                    }}
                    variant="outline"
                    className="w-full text-xs border-white/10 hover:bg-white/5 hover:text-white"
                  >
                    Close & Check Balance
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Complete State */}
          {bridgeStatus === 'complete' && (
            <Card className="p-6 border-green-500/30 bg-green-500/5">
              <div className="space-y-4">
                {/* All steps complete */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Confirmed on Solana</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Bridging + Swapping</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-green-500">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Credited Trading Balance</p>
                    <p className="text-xs text-green-400">Your funds are ready to trade!</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-sm font-bold text-green-400">✓ Funding Complete!</p>
                  <p className="text-xs text-white/70">Modal will close automatically...</p>
                </div>
            </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
