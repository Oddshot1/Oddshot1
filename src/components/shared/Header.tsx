import React from "react";
import { Search, Zap, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useViewMode } from "@/hooks/use-view-mode";
import { Link, useLocation } from "react-router-dom";
import { WalletButton } from "@/components/shared/WalletButton";

const navItems = [
  { label: "Markets", path: "/app" },
  { label: "Signals", path: "/app/signals" },
  { label: "Edge", path: "/app/edge" },
  { label: "Lock-In", path: "/app/lock-in" },
  { label: "Yield", path: "/app/yield" },
  { label: "Assistant", path: "/app/assistant" },
];

export function Header() {
  const { toggleMode, isGuided } = useViewMode();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new Event("oddshot:open-search"));
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'pt-3 px-2 lg:px-4' 
        : 'bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-xl'
    }`}>
      <div className={`flex items-center justify-between gap-2 lg:gap-6 transition-all duration-300 ${
        isScrolled 
          ? 'max-w-5xl h-16 px-3 lg:px-6 bg-background/80 border border-border rounded-full mx-auto' 
          : 'container h-16 px-3 lg:px-6 mx-auto'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.svg" alt="ODDSHOT" className={`transition-all duration-300 ${isScrolled ? 'h-6 lg:h-7' : 'h-7 lg:h-8'}`} />
        </Link>

        {/* Search - Desktop */}
        {!isScrolled && (
        <div className="hidden md:flex flex-1 max-w-md">
          <Button
            variant="outline"
            onClick={openSearch}
              className="w-full justify-start gap-2 text-muted-foreground bg-[#1A1A1A] border-white/10 hover:bg-background/50 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search markets...</span>
              <kbd className="ml-auto pointer-events-none h-5 select-none rounded border border-white/10 bg-background/50 px-1.5 font-mono text-xs">
              ⌘K
            </kbd>
          </Button>
        </div>
        )}

        {/* Nav - Desktop */}
        <nav className={`hidden lg:flex items-center text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
          isScrolled
            ? 'gap-6 bg-transparent px-0'
            : 'gap-1 bg-[#1A1A1A] px-2 py-1.5 rounded-full'
        }`}>
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <button className={`transition-all duration-300 whitespace-nowrap ${
                isScrolled 
                  ? location.pathname === item.path
                    ? 'text-purple-400'
                    : 'text-muted-foreground hover:text-foreground'
                  : location.pathname === item.path
                    ? 'bg-purple-500/20 text-purple-300 px-4 py-2 rounded-full'
                    : 'text-foreground hover:text-purple-400 px-4 py-2 rounded-full hover:bg-background/50'
              }`}>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {/* Watchlist */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/app/watchlist">
                <button className="items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md hidden sm:flex h-9 w-9 p-0 hover:bg-background/50 hover:text-purple-400">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Star className="h-3.5 w-3.5 text-white" />
                  </div>
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Watchlist</TooltipContent>
          </Tooltip>

          {/* Portfolio */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/app/portfolio">
                <button className="items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md hidden sm:flex h-9 w-9 p-0 hover:bg-background/50 hover:text-purple-400">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Wallet className="h-3.5 w-3.5 text-white" />
                  </div>
                </button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Portfolio</TooltipContent>
          </Tooltip>

          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 lg:gap-2 text-[9px] lg:text-sm border-l border-white/10 pl-1 lg:pl-3">
            <span className={`font-medium whitespace-nowrap ${isGuided ? "text-foreground" : "text-muted-foreground"}`}>Guided</span>
            <Switch 
              checked={!isGuided} 
              onCheckedChange={toggleMode}
              className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-[#1A1A1A] scale-75 lg:scale-100 mx-0.5"
            />
            <span className={`font-medium whitespace-nowrap ${!isGuided ? "text-foreground" : "text-muted-foreground"}`}>Terminal</span>
          </div>

          {/* Wallet */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
