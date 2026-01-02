// ODDSHOT Phantom Multichain EVM Detection
// Detect and access EVM address from Phantom's multichain wallet
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface PhantomEVMState {
  evmAddress: string | null;
  evmConnected: boolean;
  evmAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  connectEVM: () => Promise<void>;
}

declare global {
  interface Window {
    phantom?: {
      ethereum?: {
        isPhantom?: boolean;
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      };
      solana?: {
        isPhantom?: boolean;
        publicKey?: { toBase58: () => string };
      };
    };
  }
}

export function usePhantomEVM(): PhantomEVMState {
  const { connected: solanaConnected } = useWallet();
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Phantom's EVM provider is available
  const evmAvailable = typeof window !== 'undefined' && 
    !!window.phantom?.ethereum?.isPhantom;

  const connectEVM = useCallback(async () => {
    if (!window.phantom?.ethereum) {
      setError('Enable multichain/EVM in Phantom to trade');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accounts = await window.phantom.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts && accounts.length > 0) {
        setEvmAddress(accounts[0]);
      }
    } catch (err) {
      console.error('[usePhantomEVM] Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect EVM');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-detect EVM address if already connected
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!window.phantom?.ethereum) return;

      try {
        const accounts = await window.phantom.ethereum.request({
          method: 'eth_accounts',
        }) as string[];

        if (accounts && accounts.length > 0) {
          setEvmAddress(accounts[0]);
        }
      } catch (err) {
        console.error('[usePhantomEVM] Check error:', err);
      }
    };

    if (solanaConnected && evmAvailable) {
      checkExistingConnection();
    }
  }, [solanaConnected, evmAvailable]);

  // Listen for account changes
  useEffect(() => {
    if (!window.phantom?.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountList = accounts as string[];
      if (accountList && accountList.length > 0) {
        setEvmAddress(accountList[0]);
      } else {
        setEvmAddress(null);
      }
    };

    window.phantom.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.phantom?.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return {
    evmAddress,
    evmConnected: !!evmAddress,
    evmAvailable,
    isLoading,
    error,
    connectEVM,
  };
}
