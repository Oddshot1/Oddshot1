import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proxyWallet: string;
  currentBalance?: string;
  onSuccess?: () => void;
}

export function WithdrawModal({
  open,
  onOpenChange,
  proxyWallet,
  currentBalance,
}: WithdrawModalProps) {
  const handleWithdraw = () => {
    // Open Polymarket.com for secure withdrawals
    window.open('https://polymarket.com', '_blank');
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-400" />
            Withdraw USDC
          </DialogTitle>
          <DialogDescription>
            Use Polymarket.com for secure, gasless withdrawals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Balance Info */}
            {currentBalance && (
              <div className="bg-[#1A1A1A] border border-white/10 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-bold text-white">${currentBalance}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  Proxy: {proxyWallet.slice(0, 6)}...{proxyWallet.slice(-4)}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white">How to withdraw:</p>
              <ol className="space-y-2.5 text-sm text-left">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400 flex-shrink-0">1</span>
                  <p className="text-muted-foreground">Click the button below to open Polymarket</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400 flex-shrink-0">2</span>
                  <p className="text-muted-foreground">Connect your Phantom wallet</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400 flex-shrink-0">3</span>
                  <p className="text-muted-foreground">Go to Profile → Wallet → Withdraw</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400 flex-shrink-0">4</span>
                  <p className="text-muted-foreground">Enter amount and complete the gasless withdrawal</p>
                </li>
              </ol>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-400 font-semibold">Why Polymarket.com?</p>
                  <p className="text-muted-foreground mt-1">
                    Polymarket's official interface provides secure, gasless withdrawals from your proxy wallet with no transaction fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleWithdraw}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Polymarket to Withdraw
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full bg-[#1A1A1A] hover:bg-purple-500/10 hover:text-purple-400 border-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
