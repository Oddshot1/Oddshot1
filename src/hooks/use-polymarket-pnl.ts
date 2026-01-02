// Hook to get realized P&L from Polymarket positions API
import { useQuery } from '@tanstack/react-query';

export interface RealizedPnLEntry {
  marketTitle: string;
  outcome: string;
  icon?: string;
  size: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  realizedPnl: number;
  isClosed: boolean;
}

export interface PnLSummary {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  closedPositions: RealizedPnLEntry[];
  openPositions: RealizedPnLEntry[];
}

interface PositionAPIResponse {
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  realizedPnl: number;
  title: string;
  icon?: string;
  outcome: string;
}

export function usePolymarketPnL(proxyWallet?: string) {
  return useQuery({
    queryKey: ['polymarket-pnl', proxyWallet],
    queryFn: async (): Promise<PnLSummary> => {
      if (!proxyWallet) {
        return {
          totalRealizedPnL: 0,
          totalUnrealizedPnL: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          closedPositions: [],
          openPositions: [],
        };
      }

      console.log('[usePolymarketPnL] Fetching P&L for:', proxyWallet);

      // Get all positions (open and closed) from Polymarket API
      const response = await fetch(
        `https://data-api.polymarket.com/positions?user=${proxyWallet}`
      );

      if (!response.ok) {
        console.error('[usePolymarketPnL] API error:', response.status);
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }

      const positionsData: PositionAPIResponse[] = await response.json();
      console.log('[usePolymarketPnL] Fetched positions:', positionsData.length);

      let totalRealizedPnL = 0;
      let totalUnrealizedPnL = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      const closedPositions: RealizedPnLEntry[] = [];
      const openPositions: RealizedPnLEntry[] = [];

      positionsData.forEach((pos) => {
        const isClosed = pos.currentValue === 0;
        const entry: RealizedPnLEntry = {
          marketTitle: pos.title || 'Unknown Market',
          outcome: pos.outcome || 'Unknown',
          icon: pos.icon,
          size: pos.size || 0,
          initialValue: pos.initialValue || 0,
          currentValue: pos.currentValue || 0,
          cashPnl: pos.cashPnl || 0,
          realizedPnl: pos.realizedPnl || 0,
          isClosed,
        };

        if (isClosed) {
          // Closed position - count realized P&L
          totalRealizedPnL += pos.cashPnl || 0;
          closedPositions.push(entry);
          
          if ((pos.cashPnl || 0) > 0) {
            winningTrades++;
          } else if ((pos.cashPnl || 0) < 0) {
            losingTrades++;
          }
        } else {
          // Open position - count unrealized P&L
          totalUnrealizedPnL += pos.cashPnl || 0;
          openPositions.push(entry);
        }
      });

      console.log('[usePolymarketPnL] Summary:', {
        totalRealizedPnL,
        totalUnrealizedPnL,
        winningTrades,
        losingTrades,
        closedCount: closedPositions.length,
        openCount: openPositions.length,
      });

      return {
        totalRealizedPnL,
        totalUnrealizedPnL,
        totalTrades: closedPositions.length,
        winningTrades,
        losingTrades,
        closedPositions,
        openPositions,
      };
    },
    enabled: !!proxyWallet,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000,
  });
}
