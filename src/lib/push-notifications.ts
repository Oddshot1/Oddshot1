import { supabase } from "@/integrations/supabase/client";

// VAPID public key would normally come from environment
// For now, we'll use the Push API without a server for local notifications
const VAPID_PUBLIC_KEY = "";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async init(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Wait for it to be ready
      await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      return null;
    }

    try {
      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        return this.subscription;
      }

      // Subscribe without a server key for local notifications
      // In production, you'd use VAPID keys
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey would go here with VAPID
      });

      return this.subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      return true;
    } catch (error) {
      console.error("Unsubscribe failed:", error);
      return false;
    }
  }

  // Show a local notification (doesn't require push server)
  async showLocalNotification(
    title: string,
    options: NotificationOptions & { marketId?: string; url?: string }
  ): Promise<boolean> {
    if (Notification.permission !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        return false;
      }
    }

    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      // Fallback to regular notification
      new Notification(title, options);
      return true;
    }

    try {
      await this.registration.showNotification(title, {
        ...options,
        badge: "/favicon.ico",
        icon: options.icon || "/favicon.ico",
        data: { marketId: options.marketId, url: options.url },
      });
      return true;
    } catch (error) {
      console.error("Show notification failed:", error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  isSupported(): boolean {
    return "serviceWorker" in navigator && "Notification" in window;
  }
}

export const pushService = new PushNotificationService();
