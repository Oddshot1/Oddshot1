import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Market, Signal, EdgeRow } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MarketContext {
  title: string;
  category: string;
  yesProb: number;
  noProb: number;
  change24h: number;
  volume24h: number;
  expiresAt: string;
  sourceLabel: string;
  edge?: number;
  edgeConfidence?: string;
  signal?: { headline: string };
}

export function useTradeAssistant(market?: Market, signal?: Signal, edge?: EdgeRow) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildContext = useCallback((): MarketContext | undefined => {
    if (!market) return undefined;
    
    return {
      title: market.title,
      category: market.category,
      yesProb: market.yesProb,
      noProb: market.noProb,
      change24h: market.change24h,
      volume24h: market.volume24h,
      expiresAt: market.expiresAt,
      sourceLabel: market.sourceLabel,
      edge: edge?.edge,
      edgeConfidence: edge?.confidence,
      signal: signal ? { headline: signal.headline } : undefined,
    };
  }, [market, signal, edge]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    const userChatMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("trade-assistant", {
        body: {
          message: userMessage,
          marketContext: buildContext(),
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      console.error("Trade assistant error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, buildContext]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
