import type { PolymarketMarket } from "@/hooks/use-polymarket-markets";
import type { KalshiMarket } from "@/hooks/use-kalshi-markets";
import type { PredictItMarket } from "@/hooks/use-predictit-markets";
import type { OddsEvent } from "@/hooks/use-odds-events";

// Unified market interface for cross-venue comparison
export interface UnifiedMarket {
  id: string;
  title: string;
  venue: "polymarket" | "kalshi" | "predictit";
  venueName: string;
  yesBuy: number;  // Price to BUY YES
  noBuy: number;   // Price to BUY NO
  yesSell: number; // Price you get when selling YES
  noSell: number;  // Price you get when selling NO
  midPrice: number;
  lastUpdated: string;
}

// Cross-venue arbitrage opportunity
export interface CrossVenueArbitrage {
  type: "cross-venue";
  id: string;
  market1Id: string;
  market2Id: string;
  title: string;
  market1Title: string;
  market2Title: string;
  matchConfidence: number;
  venue1: string;
  venue2: string;
  venue1YesBuy: number;
  venue1NoBuy: number;
  venue2YesBuy: number;
  venue2NoBuy: number;
  strategy: string;
  profitPerDollar: number;
  totalCost: number;
  riskNote: string;
  venues: [string, string];
  lastUpdated: string;
  isGuaranteed: boolean;
}

// Intra-Polymarket arbitrage (related markets that don't sum to 100%)
export interface IntraMarketArbitrage {
  type: "intra-polymarket";
  id: string;
  eventTitle: string;
  markets: {
    id: string;
    title: string;
    yesProb: number;
    noProb: number;
  }[];
  totalProbability: number;
  arbitrageGap: number;
  profitPerDollar: number;
  strategy: string;
  riskNote: string;
  lastUpdated: string;
  isGuaranteed: boolean;
}

// Price gap opportunity (not guaranteed arbitrage, but momentum signal)
// Note: This reuses some fields for convenience but is clearly labeled as NOT arbitrage
export interface PriceGapOpportunity {
  type: "price-gap";
  id: string;
  polymarketId: string;
  kalshiId: string; // Empty for momentum alerts (no cross-venue comparison)
  title: string;
  polymarketTitle: string;
  kalshiTitle: string; // Empty for momentum alerts
  matchConfidence: number; // 0 for momentum alerts
  polymarketPrice: number; // Current price
  kalshiPrice: number; // For momentum: previous price before move (NOT an actual Kalshi price)
  priceDifference: number;
  direction: "poly-higher" | "kalshi-higher";
  potentialProfit: number; // For momentum: just the % move, NOT guaranteed profit
  riskNote: string;
  venues: ["Polymarket", "Kalshi"];
  lastUpdated: string;
}

// Sports betting arbitrage opportunity
export interface SportsArbitrage {
  type: "sports-arbitrage";
  id: string;
  eventId: string;
  title: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bestHomeBookmaker: string;
  bestAwayBookmaker: string;
  homeOdds: number;
  awayOdds: number;
  profitPercent: number;
  strategy: string;
  riskNote: string;
  isGuaranteed: boolean;
  bookmakersCount: number;
}

export type ArbitrageOpportunity = CrossVenueArbitrage | IntraMarketArbitrage | PriceGapOpportunity | SportsArbitrage;

// Keywords that indicate similar topics - ENHANCED for better matching
const TOPIC_KEYWORDS: Record<string, string[]> = {
  trump: ["trump", "donald", "president trump", "45th", "47th"],
  biden: ["biden", "joe biden", "president biden"],
  bitcoin: ["bitcoin", "btc", "crypto", "cryptocurrency"],
  ethereum: ["ethereum", "eth", "ether"],
  fed: ["fed", "federal reserve", "interest rate", "fomc", "powell", "rate cut", "rate hike"],
  election: ["election", "vote", "ballot", "electoral", "2024 election", "2028 election"],
  ai: ["ai", "artificial intelligence", "openai", "gpt", "chatgpt", "claude", "gemini"],
  tesla: ["tesla", "tsla", "musk", "elon"],
  war: ["war", "conflict", "ukraine", "russia", "israel", "gaza", "military"],
  recession: ["recession", "gdp", "economy", "economic", "downturn"],
  inflation: ["inflation", "cpi", "prices", "consumer price"],
  sports: ["nfl", "nba", "mlb", "super bowl", "championship", "playoffs", "finals"],
  china: ["china", "chinese", "beijing", "xi jinping", "taiwan"],
  congress: ["congress", "senate", "house", "legislation", "bill", "law"],
};

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract topic from title
function extractTopics(text: string): string[] {
  const normalized = normalizeText(text);
  const topics: string[] = [];
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        topics.push(topic);
        break;
      }
    }
  }
  
  return topics;
}

