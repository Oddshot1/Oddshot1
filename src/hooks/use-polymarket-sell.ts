// ODDSHOT Polymarket Sell Hook
// Handles selling (cash-out) of existing positions
import { useState, useCallback } from 'react';
import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { ethers } from 'ethers';

interface SellState {
  status: 'idle' | 'quoting' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  orderId: string | null;
  quote: {
    currentPrice: number;
    estimatedProceeds: number;
    estimatedFees: number;
    netProceeds: number;
  } | null;
  error: string | null;
}

interface UsePolymarketSellReturn {
  sellState: SellState;
  getQuote: (tokenId: string, size: number, currentPrice: number) => Promise<void>;
  sellPosition: (
    tokenId: string,
    size: number,
    tickSize: string | undefined, // Optional - will be fetched from market
    negRisk: boolean | undefined, // Optional - will be fetched from market
    l2Creds: { apiKey: string; secret: string; passphrase: string },
    proxyWallet: string
  ) => Promise<boolean>;
  reset: () => void;
}

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon

// Builder Config - Remote signing for order attribution
const REMOTE_SIGNER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-builder-sign`;

// Initialize builder config with error handling
let BUILDER_CONFIG: BuilderConfig | undefined;
try {
  if (REMOTE_SIGNER_URL && import.meta.env.VITE_SUPABASE_URL) {
    BUILDER_CONFIG = new BuilderConfig({
      remoteBuilderConfig: {
        url: REMOTE_SIGNER_URL
      }
    });
    console.log('[usePolymarketSell] Builder config initialized for order attribution');
  }
} catch (error) {
  console.warn('[usePolymarketSell] Builder config initialization failed - orders will work without attribution:', error);
  BUILDER_CONFIG = undefined;
}

export function usePolymarketSell(): UsePolymarketSellReturn {
  const [sellState, setSellState] = useState<SellState>({
    status: 'idle',
    orderId: null,
    quote: null,
    error: null,
  });

  const getQuote = useCallback(async (
    tokenId: string,
    size: number,
    currentPrice: number
  ) => {
    if (!tokenId) {
      console.error('[usePolymarketSell] No tokenId provided for quote');
      setSellState({
        status: 'failed',
        orderId: null,
        quote: null,
        error: 'Missing token ID - cannot get quote',
      });
      return;
    }

    console.log('[usePolymarketSell] Getting quote for:', {
      tokenIdPreview: tokenId.slice(0, 20) + '...',
      tokenIdLength: tokenId.length,
      size,
      currentPrice,
    });

    setSellState({ status: 'quoting', orderId: null, quote: null, error: null });

    try {
      // Fetch current market prices for THIS SPECIFIC tokenId
      const quoteUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-quotes?tokenIds=${tokenId}`;
      const res = await fetch(quoteUrl, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch quote (status ${res.status})`);
      }

      const quoteData = await res.json();
      
      if (!quoteData.quotes || quoteData.quotes.length === 0) {
        throw new Error('No quote available for this token');
      }

      // ✅ CRITICAL: Use bestBid when SELLING (you're selling to the highest bidder)
      const bestBid = quoteData.quotes[0].bestBid;

      if (!bestBid || bestBid <= 0) {
        throw new Error('Invalid bid price - market may have no liquidity');
      }

      console.log('[usePolymarketSell] Quote fetched:', {
        tokenIdPreview: tokenId.slice(0, 20) + '...',
        bestBid,
        bestAsk: quoteData.quotes[0].bestAsk,
        size,
      });

      const estimatedProceeds = size * bestBid;
      const estimatedFees = estimatedProceeds * 0.02; // 2% fee
      const netProceeds = estimatedProceeds - estimatedFees;

      setSellState({
        status: 'idle',
        orderId: null,
        quote: {
          currentPrice: bestBid,
          estimatedProceeds,
          estimatedFees,
          netProceeds,
        },
        error: null,
      });
    } catch (err) {
      console.error('[usePolymarketSell] Quote error:', err);
      setSellState({
        status: 'failed',
        orderId: null,
        quote: null,
        error: err instanceof Error ? err.message : 'Failed to get quote',
      });
    }
  }, []);

  const sellPosition = useCallback(async (
    tokenId: string,
    size: number,
    tickSize: string | undefined,
    negRisk: boolean | undefined,
    l2Creds: { apiKey: string; secret: string; passphrase: string },
    proxyWallet: string
  ): Promise<boolean> => {
    if (!tokenId) {
      console.error('[usePolymarketSell] No tokenId provided for sell');
      setSellState({
        status: 'failed',
        orderId: null,
        quote: sellState.quote,
        error: 'Missing token ID - cannot sell position',
      });
      return false;
    }

    // ✅ Validate tokenId format (should be 66 chars for valid token IDs)
    if (tokenId.length < 60) {
      console.error('[usePolymarketSell] Invalid tokenId format:', tokenId);
      setSellState({
        status: 'failed',
        orderId: null,
        quote: sellState.quote,
        error: 'Invalid token ID format',
      });
      return false;
    }

    console.log('[usePolymarketSell] Starting sell with tokenId:', {
      tokenId: tokenId.slice(0, 20) + '...',
      fullLength: tokenId.length,
      size,
    });

    if (!window.ethereum) {
      setSellState({
        status: 'failed',
        orderId: null,
        quote: sellState.quote,
        error: 'Ethereum provider not found',
      });
      return false;
    }

    setSellState({ ...sellState, status: 'signing' });

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      // Initialize CLOB client with builder attribution
      const client = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer,
        {
          key: l2Creds.apiKey,
          secret: l2Creds.secret,
          passphrase: l2Creds.passphrase,
        },
        2, // signatureType: EOA + Proxy
        proxyWallet,
        undefined, // geoBlockToken
        undefined, // useServerTime
        BUILDER_CONFIG // ✅ Builder attribution for sell orders!
      );

      // ✅ Fetch REAL market params using ClobClient methods (ignore passed params)
      console.log('[usePolymarketSell] Fetching market params for tokenId:', tokenId);
      let realTickSize;
      let realNegRisk;
      
      try {
        // Always fetch fresh values from the market, ignore any passed parameters
        realTickSize = await client.getTickSize(tokenId);
        realNegRisk = await client.getNegRisk(tokenId);
        
        console.log('[usePolymarketSell] ✅ Fetched market params:', {
          tickSize: realTickSize,
          negRisk: realNegRisk,
          passedTickSize: tickSize,
          passedNegRisk: negRisk,
          usingFetchedValues: true,
        });
      } catch (marketError) {
        console.error('[usePolymarketSell] Failed to fetch market params:', marketError);
        throw new Error('This market is not available for trading. It may be closed or invalid.');
      }

      // ✅ Fetch current market price for selling - CRITICAL for correct pricing
      console.log('[usePolymarketSell] Fetching quote for tokenId:', tokenId.slice(0, 20) + '...');
      let sellPrice = 0.5; // default
      try {
        const quoteUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-quotes?tokenIds=${tokenId}`;
        const res = await fetch(quoteUrl, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        if (!res.ok) {
          console.error('[usePolymarketSell] Quote API error:', res.status, res.statusText);
          throw new Error(`Failed to get quote for this token (status ${res.status})`);
        }

        const quoteData = await res.json();
        console.log('[usePolymarketSell] Quote response:', {
          hasQuotes: !!quoteData.quotes,
          quotesLength: quoteData.quotes?.length,
          firstQuote: quoteData.quotes?.[0] ? {
            bestBid: quoteData.quotes[0].bestBid,
            bestAsk: quoteData.quotes[0].bestAsk,
          } : null,
        });

        if (!quoteData.quotes || quoteData.quotes.length === 0) {
          throw new Error('No quote available for this token. Market may be closed.');
        }

        // ✅ CRITICAL: Use bestBid when SELLING (you're selling to the highest bidder)
        sellPrice = quoteData.quotes[0].bestBid;
        
        if (!sellPrice || sellPrice <= 0) {
          throw new Error('Invalid bid price received. Market may have no liquidity.');
        }

        console.log('[usePolymarketSell] ✅ Got valid bestBid for SELL order:', {
          tokenIdPreview: tokenId.slice(0, 20) + '...',
          bestBid: sellPrice,
          bestAsk: quoteData.quotes[0].bestAsk,
        });

      } catch (err) {
        console.error('[usePolymarketSell] Quote fetch failed:', err);
        throw new Error(err instanceof Error ? err.message : 'Could not fetch market price');
      }

      // ✅ Validate and adjust price if needed (min: 0.01, max: 0.99)
      if (sellPrice < 0.01) {
        console.warn(`[usePolymarketSell] Price ${sellPrice} below minimum, adjusting to 0.02`);
        sellPrice = 0.02;
      } else if (sellPrice > 0.99) {
        console.warn(`[usePolymarketSell] Price ${sellPrice} above maximum, adjusting to 0.98`);
        sellPrice = 0.98;
      }

      console.log('[usePolymarketSell] Creating SELL order:', {
        tokenId,
        size,
        side: 'SELL',
        price: sellPrice,
        tickSize: realTickSize,
        negRisk: realNegRisk,
      });

      setSellState({ ...sellState, status: 'submitted' });

      // Create market sell order with validated price
      let response;
      try {
        response = await client.createAndPostMarketOrder(
          {
            tokenID: tokenId,
            side: Side.SELL,
            amount: size, // Size in shares to sell
            price: sellPrice, // ✅ Add validated price
            feeRateBps: 0,
          },
          {
            tickSize: realTickSize as any, // ✅ Use fetched tickSize
            negRisk: realNegRisk,          // ✅ Use fetched negRisk
          },
          OrderType.FOK // Fill-or-kill for immediate execution
        );
      } catch (orderError: any) {
        console.error('[usePolymarketSell] createAndPostMarketOrder threw error:', {
          errorMessage: orderError.message,
          errorData: orderError.response?.data,
          errorStatus: orderError.response?.status,
          fullError: orderError,
        });
        throw orderError;
      }

      console.log('[usePolymarketSell] Sell response:', response);

      // ✅ Check for nonce=0 which indicates authentication failure
      if (response && typeof response === 'object') {
        const responseObj = response as any;
        if (responseObj.order && (responseObj.order.nonce === "0" || responseObj.order.nonce === 0)) {
          console.error('[usePolymarketSell] CRITICAL: Order nonce is 0 - L2 credentials are INVALID');
          throw new Error('Authentication failed: Invalid trading credentials. Please go to Portfolio and click "Enable Trading" again.');
        }
      }

      // Check for errors in response
      if (!response || response.success === false) {
        const errorMsg = response?.errorMsg || response?.error || 'Sell order failed';
        console.error('[usePolymarketSell] Order submission failed:', {
          error: errorMsg,
          fullResponse: response,
        });
        throw new Error(errorMsg);
      }

      const orderId = response.orderID || response.orderId;

      if (!orderId) {
        console.error('[usePolymarketSell] No order ID in response:', response);
        throw new Error('No order ID returned from Polymarket');
      }

      setSellState({
        status: 'confirmed',
        orderId,
        quote: sellState.quote,
        error: null,
      });

      return true;
    } catch (err) {
      console.error('[usePolymarketSell] Sell error:', err);
      
      // Parse error for user-friendly message
      let errorMessage = 'Failed to sell position';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        if (msg.includes('insufficient')) {
          errorMessage = 'Insufficient shares to sell. Please check your position size.';
        } else if (msg.includes('authentication') || msg.includes('invalid trading credentials')) {
          errorMessage = 'Authentication failed. Please go to Portfolio and click "Enable Trading" again.';
        } else if (msg.includes('user rejected') || msg.includes('cancelled')) {
          errorMessage = 'Transaction cancelled by user.';
        } else if (msg.includes('minimum')) {
          errorMessage = 'Sell amount is below minimum. Please increase the amount.';
        } else if (msg.includes('slippage')) {
          errorMessage = 'Price changed too much. Please try again.';
        } else if (msg.includes('market') && (msg.includes('closed') || msg.includes('inactive'))) {
          errorMessage = 'This market is no longer available for trading.';
        } else if (msg.includes('no position') || msg.includes('position not found')) {
          errorMessage = 'Position not found. Please refresh and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setSellState({
        status: 'failed',
        orderId: null,
        quote: sellState.quote,
        error: errorMessage,
      });
      return false;
    }
  }, [sellState]);

  const reset = useCallback(() => {
    setSellState({
      status: 'idle',
      orderId: null,
      quote: null,
      error: null,
    });
  }, []);

  return {
    sellState,
    getQuote,
    sellPosition,
    reset,
  };
}

