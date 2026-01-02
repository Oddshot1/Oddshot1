import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { WatchlistItem } from "@/lib/types";

const STORAGE_KEY = "oddshot-watchlist";

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isWatched: (marketId: string) => boolean;
  toggle: (marketId: string) => void;
  add: (marketId: string) => void;
  remove: (marketId: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount (only once)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWatchlist(parsed);
        }
      } catch (e) {
        // Failed to parse
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever watchlist changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist, isInitialized]);

  const isWatched = useCallback((marketId: string) => {
    return watchlist.some(w => w.marketId === marketId);
  }, [watchlist]);

  const add = useCallback((marketId: string) => {
    setWatchlist(prev => {
      if (prev.some(w => w.marketId === marketId)) {
        return prev;
      }
      return [...prev, { marketId, addedAt: new Date().toISOString() }];
    });
  }, []);

  const remove = useCallback((marketId: string) => {
    setWatchlist(prev => prev.filter(w => w.marketId !== marketId));
  }, []);

  const toggle = useCallback((marketId: string) => {
    setWatchlist(prev => {
      const exists = prev.some(w => w.marketId === marketId);
      if (exists) {
        return prev.filter(w => w.marketId !== marketId);
      } else {
        return [...prev, { marketId, addedAt: new Date().toISOString() }];
      }
    });
  }, []);

  return (
    <WatchlistContext.Provider value={{ watchlist, isWatched, toggle, add, remove }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within WatchlistProvider");
  }
  return context;
}

