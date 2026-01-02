import { Settings as SettingsIcon, Moon, Bell, Info, ExternalLink, RefreshCw, Wallet, BellRing } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewMode } from "@/hooks/use-view-mode";
import { useWalletIdentity } from "@/hooks/use-wallet-identity";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { useResetOnboarding } from "@/components/onboarding/OnboardingModal";
import { Link } from "react-router-dom";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { mode, setMode, isGuided } = useViewMode();
  const resetOnboarding = useResetOnboarding();
  const { toast } = useToast();
  const { setVisible } = useWalletModal();
  const { 
    preferences, 
    updatePreferences, 
    connected, 
    walletAddress, 
    loading 
  } = useWalletIdentity();
  const {
    permission: pushPermission,
    isSupported: pushSupported,
    requestPermission: requestPushPermission,
    sendTestNotification,
  } = usePushNotifications();

  const handleEnablePush = async () => {
    const result = await requestPushPermission();
    if (result === "granted") {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive alerts for price movements",
      });
    } else if (result === "denied") {
      toast({
        title: "Permission Denied",
        description: "Enable notifications in your browser settings",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast({
        title: "Test Sent",
        description: "Check your notifications!",
      });
    }
  };

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    if (!connected) {
      toast({
        title: "Connect Wallet",
        description: "Connect your wallet to save preferences across devices",
      });
      setVisible(true);
      return;
    }
    await updatePreferences({ [key]: value });
    toast({
      title: "Preferences Saved",
      description: "Your settings have been updated",
    });
  };

  const truncateAddress = (address: string) => 
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <SEOHead title={seoContent.settings.title} description={seoContent.settings.description} />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize your ODDSHOT experience
        </p>
      </div>

      {/* Wallet Identity */}
      <Card className="p-6 border-border bg-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Wallet Identity
        </h2>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : connected && walletAddress ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Connected
              </Badge>
              <code className="text-sm text-muted-foreground">{truncateAddress(walletAddress)}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Your watchlist and preferences are synced across devices
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to sync your watchlist and preferences across devices
            </p>
            <Button variant="outline" onClick={() => setVisible(true)} className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        )}
      </Card>

      {/* Display Settings */}
      <Card className="p-6 border-border bg-card space-y-6">
        <div>
          <h2 className="font-semibold mb-4">Display</h2>
          
          <div className="space-y-4">
            {/* View Mode */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">View Mode</div>
                <div className="text-sm text-muted-foreground">
                  {isGuided ? "Simplified view with curated content" : "Full access to all features and data"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={isGuided ? "text-foreground" : "text-muted-foreground"}>Guided</span>
                <Switch checked={!isGuided} onCheckedChange={() => setMode(isGuided ? "terminal" : "guided")} />
                <span className={!isGuided ? "text-foreground" : "text-muted-foreground"}>Terminal</span>
              </div>
            </div>

            <Separator />

            {/* Theme - Always dark for ODDSHOT */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-sm text-muted-foreground">ODDSHOT uses a premium dark theme</div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Moon className="h-3 w-3" />
                Dark
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Push Notifications */}
      {pushSupported && (
        <Card className="p-6 border-border bg-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            Push Notifications
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Browser Notifications</div>
              <div className="text-sm text-muted-foreground">
                {pushPermission === "granted" 
                  ? "Enabled - you'll receive real-time alerts"
                  : pushPermission === "denied"
                  ? "Blocked - enable in browser settings"
                  : "Get notified when prices move"
                }
              </div>
            </div>
            {pushPermission === "granted" ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Enabled
                </Badge>
                <Button variant="outline" size="sm" onClick={handleTestNotification}>
                  Test
                </Button>
              </div>
            ) : pushPermission === "denied" ? (
              <Badge variant="secondary">Blocked</Badge>
            ) : (
              <Button variant="outline" onClick={handleEnablePush} className="gap-2">
                <BellRing className="h-4 w-4" />
                Enable
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Notification Preferences */}
      <Card className="p-6 border-border bg-card space-y-6">
        <div>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Preferences
            {!connected && (
              <Badge variant="secondary" className="text-xs">Requires Wallet</Badge>
            )}
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Price Alerts</div>
                <div className="text-sm text-muted-foreground">Get notified when watched markets hit your targets</div>
              </div>
              <Switch 
                checked={preferences.priceAlerts} 
                onCheckedChange={(v) => handlePreferenceChange("priceAlerts", v)} 
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Signal Alerts</div>
                <div className="text-sm text-muted-foreground">Notify on high-confidence trading signals</div>
              </div>
              <Switch 
                checked={preferences.signalAlerts} 
                onCheckedChange={(v) => handlePreferenceChange("signalAlerts", v)} 
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Digest</div>
                <div className="text-sm text-muted-foreground">Daily summary of top opportunities</div>
              </div>
              <Switch 
                checked={preferences.emailDigest} 
                onCheckedChange={(v) => handlePreferenceChange("emailDigest", v)} 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Onboarding */}
      <Card className="p-6 border-border bg-card space-y-4">
        <h2 className="font-semibold">Tutorial</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Replay Onboarding</div>
            <div className="text-sm text-muted-foreground">See the intro tutorial again</div>
          </div>
          <Button variant="outline" size="sm" onClick={resetOnboarding} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Replay
          </Button>
        </div>
      </Card>

      {/* Availability Notice */}
      <Card className="p-6 border-border bg-card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Availability Notice
        </h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            ODDSHOT provides information about prediction markets for educational and informational purposes.
            Trading availability may vary by jurisdiction.
          </p>
          <p>
            Market data is sourced from third-party platforms. ODDSHOT is not responsible for the accuracy
            or timeliness of this data.
          </p>
          <p>
            This is not financial advice. Always do your own research before trading.
          </p>
        </div>
      </Card>

      {/* Links */}
      <Card className="p-6 border-border bg-card space-y-4">
        <h2 className="font-semibold">Resources</h2>
        <div className="space-y-2">
          <Link to="/app/legal" className="flex items-center justify-between p-2 rounded hover:bg-secondary/50">
            <span>Legal & Disclaimers</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded hover:bg-secondary/50">
            <span>Polymarket</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </Card>

      {/* Version */}
      <div className="text-center text-sm text-muted-foreground">
        <p>ODDSHOT v0.1.0</p>
      </div>
    </div>
  );
}
