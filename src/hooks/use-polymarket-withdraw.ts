// ODDSHOT Polymarket Withdrawal Hook
// Simplified - withdrawals are handled via Polymarket.com
import { useState, useCallback } from 'react';

interface WithdrawState {
  status: 'idle' | 'preparing' | 'signing' | 'executing' | 'success' | 'failed';
  txHash: string | null;
  error: string | null;
}

interface UsePolymarketWithdrawReturn {
  withdrawState: WithdrawState;
  needsL2Auth: boolean;
  isInitializingL2: boolean;
  initializeL2Credentials: () => Promise<boolean>;
  withdraw: (amount: string, toAddress: string) => Promise<boolean>;
  reset: () => void;
}

export function usePolymarketWithdraw(
  proxyWallet?: string
): UsePolymarketWithdrawReturn {
  const [withdrawState, setWithdrawState] = useState<WithdrawState>({
    status: 'idle',
    txHash: null,
    error: null,
  });

  // No L2 auth needed - withdrawals go through Polymarket.com
  const needsL2Auth = false;
  const isInitializingL2 = false;

  const initializeL2Credentials = useCallback(async (): Promise<boolean> => {
    // Not needed - withdrawals are on polymarket.com
    return true;
  }, []);

  const withdraw = useCallback(async (amount: string, toAddress: string): Promise<boolean> => {
    // Withdrawals are handled by opening polymarket.com
    // This function is not actually called from the modal anymore
    console.log('[usePolymarketWithdraw] Redirect to polymarket.com for withdrawal');
    return false;
  }, []);

  const reset = useCallback(() => {
    setWithdrawState({
      status: 'idle',
      txHash: null,
      error: null,
    });
  }, []);

  return {
    withdrawState,
    needsL2Auth,
    isInitializingL2,
    initializeL2Credentials,
    withdraw,
    reset,
  };
}
