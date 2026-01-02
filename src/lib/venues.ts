// ODDSHOT Venue Layer
// Internal abstraction for multi-venue trading: Polymarket (Polygon)
// All execution happens IN-APP - no redirects

export type VenueId = "polymarket" | "drift" | "kalshi";
export type ChainId = "polygon" | "solana" | "offchain";

export interface Venue {
  id: VenueId;
  name: string;
  chain: ChainId;
  chainLabel: string;
  isActive: boolean;
  requiresEVM: boolean;
  requiresSolana: boolean;
  fees: {
    trading: number; // percentage
    withdrawal: number;
  };
}

export const VENUES: Record<VenueId, Venue> = {
  polymarket: {
    id: "polymarket",
    name: "Polymarket",
    chain: "polygon",
    chainLabel: "Polygon",
    isActive: true,
    requiresEVM: true,
    requiresSolana: false,
    fees: {
      trading: 0.02, // 2%
      withdrawal: 0,
    },
  },
  drift: {
    id: "drift",
    name: "Drift BET",
    chain: "solana",
    chainLabel: "Solana",
    isActive: false, // Not yet integrated for in-app
    requiresEVM: false,
    requiresSolana: true,
    fees: {
      trading: 0.001, // 0.1%
      withdrawal: 0,
    },
  },
  kalshi: {
    id: "kalshi",
    name: "Kalshi",
    chain: "offchain",
    chainLabel: "Regulated",
    isActive: false,
    requiresEVM: false,
    requiresSolana: false,
    fees: {
      trading: 0.01,
      withdrawal: 0,
    },
  },
};

// Get venue for a market (all markets execute on Polymarket via CLOB)
export function getMarketVenue(sourceLabel: string): Venue {
  // All execution goes through Polymarket for badge-grade integration
  return VENUES.polymarket;
}

// Get CTA label for in-app execution
export function getTradeCTA(venue: Venue, side: "YES" | "NO"): string {
  return `Buy ${side}`;
}

// Check if user has required wallet connected
export interface WalletState {
  solanaConnected: boolean;
  evmConnected: boolean;
  evmAddress?: string;
}

export function canTradeOnVenue(venue: Venue, walletState: WalletState): boolean {
  if (venue.requiresEVM && !walletState.evmConnected) return false;
  if (venue.requiresSolana && !walletState.solanaConnected) return false;
  return true;
}

// Quote snapshot for receipts
export interface QuoteSnapshot {
  venue: VenueId;
  venueName: string;
  chain: ChainId;
  timestamp: string;
  price: number;
  marketId: string;
  side: "YES" | "NO";
  amount: number;
  expectedShares: number;
  fees: number;
  total: number;
}

export function createQuoteSnapshot(
  venue: Venue,
  marketId: string,
  side: "YES" | "NO",
  price: number,
  amount: number
): QuoteSnapshot {
  const fees = amount * venue.fees.trading;
  const expectedShares = amount / price;
  
  return {
    venue: venue.id,
    venueName: venue.name,
    chain: venue.chain,
    timestamp: new Date().toISOString(),
    price,
    marketId,
    side,
    amount,
    expectedShares,
    fees,
    total: amount + fees,
  };
}

// Order status types for in-app execution
export type OrderStatus = 
  | "idle" 
  | "quoting" 
  | "ready" 
  | "signing" 
  | "submitted" 
  | "confirmed" 
  | "failed";

export interface OrderResult {
  orderId: string;
  status: OrderStatus;
  tokenId: string;
  side: string;
  size: number;
  price: number;
  filledSize?: number;
  avgFillPrice?: number;
  timestamp: string;
  builder: string;
  error?: string;
}
