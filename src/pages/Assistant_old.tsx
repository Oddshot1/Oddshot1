import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Zap, Star, ChevronRight, Lightbulb, Loader2 } from "lucide-react";
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

const templates = [
  { label: "Best opportunities now", prompt: "What are the best 3 opportunities right now?" },
  { label: "Explain this market", prompt: "Explain the top market in detail" },
  { label: "What changed?", prompt: "What changed in the last hour?" },
  { label: "Build a hedge", prompt: "Help me build a hedge for my positions" },
  { label: "Low risk trades", prompt: "Find low risk trades with good returns" },
];

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleWatch = (marketId: string) => {
    toggleWatchlist(marketId);
    toast({
      title: isWatched(marketId) ? "Removed from watchlist" : "Added to watchlist",
      duration: 2000,
    });
  };

  return (
    <>
      <SEOHead 
        title={seoContent.assistant.title}
        description={seoContent.assistant.description}
      />
      
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

      <section className="relative py-10 lg:py-20 overflow-hidden min-h-[calc(100vh-200px)]">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container max-w-7xl mx-auto h-full flex flex-col">
          {/* Chat Messages Area - Expandable */}
          <div className="flex-1 flex flex-col mb-6 min-h-[500px]">
            <div className="p-4 border-b border-white/10 bg-[#1A1A1A]/50">
              <h2 className="font-semibold flex items-center gap-2 text-lg bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Conversation
              </h2>
            </div>
            
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center flex-shrink-0 border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-4",
                        message.role === "user"
                          ? "bg-gradient-to-br from-purple-500/30 to-purple-600/30 backdrop-blur-sm text-white border border-purple-500/30"
                          : "bg-[#1A1A1A] border border-white/10"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.markets && message.markets.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                          {message.markets.map((market) => (
                            <div key={market.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent border border-white/10">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{market.title}</p>
                                <p className="text-xs font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{Math.round(market.yesProb * 100)}¢</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Link to={`/app/market/${market.id}`}>
                                  <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30">
                                    <Zap className="w-3.5 h-3.5 text-white" />
                                  </Button>
                                </Link>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30"
                                  onClick={() => handleWatch(market.id)}
                                >
                                  <Star className={cn(
                                    "w-3.5 h-3.5 text-white",
                                    isWatched(market.id) && "fill-purple-400 text-purple-400"
                                  )} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center flex-shrink-0 border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <span className="text-xs font-semibold text-purple-400">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <Bot className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-4">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-[#1A1A1A]/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask about markets, strategies, or opportunities..."
                  disabled={isLoading}
                  className="bg-[#0A0A0A] border-white/10 focus-visible:ring-purple-500 placeholder:text-muted-foreground/50"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <Card className="p-4 border-white/10 bg-[#0A0A0A]">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.label}
                    variant="ghost"
                    className="w-full justify-start text-left text-sm bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors border-0"
                    onClick={() => setInput(template.prompt)}
                    disabled={isLoading}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Top Signals */}
            {signals.length > 0 && (
              <Card className="p-4 border-white/10 bg-[#0A0A0A]">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Live Signals
                </h3>
                <div className="space-y-3">
                  {signals.slice(0, 3).map((signal) => {
                    const market = markets?.find(m => m.id === signal.marketId);
                    if (!market) return null;
                    
                    return (
                      <div
                        key={signal.id}
                        className="p-3 rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent hover:from-purple-500/20 hover:via-purple-400/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className={cn(
                            "border-0 pointer-events-none text-[10px] px-1.5 py-0.5",
                            signal.confidence === "High" ? "bg-green-500/20 text-green-400" :
                            signal.confidence === "Med" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5 text-white"
                          )}>
                            {signal.confidence}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWatch(market.id)}
                            className="h-6 w-6 p-0 rounded-lg bg-gradient-to-b from-zinc-900 to-black border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:from-zinc-800 hover:to-black/90 hover:border-purple-400/30"
                          >
                            <Star
                              className={cn(
                                "w-3 h-3 text-white",
                                isWatched(market.id) && "fill-purple-400 text-purple-400"
                              )}
                            />
                          </Button>
                        </div>
                        <p className="text-sm font-medium mb-2">{signal.headline}</p>
                        <Link
                          to={`/app/market/${market.id}`}
                          className="text-xs text-muted-foreground hover:text-purple-400 transition-colors flex items-center gap-1"
                        >
                          View market <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
