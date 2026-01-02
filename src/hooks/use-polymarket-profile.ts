// ODDSHOT Polymarket Profile Hook
// Discovers user's Polymarket profile and proxy wallet
import { useState, useEffect } from 'react';

interface ProfileData {
  hasProfile: boolean;
  proxyWallet?: string;
  name?: string;
  pseudonym?: string;
  message?: string; // Message when no profile exists
}

interface UsePolymarketProfileReturn {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  message: string | null; // User-friendly message
  refetch: () => Promise<void>;
}

export function usePolymarketProfile(evmAddress?: string): UsePolymarketProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!evmAddress) {
      setProfile(null);
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/poly-profile?address=${evmAddress}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data: ProfileData = await response.json();
      setProfile(data);
      
      // If no profile, set the message for UI display
      if (!data.hasProfile && data.message) {
        setMessage(data.message);
      }
    } catch (err) {
      console.error('[usePolymarketProfile] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile({ hasProfile: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [evmAddress]);

  return {
    profile,
    loading,
    error,
    message, // Now includes user-friendly messages
    refetch: fetchProfile,
  };
}

