// ODDSHOT Polymarket Trade Integration
// Comprehensive wrapper for TradeTicket with Polymarket-specific logic
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ExternalLink, Shield, Zap } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePhantomEVM } from '@/hooks/use-phantom-evm';
import { usePolymarketGeoblock } from '@/hooks/use-polymarket-geoblock';
import { usePolymarketProfile } from '@/hooks/use-polymarket-profile';
import { usePolymarketBalance } from '@/hooks/use-polymarket-balance';
import { usePolymarketClob } from '@/hooks/use-polymarket-clob';
import { useToast } from '@/hooks/use-toast';
import { FundingModal } from './FundingModal';
import { ethers } from 'ethers';

interface PolymarketTradeIntegrationProps {
  marketId: string;
  tokenId: string;
  side: 'YES' | 'NO';
  price: number;
  onTradeComplete?: (orderId: string) => void;
}

export function PolymarketTradeIntegration({
  marketId,
  tokenId,
  side,
  price,
  onTradeComplete,
}: PolymarketTradeIntegrationProps) {
  const { connected } = useWallet();
  const { toast } = useToast();
  
  // Phantom EVM
  const { evmAddress, evmConnected, evmAvailable, connectEVM } = usePhantomEVM();
  
  // Geoblock check
  const { blocked, country, loading: geoblockLoading } = usePolymarketGeoblock();
  
  // Profile & proxy wallet
  const { profile, loading: profileLoading } = usePolymarketProfile(evmAddress);
  const proxyWallet = profile?.proxyWallet;
  
  // Balance
  const { balance, loading: balanceLoading } = usePolymarketBalance(proxyWallet);
  
  // CLOB client & L2 credentials
  const {
    client,
    l2Creds,
    hasL2Creds,
    isCreatingL2Creds,
    createL2Creds,
    signOrder,
    clearL2Creds,
    error: clobError,
  } = usePolymarketClob();
  
  // UI state
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'l2creds' | 'signing' | 'submitting' | 'complete'>('idle');

  // Handle trade
  const handleTrade = async () => {
    if (!connected || !evmConnected || !proxyWallet || !evmAddress || !client) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your Phantom wallet and enable EVM to trade.',
        variant: 'destructive',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    // Check balance
    const balanceNum = parseFloat(balance || '0');
    if (amountNum > balanceNum) {
      toast({
        title: 'Insufficient Balance',
        description: `You need $${amountNum.toFixed(2)} but only have $${balance}. Fund your account in the Portfolio tab.`,
        variant: 'destructive',
      });
      setShowFundingModal(true);
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Step 1: Create L2 credentials if first time
      if (!hasL2Creds) {
        setOrderStatus('l2creds');
        toast({
          title: 'Setting Up Trading',
          description: 'Please approve in Phantom to create your trading credentials (one-time setup)',
        });
        
        await createL2Creds();
        
        toast({
          title: 'Trading Credentials Created',
          description: 'Now signing your order...',
        });
      }

      // Step 2: Build order arguments
      setOrderStatus('signing');
      
      const expectedShares = amountNum / price;
      
      // ⚠️ CRITICAL: Order construction with proxy wallet pattern
      // Based on Polymarket docs: maker=proxyWallet, signer=userEOA, signatureType=2
      const orderArgs = {
        tokenID: tokenId, // Note: ClobClient might use 'tokenID' not 'tokenId'
        price: price.toString(),
        size: expectedShares.toString(),
        side, // 'YES' or 'NO' - might need to be 'BUY' for CLOB
        feeRateBps: '0',
        nonce: Math.floor(Date.now() / 1000).toString(),
        // ⚠️ TODO: Verify these are needed/correct for ClobClient
        // maker: proxyWallet,  // Funder = proxy wallet
        // taker: evmAddress,   // Signer = user EOA
        // signatureType: 2,    // Required for browser + proxy
      };

      console.log('[PolymarketTrade] Building order:', orderArgs);

      // Step 3: Sign order with ClobClient
      const signedOrder = await signOrder(orderArgs);
      
      console.log('[PolymarketTrade] Order signed:', signedOrder);

      // Step 4: Submit to poly-order Edge Function
      setOrderStatus('submitting');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            signedOrder,
            orderType: 'GTC', // Good-til-canceled
            // ⚠️ TODO: Verify if user L2 auth headers are needed
            // If needed, generate HMAC signature client-side:
            // userApiKey: l2Creds?.apiKey,
            // userSignature: buildHmacSignature(...),
            // userTimestamp: timestamp,
            // userPassphrase: l2Creds?.passphrase,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.status === 'failed') {
        // Handle auth errors (401/403) - clear L2 creds and retry
        if (response.status === 401 || response.status === 403) {
          console.log('[PolymarketTrade] Auth error, clearing L2 creds and retrying...');
          clearL2Creds();
          
          toast({
            title: 'Session Expired',
            description: 'Refreshing your trading credentials and retrying...',
          });
          
          // Retry once
          setIsPlacingOrder(false);
          setTimeout(() => handleTrade(), 500);
          return;
        }

        throw new Error(result.error || 'Order submission failed');
      }

      // Success!
      setOrderStatus('complete');
      
      const orderId = result.orderId || result.orderID;
      
      toast({
        title: 'Order Placed Successfully',
        description: `Your order has been placed. Check Portfolio for details.`,
      });

      if (onTradeComplete && orderId) {
        onTradeComplete(orderId);
      }

      // Reset
      setTimeout(() => {
        setOrderStatus('idle');
        setAmount('');
        setIsPlacingOrder(false);
      }, 2000);

    } catch (err) {
      console.error('[PolymarketTrade] Error:', err);
      setOrderStatus('idle');
      
      // Parse error for better messaging
      let errorTitle = 'Trade Failed';
      let errorDescription = 'Unknown error';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        if (msg.includes('insufficient')) {
          errorTitle = 'Insufficient Balance';
          errorDescription = 'You don\'t have enough funds for this trade. Please fund your account.';
        } else if (msg.includes('authentication') || msg.includes('credentials')) {
          errorTitle = 'Authentication Error';
          errorDescription = 'Your trading credentials are invalid. Please reconnect your wallet.';
        } else if (msg.includes('user rejected') || msg.includes('cancelled')) {
          errorTitle = 'Transaction Cancelled';
          errorDescription = 'You cancelled the transaction in your wallet.';
        } else if (msg.includes('minimum')) {
          errorTitle = 'Order Too Small';
          errorDescription = 'Your order amount is below the minimum required.';
        } else if (msg.includes('slippage')) {
          errorTitle = 'Price Changed';
          errorDescription = 'The price moved too much. Please try again.';
        } else {
          errorDescription = err.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      if (orderStatus !== 'complete') {
        setIsPlacingOrder(false);
      }
    }
  };

  // Loading states
  if (geoblockLoading || profileLoading || balanceLoading) {
    return (
      <Card className="p-6 border-white/10 bg-[#0A0A0A]">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </Card>
    );
  }

  // Geoblock check
  if (blocked) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Trading Unavailable</AlertTitle>
        <AlertDescription>
          Trading on Polymarket is not available in your region ({country}).
        </AlertDescription>
      </Alert>
    );
  }

  // Not connected
  if (!connected || !evmConnected) {
    return (
      <Card className="p-6 border-white/10 bg-[#0A0A0A] space-y-4">
        <Alert className="border-purple-500/30 bg-purple-500/10">
          <Shield className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-white/80">
            Connect Phantom and enable EVM to trade on Polymarket
          </AlertDescription>
        </Alert>
        
        {evmAvailable && !evmConnected && (
          <Button
            onClick={connectEVM}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
          >
            <Shield className="h-4 w-4" />
            Connect EVM
          </Button>
        )}
      </Card>
    );
  }

  // No profile
  if (!profile?.hasProfile) {
    return (
      <Card className="p-6 border-white/10 bg-[#0A0A0A] space-y-4">
        <Alert className="border-purple-500/30 bg-purple-500/10">
          <AlertCircle className="h-4 w-4 text-purple-400" />
          <AlertTitle>Create Polymarket Profile</AlertTitle>
          <AlertDescription className="text-white/80">
            You need a Polymarket profile to start trading.
          </AlertDescription>
        </Alert>
        
        <Button
          asChild
          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
        >
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">
            Create Profile
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </Card>
    );
  }

  // Main trade interface
  return (
    <>
      <Card className="p-4 space-y-4 border-white/10 bg-[#0A0A0A]">
        {/* Trading Balance */}
        <div className="flex items-center justify-between p-2 rounded-md bg-[#1A1A1A]/50 border border-white/10 text-xs">
          <span className="text-muted-foreground">Trading Balance</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-purple-400">
              ${balance || '0.00'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-xs hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
              onClick={() => setShowFundingModal(true)}
            >
              Fund
            </Button>
          </div>
        </div>

        {/* L2 Credentials Status */}
        {hasL2Creds && (
          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
            ✓ API Credentials Ready
          </Badge>
        )}

        {/* Errors */}
        {clobError && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {(() => {
                const error = clobError.toLowerCase();
                if (error.includes('insufficient')) return 'Insufficient funds. Please fund your account in Portfolio.';
                if (error.includes('authentication') || error.includes('credentials')) return 'Authentication failed. Please reconnect your wallet.';
                if (error.includes('cancelled') || error.includes('rejected')) return 'You cancelled the transaction.';
                if (error.includes('minimum')) return 'Order amount is below minimum.';
                if (error.includes('no order id')) return 'Order failed to process. Please try again.';
                return clobError;
              })()}
            </AlertDescription>
          </Alert>
        )}

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={isPlacingOrder || !amount || parseFloat(amount) <= 0}
          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
          size="lg"
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {orderStatus === 'l2creds' && 'Creating credentials...'}
              {orderStatus === 'signing' && 'Sign order in Phantom...'}
              {orderStatus === 'submitting' && 'Submitting order...'}
              {orderStatus === 'complete' && 'Complete!'}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              {hasL2Creds ? `Buy ${side}` : `Buy ${side} (Setup Required)`}
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          {hasL2Creds 
            ? '1 signature required'
            : '2 signatures required (first time only)'}
        </p>
      </Card>

      {/* Funding Modal */}
      {proxyWallet && (
        <FundingModal
          open={showFundingModal}
          onOpenChange={setShowFundingModal}
          proxyWallet={proxyWallet}
        />
      )}
    </>
  );
}

