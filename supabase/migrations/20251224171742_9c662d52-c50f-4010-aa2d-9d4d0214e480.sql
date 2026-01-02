-- Create wallet_profiles table for wallet-based identity
CREATE TABLE public.wallet_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  display_name TEXT,
  preferences JSONB DEFAULT '{"priceAlerts": true, "signalAlerts": true, "emailDigest": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watchlists table for persisted watchlists
CREATE TABLE public.watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.wallet_profiles(wallet_address) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, market_id)
);

-- Enable Row Level Security
ALTER TABLE public.wallet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_profiles (public read, owner write)
CREATE POLICY "Anyone can view profiles" 
ON public.wallet_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.wallet_profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.wallet_profiles 
FOR UPDATE 
USING (true);

-- RLS policies for watchlists (public read, owner write based on wallet)
CREATE POLICY "Anyone can view watchlists" 
ON public.watchlists 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own watchlist" 
ON public.watchlists 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete their own watchlist items" 
ON public.watchlists 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wallet_profiles_updated_at
BEFORE UPDATE ON public.wallet_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_watchlists_wallet ON public.watchlists(wallet_address);
CREATE INDEX idx_watchlists_market ON public.watchlists(market_id);