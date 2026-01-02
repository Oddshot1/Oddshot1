import { cn } from "@/lib/utils";
import type { MarketCategory } from "@/lib/types";
import { Bitcoin, Trophy, Landmark, Film, TrendingUp } from "lucide-react";

interface MarketThumbnailProps {
  thumbnail: {
    imageUrl?: string | null;
    iconUrl?: string | null;
    imageOptimizedUrl?: string | null;
    resolvedUrl?: string | null;
    type?: string;
  };
  category: MarketCategory | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Sports: <Trophy className="h-5 w-5" />,
  Crypto: <Bitcoin className="h-5 w-5" />,
  Politics: <Landmark className="h-5 w-5" />,
  Culture: <Film className="h-5 w-5" />,
  Macro: <TrendingUp className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  Sports: "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
  Crypto: "from-amber-500/20 to-amber-600/10 text-amber-400",
  Politics: "from-blue-500/20 to-blue-600/10 text-blue-400",
  Culture: "from-pink-500/20 to-pink-600/10 text-pink-400",
  Macro: "from-purple-500/20 to-purple-600/10 text-purple-400",
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

export function MarketThumbnail({ thumbnail, category, size = "md", className }: MarketThumbnailProps) {
  // Try to get the best available image URL
  const imageUrl = thumbnail?.imageOptimizedUrl || thumbnail?.imageUrl || thumbnail?.resolvedUrl || thumbnail?.iconUrl;
  
  // If we have a real image URL, use it
  if (imageUrl) {
    return (
      <div className={cn(
        "shrink-0 rounded-lg overflow-hidden bg-secondary",
        sizeClasses[size],
        className
      )}>
        <img 
          src={imageUrl} 
          alt="" 
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Hide broken images and let fallback show
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback to icon-based thumbnail
  const catKey = category as string;
  return (
    <div className={cn(
      "shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br",
      sizeClasses[size],
      categoryColors[catKey] || categoryColors["Macro"],
      className
    )}>
      {categoryIcons[catKey] || categoryIcons["Macro"]}
    </div>
  );
}
