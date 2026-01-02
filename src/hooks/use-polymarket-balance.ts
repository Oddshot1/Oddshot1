// ODDSHOT Polymarket Balance Hook
// Checks USDC.e balance on Polygon for user's proxy wallet
import { useState, useEffect, useCallback } from 'react';

interface BalanceData {
  balance: string; // Human-readable USD amount
  raw: string; // Raw wei amount
}

interface UsePolymarketBalanceReturn {
  balance: string | null; // USD amount as string
  loading: boolean;
  error: string | null;
  refetch: () => Promise<string>; // Returns the fresh balance
}

export function usePolymarketBalance(
  proxyWallet?: string,
  pollInterval?: number // Optional auto-refresh in milliseconds
): UsePolymarketBalanceReturn {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (): Promise<string> => {
    if (!proxyWallet) {
      setBalance(null);
      return '0';
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-balance?address=${proxyWallet}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data: BalanceData = await response.json();
      setBalance(data.balance);
      return data.balance; // Return the fresh balance
    } catch (err) {
      console.error('[usePolymarketBalance] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance('0.00');
      return '0.00';
    } finally {
      setLoading(false);
    }
  }, [proxyWallet]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Optional polling
  useEffect(() => {
    if (!pollInterval || !proxyWallet) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, proxyWallet, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}

