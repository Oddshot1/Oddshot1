import React from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  isScrolled: boolean;
}

export function Header({ isScrolled }: HeaderProps) {
  return (
    <>
          {/* Normal Announcement Banner */}
          <div className={`transition-all duration-300 overflow-hidden ${
            isScrolled ? 'h-0 opacity-0' : 'h-10 opacity-100'
          }`}>
            <div className="h-full flex items-center">
              <div className="animate-scroll whitespace-nowrap flex items-center gap-8 text-sm">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-foreground/90 font-medium uppercase tracking-wide">
                      Find the trade before it's obvious — ODDSHOT scans top venues for edge
                    </span>
                    <a href="#how-it-works" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                      Learn More →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Normal Sticky Header */}
          <header className={`sticky top-0 z-50 transition-all duration-300 ${
            isScrolled
              ? 'pt-3 px-4' 
              : ''
          }`}>
            <div className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled 
                ? 'max-w-4xl h-14 px-6 bg-background/80 border border-border rounded-full mx-auto' 
                : 'container h-16 px-6 mx-auto'
            }`}>
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <img src="/logo.svg" alt="ODDSHOT" className={`transition-all duration-300 ${isScrolled ? 'h-7' : 'h-8'}`} />
              </Link>
              <nav className={`hidden md:flex items-center text-xs font-medium uppercase tracking-wide transition-all duration-300 ${
                isScrolled
                  ? 'gap-6 bg-transparent px-0'
                  : 'gap-1 bg-[#1A1A1A] px-2 py-1.5 rounded-full'
              }`}>
                <a href="#markets" className={`transition-all duration-300 ${isScrolled ? 'text-muted-foreground hover:text-foreground' : 'text-foreground hover:text-purple-400 px-4 py-2 rounded-full hover:bg-background/50'}`}>
                    Markets
                  </a>
                
                <a href="#why" className={`transition-all duration-300 ${isScrolled ? 'text-muted-foreground hover:text-foreground' : 'text-foreground hover:text-purple-400 px-4 py-2 rounded-full hover:bg-background/50'}`}>
                  Why ODDSHOT
                </a>
                <a href="#modes" className={`transition-all duration-300 ${isScrolled ? 'text-muted-foreground hover:text-foreground' : 'text-foreground hover:text-purple-400 px-4 py-2 rounded-full hover:bg-background/50'}`}>
                  Features
                </a>
              </nav>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/app">
                  <div className={`relative rounded-full p-[2px] transition-all duration-300 ${isScrolled ? 'h-9' : 'h-10'}`}>
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-[-100%] animate-spin-slow"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                    <div className="relative h-full w-full rounded-full bg-background">
                      <Button 
                        size="sm" 
                        className={`h-full w-full gap-2 bg-transparent hover:bg-background/50 text-foreground border-0 font-medium uppercase tracking-wide transition-all duration-300 ${isScrolled ? 'text-[10px] px-4' : 'text-xs px-5'}`}
                      >
                        Launch App
                        <ArrowUpRight className={`transition-all duration-300 ${isScrolled ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </header>
        </>
  );
}

