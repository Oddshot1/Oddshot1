import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Zap, LogOut, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    setVisible(true);
  };

  const handleCopy = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      toast({ title: 'Address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({ title: 'Wallet disconnected' });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected || !publicKey) {
    return (
      <div className="relative rounded-full p-[2px] h-9">
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
            size="sm" 
            onClick={handleConnect}
            className="h-full w-full gap-2 px-5 bg-transparent hover:bg-background/50 text-foreground border-0 font-medium uppercase tracking-wide rounded-full text-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 font-mono text-xs bg-[#1A1A1A] border-white/10 hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400 transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          {shortenAddress(publicKey.toBase58())}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-[#0A0A0A] border-white/10">
        <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer hover:bg-purple-500/10 hover:text-purple-400 focus:bg-purple-500/10 focus:text-purple-400">
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          <span className="font-medium">Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={handleDisconnect} className="gap-2 cursor-pointer hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400">
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
