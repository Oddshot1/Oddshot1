// ODDSHOT Polymarket CLOB Hook
// Manages L2 credentials and order signing
import { useState, useCallback, useRef, useEffect } from 'react';
import { ClobClient } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import { BuilderConfig } from '@polymarket/builder-signing-sdk';

const CLOB_HOST = 'https://clob.polymarket.com';
const POLYGON_CHAIN_ID = 137;

// Remote signing server URL (keeps builder credentials secure on server)
const REMOTE_SIGNER_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-builder-sign`
  : undefined;

interface L2Credentials {
  apiKey: string;
  secret: string;
  passphrase: string;
  timestamp: number; // When created
}

interface UsePolymarketClobReturn {
  client: ClobClient | null;
  l2Creds: L2Credentials | null;
  hasL2Creds: boolean;
  isCreatingL2Creds: boolean;
  createL2Creds: () => Promise<void>;
  signOrder: (order: any) => Promise<any>;
  clearL2Creds: () => void;
  error: string | null;
  builderConfig: BuilderConfig | null;
}

// Session storage key for L2 credentials (prefer in-memory, but session storage is acceptable)
const L2_CREDS_KEY = 'oddshot_polymarket_l2_creds';
const L2_CREDS_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function usePolymarketClob(
  signerOrProvider?: ethers.Signer | ethers.providers.Provider
): UsePolymarketClobReturn {
  const [client, setClient] = useState<ClobClient | null>(null);
  const [l2Creds, setL2Creds] = useState<L2Credentials | null>(null);
  const [isCreatingL2Creds, setIsCreatingL2Creds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig | null>(null);
  const creatingRef = useRef(false); // Mutex to prevent concurrent creates

  // Load L2 credentials from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(L2_CREDS_KEY);
      if (stored) {
        const creds: L2Credentials = JSON.parse(stored);
        
        // Check if credentials are still valid (within TTL)
        const age = Date.now() - creds.timestamp;
        if (age < L2_CREDS_TTL) {
          setL2Creds(creds);
        } else {
          // Expired, remove
          sessionStorage.removeItem(L2_CREDS_KEY);
        }
      }
    } catch (err) {
      console.error('[usePolymarketClob] Failed to load L2 creds:', err);
    }
  }, []);

  // Initialize CLOB client when signer is available
  useEffect(() => {
    if (!signerOrProvider) {
      setClient(null);
      return;
    }

    try {
      // Initialize builder config with REMOTE signing (secure - credentials stay on server)
      if (REMOTE_SIGNER_URL) {
        try {
          console.log('[usePolymarketClob] Initializing with remote builder signing for order attribution');
          const config = new BuilderConfig({
            remoteBuilderConfig: {
              url: REMOTE_SIGNER_URL
            }
          });
          setBuilderConfig(config);
          console.log('[usePolymarketClob] Builder config set with remote signing - orders will be attributed to your builder account');
        } catch (builderError) {
          console.warn('[usePolymarketClob] Builder config failed - continuing without attribution:', builderError);
          setBuilderConfig(null);
        }
      } else {
        console.warn('[usePolymarketClob] No remote signer URL - orders will work without builder attribution');
        setBuilderConfig(null);
      }
      
      const clobClient = new ClobClient(
        CLOB_HOST, 
        POLYGON_CHAIN_ID, 
        signerOrProvider as any // ClobClient accepts Signer/Provider at runtime
      );
      setClient(clobClient);
    } catch (err) {
      console.error('[usePolymarketClob] Failed to initialize client:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize CLOB client');
    }
  }, [signerOrProvider]);

  // Create or derive L2 API credentials
  const createL2Creds = useCallback(async () => {
    if (!client) {
      setError('CLOB client not initialized');
      return;
    }

    // Prevent concurrent creates (mutex)
    if (creatingRef.current) {
      console.log('[usePolymarketClob] Already creating L2 creds, skipping');
      return;
    }

    creatingRef.current = true;
    setIsCreatingL2Creds(true);
    setError(null);

    try {
      console.log('[usePolymarketClob] Creating or deriving L2 API credentials...');
      
      // This triggers ONE Phantom popup for signature
      const credentials = await client.createOrDeriveApiKey();

      const newCreds: L2Credentials = {
        apiKey: (credentials as any).apiKey || (credentials as any).key,
        secret: credentials.secret,
        passphrase: credentials.passphrase,
        timestamp: Date.now(),
      };

      // Store in memory
      setL2Creds(newCreds);

      // Persist to session storage
      try {
        sessionStorage.setItem(L2_CREDS_KEY, JSON.stringify(newCreds));
      } catch (storageErr) {
        console.warn('[usePolymarketClob] Failed to persist L2 creds to session storage:', storageErr);
        // Non-critical, continue anyway
      }

      console.log('[usePolymarketClob] L2 credentials created successfully');
    } catch (err) {
      console.error('[usePolymarketClob] Failed to create L2 creds:', err);
      setError(err instanceof Error ? err.message : 'Failed to create L2 credentials');
      throw err;
    } finally {
      creatingRef.current = false;
      setIsCreatingL2Creds(false);
    }
  }, [client]);

  // Sign order
  const signOrder = useCallback(async (orderArgs: any): Promise<any> => {
    if (!client) {
      throw new Error('CLOB client not initialized');
    }

    try {
      console.log('[usePolymarketClob] Signing order...');
      
      // This triggers ONE Phantom popup for signature
      const signedOrder = await client.createOrder(orderArgs);

      console.log('[usePolymarketClob] Order signed successfully');
      return signedOrder;
    } catch (err) {
      console.error('[usePolymarketClob] Failed to sign order:', err);
      throw err;
    }
  }, [client]);

  // Clear L2 credentials (for retry/error handling)
  const clearL2Creds = useCallback(() => {
    setL2Creds(null);
    try {
      sessionStorage.removeItem(L2_CREDS_KEY);
    } catch (err) {
      console.warn('[usePolymarketClob] Failed to clear session storage:', err);
    }
  }, []);

  return {
    client,
    l2Creds,
    hasL2Creds: !!l2Creds,
    isCreatingL2Creds,
    createL2Creds,
    signOrder,
    clearL2Creds,
    error,
    builderConfig,
  };
}

