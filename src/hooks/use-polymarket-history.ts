// Hook to fetch Polymarket trading history with P&L from positions API
import { useQuery } from '@tanstack/react-query';

export interface PolymarketHistoryItem {
  id: string;
  activity: 'Bought' | 'Sold' | 'Lost' | 'Won';
  marketTitle: string;
  outcome: string;
  shares: number;
  price: number;
  value: number;
  pnl?: number;
  timestamp: string;
  transactionHash?: string;
  icon?: string;
}

interface ActivityItem {
  conditionId: string;
  asset: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  usdcSize: number;
  title: string;
  icon?: string;
  timestamp: number;
  transactionHash?: string;
  type: string;
}

interface PositionItem {
  conditionId: string;
  outcome: string;
  currentValue: number;
  cashPnl: number;
  title: string;
  icon?: string;
}

export function usePolymarketHistory(proxyWallet?: string) {
  return useQuery({
    queryKey: ['polymarket-history', proxyWallet],
    queryFn: async (): Promise<PolymarketHistoryItem[]> => {
      if (!proxyWallet) {
        return [];
      }

      console.log('[usePolymarketHistory] Fetching history for:', proxyWallet);

      try {
        // Fetch positions (includes closed positions with P&L)
        const positionsResponse = await fetch(
          `https://data-api.polymarket.com/positions?user=${proxyWallet}`
        );

        const positionsMap = new Map<string, PositionItem>();
        if (positionsResponse.ok) {
          const positions: PositionItem[] = await positionsResponse.json();
          positions.forEach((pos) => {
            const key = `${pos.conditionId}-${pos.outcome}`;
            positionsMap.set(key, pos);
          });
          console.log('[usePolymarketHistory] Loaded positions:', positions.length);
        }

        // Fetch activity (trades)
        const activityResponse = await fetch(
          `https://data-api.polymarket.com/activity?user=${proxyWallet}&limit=100`
        );

        if (!activityResponse.ok) {
          console.error('[usePolymarketHistory] Activity API error:', activityResponse.status);
          return [];
        }

        const activities: ActivityItem[] = await activityResponse.json();
        console.log('[usePolymarketHistory] Fetched activities:', activities.length);

        // Transform activity to history, enriched with P&L from positions
        const history: PolymarketHistoryItem[] = activities
          .filter((item: any) => item && item.type === 'TRADE')
          .map((item: ActivityItem, index: number) => {
            const posKey = `${item.conditionId}-${item.outcome}`;
            const position = positionsMap.get(posKey);

            // Determine activity type
            let activity: 'Bought' | 'Sold' | 'Lost' | 'Won' = item.side === 'BUY' ? 'Bought' : 'Sold';
            
            // If we have position data and it's closed (currentValue = 0), mark as Lost/Won
            if (position && position.currentValue === 0) {
              if (position.cashPnl < 0) {
                activity = 'Lost';
              } else if (position.cashPnl > 0) {
                activity = 'Won';
              }
            }

            // Convert unix timestamp to ISO string
            const timestamp = typeof item.timestamp === 'number' 
              ? new Date(item.timestamp * 1000).toISOString() 
              : new Date().toISOString();

            return {
              id: item.transactionHash || `${item.timestamp}-${index}`,
              activity,
              marketTitle: item.title || 'Unknown Market',
              outcome: item.outcome || 'Unknown',
              shares: item.size || 0,
              price: item.price || 0,
              value: item.usdcSize || 0,
              pnl: position?.cashPnl, // ✅ Add P&L from positions API
              timestamp,
              transactionHash: item.transactionHash || '',
              icon: item.icon || position?.icon || '',
            };
          });

        console.log('[usePolymarketHistory] Processed history:', history.length);
        return history;

      } catch (error) {
        console.error('[usePolymarketHistory] Error fetching history:', error);
        return [];
      }
    },
    enabled: !!proxyWallet,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
