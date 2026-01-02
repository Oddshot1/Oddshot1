import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";

export interface WalletProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  preferences: {
    priceAlerts: boolean;
    signalAlerts: boolean;
    emailDigest: boolean;
  };
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES = {
  priceAlerts: true,
  signalAlerts: true,
  emailDigest: false,
};

export function useWalletIdentity() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const walletAddress = publicKey?.toBase58() || null;

  // Fetch or create profile when wallet connects
  useEffect(() => {
    if (!walletAddress) {
      setProfile(null);
      return;
    }

    async function fetchOrCreateProfile() {
      setLoading(true);
      try {
        // Try to fetch existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from("wallet_profiles")
          .select("*")
          .eq("wallet_address", walletAddress)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching profile:", fetchError);
          setLoading(false);
          return;
        }

        if (existingProfile) {
          setProfile(existingProfile as WalletProfile);
        } else {
          // Create new profile
          const { data: newProfile, error: insertError } = await supabase
            .from("wallet_profiles")
            .insert({
              wallet_address: walletAddress,
              preferences: DEFAULT_PREFERENCES,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            setProfile(newProfile as WalletProfile);
          }
        }
      } catch (err) {
        console.error("Profile error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrCreateProfile();
  }, [walletAddress]);

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<WalletProfile["preferences"]>) => {
      if (!walletAddress || !profile) return;

      const updatedPreferences = { ...profile.preferences, ...newPreferences };

      const { error } = await supabase
        .from("wallet_profiles")
        .update({ preferences: updatedPreferences })
        .eq("wallet_address", walletAddress);

      if (error) {
        console.error("Error updating preferences:", error);
        return;
      }

      setProfile((prev) =>
        prev ? { ...prev, preferences: updatedPreferences } : null
      );
    },
    [walletAddress, profile]
  );

  // Update display name
  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!walletAddress) return;

      const { error } = await supabase
        .from("wallet_profiles")
        .update({ display_name: displayName })
        .eq("wallet_address", walletAddress);

      if (error) {
        console.error("Error updating display name:", error);
        return;
      }

      setProfile((prev) =>
        prev ? { ...prev, display_name: displayName } : null
      );
    },
    [walletAddress]
  );

  return {
    profile,
    loading,
    connected,
    walletAddress,
    preferences: profile?.preferences || DEFAULT_PREFERENCES,
    updatePreferences,
    updateDisplayName,
  };
}
