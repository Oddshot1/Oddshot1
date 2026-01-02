import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/shared/Header";
import { MobileNav } from "@/components/shared/MobileNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ViewModeProvider } from "@/contexts/view-mode-context";
import { WalletProvider } from "@/components/shared/WalletProvider";
import { WatchlistProvider } from "@/contexts/WatchlistContext";
import { SearchCommand } from "@/components/shared/SearchCommand";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import Markets from "@/pages/Markets";
import MarketDetail from "@/pages/MarketDetail";
import Signals from "@/pages/Signals";
import Edge from "@/pages/Edge";
import LockIn from "@/pages/LockIn";
import Yield from "@/pages/Yield";
import Assistant from "@/pages/Assistant";
import Watchlist from "@/pages/Watchlist";
import Portfolio from "@/pages/Portfolio";
import Landing from "@/pages/Landing";
import Settings from "@/pages/Settings";
import Legal from "@/pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <WatchlistProvider>
          <TooltipProvider>
            <ViewModeProvider>
              <div className="min-h-screen bg-background text-foreground dark">
                <BrowserRouter>
                <SearchCommand />
                <OnboardingModal />
                <Routes>
                  {/* Marketing Landing at root - No header */}
                  <Route path="/" element={<Landing />} />

                  {/* App Routes at /app - With header */}
                  <Route
                    path="/app/*"
                    element={
                      <>
                        <Header />
                        <main className="pb-20 lg:pb-0">
                          <Routes>
                            <Route path="/" element={<Markets />} />
                            <Route path="/signals" element={<Signals />} />
                            <Route path="/edge" element={<Edge />} />
                            <Route path="/lock-in" element={<LockIn />} />
                            <Route path="/yield" element={<Yield />} />
                            <Route path="/assistant" element={<Assistant />} />
                            <Route path="/market/:id" element={<MarketDetail />} />
                            <Route path="/watchlist" element={<Watchlist />} />
                            <Route path="/portfolio" element={<Portfolio />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/legal" element={<Legal />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <MobileNav />
                      </>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </div>
            <Toaster />
            <Sonner />
          </ViewModeProvider>
        </TooltipProvider>
        </WatchlistProvider>
      </WalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
