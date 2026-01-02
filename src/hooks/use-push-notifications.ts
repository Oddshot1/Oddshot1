import { useCallback, useEffect, useState } from "react";
import { pushService } from "@/lib/push-notifications";
import { useWatchlist } from "@/hooks/use-watchlist";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";

interface PriceAlertConfig {
  marketId: string;
  type: "CROSS_ABOVE" | "CROSS_BELOW" | "MOVE_PCT";
  threshold: number;
  enabled: boolean;
}

const ALERTS_STORAGE_KEY = "oddshot-price-alerts";
const LAST_PRICES_KEY = "oddshot-last-prices";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { watchlist } = useWatchlist();
  const { data: markets } = usePolymarketMarkets(200);

  // Initialize push service
  useEffect(() => {
    const init = async () => {
      const supported = pushService.isSupported();
      setIsSupported(supported);

      if (supported) {
        await pushService.init();
        setPermission(pushService.getPermissionStatus());
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    const newPermission = await pushService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  // Check price alerts
  useEffect(() => {
    if (!isInitialized || permission !== "granted" || !markets) return;

    const checkAlerts = () => {
      const alertsJson = localStorage.getItem(ALERTS_STORAGE_KEY);
      const lastPricesJson = localStorage.getItem(LAST_PRICES_KEY);

      if (!alertsJson) return;

      const alerts: PriceAlertConfig[] = JSON.parse(alertsJson);
      const lastPrices: Record<string, number> = lastPricesJson
        ? JSON.parse(lastPricesJson)
        : {};

      const enabledAlerts = alerts.filter((a) => a.enabled);

      for (const alert of enabledAlerts) {
        const market = markets.find((m) => m.id === alert.marketId);
        if (!market) continue;

        const currentPrice = market.yesProb * 100;
        const lastPrice = lastPrices[alert.marketId] ?? currentPrice;

        let shouldNotify = false;
        let message = "";

        switch (alert.type) {
          case "CROSS_ABOVE":
            if (lastPrice < alert.threshold && currentPrice >= alert.threshold) {
              shouldNotify = true;
              message = `crossed above ${alert.threshold}%`;
            }
            break;
          case "CROSS_BELOW":
            if (lastPrice > alert.threshold && currentPrice <= alert.threshold) {
              shouldNotify = true;
              message = `crossed below ${alert.threshold}%`;
            }
            break;
          case "MOVE_PCT":
            const pctChange = Math.abs(currentPrice - lastPrice);
            if (pctChange >= alert.threshold) {
              shouldNotify = true;
              const direction = currentPrice > lastPrice ? "up" : "down";
              message = `moved ${direction} ${pctChange.toFixed(1)}%`;
            }
            break;
        }

        if (shouldNotify) {
          pushService.showLocalNotification("ODDSHOT Price Alert", {
            body: `${market.title.slice(0, 50)}... ${message}`,
            tag: `price-alert-${alert.marketId}`,
            marketId: alert.marketId,
            url: `/app/market/${alert.marketId}`,
          });
        }

        // Update last price
        lastPrices[alert.marketId] = currentPrice;
      }

      localStorage.setItem(LAST_PRICES_KEY, JSON.stringify(lastPrices));
    };

    // Check immediately and then every 30 seconds
    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, permission, markets]);

  // Show a test notification
  const sendTestNotification = useCallback(async () => {
    if (permission !== "granted") {
      await requestPermission();
    }

    return pushService.showLocalNotification("ODDSHOT Test", {
      body: "Push notifications are working!",
      tag: "test-notification",
    });
  }, [permission, requestPermission]);

  // Notify about a specific market
  const notifyMarketMove = useCallback(
    async (marketId: string, title: string, change: number) => {
      if (permission !== "granted") return false;

      const direction = change > 0 ? "📈" : "📉";
      const changeStr = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;

      return pushService.showLocalNotification(`${direction} ${title.slice(0, 40)}...`, {
        body: `Price moved ${changeStr}`,
        tag: `market-${marketId}`,
        marketId,
        url: `/app/market/${marketId}`,
      });
    },
    [permission]
  );

  return {
    permission,
    isSupported,
    isInitialized,
    requestPermission,
    sendTestNotification,
    notifyMarketMove,
  };
}
