import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Star, Clock, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";
import { useToast } from "@/hooks/use-toast";

const OPEN_SEARCH_EVENT = "oddshot:open-search";

const quickLinks = [
  { label: "Markets", path: "/app", icon: TrendingUp },
  { label: "Watchlist", path: "/app/watchlist", icon: Star },
  { label: "Lock-In Scanner", path: "/app/lock-in", icon: Clock },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: markets = [] } = usePolymarketMarkets();
  const { toast } = useToast();

  // ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Open from UI (Header click)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, handler);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, handler);
  }, []);

  const handleSelect = useCallback(
    (path: string, label?: string) => {
      setOpen(false);
      navigate(path);
      if (label) {
        toast({
          title: `Opening ${label}`,
          duration: 1500,
        });
      }
    },
    [navigate, toast]
  );

  const displayMarkets = markets.slice(0, 50);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput autoFocus placeholder="Search markets, categories..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Links">
          {quickLinks.map((link) => (
            <CommandItem
              key={link.path}
              value={link.label}
              onSelect={() => handleSelect(link.path, link.label)}
              className="gap-3 cursor-pointer"
            >
              <link.icon className="h-4 w-4 text-muted-foreground" />
              <span>{link.label}</span>
              <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>

        {displayMarkets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Markets">
              {displayMarkets.map((market) => (
              <CommandItem
                  key={market.id}
                  value={`${market.title} ${market.category || ""}`}
                  onSelect={() => handleSelect(`/app/market/${market.id}`, market.title.slice(0, 30))}
                  className="gap-3 cursor-pointer"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{market.title}</p>
                    {market.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {market.category}
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-sm text-primary shrink-0">
                    {Math.round(market.yesProb * 100)}%
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

