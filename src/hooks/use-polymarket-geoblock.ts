// ODDSHOT Polymarket Geoblock Hook
// Checks if user's region is blocked by Polymarket
import { useState, useEffect } from 'react';

interface GeoblockData {
  blocked: boolean;
  country?: string;
  region?: string;
}

interface UsePolymarketGeoblockReturn {
  blocked: boolean;
  country?: string;
  region?: string;
  loading: boolean;
  error: string | null;
}

const GEOBLOCK_CACHE_KEY = 'oddshot_polymarket_geoblock';
const GEOBLOCK_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function usePolymarketGeoblock(): UsePolymarketGeoblockReturn {
  const [data, setData] = useState<GeoblockData>({ blocked: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeoblock = async () => {
      // Check cache first
      try {
        const cached = localStorage.getItem(GEOBLOCK_CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < GEOBLOCK_CACHE_TTL) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[usePolymarketGeoblock] Failed to read cache:', err);
      }

      // Fetch from API
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-geoblock`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Geoblock check failed: ${response.statusText}`);
        }

        const result: GeoblockData = await response.json();
        setData(result);

        // Cache result
        try {
          localStorage.setItem(
            GEOBLOCK_CACHE_KEY,
            JSON.stringify({ data: result, timestamp: Date.now() })
          );
        } catch (err) {
          console.warn('[usePolymarketGeoblock] Failed to cache:', err);
        }
      } catch (err) {
        console.error('[usePolymarketGeoblock] Error:', err);
        setError(err instanceof Error ? err.message : 'Geoblock check failed');
        // Fail safe: assume blocked if check fails
        setData({ blocked: true });
      } finally {
        setLoading(false);
      }
    };

    fetchGeoblock();
  }, []);

  return {
    blocked: data.blocked,
    country: data.country,
    region: data.region,
    loading,
    error,
  };
}

