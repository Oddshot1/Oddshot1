// ODDSHOT Polymarket Portfolio Hook
// Uses Positions API to get open positions with correct P&L
import { useQuery } from '@tanstack/react-query';

export interface PolymarketPosition {
  conditionId: string;
  tokenId: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  marketTitle?: string;
  marketId?: string;
  title?: string;
  proxyWallet?: string;
  icon?: string;
  slug?: string;
}

interface PortfolioResponse {
  address: string;
  positions: PolymarketPosition[]; // Only open positions
  totalValue: number; // Current value of open positions
  totalPnl: number; // P&L from open positions
  totalRealizedPnl: number; // P&L from closed positions
  totalInitialValue: number; // Total amount invested
  activity: Array<{
    type: string;
    timestamp: string;
    amount: number;
  }>;
}

interface PositionAPIResponse {
  proxyWallet: string;
  asset: string; // tokenId
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon?: string;
  eventId?: string;
  eventSlug?: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome?: string;
  oppositeAsset?: string;
  endDate?: string;
  negativeRisk: boolean;
}

export function usePolymarketPortfolio(proxyWallet?: string) {
  return useQuery({
    queryKey: ['polymarket-portfolio', proxyWallet],
    queryFn: async (): Promise<PortfolioResponse> => {
      if (!proxyWallet) {
        return {
          address: '',
          positions: [],
          totalValue: 0,
          totalPnl: 0,
          activity: [],
        };
      }

      console.log('[usePolymarketPortfolio] Fetching positions for:', proxyWallet);

      // Use Polymarket's Positions API - returns ONLY open positions with P&L!
      const response = await fetch(
        `https://data-api.polymarket.com/positions?user=${proxyWallet}`
      );

      if (!response.ok) {
        console.error('[usePolymarketPortfolio] API error:', response.status);
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
      }

      const positionsData: PositionAPIResponse[] = await response.json();
      console.log('[usePolymarketPortfolio] Fetched positions:', positionsData);

      let totalValue = 0;
      let totalPnl = 0;
      let totalRealizedPnl = 0;
      let totalInitialValue = 0;

      // Calculate totals from ALL positions (open + closed)
      positionsData.forEach((pos) => {
        const initialValue = pos.initialValue || 0;
        const currentValue = pos.currentValue || 0;
        const cashPnl = pos.cashPnl || 0;

        totalInitialValue += initialValue;

        if (currentValue > 0) {
          // Open position
          totalValue += currentValue;
          totalPnl += cashPnl;
        } else {
          // Closed position
          totalRealizedPnl += cashPnl;
        }
      });

      // Filter for display: only open positions WITH valid tokenId
      const positions: PolymarketPosition[] = positionsData
        .filter((pos) => {
          // Only show open positions (currentValue > 0) with valid tokenId
          const isValid = pos && pos.conditionId && pos.asset && pos.currentValue > 0;
          
          if (pos && pos.currentValue > 0 && !pos.asset) {
            console.warn('[usePolymarketPortfolio] Position missing tokenId:', {
              conditionId: pos.conditionId,
              outcome: pos.outcome,
              title: pos.title,
            });
          }
          
          return isValid;
        })
        .map((pos) => {
          const size = pos.size || 0;
          const avgPrice = pos.avgPrice || 0;
          const currentPrice = pos.curPrice || 0;
          const pnl = pos.cashPnl || 0;
          const pnlPct = pos.percentPnl || 0;
          const currentValue = pos.currentValue || 0;

          // ✅ Log if tokenId is empty (should never happen after filter)
          if (!pos.asset || pos.asset.length < 10) {
            console.error('[usePolymarketPortfolio] Invalid tokenId for position:', {
              conditionId: pos.conditionId,
              tokenId: pos.asset,
              title: pos.title,
            });
          }

          return {
            conditionId: pos.conditionId || '',
            tokenId: pos.asset || '', // This should always be valid after filter
            outcome: pos.outcome || 'Unknown',
            size,
            avgPrice,
            currentPrice,
            pnl,
            pnlPct,
            marketTitle: pos.title || 'Unknown Market',
            title: pos.title || 'Unknown Market',
            slug: pos.slug || '',
            icon: pos.icon,
            proxyWallet,
          };
        });

      console.log('[usePolymarketPortfolio] Summary:', {
        openPositions: positions.length,
        totalValue,
        totalPnl,
        totalRealizedPnl,
        totalInitialValue,
      });

      return {
        address: proxyWallet,
        positions,
        totalValue,
        totalPnl,
        totalRealizedPnl,
        totalInitialValue,
        activity: [],
      };
    },
    enabled: !!proxyWallet,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Data is fresh for 25 seconds (less than refetch interval to prevent race conditions)
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch on mount to get fresh data
  });
}
