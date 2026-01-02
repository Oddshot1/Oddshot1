import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradeAssistant } from "@/hooks/use-trade-assistant";
import type { Market, Signal, EdgeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TradeAIChatProps {
  market: Market;
  signal?: Signal;
  edge?: EdgeRow;
}

const quickPrompts = [
  "Should I buy YES or NO?",
  "What's the edge here?",
  "What could go wrong?",
  "Explain this market",
];

export function TradeAIChat({ market, signal, edge }: TradeAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage } = useTradeAssistant(market, signal, edge);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 lg:bottom-4 right-4 z-50 rounded-full p-[2px] shadow-lg w-[130px]">
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
            onClick={() => setIsOpen(true)}
            size="sm"
            className="h-11 w-full gap-2 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors text-xs"
          >
            <img 
              src="/chatlogo.svg" 
              alt="ODDSHOT" 
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
            Ask AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 border-white/10 bg-[#0A0A0A] shadow-2xl transition-all duration-200",
      isExpanded 
        ? "inset-4 lg:inset-8" 
        : "bottom-20 right-4 w-[calc(100vw-2rem)] max-w-md h-[60vh] lg:bottom-4 lg:right-4 lg:w-96 lg:h-[500px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <img 
            src="/chatlogo.svg" 
            alt="ODDSHOT" 
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
          <div>
            <h3 className="text-sm font-semibold">Trade Assistant</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{market.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" style={{ height: isExpanded ? "calc(100% - 130px)" : "calc(100% - 130px)" }}>
        <div ref={scrollRef} className="space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <img 
                  src="/chatlogo.svg" 
                  alt="ODDSHOT" 
                  className="w-6 h-6 rounded-full flex-shrink-0"
                />
                <div className="text-sm text-muted-foreground">
                  I can help you analyze this market. Ask me anything about the trade, edge, or risks.
                </div>
              </div>
              
              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => {
                      setInput(prompt);
                      sendMessage(prompt);
                    }}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {message.role === "assistant" ? (
                  <img 
                    src="/chatlogo.svg" 
                    alt="ODDSHOT" 
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-secondary">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-lg p-3 text-sm",
                  message.role === "assistant" ? "bg-secondary/50" : "bg-primary/10"
                )}>
                  <div className="whitespace-pre-wrap prose prose-sm prose-invert max-w-none">
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-2">
              <img 
                src="/chatlogo.svg" 
                alt="ODDSHOT" 
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
              <div className="bg-secondary/50 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-oddshot-danger bg-oddshot-danger/10 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this trade..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="h-12 bg-[#1A1A1A] border-white/10 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent placeholder:text-white/40 pr-14 rounded-xl"
          />
          <div className="absolute right-1 top-1">
            <div className="relative rounded-full p-[2px] h-10 w-10">
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
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <Send className="w-4 h-4 text-purple-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
