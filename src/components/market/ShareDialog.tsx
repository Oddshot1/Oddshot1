import { useState } from "react";
import { Link2, ExternalLink, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { Market } from "@/lib/types";

interface ShareDialogProps {
  market: {
    id: string;
    title: string;
    yesProb: number;
    noProb: number;
  };
  trigger?: React.ReactNode;
}

export function ShareDialog({ market, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  
  const marketUrl = `${window.location.origin}/app/market/${market.id}`;
  const tradeLink = `${marketUrl}?action=trade`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(marketUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyTradeLink = async () => {
    try {
      await navigator.clipboard.writeText(tradeLink);
      toast.success("Trade link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePostToX = () => {
    const text = `${market.title}\n\nYES: ${Math.round(market.yesProb * 100)}% | NO: ${Math.round(market.noProb * 100)}%\n\nTrade on ODDSHOT:`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(marketUrl)}`;
    window.open(tweetUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        
        {/* Market Preview */}
        <Card className="p-4 bg-secondary/50 border-border">
          <p className="font-medium text-sm line-clamp-2">{market.title}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-oddshot-success font-mono font-semibold">
              YES {Math.round(market.yesProb * 100)}%
            </span>
            <span className="text-oddshot-danger font-mono">
              NO {Math.round(market.noProb * 100)}%
            </span>
          </div>
        </Card>

        {/* Trade Link (Blinks) */}
        <Card className="p-4 border-purple-500/30 bg-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-sm">Trade Link (Blinks)</span>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 text-xs border-0">Recommended</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            One-tap trading from any Solana Actions-compatible app
          </p>
          <Button 
            onClick={handleCopyTradeLink}
            className="w-full bg-[#1A1A1A] text-foreground hover:bg-background/50 hover:text-purple-400"
          >
            Copy trade link
          </Button>
        </Card>

        {/* Other Options */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2 bg-[#1A1A1A] border-white/10 hover:bg-background/50 hover:text-purple-400"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4" />
            Copy link
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2 bg-[#1A1A1A] border-white/10 hover:bg-background/50 hover:text-purple-400"
            onClick={handlePostToX}
          >
            <ExternalLink className="h-4 w-4" />
            Post to X
          </Button>
        </div>

        {/* Coming Soon */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-2">
          <Download className="h-4 w-4" />
          <span>Download card (coming soon)</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

