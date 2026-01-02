import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Zap, Star, Loader2, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePolymarketMarkets, generateSignalsFromMarkets } from "@/hooks/use-polymarket-markets";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useToast } from "@/hooks/use-toast";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketThumbnail } from "@/components/market/MarketThumbnail";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  markets?: Array<{
    id: string;
    title: string;
    yesProb: number;
  }>;
}

const quickPrompts = [
  "What are the best opportunities right now?",
  "Show me high confidence signals",
  "Find low risk trades",
  "What markets have momentum?",
];

export default function Assistant() {
  const { data: markets } = usePolymarketMarkets(400);
  const signals = markets ? generateSignalsFromMarkets(markets) : [];
  const { toggle: toggleWatchlist, isWatched } = useWatchlist();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I'm your trading assistant. I can help you find opportunities, analyze markets, and build execution plans. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleWatch = (marketId: string) => {
    toggleWatchlist(marketId);
    toast({
      title: isWatched(marketId) ? "Removed from watchlist" : "Added to watchlist",
      duration: 2000,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Filter for tradeable markets (not at extremes, good volume)
      const tradeableMarkets = markets?.filter(m => 
        m.yesProb >= 0.20 && m.yesProb <= 0.80 && // Better price range
        m.volume24h > 10000 && // Higher volume requirement
        m.liquidityLabel !== "Low" // Good liquidity
      ) || [];

      // Get markets with signals (highest priority)
      const marketsWithSignals = signals.slice(0, 5).map(s => {
        const market = markets?.find(m => m.id === s.marketId);
        if (market && market.yesProb >= 0.20 && market.yesProb <= 0.80) {
          return market;
        }
        return null;
      }).filter(Boolean);

      // Combine: markets with signals first, then other tradeable markets
      const prioritizedMarkets = [
        ...marketsWithSignals as any[],
        ...tradeableMarkets.filter(m => !marketsWithSignals.find((sm: any) => sm?.id === m.id))
      ].slice(0, 10);

      // Build comprehensive context for the AI
      const topMarketsContext = prioritizedMarkets.map(m => ({
        title: m.title,
        category: m.category,
        yesProb: m.yesProb,
        noProb: 1 - m.yesProb,
        change24h: m.change24h,
        volume24h: m.volume24h,
        liquidity: m.liquidityLabel,
        expiresAt: m.expiresAt,
      }));

      const signalsContext = signals.slice(0, 5).map(s => ({
        headline: s.headline,
        type: s.type,
        confidence: s.confidence,
        marketTitle: markets?.find(m => m.id === s.marketId)?.title,
      }));

      // Build market data string to embed BEFORE the user's message
      let marketDataString = `[AVAILABLE MARKET DATA - ${markets?.length || 0} markets tracked]\n\n`;
      topMarketsContext?.forEach((m, i) => {
        marketDataString += `${i + 1}. ${m.title}\n`;
        marketDataString += `   ${m.category} | YES: ${Math.round(m.yesProb * 100)}¢ | NO: ${Math.round(m.noProb * 100)}¢\n`;
        marketDataString += `   24h: ${(m.change24h * 100).toFixed(1)}% | Vol: $${m.volume24h?.toLocaleString()} | ${m.liquidity} liquidity\n\n`;
      });

      if (signalsContext && signalsContext.length > 0) {
        marketDataString += `[LIVE SIGNALS]\n\n`;
        signalsContext.forEach((s, i) => {
          marketDataString += `${i + 1}. ${s.headline} (${s.confidence} confidence)\n`;
          marketDataString += `   Market: ${s.marketTitle}\n\n`;
        });
      }

      marketDataString += `---\nUSER QUESTION: `;

      const { data, error } = await supabase.functions.invoke("trade-assistant", {
        body: {
          message: marketDataString + input,
          marketContext: {
            topMarkets: topMarketsContext,
            signals: signalsContext,
            totalMarketsAvailable: markets?.length || 0,
          },
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      // Extract market references from AI response
      const mentionedMarkets: Array<{id: string; title: string; yesProb: number}> = [];
      const responseText = data.message || "";
      
      // Try to find markets mentioned in the response
      topMarketsContext?.forEach(market => {
        if (responseText.includes(market.title)) {
          const fullMarket = markets?.find(m => m.title === market.title);
          if (fullMarket) {
            mentionedMarkets.push({
              id: fullMarket.id,
              title: fullMarket.title,
              yesProb: fullMarket.yesProb,
            });
          }
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I couldn't generate a response. Please try again.",
        markets: mentionedMarkets.length > 0 ? mentionedMarkets : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead title={seoContent.assistant.title} description={seoContent.assistant.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            TRADING ASSISTANT
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            AI-powered analysis and recommendations for prediction markets
          </p>
        </div>
            </div>
            
      <section className="relative pb-10 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Chat Area - Full Width */}
            <div className="lg:col-span-3 flex flex-col">
              {/* Messages */}
              <ScrollArea ref={scrollRef} className="flex-1 min-h-[500px] max-h-[calc(100vh-400px)] mb-6 mt-8 border border-white/10 rounded-2xl bg-[#0A0A0A]">
                <div className="space-y-6 p-6 pt-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                      className="flex gap-4 max-w-4xl mx-auto"
                  >
                    {message.role === "assistant" && (
                        <img 
                          src="/chatlogo.svg" 
                          alt="ODDSHOT" 
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.markets && message.markets.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                            {message.markets.map((market) => {
                              const fullMarket = markets?.find(m => m.id === market.id);
                              return (
                                <div key={market.id} className="p-4 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent hover:from-purple-500/20 hover:via-purple-400/10 transition-all">
                                  <div className="flex items-center gap-3">
                                    {fullMarket && (
                                      <MarketThumbnail 
                                        thumbnail={fullMarket.thumbnail} 
                                        category={fullMarket.category} 
                                        size="sm" 
                                      />
                                    )}
                              <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium mb-1">{market.title}</p>
                                <p className="text-xs text-muted-foreground">{Math.round(market.yesProb * 100)}¢</p>
                              </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                <Link to={`/app/market/${market.id}`}>
                                        <button className="h-8 px-3 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center gap-1.5 transition-colors">
                                          <Zap className="w-3.5 h-3.5 text-white" />
                                          <span className="text-xs text-white font-medium">Trade</span>
                                        </button>
                                </Link>
                                <Link to={`/app/market/${market.id}`}>
                                        <button className="h-8 px-3 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center gap-1.5 transition-colors">
                                          <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                                          <span className="text-xs text-white font-medium">View</span>
                                        </button>
                                </Link>
                                      <button 
                                  onClick={() => handleWatch(market.id)}
                                        className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center transition-colors"
                                >
                                  <Star className={cn(
                                    "w-4 h-4",
                                          isWatched(market.id) ? "fill-purple-400 text-purple-400" : "text-white"
                                  )} />
                                      </button>
                                    </div>
                              </div>
                            </div>
                              );
                            })}
                        </div>
                      )}
                      </div>
                  </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 max-w-4xl mx-auto">
                      <img 
                        src="/chatlogo.svg" 
                        alt="ODDSHOT" 
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-sm text-white/60">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

              {/* Large Input Area - ChatGPT Style */}
              <div className="sticky bottom-4 w-full max-w-4xl mx-auto space-y-4">
                {/* Quick Prompts - Always visible */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm rounded-lg bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 border border-white/10 transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Ask me about markets, strategies, or opportunities..."
                  disabled={isLoading}
                    className="h-16 bg-[#1A1A1A] border-white/10 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent placeholder:text-white/40 pr-16 rounded-2xl text-base"
                  />
                  <div className="absolute right-2 top-2">
                    <div className="relative rounded-full p-[2px] h-12 w-12">
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
                        <button 
                          onClick={handleSend} 
                          disabled={isLoading || !input.trim()}
                          className="h-full w-full rounded-full flex items-center justify-center bg-transparent hover:bg-background/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="w-5 h-5 text-purple-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Live Signals */}
            <div className="lg:col-span-1 space-y-4 mt-8">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                Live Signals
              </h3>
              
                <div className="space-y-3">
                {signals.slice(0, 4).map((signal) => {
                    const market = markets?.find(m => m.id === signal.marketId);
                    if (!market) return null;
                    
                    return (
                    <Link 
                      key={signal.marketId} 
                      to={`/app/market/${signal.marketId}`}
                      className="block"
                    >
                      <Card className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent backdrop-blur-sm transition-all duration-300 hover:from-purple-500/20 hover:via-purple-400/10 cursor-pointer p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <MarketThumbnail 
                            thumbnail={market.thumbnail} 
                            category={market.category} 
                            size="sm" 
                          />
                          <div className="flex-1 min-w-0">
                            <Badge className={cn(
                              "text-[10px] px-1.5 py-0.5 border-0 mb-2",
                              signal.confidence === "High" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
                            )}>
                            {signal.confidence}
                          </Badge>
                            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">{market.title}</h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                            {Math.round(market.yesProb * 100)}¢
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleWatch(market.id);
                              }}
                              className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center transition-colors"
                            >
                              <Star className={cn(
                                "w-4 h-4",
                                isWatched(market.id) ? "fill-purple-400 text-purple-400" : "text-white"
                              )} />
                            </button>
                            <button className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 flex items-center justify-center">
                              <ArrowUpRight className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </Card>
                        </Link>
                    );
                  })}
                </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

