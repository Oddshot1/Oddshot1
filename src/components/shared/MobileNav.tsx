import { Home, Activity, TrendingUp, Percent, Bot, Star, Wallet, MoreHorizontal, Lock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { icon: Home, label: "Markets", path: "/app" },
  { icon: Activity, label: "Signals", path: "/app/signals" },
  { icon: Bot, label: "AI", path: "/app/assistant" },
  { icon: Star, label: "Watch", path: "/app/watchlist" },
];

const moreNavItems = [
  { icon: TrendingUp, label: "Edge", path: "/app/edge" },
  { icon: Percent, label: "Yield", path: "/app/yield" },
  { icon: Wallet, label: "Portfolio", path: "/app/portfolio" },
  { icon: Lock, label: "Lock-In", path: "/app/lock-in" },
];

export function MobileNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed z-50 transition-all duration-300 lg:hidden",
      isScrolled
        ? "bottom-3 left-4 right-4 pb-3 px-4"
        : "bottom-0 left-0 right-0"
    )}>
      <div className={cn(
        "flex items-center justify-around transition-all duration-300",
        isScrolled
          ? "h-14 px-6 bg-background/80 border border-border rounded-full mx-auto max-w-2xl"
          : "h-16 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      )}>
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors rounded-lg",
                isActive 
                  ? "text-purple-400" 
                  : "text-muted-foreground hover:text-purple-400"
              )}
            >
              <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <item.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* More menu */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors rounded-lg",
                "text-muted-foreground hover:text-purple-400"
              )}
            >
              <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <MoreHorizontal className="h-3.5 w-3.5 text-white" />
              </div>
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto bg-[#0A0A0A] border-white/10">
            <div className="py-4">
              <h3 className="text-sm font-medium mb-4 text-center">More Options</h3>
              <div className="grid grid-cols-2 gap-4">
                {moreNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 border border-white/10 cursor-pointer rounded-lg transition-colors",
                        isActive 
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                          : "hover:bg-purple-500/5"
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border border-white/10 transition-colors" 
                onClick={() => setMoreOpen(false)}
              >
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
