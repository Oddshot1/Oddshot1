import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { EVOpportunity } from "@/hooks/use-polymarket-sports";

// Simple notification sound using Web Audio API
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not available
  }
}

// Request browser notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  
  if (Notification.permission === "granted") return true;
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
}

// Show browser notification
function showBrowserNotification(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "ev-alert", // Prevents duplicate notifications
    });
  }
}

interface UseOpportunityAlertsOptions {
  opportunities: EVOpportunity[];
  enabled?: boolean;
  threshold?: number; // Minimum EV% to trigger alert
}

export function useOpportunityAlerts({
  opportunities,
  enabled = true,
  threshold = 5,
}: UseOpportunityAlertsOptions) {
  const seenIds = useRef<Set<string>>(new Set());
  const hasRequestedPermission = useRef(false);
  const isFirstLoad = useRef(true);

  // Request notification permission on first use
  useEffect(() => {
    if (enabled && !hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, [enabled]);

  // Check for new high-value opportunities
  useEffect(() => {
    if (!enabled || opportunities.length === 0) return;
    
    // Skip alerting on first load (don't spam user with existing opps)
    if (isFirstLoad.current) {
      opportunities.forEach(opp => seenIds.current.add(opp.id));
      isFirstLoad.current = false;
      return;
    }

    const newHighValueOpps = opportunities.filter(
      opp => opp.evPercent >= threshold && !seenIds.current.has(opp.id)
    );

    if (newHighValueOpps.length > 0) {
      // Mark as seen
      newHighValueOpps.forEach(opp => seenIds.current.add(opp.id));
      
      // Play sound
      playAlertSound();
      
      // Show toast
      const bestOpp = newHighValueOpps[0];
      toast.success(`🔔 New +${bestOpp.evPercent.toFixed(1)}% EV opportunity!`, {
        description: bestOpp.teams 
          ? `${bestOpp.teams.home} vs ${bestOpp.teams.away} - ${bestOpp.betOn}`
          : bestOpp.question,
        duration: 8000,
      });
      
      // Show browser notification
      showBrowserNotification(
        `+${bestOpp.evPercent.toFixed(1)}% EV Opportunity`,
        bestOpp.teams 
          ? `${bestOpp.betOn} - ${bestOpp.teams.home} vs ${bestOpp.teams.away}`
          : bestOpp.question
      );
    }
  }, [opportunities, enabled, threshold]);

  // Clear seen IDs when disabled
  useEffect(() => {
    if (!enabled) {
      seenIds.current.clear();
      isFirstLoad.current = true;
    }
  }, [enabled]);

  return {
    clearSeen: useCallback(() => {
      seenIds.current.clear();
    }, []),
  };
}
