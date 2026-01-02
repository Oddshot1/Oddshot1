// Service Worker for Push Notifications
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, tag, url, marketId } = data;

    const options: NotificationOptions = {
      body: body || "You have a new notification",
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || "oddshot-notification",
      data: { url, marketId },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: "view", title: "View Market" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title || "ODDSHOT Alert", options)
    );
  } catch (error) {
    console.error("Error showing notification:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { url, marketId } = event.notification.data || {};

  if (event.action === "dismiss") {
    return;
  }

  // Open the market page or app
  const targetUrl = url || (marketId ? `/app/market/${marketId}` : "/app");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if (client.url.includes("/app") && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
