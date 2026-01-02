import { FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SEOHead, seoContent } from "@/components/seo/SEOHead";

export default function Legal() {
  return (
    <>
      <SEOHead title={seoContent.legal.title} description={seoContent.legal.description} />
      
      {/* Main Header */}
      <div className="container py-6 lg:py-8">
        <div className="text-center space-y-3 max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-8xl font-black uppercase bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent leading-tight">
            LEGAL & DISCLAIMERS
          </h1>
          <p className="text-lg lg:text-2xl text-white/70 leading-relaxed">
            Important information about using ODDSHOT
          </p>
        </div>
      </div>

      <section className="relative py-10 lg:py-20 overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-purple-500/10 via-purple-400/5 to-transparent rounded-t-[60px]" />
        
        <div className="relative container max-w-3xl space-y-6">
          {/* Main Disclaimer */}
          <Card className="p-6 border-purple-500/30 bg-purple-500/5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)] shrink-0">
                <AlertTriangle className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-sm space-y-2">
                <p className="font-bold text-lg text-purple-300">Important Disclaimer</p>
                <p className="text-white/80 leading-relaxed">
                  ODDSHOT is a decision support tool for prediction markets. It is NOT financial advice.
                  Always conduct your own research and understand the risks before trading.
                </p>
              </div>
            </div>
          </Card>

          {/* Sections */}
          <Card className="p-6 lg:p-8 border-white/10 bg-[#0A0A0A] space-y-6">
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">No Investment Advice</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed pl-11">
                The information provided on ODDSHOT is for informational purposes only and should not be
                construed as investment, trading, legal, or tax advice. We do not recommend any particular
                trading strategy or market position.
              </p>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Risk Warning</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed pl-11">
                Prediction markets involve substantial risk of loss. You could lose some or all of your
                investment. Past performance is not indicative of future results. Only trade with funds
                you can afford to lose.
              </p>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Data Accuracy</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed pl-11">
                Market data, signals, and analytics are sourced from third-party platforms and may not
                be accurate, complete, or timely. ODDSHOT makes no warranties about the reliability of
                this information.
              </p>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Jurisdiction</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed pl-11">
                Prediction market trading may not be legal in all jurisdictions. It is your responsibility
                to ensure compliance with applicable laws in your jurisdiction before using this service.
              </p>
            </section>

            <div className="h-px bg-white/5" />

            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center border border-white/10 shadow-[0_4px_0_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">No Guarantees</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed pl-11">
                "Edge" calculations, confidence scores, and suggested actions are algorithmic estimates
                and do not guarantee profits. Markets can move against any position regardless of
                analysis quality.
              </p>
            </section>
          </Card>

          <div className="text-center text-sm text-white/50 py-4">
            <p>Last updated: December 2024</p>
          </div>
        </div>
      </section>
    </>
  );
}
