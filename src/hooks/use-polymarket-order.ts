// ODDSHOT Polymarket Order Hook
// Client-side order signing with ClobClient + builder attribution
import { useState, useCallback, useEffect } from 'react';
import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';
import { ethers } from 'ethers';
import { OrderStatus, OrderResult } from '@/lib/venues';
import { usePhantomEVM } from './use-phantom-evm';
import { usePolymarketProfile } from './use-polymarket-profile';
import { usePolymarketBalance } from './use-polymarket-balance';

interface L2Credentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

type TickSize = "0.1" | "0.01" | "0.001" | "0.0001";

interface QuoteState {
  tokenId: string;
  outcome: "YES" | "NO";
  amountUsd: number;
  bestAsk: number;
  estShares: number;
  tickSize: TickSize;
  negRisk: boolean;
  estimatedFeesUsd: number;
  totalUsd: number;
}

interface UsePolymarketOrderReturn {
  status: OrderStatus;
  orderId: string | null;
  error: string | null;
  quote: QuoteState | null;
  needsL2Auth: boolean;
  isInitializingL2: boolean;
  initializeL2Credentials: () => Promise<boolean>;
  fetchQuote: (args: {
    tokenId: string;
    outcome: "YES" | "NO";
    amountUsd: number;
    tickSize?: TickSize;
    negRisk?: boolean;
  }) => Promise<void>;
  placeOrder: () => Promise<OrderResult | null>;
  reset: () => void;
}

const CLOB_HOST = 'https://clob.polymarket.com';
const CHAIN_ID = 137; // Polygon
const L2_CREDS_KEY = 'oddshot-poly-l2-creds';
const L2_CREDS_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    console.log('[usePolymarketOrder] Builder config initialized for order attribution');
  }
} catch (error) {
  console.warn('[usePolymarketOrder] Builder config initialization failed - orders will work without attribution:', error);
  BUILDER_CONFIG = undefined;
}

