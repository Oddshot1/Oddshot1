import { Wallet, TrendingUp, TrendingDown, Clock, Eye, ArrowUpRight, ArrowDownRight, Lightbulb, Zap, Loader2, ArrowDownToLine, ExternalLink, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import { WalletButton } from "@/components/shared/WalletButton";
import { usePolymarketPortfolio, PolymarketPosition } from "@/hooks/use-polymarket-portfolio";
import { usePolymarketHistory } from "@/hooks/use-polymarket-history";
import { usePolymarketPnL } from "@/hooks/use-polymarket-pnl";
import { usePhantomEVM } from "@/hooks/use-phantom-evm";
import { usePolymarketProfile } from "@/hooks/use-polymarket-profile";
import { usePolymarketBalance } from "@/hooks/use-polymarket-balance";
import { useViewMode } from "@/hooks/use-view-mode";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";
import { formatTimeLeft, formatUSD, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { FundingModal } from "@/components/polymarket/FundingModal";
import { WithdrawModal } from "@/components/polymarket/WithdrawModal";
import { CashOutModal } from "@/components/polymarket/CashOutModal";

export default function Portfolio() {
  const { isGuided } = useViewMode();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { evmAddress, evmConnected, evmAvailable, connectEVM } = usePhantomEVM();
  
  // Get Polymarket profile and proxy wallet
  const { profile, loading: profileLoading, message: profileMessage } = usePolymarketProfile(evmAddress);
  const proxyWallet = profile?.proxyWallet;
  
  // Get portfolio, history, balance, and P&L
  const { data: portfolio, isLoading, error } = usePolymarketPortfolio(proxyWallet);
  const { data: history, isLoading: historyLoading } = usePolymarketHistory(proxyWallet);
  const { data: pnlData, isLoading: pnlLoading } = usePolymarketPnL(proxyWallet);
  const { balance } = usePolymarketBalance(proxyWallet, 30000); // Poll every 30 seconds
  
  // Modal states
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [cashOutPosition, setCashOutPosition] = useState<PolymarketPosition | null>(null);
  
  // If not connected, show connect prompt
  if (!connected) {
    return (
      <>
        <SEOHead title={seoContent.portfolio.title} description={seoContent.portfolio.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Portfolio
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              Your positions and performance
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container">
            <div className="p-8 text-center space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Connect your wallet</h2>
                  <p className="text-muted-foreground">
                    Connect Phantom to view your Polymarket positions
                  </p>
                </div>
              </div>
              
              <div className="relative rounded-full p-[2px] h-12 inline-block">
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
                    onClick={() => setVisible(true)}
                    size="lg" 
                    className="h-full gap-2 px-8 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                  >
                    Connect Phantom
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // If connected but no EVM
  if (!evmConnected) {
    return (
      <>
        <SEOHead title={seoContent.portfolio.title} description={seoContent.portfolio.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Portfolio
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              Your positions and performance
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container">
            <div className="p-8 text-center space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {evmAvailable ? "Connect EVM wallet" : "Enable multichain in Phantom"}
                  </h2>
                  <p className="text-muted-foreground">
                    {evmAvailable 
            ? "Connect your EVM address to view Polymarket positions" 
            : "Enable multichain/EVM in Phantom settings to view your Polymarket portfolio"}
                  </p>
                </div>
              </div>
              
              {evmAvailable && (
                <div className="relative rounded-full p-[2px] h-12 inline-block">
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
                      onClick={connectEVM}
                      size="lg" 
                      className="h-full gap-2 px-8 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                    >
                      Connect EVM
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  // No profile state (user needs to create account on Polymarket)
  if (evmConnected && !profileLoading && !isLoading && !profile?.hasProfile && profileMessage) {
    return (
      <>
        <SEOHead title={seoContent.portfolio.title} description={seoContent.portfolio.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Portfolio
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              {evmAddress ? (
                <span className="font-mono text-base lg:text-xl">{evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}</span>
              ) : (
                "Your positions and performance"
              )}
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container">
            <Card className="p-8 border-white/10 bg-[#0A0A0A] max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
                  <AlertCircle className="h-10 w-10 text-purple-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Create Your Polymarket Profile</h2>
                  <p className="text-muted-foreground">
                    To trade on Polymarket through ODDSHOT, you need to create a Polymarket account first
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 w-full text-left space-y-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">1</span>
                    Visit Polymarket.com
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Go to <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">polymarket.com</a> and connect your Phantom wallet
                  </p>

                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">2</span>
                    Complete Setup
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Follow their onboarding to create your trading profile and proxy wallet
                  </p>

                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">3</span>
                    Return to ODDSHOT
                  </h3>
                  <p className="text-sm text-muted-foreground ml-8">
                    Once your profile is created, come back here to view your portfolio and place trades
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a 
                    href="https://polymarket.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                      size="lg"
                    >
                      Go to Polymarket
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10"
                    onClick={() => window.location.reload()}
                  >
                    I've Created My Profile
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Your EVM address: <span className="font-mono">{evmAddress}</span>
                </p>
              </div>
            </Card>
          </div>
        </section>
      </>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <SEOHead title={seoContent.portfolio.title} description={seoContent.portfolio.description} />
        
        {/* Main Header */}
        <div className="container py-6 lg:py-8">
          <div className="text-center space-y-3 max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              Portfolio
            </h1>
            <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
              Your positions and performance
            </p>
          </div>
        </div>

        <section className="relative py-10 lg:py-20 overflow-hidden">
          {/* Gradient Background Effect */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
          
          <div className="relative container">
        <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </div>
        </section>
      </>
    );
  }

  const positions = portfolio?.positions || [];

  // Calculate totals
  const totalValue = portfolio?.totalValue || 0;
  const totalPnL = portfolio?.totalPnl || 0;
  const totalRealizedPnL = portfolio?.totalRealizedPnl || 0;
  const totalInitialValue = portfolio?.totalInitialValue || 0;
  
  // Total exposure = initial investment
  const totalExposure = totalInitialValue;
  
  // Combined P&L = unrealized (open) + realized (closed)
  const combinedPnL = totalPnL + totalRealizedPnL;
  const totalPnLPct = totalExposure > 0 ? (combinedPnL / totalExposure) * 100 : 0;

  // Find best action for Guided mode (position with best P&L %)
  const bestPosition = positions.reduce((best, p) => {
    if (!best) return p;
    return p.pnlPct > best.pnlPct ? p : best;
  }, positions[0]);

  return (
    <>
      <SEOHead title={seoContent.portfolio.title} description={seoContent.portfolio.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            Portfolio
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            {evmAddress ? (
              <span className="font-mono text-base lg:text-xl">{evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}</span>
            ) : (
              "Your positions and performance"
            )}
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container space-y-8">

      {/* Trading Balance */}
      {proxyWallet && (
        <Card className="p-6 border-white/10 bg-[#0A0A0A]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trading Balance (USDC on Polygon)</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  ${balance || '0.00'}
                </p>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Proxy Wallet
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {proxyWallet.slice(0, 6)}...{proxyWallet.slice(-4)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowWithdrawModal(true)}
                variant="outline"
                className="gap-2 bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10"
                size="lg"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Withdraw
              </Button>
              <Button
                onClick={() => setShowFundingModal(true)}
                className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
                size="lg"
              >
                <Zap className="h-4 w-4" />
                Fund Balance
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {positions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Position Value</p>
              <p className="text-3xl font-bold text-white">
                {formatUSD(totalValue)}
              </p>
            </div>
          </Card>
          
          <Card className="p-5 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total P&L (Open)</p>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-3xl font-bold",
                  totalPnL >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {formatUSD(totalPnL)}
                </p>
                <Badge variant="outline" className={cn(
                  "border-0",
                  totalPnL >= 0 
                    ? "bg-green-500/10 text-green-400" 
                    : "bg-red-500/10 text-red-400"
                )}>
                  {totalPnL >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatPercent(totalPnLPct, 1)}
                </Badge>
              </div>
            </div>
          </Card>
          
          {pnlData && pnlData.totalRealizedPnL !== 0 && (
            <Card className="p-5 border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Realized P&L</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn(
                    "text-3xl font-bold",
                    pnlData.totalRealizedPnL >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatUSD(pnlData.totalRealizedPnL)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-green-400">{pnlData.winningTrades}W</span>
                  <span className="text-red-400">{pnlData.losingTrades}L</span>
                  <span>{pnlData.totalTrades} closed</span>
                </div>
              </div>
            </Card>
          )}
          
          <Card className="p-5 border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Open Positions</p>
              <p className="text-3xl font-bold text-white">
                {positions.length}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Guided Mode: Next Best Action */}
      {isGuided && bestPosition && (
        <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Recommended Action
                </Badge>
                <Badge variant="outline" className={cn(
                  "border-0",
                  bestPosition.pnl >= 0 
                    ? "bg-green-500/10 text-green-400" 
                    : "bg-red-500/10 text-red-400"
                )}>
                  {bestPosition.pnl >= 0 ? "In Profit" : "Underwater"}
                </Badge>
              </div>

              <h2 className="text-2xl font-semibold">{bestPosition.title || bestPosition.marketTitle || (bestPosition.conditionId ? `Position ${bestPosition.conditionId.slice(0, 8)}...` : 'Position')}</h2>

              <div className="flex items-center gap-4">
                <div className="text-5xl font-mono font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  {formatUSD(bestPosition.size * bestPosition.currentPrice)}
                </div>
                <Badge variant="outline" className={cn(
                  "border-0",
                  bestPosition.pnl >= 0 
                    ? "bg-green-500/10 text-green-400" 
                    : "bg-red-500/10 text-red-400"
                )}>
                  {bestPosition.pnl >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  {formatPercent(bestPosition.pnlPct / 100, 1)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  {bestPosition.pnl >= 0 
                    ? "Consider taking profits:" 
                    : "Review your position:"}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    Entry: {Math.round(bestPosition.avgPrice * 100)}¢ → Current: {Math.round(bestPosition.currentPrice * 100)}¢
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    Size: {bestPosition.size.toFixed(2)} shares
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center lg:min-w-[200px]">
              {bestPosition.marketId ? (
                <>
                  <Link to={`/app/market/${bestPosition.marketId}`} className="w-full">
                    <div className="relative rounded-full p-[2px] h-12 w-full">
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
                          size="lg" 
                          className="h-full w-full gap-2 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                        >
                          <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                            <Zap className="h-3 w-3 text-white" />
                          </div>
                {bestPosition.pnl >= 0 ? "Cash Out" : "Review"}
              </Button>
                      </div>
                    </div>
                  </Link>
              <Link to={`/app/market/${bestPosition.marketId}`}>
                    <Button variant="ghost" size="lg" className="gap-2 w-full bg-[#1A1A1A] hover:bg-background/50 hover:text-purple-400 transition-colors">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                  View Market
                </Button>
              </Link>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Market data loading...
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Totals */}
      <Card className="p-6 border-white/10 bg-[#0A0A0A]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Exposure</div>
            <div className="text-2xl font-mono font-bold">{formatUSD(totalExposure)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Est. Value</div>
            <div className="text-2xl font-mono font-bold">{formatUSD(totalValue)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
            <div className={cn(
              "text-2xl font-mono font-bold flex items-center gap-1",
              combinedPnL >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {combinedPnL >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              {formatUSD(Math.abs(combinedPnL))}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Return</div>
            <div className={cn(
              "text-2xl font-mono font-bold",
              totalPnLPct >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {totalPnLPct >= 0 ? "+" : ""}{formatPercent(totalPnLPct / 100, 1)}
            </div>
          </div>
        </div>
      </Card>

      {/* Positions & History Tabs */}
      <Tabs defaultValue="positions" className="w-full">
        <TabsList className="w-full justify-start border-b border-white/10 bg-transparent rounded-none h-auto p-0">
          <TabsTrigger 
            value="positions" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
          >
            Positions
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none"
          >
            History
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="mt-6">
          {positions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No positions yet"
              description="Your Polymarket positions will appear here once you start trading"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  All Positions
                </h3>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {positions.length} total
                </Badge>
              </div>
              {positions.map((position) => (
                <PositionCard 
                  key={position.conditionId} 
                  position={position} 
                  onCashOut={() => setCashOutPosition({ ...position, proxyWallet })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : !history || history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No trading history"
              description="Your past trades will appear here"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Trading History
                </h3>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {history.length} trades
                </Badge>
              </div>
              {history.map((item, index) => (
                <HistoryCard key={item.id || index} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
      </section>
      
      {/* Modals */}
      {proxyWallet && (
        <>
          <FundingModal
            open={showFundingModal}
            onOpenChange={setShowFundingModal}
            proxyWallet={proxyWallet}
            currentBalance={balance || undefined}
          />
          
          <WithdrawModal
            open={showWithdrawModal}
            onOpenChange={setShowWithdrawModal}
            proxyWallet={proxyWallet}
            currentBalance={balance || undefined}
            onSuccess={() => {
              // Portfolio will auto-refresh via query invalidation in WithdrawModal
            }}
          />
        </>
      )}
      
      {cashOutPosition && (
        <CashOutModal
          open={!!cashOutPosition}
          onOpenChange={(open) => !open && setCashOutPosition(null)}
          position={cashOutPosition}
          onSuccess={() => {
            // Portfolio will auto-refresh via query invalidation in CashOutModal
          }}
        />
      )}
    </>
  );
}

function PositionCard({ 
  position, 
  onCashOut 
}: { 
  position: PolymarketPosition;
  onCashOut: () => void;
}) {
  const isProfit = position.pnl >= 0;
  const value = position.size * position.currentPrice;

  return (
    <Card className="p-4 border-white/10 bg-[#0A0A0A] transition-all duration-200 hover:border-purple-400/30">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Icon */}
        {position.icon && (
          <div className="flex-shrink-0">
            <img 
              src={position.icon} 
              alt={position.marketTitle || 'Market'} 
              className="w-12 h-12 rounded-lg object-cover"
            />
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={position.outcome === "YES" ? "default" : "outline"} className={cn(
              "border-0",
              position.outcome === "YES" 
                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white" 
                : "bg-[#1A1A1A] text-muted-foreground"
            )}>
              {position.outcome || 'Unknown'}
            </Badge>
            {position.conditionId && (
              <Badge variant="outline" className="text-xs border-0 bg-[#1A1A1A]">
                {position.conditionId.slice(0, 8)}...
              </Badge>
            )}
          </div>
          <h3 className="font-medium text-white">
            {position.marketTitle || (position.conditionId ? `Market ${position.conditionId.slice(0, 12)}...` : 'Unknown Market')}
            </h3>
        </div>

        {/* Entry vs Current */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Entry</div>
            <div className="font-mono">{Math.round(position.avgPrice * 100)}¢</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Current</div>
            <div className="font-mono">{Math.round(position.currentPrice * 100)}¢</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Size</div>
            <div className="font-mono">{position.size.toFixed(2)}</div>
          </div>
        </div>

        {/* Value & P&L */}
        <div className="text-right min-w-[140px]">
          <div className="text-lg font-mono font-bold">{formatUSD(value)}</div>
          <div className={cn(
            "text-sm font-mono flex items-center justify-end gap-1",
            isProfit ? "text-green-400" : "text-red-400"
          )}>
            {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isProfit ? "+" : ""}{formatUSD(position.pnl)}
            <span className="text-muted-foreground">({formatPercent(position.pnlPct / 100, 1)})</span>
          </div>
          <Button
            onClick={onCashOut}
            variant="outline"
            size="sm"
            disabled={!position.tokenId}
            className="mt-2 w-full gap-1 bg-[#1A1A1A] hover:bg-green-500/10 hover:text-green-400 border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!position.tokenId ? 'Token ID not available - refresh portfolio' : 'Sell this position'}
          >
            <ArrowDownToLine className="h-3 w-3" />
            {position.tokenId ? 'Cash Out' : 'Unavailable'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function HistoryCard({ item }: { item: any }) {
  const getActivityIcon = () => {
    switch (item.activity) {
      case 'Bought':
        return <ArrowDownRight className="h-4 w-4" />;
      case 'Sold':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'Lost':
        return <TrendingDown className="h-4 w-4" />;
      case 'Won':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = () => {
    switch (item.activity) {
      case 'Bought':
        return 'text-blue-400';
      case 'Sold':
        return 'text-green-400';
      case 'Lost':
        return 'text-red-400';
      case 'Won':
        return 'text-green-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }
    } catch (e) {
      return timestamp || 'Unknown time';
    }
  };

  return (
    <Card className="p-4 border-white/10 bg-[#0A0A0A] transition-all duration-200 hover:border-purple-400/30">
      <div className="flex items-center gap-4">
        {/* Activity Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          item.activity === 'Lost' ? 'bg-red-500/10' :
          item.activity === 'Won' ? 'bg-green-500/10' :
          item.activity === 'Sold' ? 'bg-green-500/10' :
          'bg-blue-500/10'
        )}>
          <div className={getActivityColor()}>
            {getActivityIcon()}
          </div>
        </div>

        {/* Market Icon */}
        {item.icon && (
          <img 
            src={item.icon} 
            alt={item.marketTitle} 
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}

        {/* Market Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border-0",
                item.activity === 'Lost' ? 'bg-red-500/10 text-red-400' :
                item.activity === 'Won' ? 'bg-green-500/10 text-green-400' :
                item.activity === 'Sold' ? 'bg-green-500/10 text-green-400' :
                'bg-blue-500/10 text-blue-400'
              )}
            >
              {item.activity}
            </Badge>
            <Badge variant="outline" className="text-xs border-0 bg-[#1A1A1A]">
              {item.outcome || 'Unknown'} {Math.round((item.price || 0) * 100)}¢
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {(item.shares || 0).toFixed(2)} shares
            </span>
          </div>
          <h3 className="font-medium text-white text-sm">
            {item.marketTitle || 'Unknown Market'}
          </h3>
        </div>

        {/* Value & Timestamp */}
        <div className="text-right">
          <div className={cn(
            "text-lg font-mono font-bold",
            item.activity === 'Lost' ? 'text-red-400' :
            item.activity === 'Won' ? 'text-green-400' :
            item.pnl !== undefined && item.pnl !== 0 ? (item.pnl >= 0 ? 'text-green-400' : 'text-red-400') : 
            'text-white'
          )}>
            {item.pnl !== undefined && item.pnl !== 0 
              ? (item.pnl >= 0 ? '+' : '') + formatUSD(item.pnl)
              : item.activity === 'Bought' || item.activity === 'Sold'
                ? (item.activity === 'Bought' ? '-' : '+') + formatUSD(item.value || 0)
                : formatUSD(item.value || 0)
            }
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(item.timestamp)}
          </div>
          {item.transactionHash && (
            <a
              href={`https://polygonscan.com/tx/${item.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center justify-end gap-1 mt-1"
            >
              View Tx
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
