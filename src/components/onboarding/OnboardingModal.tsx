import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "oddshot-onboarding-complete";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  visual: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ODDSHOT",
    subtitle: "Your prediction markets cockpit",
    description: "ODDSHOT helps you find, analyze, and trade prediction markets with confidence. Think of it as a premium dashboard for smarter trading decisions.",
    icon: Sparkles,
    visual: null,
  },
  {
    id: "what-are-prediction-markets",
    title: "What are Prediction Markets?",
    subtitle: "Trade on future events",
    description: "Prediction markets let you buy shares on whether something will happen. If you're right, you profit. It's like betting, but with real-time prices that reflect the crowd's belief.",
    icon: TrendingUp,
    visual: (
      <div className="space-y-3 w-full max-w-xs mx-auto">
        <div className="p-4 rounded-xl bg-[#1A1A1A] border border-white/10">
          <p className="text-sm font-medium mb-2 text-white">Example Market:</p>
          <p className="text-xs text-white/60">"Will BTC reach $100k by Dec 2025?"</p>
          <div className="flex gap-4 mt-3">
            <div className="flex-1 p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-center">
              <span className="text-lg font-mono font-bold text-purple-400">65¢</span>
              <p className="text-xs text-white/60 mt-1">YES</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <span className="text-lg font-mono font-bold text-white">35¢</span>
              <p className="text-xs text-white/60 mt-1">NO</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "how-pricing-works",
    title: "How Pricing Works",
    subtitle: "Buy low, sell at $1",
    description: "Prices range from 0¢ to 100¢. If you buy YES at 65¢ and the event happens, you get $1 per share — a 54% profit. If it doesn't happen, you lose your stake.",
    icon: DollarSign,
    visual: (
      <div className="space-y-3 w-full max-w-xs mx-auto">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">If YES wins:</p>
            <p className="text-white/60">You bought at 65¢ → Get $1 = <span className="text-green-400">+35¢ profit</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
            <Target className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">If NO wins:</p>
            <p className="text-white/60">Your YES shares = <span className="text-red-400">$0 (lose 65¢)</span></p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "oddshot-features",
    title: "How ODDSHOT Helps",
    subtitle: "Signals, Edge & Receipts",
    description: "We scan markets for opportunities, calculate potential edge against benchmarks, and provide transparent reasoning for every suggestion. No black boxes.",
    icon: Zap,
    visual: (
      <div className="space-y-3 w-full max-w-xs mx-auto">
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shrink-0">Signals</Badge>
          <span className="text-xs text-white/70">Real-time alerts on market moves</span>
        </div>
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 shrink-0">Edge</Badge>
          <span className="text-xs text-white/70">Find mispriced markets</span>
        </div>
        <div className="p-3 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 shrink-0">Receipts</Badge>
          <span className="text-xs text-white/70">Full transparency on our logic</span>
        </div>
      </div>
    ),
  },
  {
    id: "getting-started",
    title: "You're Ready!",
    subtitle: "Start exploring",
    description: "Browse live markets, check out signals, or ask our AI assistant for personalized recommendations. Remember: only trade what you can afford to lose.",
    icon: CheckCircle2,
    visual: null,
  },
];

export function OnboardingModal() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Only show on /app/* routes (dashboard), not on landing page
  const isInApp = location.pathname.startsWith('/app');

  useEffect(() => {
    // Only show onboarding if we're in the app section
    if (!isInApp) return;
    
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let app render first
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isInApp]);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[#0A0A0A] border-white/10 overflow-hidden [&>button]:top-2 [&>button]:right-2">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5 bg-white/5">
            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all" style={{ width: `${progress}%` }} />
          </Progress>
          <div className="flex justify-between mt-3 text-xs">
            <span className="text-white/60">Step {currentStep + 1} of {steps.length}</span>
            <button onClick={handleSkip} className="text-white/60 hover:text-purple-400 transition-colors font-medium">
              Skip intro
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon with 3D box */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <step.icon className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <Badge variant="outline" className="mb-2 bg-purple-500/10 text-purple-400 border-purple-500/30">{step.subtitle}</Badge>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">{step.title}</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>
          </div>

          {/* Visual */}
          {step.visual && (
            <div className="py-4">
              {step.visual}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={handlePrev}
              className="gap-2 h-10 bg-[#1A1A1A] hover:bg-[#252525] hover:text-purple-400 border-0 transition-colors"
            >
              <div className="h-5 w-5 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                <ChevronLeft className="h-3 w-3 text-white" />
              </div>
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext}
            size="sm" 
            className="flex-1 h-10 rounded-full gap-2 bg-[#1A1A1A] hover:bg-[#252525] hover:text-purple-400 text-foreground border-0 font-medium uppercase tracking-wide text-xs px-5 transition-colors"
          >
            {isLastStep ? "Start Trading" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to reset onboarding (for testing)
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };
}

