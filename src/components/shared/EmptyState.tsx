import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  actionHref, 
  onAction,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] mb-4">
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && (actionHref || onAction) && (
        <div className="relative rounded-full p-[2px] h-12">
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
            {actionHref ? (
              <Link to={actionHref}>
                <Button 
                  size="lg" 
                  className="h-full gap-2 px-8 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
                >
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={onAction}
                size="lg" 
                className="h-full gap-2 px-8 bg-transparent hover:bg-background/50 text-foreground hover:text-white border-0 font-medium uppercase tracking-wide rounded-full transition-colors"
              >
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