export function usePolymarketOrder(): UsePolymarketOrderReturn {
  const [status, setStatus] = useState<OrderStatus>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<UsePolymarketOrderReturn['quote']>(null);
  const [l2Creds, setL2Creds] = useState<L2Credentials | null>(null);
  const [clobClient, setClobClient] = useState<ClobClient | null>(null);
  const [isInitializingL2, setIsInitializingL2] = useState(false);
  
  const { evmAddress, evmConnected } = usePhantomEVM();
  const { profile } = usePolymarketProfile(evmAddress);
  const { balance } = usePolymarketBalance(profile?.proxyWallet);
  
  // Check if L2 credentials are needed
  const needsL2Auth = evmConnected && !!profile?.proxyWallet && !l2Creds;
  
  // Load L2 creds from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(L2_CREDS_KEY);
    if (stored) {
      try {
        const { creds, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < L2_CREDS_TTL) {
          setL2Creds(creds);
        } else {
          sessionStorage.removeItem(L2_CREDS_KEY);
        }
      } catch (e) {
        sessionStorage.removeItem(L2_CREDS_KEY);
      }
    }
  }, []);

  // Initialize ClobClient when EVM connected and L2 creds available
  useEffect(() => {
    if (evmConnected && evmAddress && l2Creds && profile?.proxyWallet && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const creds = {
          key: l2Creds.apiKey,
          secret: l2Creds.secret,
          passphrase: l2Creds.passphrase
        };
        
        // Initialize with proper signature type and funder (proxy wallet)
        // signatureType 2 = EOA + Proxy wallet pattern (Polymarket's recommended approach)
        const signatureType = 2;
        const funder = profile.proxyWallet; // Proxy wallet is the maker/funder
        
        // Create client with builder attribution for order tracking
        // ClobClient(host, chainId, signer, creds, signatureType, funderAddress, geoBlockToken, useServerTime, builderConfig)
        const client = new ClobClient(
          CLOB_HOST,
          CHAIN_ID,
          signer,
          creds,
          signatureType,
          funder,
          undefined, // geoBlockToken
          undefined, // useServerTime  
          BUILDER_CONFIG // ✅ Builder attribution enabled!
        );
        
        setClobClient(client);
        
        console.log('[usePolymarketOrder] ✅ ClobClient initialized with builder attribution and proxy wallet:', funder);
      } catch (e) {
        console.error('[usePolymarketOrder] Failed to init ClobClient:', e);
      }
    } else {
      setClobClient(null);
    }
  }, [evmConnected, evmAddress, l2Creds, profile]);

  // Initialize L2 credentials (can be called separately before placing orders)
  const initializeL2Credentials = useCallback(async (): Promise<boolean> => {
    if (!evmConnected || !evmAddress || !profile?.proxyWallet) {
      setError('EVM wallet not connected or no Polymarket profile');
      return false;
    }

    if (l2Creds) {
      console.log('[usePolymarketOrder] L2 credentials already exist');
      return true; // Already have credentials
    }

    setIsInitializingL2(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found');
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check/switch to Polygon network
      const network = await provider.getNetwork();
      if (network.chainId !== CHAIN_ID) {
        console.log(`[usePolymarketOrder] Switching to Polygon (${CHAIN_ID})...`);
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${CHAIN_ID.toString(16)}`,
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
              }],
            });
          } else {
            throw new Error('Failed to switch to Polygon network');
          }
        }
      }
      
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      if (signerAddress.toLowerCase() !== evmAddress.toLowerCase()) {
        throw new Error(`Signer address mismatch: expected ${evmAddress}, got ${signerAddress}`);
      }
      
      const SIGNATURE_TYPE = 2; // GNOSIS_SAFE for browser wallet
      const FUNDER_ADDRESS = profile.proxyWallet;
      
      console.log('[usePolymarketOrder] Creating client to derive API credentials:', {
        signatureType: SIGNATURE_TYPE,
        funder: FUNDER_ADDRESS,
        signer: signerAddress
      });
      
      const tempClient = new ClobClient(
        CLOB_HOST, 
        CHAIN_ID, 
        signer,
        undefined,
        SIGNATURE_TYPE,
        FUNDER_ADDRESS,
        undefined, // geoBlockToken
        undefined, // useServerTime
        BUILDER_CONFIG // ✅ Builder attribution
      );
      
      console.log('[usePolymarketOrder] Requesting L2 API credentials (this will prompt for signature)...');
      const credsResponse = await tempClient.createOrDeriveApiKey();
      
      console.log('[usePolymarketOrder] Raw credentials response:', {
        hasKey: !!credsResponse.key,
        keyPreview: credsResponse.key?.slice(0, 8),
        hasSecret: !!credsResponse.secret,
        hasPassphrase: !!credsResponse.passphrase,
      });
      
      // ✅ Validate credentials before storing
      if (!credsResponse.key || !credsResponse.secret || !credsResponse.passphrase) {
        throw new Error('Invalid credentials received: missing key, secret, or passphrase');
      }
      
      if (credsResponse.key.length < 10 || credsResponse.secret.length < 10) {
        throw new Error('Invalid credentials received: key or secret too short');
      }
      
      const newCreds = { 
        apiKey: credsResponse.key,
        secret: credsResponse.secret,
        passphrase: credsResponse.passphrase 
      };
      
      // ✅ Initialize authenticated client with the new credentials
      console.log('[usePolymarketOrder] Initializing authenticated ClobClient...');
      const authClient = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer,
        { key: newCreds.apiKey, secret: newCreds.secret, passphrase: newCreds.passphrase },
        SIGNATURE_TYPE,
        FUNDER_ADDRESS,
        undefined, // geoBlockToken
        undefined, // useServerTime
        BUILDER_CONFIG // ✅ Builder attribution
      );
      
      // ✅ Store credentials
      setL2Creds(newCreds);
      sessionStorage.setItem(L2_CREDS_KEY, JSON.stringify({ creds: newCreds, timestamp: Date.now() }));
      setClobClient(authClient);
      
      console.log('[usePolymarketOrder] ✅ L2 credentials validated and stored successfully');
      return true;
      
    } catch (err) {
      console.error('[usePolymarketOrder] L2 initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize trading credentials';
      setError(errorMessage);
      return false;
    } finally {
      setIsInitializingL2(false);
    }
  }, [evmConnected, evmAddress, profile, l2Creds]);

  const fetchQuote = useCallback(async (args: {
    tokenId: string;
    outcome: "YES" | "NO";
    amountUsd: number;
    tickSize?: TickSize;
    negRisk?: boolean;
  }) => {
    const { tokenId, outcome, amountUsd } = args;
    setStatus('quoting');
    setError(null);

    try {
      // ✅ Use ClobClient methods to fetch REAL market metadata
      console.log('[usePolymarketOrder] Fetching market metadata for tokenId:', tokenId);
      
      // Create a temporary ClobClient to fetch market params (no auth needed for these calls)
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tempClient = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer,
        undefined, // creds
        undefined, // signatureType
        undefined, // funderAddress
        undefined, // geoBlockToken
        undefined, // useServerTime
        BUILDER_CONFIG // ✅ Builder attribution
      );
      
      // ✅ Use official ClobClient methods
      const realTickSize = await tempClient.getTickSize(tokenId);
      const realNegRisk = await tempClient.getNegRisk(tokenId);
      
      console.log('[usePolymarketOrder] Fetched market params:', {
        tickSize: realTickSize,
        negRisk: realNegRisk,
      });
      
      // ✅ Now fetch quote with validated tokenId
      console.log('[usePolymarketOrder] Fetching quote for tokenId:', tokenId);
      const quoteUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-quotes?tokenIds=${tokenId}`;
      const res = await fetch(quoteUrl, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to get quote for this market (status ${res.status}). Market may be closed or invalid.`);
      }

        const quoteData = await res.json();
      
      // ✅ Check if we got a valid quote back
      if (!quoteData.quotes || quoteData.quotes.length === 0) {
        console.error('[usePolymarketOrder] No quote data returned for tokenId:', tokenId);
        throw new Error('This market is not available for trading. It may be closed or have no liquidity.');
      }

          const q = quoteData.quotes[0];
      
      // ✅ Validate that the quote has valid prices
      if (!q.bestAsk || !q.bestBid || q.bestAsk <= 0 || q.bestBid <= 0) {
        console.error('[usePolymarketOrder] Invalid quote prices:', q);
        throw new Error('This market has no liquidity or is closed for trading.');
      }

      // ✅ Always use bestAsk for BUY orders, regardless of YES/NO
      // The tokenId already determines which outcome we're buying
      const bestAsk = q.bestAsk;
      
      console.log('[usePolymarketOrder] Quote validated:', {
        tokenId: tokenId.slice(0, 20) + '...',
        outcome: outcome,
        bestAsk,
        bestBid: q.bestBid,
        tickSize: realTickSize,
        negRisk: realNegRisk,
        hasLiquidity: true,
      });

      const estShares = amountUsd / bestAsk;
      const estimatedFeesUsd = amountUsd * 0.02;
      const totalUsd = amountUsd + estimatedFeesUsd;

      setQuote({
        tokenId,
        outcome,
        amountUsd,
        bestAsk,
        estShares,
        tickSize: realTickSize, // ✅ Use REAL tickSize from API
        negRisk: realNegRisk,   // ✅ Use REAL negRisk from API
        estimatedFeesUsd,
        totalUsd,
      });

      setStatus('ready');
    } catch (err) {
      console.error('[usePolymarketOrder] Quote error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setStatus('failed');
    }
  }, []);

  const placeOrder = useCallback(async (): Promise<OrderResult | null> => {
    if (!quote) {
      setError('No quote available');
      return null;
    }

    if (!evmConnected || !evmAddress || !profile?.proxyWallet) {
      setError('EVM wallet not connected or no Polymarket profile');
      return null;
    }

      if (!l2Creds) {
      setError('Trading credentials not initialized. Please sign in first.');
      return null;
    }

    // ✅ CHECK BALANCE BEFORE PLACING ORDER
    const currentBalance = parseFloat(balance || '0');
    const requiredAmount = quote.totalUsd;
    
    console.log(`[usePolymarketOrder] Balance check: $${currentBalance.toFixed(2)} available, need $${requiredAmount.toFixed(2)}`);
    
    if (currentBalance < requiredAmount) {
      const errorMsg = `Insufficient Balance - You have $${currentBalance.toFixed(2)} but need $${requiredAmount.toFixed(2)} to place this order.`;
      setError(errorMsg);
      setStatus('failed');
      return null;
    }

    // ✅ Check if L2 credentials are expired (24hr TTL)
    const stored = sessionStorage.getItem(L2_CREDS_KEY);
    if (stored) {
      try {
        const { timestamp } = JSON.parse(stored);
        const age = Date.now() - timestamp;
        if (age >= L2_CREDS_TTL) {
          console.warn('[usePolymarketOrder] L2 credentials expired. Please re-enable trading.');
          setError('Trading credentials expired. Please click "Enable Trading" again.');
          sessionStorage.removeItem(L2_CREDS_KEY);
          setL2Creds(null);
          return null;
        }
        console.log(`[usePolymarketOrder] L2 credentials age: ${Math.round(age / 1000 / 60)} minutes`);
      } catch (e) {
        console.error('[usePolymarketOrder] Failed to parse stored credentials');
      }
    }

    setStatus('signing');

    try {

      // Sign order with user's EOA
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found for signing');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Check if we're on the correct network (Polygon = 137)
      const network = await provider.getNetwork();
      console.log('[usePolymarketOrder] Current network:', network.chainId);
      
      if (network.chainId !== CHAIN_ID) {
        console.log(`[usePolymarketOrder] Switching to Polygon (${CHAIN_ID})...`);
        try {
          // Try to switch to Polygon
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }], // 0x89 for Polygon
          });
          console.log('[usePolymarketOrder] Switched to Polygon successfully');
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to Phantom yet
          if (switchError.code === 4902) {
            console.log('[usePolymarketOrder] Polygon not added, adding now...');
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: 'Polygon Mainnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                  },
                  rpcUrls: ['https://polygon-rpc.com/'],
                  blockExplorerUrls: ['https://polygonscan.com/']
                }],
              });
              console.log('[usePolymarketOrder] Polygon added and switched successfully');
            } catch (addError) {
              throw new Error('Failed to add Polygon network. Please add it manually in your wallet.');
            }
          } else {
            throw new Error('Failed to switch to Polygon network. Please switch manually in your wallet.');
          }
        }
      }
      
      // Request accounts to ensure connection
      await provider.send("eth_requestAccounts", []);
      // Get the connected signer
      const signer = provider.getSigner();
      
      // Verify signer address
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== evmAddress.toLowerCase()) {
        throw new Error(`Signer address mismatch: expected ${evmAddress}, got ${signerAddress}`);
      }

      // ✅ CRITICAL: Reinitialize ClobClient with current signer for this order
      // The old clobClient might have a stale signer reference
      console.log('[usePolymarketOrder] Initializing fresh ClobClient with:', {
        signerAddress,
        proxyWallet: profile!.proxyWallet,
        signatureType: 2,
        hasL2Creds: !!l2Creds
      });
      
      const freshClient = new ClobClient(
        CLOB_HOST,
        CHAIN_ID,
        signer,
        {
          key: l2Creds!.apiKey,
          secret: l2Creds!.secret,
          passphrase: l2Creds!.passphrase
        },
        2, // signatureType: EOA + Proxy
        profile!.proxyWallet, // funder address
        undefined, // geoBlockToken
        undefined, // useServerTime
        BUILDER_CONFIG // ✅ Builder attribution for order tracking!
      );
      
      console.log('[usePolymarketOrder] Fresh ClobClient initialized successfully');
      
      // ✅ CRITICAL: Fetch REAL market params RIGHT BEFORE placing order
      // This ensures we always use the latest configuration
      console.log('[usePolymarketOrder] Fetching market params for tokenId:', quote.tokenId);
      const negRisk = await freshClient.getNegRisk(quote.tokenId);
      const tickSize = await freshClient.getTickSize(quote.tokenId);
      
      console.log('[usePolymarketOrder] Fetched market params:', { negRisk, tickSize });
      console.log('[usePolymarketOrder] ✅ CRITICAL: negRisk =', negRisk, 'tickSize =', tickSize);
      
      // ✅ Use user's amount exactly as entered (e.g., $1.00)
      // Polymarket's createAndPostMarketOrder handles the minimum internally
      const orderAmount = quote.amountUsd;
      
      // Adjust price if it's at the boundary (0.99 or 0.01)
      // Polymarket has strict validation: min 0.01, max 0.99
      let orderPrice = quote.bestAsk;
      if (orderPrice >= 0.99) {
        orderPrice = 0.98; // Back off from the 0.99 max
      } else if (orderPrice <= 0.01) {
        orderPrice = 0.02; // Back off from the 0.01 min
      }
      
      console.log('[usePolymarketOrder] Market order params:', {
        amount: orderAmount,
        tokenId: quote.tokenId,
        tokenIdShort: quote.tokenId.slice(0, 20) + '...',
        side: 'BUY',
        price: orderPrice,
        originalPrice: quote.bestAsk,
        tickSize: tickSize,        // ✅ Using freshly fetched value
        negRisk: negRisk,          // ✅ Using freshly fetched value
        proxyWallet: profile!.proxyWallet,
        eoaAddress: signerAddress,
        credentialsAge: stored ? `${Math.round((Date.now() - JSON.parse(stored).timestamp) / 1000 / 60)} minutes` : 'unknown',
      });
      
      setStatus('submitted');
      console.log('[usePolymarketOrder] Submitting MARKET order to Polymarket CLOB...');
      console.log('[usePolymarketOrder] Order params being sent:', {
        tokenID: quote.tokenId,
        side: 'BUY',
        amount: orderAmount,
        price: orderPrice,
        feeRateBps: 0,
        tickSize: tickSize,   // ✅ Using freshly fetched value
        negRisk: negRisk,     // ✅ Using freshly fetched value
        orderType: 'FOK',
      });
      
      // ✅ Use createAndPostMarketOrder - takes USD amount directly
      // Pass user's exact amount (e.g., $1.00)
      // NOTE: Do NOT specify nonce - ClobClient handles it internally
      let response;
      try {
        response = await freshClient.createAndPostMarketOrder(
        {
          tokenID: quote.tokenId,
          side: Side.BUY,
          amount: orderAmount, // User's exact amount (e.g., $1.00)
            price: orderPrice, // Adjusted market price
          feeRateBps: 0,
            // nonce is auto-generated by ClobClient - do NOT set manually
        },
        {
          tickSize: tickSize,  // ✅ Use freshly fetched value - THIS IS THE KEY FIX
          negRisk: negRisk,    // ✅ Use freshly fetched value - THIS IS THE KEY FIX
        },
        OrderType.FOK // Fill-or-kill for immediate execution
      );
      } catch (orderError: any) {
        console.error('[usePolymarketOrder] createAndPostMarketOrder threw error:', {
          errorMessage: orderError.message,
          errorData: orderError.response?.data,
          errorStatus: orderError.response?.status,
          fullError: orderError,
        });
        throw orderError;
      }
      
      console.log('[usePolymarketOrder] Polymarket CLOB response:', response);
      console.log('[usePolymarketOrder] Response type:', typeof response);
      console.log('[usePolymarketOrder] Response keys:', response ? Object.keys(response) : 'null');
      
      // ✅ Check for nonce=0 which indicates authentication failure
      if (response && typeof response === 'object') {
        const responseObj = response as any;
        console.log('[usePolymarketOrder] Checking response for issues:', {
          hasOrder: 'order' in responseObj,
          hasNonce: responseObj.order && 'nonce' in responseObj.order,
          nonce: responseObj.order?.nonce,
          hasError: 'error' in responseObj,
          error: responseObj.error,
        });
        
        if (responseObj.order && (responseObj.order.nonce === "0" || responseObj.order.nonce === 0)) {
          console.error('[usePolymarketOrder] CRITICAL: Order nonce is 0 - L2 credentials are INVALID');
          console.error('[usePolymarketOrder] This means createOrDeriveApiKey() returned bad credentials');
          console.error('[usePolymarketOrder] You MUST clear storage and re-enable trading');
          throw new Error('Authentication failed: Invalid trading credentials. Clear browser storage and click "Enable Trading" again.');
        }
      }

      // Check for errors in response
      if (!response || response.success === false) {
        const errorMsg = response?.errorMsg || response?.error || 'Order submission failed';
        
        console.error('[usePolymarketOrder] Order submission failed:', {
          error: errorMsg,
          fullResponse: response,
        });
        
        throw new Error(errorMsg);
      }

      // Extract order ID from response
      const orderId = response.orderID || response.orderId;
      
      if (!orderId) {
        throw new Error('No order ID returned from Polymarket');
      }

      setOrderId(orderId);
      setStatus('confirmed');

      return {
        orderId,
        status: 'confirmed',
        tokenId: quote.tokenId,
        side: quote.outcome,
        size: quote.estShares,
        price: quote.bestAsk,
        timestamp: new Date().toISOString(),
        builder: 'polymarket',
      };
    } catch (err) {
      console.error('[usePolymarketOrder] Order error:', err);
      
      // Parse error for user-friendly message
      let errorMessage = 'Failed to place order';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        if (msg.includes('insufficient')) {
          errorMessage = 'Insufficient balance. Please fund your account in the Portfolio tab.';
        } else if (msg.includes('authentication') || msg.includes('invalid trading credentials')) {
          errorMessage = 'Authentication failed. Please go to Portfolio and click "Enable Trading" again.';
        } else if (msg.includes('user rejected') || msg.includes('cancelled')) {
          errorMessage = 'Transaction cancelled by user.';
        } else if (msg.includes('minimum')) {
          errorMessage = 'Order amount is below minimum. Please increase the amount.';
        } else if (msg.includes('slippage')) {
          errorMessage = 'Price changed too much. Please try again.';
        } else if (msg.includes('market') && (msg.includes('closed') || msg.includes('inactive'))) {
          errorMessage = 'This market is no longer available for trading.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setStatus('failed');
      return null;
    }
  }, [quote, evmConnected, evmAddress, profile, l2Creds, clobClient, balance]);

  const reset = useCallback(() => {
    setStatus('idle');
    setOrderId(null);
    setError(null);
    setQuote(null);
  }, []);

  return {
    status,
    orderId,
    error,
    quote,
    needsL2Auth,
    isInitializingL2,
    initializeL2Credentials,
    fetchQuote,
    placeOrder,
    reset,
  };
}