// Extract key terms for matching
function extractKeyTerms(text: string): string[] {
  const normalized = normalizeText(text);
  const stopWords = new Set(["the", "a", "an", "will", "be", "to", "in", "on", "at", "by", "for", "of", "and", "or", "is", "are", "was", "were", "been", "before", "after", "this", "that", "what", "when", "where", "which", "who", "how"]);
  return normalized.split(" ").filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate match confidence between two market titles
function calculateMatchConfidence(polyTitle: string, kalshiTitle: string): number {
  const polyTerms = extractKeyTerms(polyTitle);
  const kalshiTerms = new Set(extractKeyTerms(kalshiTitle));
  const polyTopics = extractTopics(polyTitle);
  const kalshiTopics = extractTopics(kalshiTitle);
  
  if (polyTerms.length === 0) return 0;
  
  // Check topic overlap first
  const topicOverlap = polyTopics.filter(t => kalshiTopics.includes(t)).length;
  if (topicOverlap === 0 && polyTopics.length > 0 && kalshiTopics.length > 0) {
    return 0; // Different topics, no match
  }
  
  let matchCount = 0;
  for (const term of polyTerms) {
    if (kalshiTerms.has(term)) {
      matchCount++;
    } else {
      // Partial match for similar terms
      for (const kTerm of kalshiTerms) {
        if (kTerm.includes(term) || term.includes(kTerm)) {
          matchCount += 0.5;
          break;
        }
      }
    }
  }
  
  let confidence = matchCount / Math.max(polyTerms.length, kalshiTerms.size);
  
  // Boost confidence if topics match
  if (topicOverlap > 0) {
    confidence = Math.min(1, confidence + 0.2 * topicOverlap);
  }
  
  return Math.min(1, confidence);
}

// Convert markets to unified format for comparison
function toUnifiedMarkets(
  polymarkets: PolymarketMarket[],
  kalshiMarkets: KalshiMarket[],
  predictitMarkets: PredictItMarket[] = []
): UnifiedMarket[] {
  const unified: UnifiedMarket[] = [];
  
  // Add Polymarket markets
  for (const m of polymarkets) {
    if (!m.active || m.yesProb < 0.02 || m.yesProb > 0.98) continue;
    unified.push({
      id: m.id,
      title: m.title,
      venue: "polymarket",
      venueName: "Polymarket",
      yesBuy: m.yesProb,
      noBuy: m.noProb,
      yesSell: m.yesProb, // Polymarket prices are same for buy/sell (simplified)
      noSell: m.noProb,
      midPrice: m.yesProb,
      lastUpdated: m.lastUpdatedAt,
    });
  }
  
  // Add Kalshi markets
  for (const m of kalshiMarkets) {
    if (m.yesAsk < 0.01 || m.yesAsk > 0.99) continue;
    unified.push({
      id: m.id,
      title: m.title,
      venue: "kalshi",
      venueName: "Kalshi",
      yesBuy: m.yesAsk,
      noBuy: m.noAsk,
      yesSell: m.yesBid,
      noSell: m.noBid,
      midPrice: m.midPrice,
      lastUpdated: m.closeTime,
    });
  }
  
  // Add PredictIt markets
  for (const m of predictitMarkets) {
    if (m.yesBid < 0.01 || m.yesBid > 0.99) continue;
    unified.push({
      id: m.id,
      title: m.title,
      venue: "predictit",
      venueName: "PredictIt",
      yesBuy: m.yesBid,
      noBuy: m.noBid,
      yesSell: m.yesAsk,
      noSell: m.noAsk,
      midPrice: m.midPrice,
      lastUpdated: new Date().toISOString(),
    });
  }
  
  return unified;
}

// Find cross-venue arbitrage opportunities across all venues
export function findCrossVenueArbitrage(
  polymarkets: PolymarketMarket[],
  kalshiMarkets: KalshiMarket[],
  predictitMarkets: PredictItMarket[] = []
): CrossVenueArbitrage[] {
  const opportunities: CrossVenueArbitrage[] = [];
  
  // Track which markets have been matched to prevent one market matching multiple others
  const usedMarkets = new Set<string>();
  
  const allMarkets = toUnifiedMarkets(polymarkets, kalshiMarkets, predictitMarkets);
  
  // Group markets by venue for comparison
  const marketsByVenue = new Map<string, UnifiedMarket[]>();
  for (const m of allMarkets) {
    if (!marketsByVenue.has(m.venue)) {
      marketsByVenue.set(m.venue, []);
    }
    marketsByVenue.get(m.venue)!.push(m);
  }
  
  const venues = Array.from(marketsByVenue.keys());
  
  // Compare each pair of venues
  for (let v1 = 0; v1 < venues.length; v1++) {
    for (let v2 = v1 + 1; v2 < venues.length; v2++) {
      const venue1Markets = marketsByVenue.get(venues[v1])!;
      const venue2Markets = marketsByVenue.get(venues[v2])!;
      
      // Find best matches between venues
      for (const m1 of venue1Markets) {
        if (usedMarkets.has(m1.id)) continue;
        
        let bestMatch: { market: UnifiedMarket; confidence: number } | null = null;
        
        for (const m2 of venue2Markets) {
          if (usedMarkets.has(m2.id)) continue;
          
          const confidence = calculateMatchConfidence(m1.title, m2.title);
          
          // Use 75% threshold but with additional name verification
          // This allows more matches while still filtering obvious mismatches
          if (confidence >= 0.75) {
            // Additional check: prevent name confusion (e.g., "Yair Golan" vs "Yair Lapid")
            const m1Names = extractProperNames(m1.title);
            const m2Names = extractProperNames(m2.title);
            const nameMatch = m1Names.length === 0 || m2Names.length === 0 || 
              m1Names.some(n => m2Names.includes(n));
            
            if (nameMatch && (!bestMatch || confidence > bestMatch.confidence)) {
              bestMatch = { market: m2, confidence };
            }
          }
        }
        
        if (bestMatch) {
          const m2 = bestMatch.market;
          
          // Mark both markets as used - each market can only match once
          usedMarkets.add(m1.id);
          usedMarkets.add(m2.id);
          
          // Calculate arbitrage: Buy YES on one + Buy NO on other
          const strat1Cost = m1.yesBuy + m2.noBuy;
          const strat1Profit = strat1Cost < 1 ? (1 - strat1Cost) : 0;
          
          const strat2Cost = m1.noBuy + m2.yesBuy;
          const strat2Profit = strat2Cost < 1 ? (1 - strat2Cost) : 0;
          
          const strategies = [
            { name: `Buy YES on ${m1.venueName} + Buy NO on ${m2.venueName}`, profit: strat1Profit, cost: strat1Cost },
            { name: `Buy NO on ${m1.venueName} + Buy YES on ${m2.venueName}`, profit: strat2Profit, cost: strat2Cost },
          ];
          
          const bestStrategy = strategies.reduce((a, b) => a.profit > b.profit ? a : b);
          
          // Include opportunities with any profit > 0.1% (even small ones are interesting)
          // Flag anything > 15% as suspicious (likely matching error)
          const hasProfit = bestStrategy.profit > 0.001;
          const isSuspicious = bestStrategy.profit > 0.15;
          
          if (hasProfit && !isSuspicious) {
            opportunities.push({
              type: "cross-venue",
              id: `xv-${m1.id}-${m2.id}`,
              market1Id: m1.id,
              market2Id: m2.id,
              title: m1.title,
              market1Title: m1.title,
              market2Title: m2.title,
              matchConfidence: bestMatch.confidence,
              venue1: m1.venueName,
              venue2: m2.venueName,
              venue1YesBuy: m1.yesBuy,
              venue1NoBuy: m1.noBuy,
              venue2YesBuy: m2.yesBuy,
              venue2NoBuy: m2.noBuy,
              strategy: bestStrategy.name,
              profitPerDollar: bestStrategy.profit,
              totalCost: bestStrategy.cost,
              riskNote: bestStrategy.profit > 0.05 
                ? `⚠️ ${(bestStrategy.profit * 100).toFixed(1)}% profit - verify markets are identical!`
                : `Cost: ${(bestStrategy.cost * 100).toFixed(1)}¢ → Return: $1.00 = ${(bestStrategy.profit * 100).toFixed(1)}% profit.`,
              venues: [m1.venueName, m2.venueName],
              lastUpdated: m1.lastUpdated,
              isGuaranteed: bestStrategy.profit > 0.005,
            });
          }
        }
      }
    }
  }
  
  return opportunities.sort((a, b) => b.profitPerDollar - a.profitPerDollar);
}

// Extract proper names from a title for better matching verification
function extractProperNames(title: string): string[] {
  // Match capitalized words that look like names (not common words)
  const commonWords = new Set(['Will', 'The', 'Be', 'By', 'In', 'On', 'At', 'To', 'Of', 'And', 'Or', 'For', 'From', 'With', 'As', 'Is', 'Are', 'Was', 'Were', 'Yes', 'No', 'If', 'When', 'What', 'Where', 'Who', 'How', 'Why', 'Before', 'After', 'Next', 'Prime', 'Minister', 'President', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
  const words = title.match(/[A-Z][a-z]+/g) || [];
  return words
    .filter(w => !commonWords.has(w) && w.length > 2)
    .map(w => w.toLowerCase());
}

// Find intra-Polymarket arbitrage (multi-outcome markets)
export function findIntraPolymarketArbitrage(
  markets: PolymarketMarket[]
): IntraMarketArbitrage[] {
  const opportunities: IntraMarketArbitrage[] = [];
  
  // Group markets by extracting the common question pattern
  // e.g., "Will Elon Musk post 300-319 tweets..." and "Will Elon Musk post 320-339 tweets..."
  // should be grouped together
  const eventGroups = new Map<string, PolymarketMarket[]>();
  
  for (const market of markets) {
    // Relaxed filter: Allow markets from 1% to 99% (previously 1-99%)
    // This catches more potential multi-outcome markets
    if (!market.active) continue;
    
    // Extract event signature by removing numerical ranges/specific values
    // This finds markets that are variants of the same question
    const signature = extractEventSignature(market.title);
    
    if (signature) {
      if (!eventGroups.has(signature)) {
        eventGroups.set(signature, []);
      }
      eventGroups.get(signature)!.push(market);
    }
  }
  
  // Analyze each group
  for (const [eventKey, group] of eventGroups) {
    // Need at least 2 outcomes, max 20 (reasonable for multi-outcome)
    if (group.length < 2 || group.length > 20) continue;
    
    // Filter out near-resolved markets for the calculation
    const activeMarkets = group.filter(m => m.yesProb >= 0.01 && m.yesProb <= 0.99);
    if (activeMarkets.length < 2) continue;
    
    // Calculate total probability
    const totalProb = activeMarkets.reduce((sum, m) => sum + m.yesProb, 0);
    const deviation = Math.abs(totalProb - 1);
    
    // Only flag if:
    // 1. Deviation > 0.5% (meaningful after fees)
    // 2. Total is between 50% and 120% (reasonable range)
    // 3. This looks like mutually exclusive outcomes
    if (deviation > 0.005 && totalProb > 0.5 && totalProb < 1.2) {
      const isUnderpriced = totalProb < 1;
      
      // Profit calculation: if underpriced, buy all YES for totalProb, get $1 back
      // Profit = ($1 - totalProb) / totalProb = profit per dollar invested
      const profitPerDollar = isUnderpriced ? (1 - totalProb) / totalProb : 0;
      
      // Risk assessment
      const riskLevel = assessIntraMarketRisk(activeMarkets);
      
      opportunities.push({
        type: "intra-polymarket",
        id: `ip-${eventKey.replace(/[^a-z0-9]/g, "-").slice(0, 30)}`,
        eventTitle: activeMarkets[0].title.length > 60 
          ? activeMarkets[0].title.slice(0, 57) + "..."
          : activeMarkets[0].title,
        markets: activeMarkets.map(m => ({
          id: m.id,
          title: m.title,
          yesProb: m.yesProb,
          noProb: m.noProb,
        })),
        totalProbability: totalProb,
        arbitrageGap: deviation,
        profitPerDollar,
        strategy: isUnderpriced 
          ? `Buy YES on all ${activeMarkets.length} outcomes (${(totalProb * 100).toFixed(0)}¢ total) → $1 guaranteed`
          : `Total ${(totalProb * 100).toFixed(0)}¢ > $1. Cannot easily arbitrage without shorting.`,
        riskNote: isUnderpriced
          ? `${((1 - totalProb) * 100).toFixed(1)}% profit IF outcomes are mutually exclusive and exhaustive. ${riskLevel}`
          : `Overpriced by ${((totalProb - 1) * 100).toFixed(1)}%. Consider betting NO on overpriced outcomes.`,
        lastUpdated: activeMarkets[0].lastUpdatedAt,
        // Only mark as guaranteed if underpriced AND we're confident outcomes are complete
        isGuaranteed: isUnderpriced && deviation > 0.01 && activeMarkets.length >= 3,
      });
    }
  }
  
  return opportunities
    .sort((a, b) => {
      if (a.isGuaranteed !== b.isGuaranteed) return a.isGuaranteed ? -1 : 1;
      return b.profitPerDollar - a.profitPerDollar;
    })
    .slice(0, 15);
}

// Extract a signature that identifies related multi-outcome markets
function extractEventSignature(title: string): string | null {
  const normalized = title.toLowerCase();
  
  // EXCLUDE: Deadline/cumulative date markets like "X by December 29" vs "X by December 31"
  // These are NOT mutually exclusive - if it happens by Dec 29, it also happens by Dec 31
  const byDatePattern = /\b(by|before|on)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+/i;
  if (byDatePattern.test(normalized)) {
    // Check if this is a "by date" pattern - these are cumulative, not exclusive
    // Only allow if it's clearly a range like "from X to Y"
    if (!normalized.includes("from") && !normalized.includes("between")) {
      return null; // Don't group deadline markets
    }
  }
  
  // Pattern: "Will X do Y from DATE1 to DATE2" with varying numeric ranges
  // e.g., "Will Elon Musk post 300-319 tweets from December 19..."
  // These ARE mutually exclusive (can only be in one range)
  const rangePattern = /^(.*?)\s*\d+[-–]\d+\s*(.*?)$/i;
  const match = normalized.match(rangePattern);
  if (match) {
    return `${match[1].trim()}_RANGE_${match[2].trim()}`.slice(0, 100);
  }
  
  // Pattern: Questions about "who will win" with different candidates
  const whoWillPattern = /^who will (win|be|become)\s+(.+?)\??$/i;
  const whoMatch = normalized.match(whoWillPattern);
  if (whoMatch) {
    return `who_will_${whoMatch[1]}_${whoMatch[2]}`.slice(0, 100);
  }
  
  // Pattern: Same base question with different specific values
  // e.g., "Will BTC reach $X by DATE" - SKIP these as they may be cumulative
  // Only match clear exclusive patterns
  
  return null;
}

// Assess risk of intra-market arbitrage
function assessIntraMarketRisk(markets: PolymarketMarket[]): string {
  // Check if outcomes appear to cover full range
  const titles = markets.map(m => m.title.toLowerCase());
  
  // Look for indicators that outcomes might not be exhaustive
  const hasUnder = titles.some(t => t.includes("under") || t.includes("fewer") || t.includes("less"));
  const hasOver = titles.some(t => t.includes("over") || t.includes("more") || t.includes("above"));
  
  if (!hasUnder && !hasOver) {
    return "⚠️ Verify all possible outcomes are included.";
  }
  
  // Check for consistent date ranges
  const datePattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d+/gi;
  const dates = new Set(titles.flatMap(t => t.match(datePattern) || []));
  if (dates.size > 2) {
    return "⚠️ Multiple date ranges detected - may not be same event.";
  }
  
  return "Verify outcomes are mutually exclusive.";
}

// Find volatility-based opportunities within Polymarket
// NOTE: These are NOT guaranteed arbitrage - they are momentum signals
export function findVolatilityOpportunities(
  markets: PolymarketMarket[]
): PriceGapOpportunity[] {
  const opportunities: PriceGapOpportunity[] = [];
  
  // Find markets with sharp recent moves that might be overreactions
  const volatileMarkets = markets.filter(m => 
    m.active && 
    m.yesProb > 0.05 && 
    m.yesProb < 0.95 &&
    (Math.abs(m.change1h) > 0.03 || Math.abs(m.change24h) > 0.08)
  );
  
  for (const market of volatileMarkets) {
    const absChange1h = Math.abs(market.change1h);
    const absChange24h = Math.abs(market.change24h);
    const isBigMove = absChange1h > 0.05 || absChange24h > 0.10;
    
    if (isBigMove) {
      const isUp = (market.change1h || market.change24h) > 0;
      const changeUsed = absChange1h > 0 ? absChange1h : absChange24h;
      const timeframe = absChange1h > 0.05 ? "1h" : "24h";
      
      opportunities.push({
        type: "price-gap",
        id: `vol-${market.id}`,
        polymarketId: market.id,
        kalshiId: "",
        title: market.title,
        polymarketTitle: market.title,
        kalshiTitle: "",
        matchConfidence: 0,
        polymarketPrice: market.yesProb,
        // Previous price is current minus change
        kalshiPrice: market.yesProb - (absChange1h > 0.05 ? market.change1h : market.change24h),
        priceDifference: changeUsed,
        direction: isUp ? "poly-higher" : "kalshi-higher",
        potentialProfit: changeUsed * 100, // Just showing the % move as potential
        riskNote: `${isUp ? "📈" : "📉"} ${(changeUsed * 100).toFixed(1)}% move in ${timeframe}. NOT guaranteed - this is momentum/volatility info, not arbitrage.`,
        venues: ["Polymarket", "Kalshi"],
        lastUpdated: market.lastUpdatedAt,
      });
    }
  }
  
  return opportunities.sort((a, b) => b.priceDifference - a.priceDifference).slice(0, 10);
}

// Find sports betting arbitrage opportunities across bookmakers
export function findSportsArbitrage(events: OddsEvent[]): SportsArbitrage[] {
  const opportunities: SportsArbitrage[] = [];
  
  for (const event of events) {
    if (!event.hasArbitrage || event.arbitrageProfit <= 0) continue;
    
    opportunities.push({
      type: "sports-arbitrage",
      id: `sports-${event.id}`,
      eventId: event.id,
      title: event.title,
      sportTitle: event.sportTitle,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      commenceTime: event.commenceTime,
      bestHomeBookmaker: event.bestHomeOdds.bookmaker,
      bestAwayBookmaker: event.bestAwayOdds.bookmaker,
      homeOdds: event.bestHomeOdds.odds,
      awayOdds: event.bestAwayOdds.odds,
      profitPercent: event.arbitrageProfit,
      strategy: `Bet ${event.homeTeam} on ${event.bestHomeOdds.bookmaker} (${event.bestHomeOdds.odds > 0 ? '+' : ''}${event.bestHomeOdds.odds}) + Bet ${event.awayTeam} on ${event.bestAwayOdds.bookmaker} (${event.bestAwayOdds.odds > 0 ? '+' : ''}${event.bestAwayOdds.odds})`,
      riskNote: event.arbitrageProfit > 3 
        ? `🔥 ${event.arbitrageProfit.toFixed(2)}% guaranteed profit! Verify odds before placing bets.`
        : `${event.arbitrageProfit.toFixed(2)}% profit. Account for fees and bet limits.`,
      isGuaranteed: event.arbitrageProfit > 0.5,
      bookmakersCount: event.bookmakers.length,
    });
  }
  
  // Sort by profit (best first)
  return opportunities.sort((a, b) => b.profitPercent - a.profitPercent).slice(0, 15);
}

// Find "near-arbitrage" opportunities in sports betting (odds are close, not quite profitable)
export function findNearSportsArbitrage(events: OddsEvent[]): SportsArbitrage[] {
  const opportunities: SportsArbitrage[] = [];
  
  for (const event of events) {
    // Skip if already has arbitrage (those go to the main function)
    if (event.hasArbitrage) continue;
    
    // Only show if profit is close (within 3% of breakeven)
    if (event.arbitrageProfit > -3 && event.arbitrageProfit <= 0) {
      opportunities.push({
        type: "sports-arbitrage",
        id: `sports-near-${event.id}`,
        eventId: event.id,
        title: event.title,
        sportTitle: event.sportTitle,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        commenceTime: event.commenceTime,
        bestHomeBookmaker: event.bestHomeOdds.bookmaker,
        bestAwayBookmaker: event.bestAwayOdds.bookmaker,
        homeOdds: event.bestHomeOdds.odds,
        awayOdds: event.bestAwayOdds.odds,
        profitPercent: event.arbitrageProfit,
        strategy: `${event.homeTeam} on ${event.bestHomeOdds.bookmaker} + ${event.awayTeam} on ${event.bestAwayOdds.bookmaker}`,
        riskNote: `📊 ${Math.abs(event.arbitrageProfit).toFixed(1)}% from breakeven. Watch for line movement.`,
        isGuaranteed: false,
        bookmakersCount: event.bookmakers.length,
      });
    }
  }
  
  // Sort by closest to profitable
  return opportunities.sort((a, b) => b.profitPercent - a.profitPercent).slice(0, 10);
}
