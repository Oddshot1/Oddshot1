import React from "react";
import { ArrowRight, Shield, Check, Clock, TrendingUp, FileText, Sparkles, BarChart3, Users, Activity, Twitter, Github, ExternalLink, Target, Brain, ArrowLeftRight, TrendingDown, MessageCircle, Monitor, Zap, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "react-router-dom";
import { usePolymarketMarkets } from "@/hooks/use-polymarket-markets";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";
import { Header } from "@/components/layout/Header";

const receiptFeatures = [
  {
    icon: Clock,
    title: "Timestamped",
    description: "See when the setup appeared and when it changed."
  },
  {
    icon: Shield,
    title: "Source + Snapshot",
    description: "Know which venue and quote the call is based on."
  },
  {
    icon: FileText,
    title: "Invalidation",
    description: "Know what would break the setup before you click trade."
  }
];

const featureCards = [
  {
    title: "Signals",
    line: "Spot where attention and money move first.",
    bullets: [
      "Flow spikes, momentum shifts, unusual activity",
      "Filtered to high-signal markets only"
    ]
  },
  {
    title: "Edge",
    line: "Know when the odds are off.",
    bullets: [
      "Market vs model, market vs venue, price distortion",
      "Confidence and invalidation included"
    ]
  },
  {
    title: "Arbitrage +EV",
    line: "Cross-venue and intra-market setups.",
    bullets: [
      "Arb, multi-outcome, mispriced legs",
      "Clear execution path, not just numbers"
    ]
  },
  {
    title: "Yield",
    line: "Near-expiry positions with measurable implied return.",
    bullets: [
      "APR preview, risk label, time-to-resolution",
      "Built for \"hold to settle\" strategies"
    ]
  },
  {
    title: "AI Assistant",
    line: "Ask about any market like you'd ask a sharp friend.",
    bullets: [
      "Explains what matters, what's priced in, what's missing",
      "Summarizes news and context, then connects it to odds"
    ]
  },
  {
    title: "Guided + Terminal",
    line: "Same engine, two ways to trade.",
    bullets: [
      "Guided: one \"Best Opportunity Now\" with a clear plan",
      "Terminal: dense tables and scanners for speed"
    ]
  }
];

const stats = [
  { value: "500+", label: "Markets Tracked", icon: BarChart3 },
  { value: "24/7", label: "Real-time Signals", icon: Activity },
  { value: "12K+", label: "Edge Alerts Sent", icon: Zap },
];

export default function Landing() {
  usePageTitle("Find → Decide → Execute");
  const { data: liveMarkets, isLoading } = usePolymarketMarkets(6);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Take top 3 markets for demo strip
  const demoMarkets = liveMarkets?.slice(0, 12) || [];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardsPerSlide = isMobile ? 1 : 3;
  const maxSlides = Math.ceil(featureCards.length / cardsPerSlide);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % maxSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + maxSlides) % maxSlides);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Video background - Only behind hero section */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden z-0 bg-black">
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ backgroundColor: '#000000' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background"></div>
        
        {/* Purple accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10"></div>
        
        {/* Bottom fade - complete fade to solid background */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/95 to-transparent"></div>
      </div>
      
      {/* Header Component */}
      <Header 
        isScrolled={isScrolled}
      />

      {/* Hero */}
      <section className="relative py-12 lg:py-32 overflow-hidden z-10">
        
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-24 right-4 lg:bottom-8 lg:right-8 z-20 group"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:border-purple-500/30 transition-all duration-300">
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white/70 group-hover:text-purple-400 transition-colors" />
            ) : (
              <Volume2 className="h-5 w-5 text-purple-400 transition-colors" />
            )}
          </div>
        </button>
        
        <div className="container max-w-5xl mx-auto text-center space-y-6 lg:space-y-8 relative z-10 px-4">
          <h1 className="text-4xl lg:text-8xl font-black tracking-tight uppercase leading-[1.1] bg-gradient-to-r from-purple-100 via-purple-300 to-purple-500 bg-clip-text text-transparent">
            Find the trade before it's obvious.
          </h1>
          
          <p className="text-base lg:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed font-normal">
            ODDSHOT scans top venues for mispriced odds, sharp flow, momentum shifts, arbitrage, and near-expiry yield. 
            You get one clear plan per market: what to do, why it works, what breaks it, and when to exit.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4 items-center">
            <Link to="/app">
              <div className="relative rounded-full p-[2px] h-[52px]">
                {/* Rotating border beam */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-[-100%] animate-spin-slow"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                    }}
                  />
                </div>
                {/* Static border background */}
                <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                {/* Button content */}
                <div className="relative h-full w-full rounded-full bg-background">
                  <Button 
                    className="h-full w-full gap-2 text-sm px-8 bg-transparent hover:bg-background/50 text-foreground border-0 font-semibold uppercase tracking-wide rounded-full"
                  >
                LAUNCH ODDSHOT
                    <ArrowRight className="h-4 w-4" />
              </Button>
                </div>
              </div>
            </Link>
            <a href="#how-it-works">
              <Button className="gap-2 text-sm px-8 h-[52px] rounded-full font-semibold uppercase tracking-wide border-0 bg-[#1A1A1A] hover:bg-background/50 text-foreground hover:text-purple-400">
                See how it works
                <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </div>

          <p className="text-xs lg:text-sm text-white/50 max-w-xl mx-auto pt-2">
            Built for Solana traders. Guided mode for beginners, Terminal mode for pros.
          </p>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="relative py-10 lg:py-20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        <div className="relative">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto py-8 lg:py-16 px-4">
          {stats.map((stat, i) => (
                <div key={i} className="text-center space-y-2 lg:space-y-4">
                  <div className="text-5xl lg:text-8xl font-black bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm lg:text-lg text-white/70 font-semibold uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Markets Strip */}
      <section id="markets" className="container py-10 lg:py-20">
        <div className="text-center mb-8 lg:mb-16 max-w-5xl mx-auto space-y-6 lg:space-y-8 px-4">
          <div className="space-y-3 lg:space-y-4">
            <Badge variant="outline" className="gap-2 bg-[#1A1A1A] border-0 text-purple-400 px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              Live from top venues
          </Badge>
            
            <div className="flex flex-col items-center gap-4">
              <span className="text-sm text-muted-foreground/80 font-medium uppercase tracking-wide">We support</span>
              <div className="relative overflow-hidden w-full max-w-4xl">
                <div className="flex animate-marquee hover:pause-marquee">
                  <div className="flex items-center gap-6 lg:gap-12 px-3 lg:px-6">
                    <img src="/1.svg" alt="Platform 1" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/2.svg" alt="Platform 2" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/3.svg" alt="Platform 3" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/4.svg" alt="Platform 4" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/5.svg" alt="Platform 5" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/7.svg" alt="Platform 7" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/8.svg" alt="Platform 8" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  {/* Duplicate for seamless loop */}
                  <div className="flex items-center gap-6 lg:gap-12 px-3 lg:px-6">
                    <img src="/1.svg" alt="Platform 1" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/2.svg" alt="Platform 2" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/3.svg" alt="Platform 3" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/4.svg" alt="Platform 4" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/5.svg" alt="Platform 5" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/7.svg" alt="Platform 7" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                    <img src="/8.svg" alt="Platform 8" className="h-5 w-16 lg:h-6 lg:w-20 object-contain opacity-70 hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </div>
              </div>
              <span className="text-sm text-purple-400 font-semibold">+30 other sportsbooks</span>
            </div>
          </div>
          
          <div className="space-y-3 lg:space-y-6 pt-4 lg:pt-6">
            <h2 className="text-3xl lg:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Real opportunities, right now
            </h2>
            <p className="text-base lg:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Live markets. Live pricing. Clean filters. No noise.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden h-[600px]">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          
          <div className="animate-scroll-up space-y-6">
          {isLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="relative p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm font-sans">
                    <div className="flex gap-4">
                      <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
                </div>
            ) : (
              <>
                {[...Array(3)].map((_, dupIndex) => (
                  <div key={dupIndex} className="grid md:grid-cols-3 gap-6">
                    {demoMarkets.map((market, i) => (
                      <div key={`${market.id}-${dupIndex}-${i}`} className="relative p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 group cursor-pointer backdrop-blur-sm font-sans">
                          <div className="flex gap-4">
                            <MarketThumbnail 
                              thumbnail={market.thumbnail} 
                              category={market.category} 
                              size="lg" 
                            />
                  <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-[10px] bg-[#1A1A1A] border-0 uppercase tracking-wide font-medium">{market.category}</Badge>
                                <span className="text-[10px] text-green-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                  LIVE
                                </span>
                    </div>
                              <h3 className="font-bold text-base line-clamp-2 group-hover:text-purple-400 transition-colors mb-3 leading-snug">{market.title}</h3>
                              <div className="flex items-center gap-3">
                                <span className="text-3xl font-mono font-black bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{Math.round(market.yesProb * 100)}¢</span>
                                <Badge variant="outline" className="text-[10px] text-muted-foreground bg-[#1A1A1A] border-0 uppercase tracking-wide">
                        ${(market.volume24h / 1000).toFixed(0)}k vol
                      </Badge>
                    </div>
                  </div>
                </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/app">
            <Button className="h-[52px] gap-2 text-sm px-8 rounded-full font-semibold uppercase tracking-wide border-0 bg-[#1A1A1A] hover:bg-background/50 text-foreground hover:text-purple-400">
              View all markets
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* What ODDSHOT Actually Does */}
      <section id="how-it-works" className="relative lg:min-h-screen py-8 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/whatyougetsection.avif" 
            alt="" 
            className="w-full h-full object-cover object-center opacity-70 scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center overflow-hidden py-8 lg:py-16">
          <div className="text-center mb-8 lg:mb-[80px] px-4 w-full">
            <h2 className="text-3xl lg:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.8))' }}>What you get in one cockpit</h2>
          </div>

          <div className="w-full">
            {/* Cards Container - Full Width */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: maxSlides }).map((_, pageIndex) => (
                  <div key={pageIndex} className="min-w-full">
                    <div className="flex flex-col md:flex-row border-y border-white/10 bg-black/90 backdrop-blur-md">
                      {featureCards.slice(pageIndex * cardsPerSlide, (pageIndex + 1) * cardsPerSlide).map((card, i) => (
                        <div key={i} className={`flex-1 p-5 md:p-7 ${i < cardsPerSlide - 1 ? 'border-b md:border-b-0 md:border-r border-white/10' : ''}`}>
                          <div className="space-y-2.5 text-left min-h-[180px] md:min-h-[200px]">
                            <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight leading-tight bg-gradient-to-r from-purple-100 via-purple-300 to-purple-500 bg-clip-text text-transparent">
                          {card.title}
                      </h3>
                            <p className="text-white/80 text-sm md:text-base font-normal leading-relaxed">
                        {card.line}
                      </p>
                            <ul className="space-y-3 pt-4">
                        {card.bullets.map((bullet, j) => (
                                <li key={j} className="flex items-start gap-3 text-xs md:text-sm text-white/70 leading-relaxed">
                                  <span className="text-purple-400 mt-0.5">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Bottom Left */}
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={prevSlide}
                  className="w-12 h-12 rounded-full bg-black/90 hover:bg-black backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all shadow-xl"
                  aria-label="Previous slide"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextSlide}
                  className="w-12 h-12 rounded-full bg-black/90 hover:bg-black backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all shadow-xl"
                  aria-label="Next slide"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="flex gap-2 ml-4">
                  {Array.from({ length: maxSlides }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all shadow-lg ${
                        i === currentSlide ? 'w-8 bg-purple-400' : 'w-2 bg-white/50'
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solana-first Execution */}
      <section className="container py-8 lg:pb-12">
          <div className="max-w-5xl mx-auto text-center space-y-4 lg:space-y-12 px-4">
            <div className="space-y-2 lg:space-y-6">
              <h2 className="text-3xl lg:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
                Solana-first execution, even across venues
              </h2>
              <p className="text-base lg:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed">
                Most opportunity lives across different venues and rails. ODDSHOT is building a Phantom-first bridge 
                so Solana users can trade with SOL or USDC, while swaps and bridging happen in the background. 
                One wallet. One flow. No chain switching for the user.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 lg:p-8 sm:border-r border-white/10">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Check className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Deposit SOL or USDC once</h3>
                </div>
              </div>
              <div className="p-5 lg:p-8 sm:border-r border-t sm:border-t-0 border-white/10">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <ArrowLeftRight className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Auto-swap and bridge behind the scenes</h3>
                </div>
              </div>
              <div className="p-5 lg:p-8 border-t sm:border-t-0 border-white/10">
                <div className="text-left space-y-3 lg:space-y-4">
                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Trade from the ODDSHOT flow, not ten tabs</h3>
                </div>
              </div>
            </div>

            <div className="text-center pt-8">
              <Link to="/app">
                <div className="relative rounded-full p-[2px] h-[52px] inline-block">
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
                      className="h-full w-full gap-2 text-sm px-8 bg-transparent hover:bg-background/50 text-foreground border-0 font-semibold uppercase tracking-wide rounded-full"
                    >
                  LAUNCH ODDSHOT
                      <ArrowRight className="h-4 w-4" />
                </Button>
                  </div>
                </div>
              </Link>
              <p className="text-sm text-white/50 mt-6">
                Execution availability depends on venue and region.
              </p>
            </div>
          </div>
      </section>

      {/* Receipts Proof Section */}
      <section id="why" className="relative container py-8 lg:py-20 mb-8 lg:mb-20">
          <div className="max-w-5xl mx-auto text-center space-y-4 lg:space-y-12 px-4">
          <div className="space-y-2 lg:space-y-6">
              <h2 className="text-3xl lg:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
                Proof on every call
              </h2>
            <p className="text-base lg:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed">
              ODDSHOT doesn't throw picks at you. Every signal is tied to a snapshot of the market, 
              the source, and the reasoning. You can verify what we saw when we saw it.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Top: Big Receipt Example Card */}
            <div className="relative p-6 lg:p-16 rounded-[2rem] border border-white/10 overflow-hidden min-h-[400px] lg:min-h-[500px]">
              {/* Background Image */}
              <div className="absolute inset-0 rounded-[2rem]">
                <img 
                  src="https://cdn.prod.website-files.com/6458f30fed157c01444bd0b2/68d2c86cc2fa6c74349f9804_6f14f8895811502991dcb5bbcc1f34b3_Homepage-bento-scale-bg.png" 
                  alt="" 
                  className="w-full h-full object-cover object-right rounded-[2rem]"
                />
                <div className="absolute inset-0 bg-black/20 rounded-[2rem]" />
              </div>
              
              <div className="relative flex flex-col justify-between h-full min-h-[350px] lg:min-h-[468px]">
            <div className="space-y-4 lg:space-y-6">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight drop-shadow-lg text-left">BTC above $100k in next 4 hours</h3>
                  </div>

                  <div className="flex gap-4 lg:gap-12 flex-wrap">
                    <div className="text-left">
                      <span className="text-white/60 text-xs uppercase tracking-wider font-semibold drop-shadow">Side</span>
                      <p className="font-bold text-sm mt-2 drop-shadow-lg">YES @ 68¢</p>
                    </div>
                    <div className="text-left">
                      <span className="text-white/60 text-xs uppercase tracking-wider font-semibold drop-shadow">Source</span>
                      <p className="font-bold text-sm mt-2 drop-shadow-lg">Polymarket</p>
                    </div>
                    <div className="text-left">
                      <span className="text-white/60 text-xs uppercase tracking-wider font-semibold drop-shadow">Edge</span>
                      <p className="font-bold text-sm text-green-400 mt-2 drop-shadow-lg">+7.0%</p>
                    </div>
                    <div className="text-left">
                      <span className="text-white/60 text-xs uppercase tracking-wider font-semibold drop-shadow">Confidence</span>
                      <p className="font-bold text-sm mt-2 drop-shadow-lg">High</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Link to="/app">
                    <Button className="h-[52px] gap-2 text-sm px-8 rounded-full font-semibold uppercase tracking-wide border-0 bg-[#1A1A1A] hover:bg-background/50 text-foreground hover:text-purple-400">
                      View all markets
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom: 3 Connected Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl lg:rounded-[2rem] border border-white/10 overflow-hidden">
              {receiptFeatures.map((feature, i) => (
                <div key={i} className={`p-5 lg:p-8 ${i < receiptFeatures.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-white/10' : ''}`}>
                  <div className="text-left space-y-3 lg:space-y-4">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <feature.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div>
                      <h3 className="text-base lg:text-lg font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">{feature.title}</h3>
                      <p className="text-xs lg:text-sm text-white/60 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="modes" className="container py-10 lg:py-20 mt-10 lg:mt-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6 lg:space-y-12">
          <div className="space-y-3 lg:space-y-6">
            <h2 className="text-3xl lg:text-7xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Made for beginners and pros
            </h2>
            <p className="text-base lg:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed">
            If you're new, ODDSHOT tells you what to do and why. If you're fast, ODDSHOT gives you scanners and execution tools.
          </p>
              </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 rounded-2xl lg:rounded-[2rem] border border-white/10 overflow-hidden">
            <div className="sm:border-r border-white/10">
              <div className="p-4 lg:p-8 border-b border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-3">
                  <Badge className="bg-[#1A1A1A] text-foreground border-0 text-xs">Guided Mode</Badge>
                  <h3 className="text-lg lg:text-2xl font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">For beginners</h3>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Best Opportunity Now, explained</span>
                </div>
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Simple actions: buy, hedge, hold</span>
                </div>
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Clear exit and invalidation</span>
                </div>
                </div>
              </div>

            <div>
              <div className="p-4 lg:p-8 border-b border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 lg:gap-3">
                  <Badge className="bg-[#1A1A1A] text-foreground border-0 text-xs">Terminal Mode</Badge>
                  <h3 className="text-lg lg:text-2xl font-bold font-[Inter] bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">For pros</h3>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Edge tables, movers, +EV feed</span>
                </div>
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Filters that kill noise</span>
                </div>
                <div className="p-4 lg:p-6 flex items-start gap-2 lg:gap-3">
                  <div className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                    <Check className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                  </div>
                  <span className="text-sm lg:text-base text-white/80">Speed-first layout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <img 
            src="/68d3d44552eec3933d5f9405_56686e4f5a0364387ca1468f0d36b05e_Background_Footer.png" 
            alt="" 
            className="w-full h-full object-cover object-top scale-150 opacity-40"
          />
          {/* Gradient fade at top */}
          <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-background via-background/70 to-transparent" />
          {/* Gradient fade at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="container relative z-10">
          {/* Hero Section */}
          <div className="text-center py-12 lg:py-24 space-y-6 lg:space-y-8 px-4">
            <p className="text-[10px] lg:text-xs text-white/40 uppercase tracking-[0.3em] mb-4 lg:mb-6">START TRADING SMARTER</p>
            <h2 className="text-4xl lg:text-8xl font-black tracking-tight uppercase leading-none">
              <span className="text-white">TRADE</span>
              <br />
              <span className="bg-gradient-to-r from-purple-100 via-purple-300 to-purple-500 bg-clip-text text-transparent">WITH ODDSHOT</span>
              <br />
              <span className="text-white">NOW</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <Link to="/app">
                <div className="relative rounded-full p-[2px] h-[52px]">
                  {/* Rotating border beam */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-[-100%] animate-spin-slow"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                      }}
                    />
              </div>
                  {/* Static border background */}
                  <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                  {/* Button content */}
                  <div className="relative h-full w-full rounded-full bg-background">
                    <button className="h-full w-full gap-2 text-sm px-8 bg-transparent hover:bg-background/50 text-foreground font-semibold uppercase tracking-wide rounded-full flex items-center justify-center">
                      LAUNCH ODDSHOT
                      <ArrowRight className="h-4 w-4" />
                    </button>
            </div>
            </div>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5"></div>

          {/* Footer Info Section */}
          <div className="py-8 lg:py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="ODDSHOT" className="h-10" />
              </div>

              {/* Social + CTA */}
            <div className="flex items-center gap-4">
                <a href="https://github.com/Oddshot1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] hover:bg-[#252525] rounded-lg text-white/50 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="https://x.com/oddshot_trade" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#1A1A1A] hover:bg-[#252525] rounded-lg text-white/50 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
                <Link to="/app" className="ml-2">
                  <div className="relative rounded-full p-[2px] h-[44px]">
                    {/* Rotating border beam */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-[-100%] animate-spin-slow"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #8b5cf6 50%, #ec4899 60%, #8b5cf6 70%, transparent 80%, transparent 100%)',
                        }}
                      />
                    </div>
                    {/* Static border background */}
                    <div className="absolute inset-0 rounded-full border border-purple-500/30" />
                    {/* Button content */}
                    <div className="relative h-full w-full rounded-full bg-background">
                      <button className="h-full w-full gap-2 text-xs px-6 bg-transparent hover:bg-background/50 text-foreground font-semibold uppercase tracking-wide rounded-full flex items-center justify-center">
                        LET'S CONNECT
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
              {/* Copyright */}
              <p className="text-xs text-white/30">
                © {new Date().getFullYear()}, Copyright ODDSHOT
              </p>

              {/* Navigation Links */}
              <nav className="flex flex-wrap items-center justify-center gap-8 text-xs">
                <Link to="/" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">HOME</Link>
                <Link to="/app" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">MARKETS</Link>
                <Link to="/app/signals" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">SIGNALS</Link>
                <Link to="/app/edge" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">EDGE</Link>
                <Link to="/app/portfolio" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">PORTFOLIO</Link>
                <Link to="/app/legal" className="text-white/40 hover:text-white/80 transition-colors uppercase tracking-[0.15em]">LEGAL</Link>
              </nav>

              {/* Scroll to top */}
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-8 h-8 flex items-center justify-center border border-white/20 rounded text-white/40 hover:text-white hover:border-white/40 transition-colors"
                aria-label="Scroll to top"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

