-- Create odds_snapshots table to store +EV opportunities
CREATE TABLE public.odds_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  slug TEXT,
  question TEXT NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  bet_on TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  poly_price DECIMAL(10,4) NOT NULL,
  fair_price DECIMAL(10,4) NOT NULL,
  edge DECIMAL(10,4) NOT NULL,
  ev_percent DECIMAL(10,4) NOT NULL,
  max_bet DECIMAL(15,2) DEFAULT 1000,
  liquidity DECIMAL(15,2) DEFAULT 0,
  volume DECIMAL(15,2) DEFAULT 0,
  commence_time TIMESTAMP WITH TIME ZONE,
  sharp_book TEXT DEFAULT 'Pinnacle',
  poly_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_value_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(market_id, bet_type, bet_on)
);

-- Enable RLS
ALTER TABLE public.odds_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is public betting data, not user-specific)
CREATE POLICY "Anyone can read odds snapshots" 
ON public.odds_snapshots 
FOR SELECT 
USING (true);

-- Only backend can insert/update/delete
CREATE POLICY "Service role can manage odds snapshots" 
ON public.odds_snapshots 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for efficient querying
CREATE INDEX idx_odds_snapshots_ev ON public.odds_snapshots(ev_percent DESC);
CREATE INDEX idx_odds_snapshots_updated ON public.odds_snapshots(expected_value_updated_at DESC);
CREATE INDEX idx_odds_snapshots_sport ON public.odds_snapshots(sport);
CREATE INDEX idx_odds_snapshots_commence ON public.odds_snapshots(commence_time);

-- Create trigger for updated_at
CREATE TRIGGER update_odds_snapshots_updated_at
BEFORE UPDATE ON public.odds_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();